import express from "express";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";

// In-memory race store (no database)
const racesByPin = new Map();

/** Generate a unique 6-digit race PIN */
function generatePin() {
  let pin;
  do {
    pin = Math.floor(100000 + Math.random() * 900000).toString();
  } while (racesByPin.has(pin));
  return pin;
}

// Very simple text pool for races
const TEXT_POOL = [
  "The quick brown fox jumps over the lazy dog. we look govern time general show such interest should give between down hand most possible should too real out this into another own late  ",
  "Real time typing races are fun and competitive. On a voyage to a distant galaxy, an astronaut was gazing at a quartz crystal.
It was passed down in his family for generations as a sign of protection.
This was a vast and complex system, full of uncharted space and mystic entities.
The astronaut had a wax seal and some quills in his spacecraft's desk.
Frequently, he would squint through a telescope and analyze the celestial array.
The great Milky Way sprawling across his view.",
  "Practice makes perfect when learning to type fast. Frequently, he would squint through a telescope and analyze the celestial array.
The great Milky Way sprawling across his view.
He was tasked with an essential query - the existence of extraterrestrial life.
On a quiet day, he saw a galaxy flicker and sway in a fascinating rhythm.",
  "Socket based applications enable low latency multiplayer games."
];

function getRandomText() {
  return TEXT_POOL[Math.floor(Math.random() * TEXT_POOL.length)];
}

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Typing race server running" });
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Host creates a race
  socket.on("create_race", (_, callback) => {
    const pin = generatePin();
    const race = {
      pin,
      hostId: socket.id,
      players: {}, // key: socketId
      status: "lobby", // lobby | running | finished
      text: null,
      startTime: null, // timestamp in ms
      leaderboard: []
    };
    racesByPin.set(pin, race);
    socket.join(pin);

    const payload = { pin, hostId: socket.id };
    if (callback) callback({ ok: true, race: payload });
    socket.emit("race_created", payload);
  });

  // Player joins a race
  socket.on("join_race", (data, callback) => {
    const { pin, name } = data || {};
    const race = racesByPin.get(pin);

    if (!race) {
      const error = { ok: false, error: "Race not found" };
      if (callback) callback(error);
      socket.emit("join_error", error);
      return;
    }

    if (race.status !== "lobby") {
      const error = { ok: false, error: "Race already started" };
      if (callback) callback(error);
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
      finishTimeMs: null
    };

    race.players[socket.id] = player;
    socket.join(pin);

    const playersList = Object.values(race.players);

    // Acknowledge to joining client
    const joinedPayload = {
      pin,
      player,
      players: playersList,
      hostId: race.hostId
    };
    if (callback) callback({ ok: true, ...joinedPayload });
    socket.emit("joined_race", joinedPayload);

    // Notify others in the race
    socket.to(pin).emit("player_joined", {
      pin,
      player,
      players: playersList
    });
  });

  // Host starts the race
  socket.on("start_race", ({ pin }, callback) => {
    const race = racesByPin.get(pin);
    if (!race) {
      if (callback) callback({ ok: false, error: "Race not found" });
      return;
    }
    if (race.hostId !== socket.id) {
      if (callback) callback({ ok: false, error: "Only host can start race" });
      return;
    }
    if (race.status !== "lobby") {
      if (callback) callback({ ok: false, error: "Race already started" });
      return;
    }

    const text = getRandomText();
    const startTime = Date.now(); // base timestamp; clients show their own 3-2-1 countdown

    race.text = text;
    race.status = "running";
    race.startTime = startTime;

    const payload = { pin, text, startTime };
    io.to(pin).emit("race_started", payload);
    if (callback) callback({ ok: true, ...payload });
  });

  // Player sends progress updates during the race
  socket.on("progress_update", (data) => {
    const { pin, progress, wpm, accuracy } = data || {};
    const race = racesByPin.get(pin);
    if (!race || race.status !== "running") return;

    const player = race.players[socket.id];
    if (!player) return;

    // Update player stats
    player.progress = typeof progress === "number" ? progress : player.progress;
    if (typeof wpm === "number") player.wpm = wpm;
    if (typeof accuracy === "number") player.accuracy = accuracy;

    const playersList = Object.values(race.players);
    io.to(pin).emit("progress_broadcast", {
      pin,
      players: playersList
    });
  });

  // Player finished the race
  socket.on("finish_race", (data, callback) => {
    const { pin, wpm, accuracy } = data || {};
    const race = racesByPin.get(pin);
    if (!race || race.status !== "running") {
      if (callback) callback({ ok: false, error: "Race not running" });
      return;
    }

    const player = race.players[socket.id];
    if (!player || player.finished) {
      if (callback) callback({ ok: false, error: "Player not part of race" });
      return;
    }

    const now = Date.now();
    const finishTimeMs = race.startTime ? now - race.startTime : 0;

    player.finished = true;
    player.finishTimeMs = finishTimeMs;
    if (typeof wpm === "number") player.wpm = wpm;
    if (typeof accuracy === "number") player.accuracy = accuracy;

    // Build leaderboard sorted by finish time (ascending)
    const finishedPlayers = Object.values(race.players).filter(
      (p) => p.finished && typeof p.finishTimeMs === "number"
    );
    finishedPlayers.sort((a, b) => a.finishTimeMs - b.finishTimeMs);
    race.leaderboard = finishedPlayers;

    const leaderboardPayload = {
      pin,
      leaderboard: race.leaderboard
    };

    io.to(pin).emit("leaderboard_update", leaderboardPayload);

    if (callback) callback({ ok: true, ...leaderboardPayload });

    // If everyone finished, mark race as finished
    const allFinished =
      Object.values(race.players).length > 0 &&
      Object.values(race.players).every((p) => p.finished);
    if (allFinished) {
      race.status = "finished";
      io.to(pin).emit("race_finished", leaderboardPayload);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);

    // Clean up player from any races they were part of
    for (const [pin, race] of racesByPin.entries()) {
      if (race.players[socket.id]) {
        const wasHost = race.hostId === socket.id;
        delete race.players[socket.id];

        const playersList = Object.values(race.players);

        io.to(pin).emit("player_left", {
          pin,
          playerId: socket.id,
          players: playersList
        });

        // If host left, end the race and remove it
        if (wasHost) {
          io.to(pin).emit("race_closed", { pin });
          racesByPin.delete(pin);
        } else if (playersList.length === 0 && race.status !== "finished") {
          // No players left, safe to remove race
          racesByPin.delete(pin);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});


