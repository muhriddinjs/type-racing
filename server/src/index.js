import express from "express";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import { redis } from "./redis.js";

// RAMda saqlangan ma'lumotlarni Redis bilan saqlayapmiz
const raceKey = (pin) => `race:${pin}`;

async function getRace(pin) {
  const raw = await redis.get(raceKey(pin));
  return raw ? JSON.parse(raw) : null;
}

async function setRace(pin, race, ttlSeconds = 60 * 60) {
  // 1 soat TTL: race uzoq turib qolmasin
  await redis.set(raceKey(pin), JSON.stringify(race), "EX", ttlSeconds);
}

async function deleteRace(pin) {
  await redis.del(raceKey(pin));
}

/** Generate a unique 6-digit race PIN */
async function generatePin() {
  let pin;
  while (true) {
    pin = Math.floor(100000 + Math.random() * 900000).toString();
    const exists = await redis.exists(raceKey(pin));
    if (!exists) return pin;
  }
}

// Very simple text pool for races
const TEXT_POOL = [
  "The quick brown fox jumps over the lazy dog. Socket based applications enable low latency multiplayer games.",
  "Real time typing races are fun and competitive. Practice makes perfect when learning to type fast.",
  "Practice makes perfect when learning to type fast. The quick brown fox jumps over the lazy dog.",
  "Socket based applications enable low latency multiplayer games. Real time typing races are fun and competitive.",
];

function getRandomText() {
  return TEXT_POOL[Math.floor(Math.random() * TEXT_POOL.length)];
}

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Typing race server running" });
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Host creates a race
  socket.on("create_race", async (_, callback) => {
    const pin = await generatePin();

    const race = {
      pin,
      hostId: socket.id,
      players: {}, // key: socketId
      status: "lobby", // lobby | running | finished
      text: null,
      startTime: null, // timestamp in ms
      leaderboard: [],
    };

    await setRace(pin, race);
    socket.join(pin);

    // host qaysi pinda turganini eslab qolamiz
    socket.data.pin = pin;

    const payload = { pin, hostId: socket.id };
    callback?.({ ok: true, race: payload });
    socket.emit("race_created", payload);
  });

  // Player joins a race
  socket.on("join_race", async (data, callback) => {
    const { pin, name } = data || {};
    const race = await getRace(pin);

    if (!race) {
      const error = { ok: false, error: "Race not found" };
      callback?.(error);
      socket.emit("join_error", error);
      return;
    }

    if (race.status !== "lobby") {
      const error = { ok: false, error: "Race already started" };
      callback?.(error);
      socket.emit("join_error", error);
      return;
    }

    const player = {
      id: socket.id,
      name: name?.trim() || "Player",
      progress: 0,
      wpm: 0,
      accuracy: 100,
      finished: false,
      finishTimeMs: null,
    };

    race.players[socket.id] = player;
    await setRace(pin, race);

    socket.join(pin);

    // player qaysi pinda ekanini eslab qolamiz
    socket.data.pin = pin;

    const playersList = Object.values(race.players);

    // Acknowledge to joining client
    const joinedPayload = {
      pin,
      player,
      players: playersList,
      hostId: race.hostId,
    };
    callback?.({ ok: true, ...joinedPayload });
    socket.emit("joined_race", joinedPayload);

    // Notify others in the race
    socket.to(pin).emit("player_joined", {
      pin,
      player,
      players: playersList,
    });
  });

  // Host starts the race
  socket.on("start_race", async ({ pin }, callback) => {
    const race = await getRace(pin);

    if (!race) return callback?.({ ok: false, error: "Race not found" });
    if (race.hostId !== socket.id)
      return callback?.({ ok: false, error: "Only host can start race" });
    if (race.status !== "lobby")
      return callback?.({ ok: false, error: "Race already started" });

    race.text = getRandomText();
    race.status = "running";
    race.startTime = Date.now();

    await setRace(pin, race);

    const payload = { pin, text: race.text, startTime: race.startTime };
    io.to(pin).emit("race_started", payload);
    callback?.({ ok: true, ...payload });
  });

  // Player sends progress updates during the race
  socket.on("progress_update", async (data) => {
    const { pin, progress, wpm, accuracy } = data || {};
    const race = await getRace(pin);
    if (!race || race.status !== "running") return;

    const player = race.players?.[socket.id];
    if (!player) return;

    // Update player stats
    if (typeof progress === "number") player.progress = progress;
    if (typeof wpm === "number") player.wpm = wpm;
    if (typeof accuracy === "number") player.accuracy = accuracy;

    await setRace(pin, race);

    io.to(pin).emit("progress_broadcast", {
      pin,
      players: Object.values(race.players),
    });
  });

  // Player finished the race
  socket.on("finish_race", async (data, callback) => {
    const { pin, wpm, accuracy } = data || {};
    const race = await getRace(pin);

    if (!race || race.status !== "running") {
      callback?.({ ok: false, error: "Race not running" });
      return;
    }

    const player = race.players?.[socket.id];
    if (!player || player.finished) {
      callback?.({ ok: false, error: "Player not part of race" });
      return;
    }

    const now = Date.now();
    player.finished = true;
    player.finishTimeMs = race.startTime ? now - race.startTime : 0;
    if (typeof wpm === "number") player.wpm = wpm;
    if (typeof accuracy === "number") player.accuracy = accuracy;

    // Build leaderboard sorted by finish time (ascending)
    const finishedPlayers = Object.values(race.players)
      .filter((p) => p.finished && typeof p.finishTimeMs === "number")
      .sort((a, b) => a.finishTimeMs - b.finishTimeMs);

    race.leaderboard = finishedPlayers;

    const leaderboardPayload = { pin, leaderboard: race.leaderboard };

    // hamma tugatganmi?
    const allFinished =
      Object.values(race.players).length > 0 &&
      Object.values(race.players).every((p) => p.finished);

    if (allFinished) race.status = "finished";

    await setRace(pin, race);

    io.to(pin).emit("leaderboard_update", leaderboardPayload);
    callback?.({ ok: true, ...leaderboardPayload });

    if (allFinished) io.to(pin).emit("race_finished", leaderboardPayload);
  });

  socket.on("disconnect", async () => {
    const pin = socket.data.pin; // qaysi race ekanini shu yerdan olamiz
    if (!pin) return;

    const race = await getRace(pin); // Redisdan race’ni olamiz
    if (!race) return;

    const wasHost = race.hostId === socket.id;

    // player bo‘lsa o‘chiramiz
    if (race.players?.[socket.id]) {
      delete race.players[socket.id];
    }

    const playersList = Object.values(race.players || {});
    io.to(pin).emit("player_left", {
      pin,
      playerId: socket.id,
      players: playersList,
    });

    // host ketgan bo‘lsa, race yopiladi
    if (wasHost) {
      io.to(pin).emit("race_closed", { pin });
      await deleteRace(pin);
      return;
    }

    // hech kim qolmagan bo‘lsa, race’ni o‘chirib tashlaymiz
    if (playersList.length === 0 && race.status !== "finished") {
      await deleteRace(pin);
      return;
    }

    // aks holda saqlab qo'yamiz
    await setRace(pin, race);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
