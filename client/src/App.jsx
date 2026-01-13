import React, { useEffect, useState } from "react";
import { socket } from "./socket";
import { Home } from "./pages/Home";
import { HostLobby } from "./pages/HostLobby";
import { PlayerLobby } from "./pages/PlayerLobby";
import { RaceScreen } from "./pages/RaceScreen";
import { ResultsScreen } from "./pages/ResultsScreen";

// High-level app state machine for simple page routing
export function App() {
  const [view, setView] = useState("home"); // home | hostLobby | playerLobby | race | results
  const [pin, setPin] = useState("");
  const [hostId, setHostId] = useState("");
  const [player, setPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [raceText, setRaceText] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    // Listen for server broadcasts that affect multiple views
    socket.on("player_joined", ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    socket.on("player_left", ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    socket.on("race_started", ({ text, startTime: serverStart }) => {
      setRaceText(text);
      setStartTime(serverStart);
      setView("race");
    });

    socket.on("progress_broadcast", ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    socket.on("leaderboard_update", ({ leaderboard: lb }) => {
      setLeaderboard(lb);
      setView("results");
    });

    socket.on("race_closed", () => {
      // If host disconnects or race closed, bring everyone back home
      alert("Race was closed by host.");
      resetState();
    });

    return () => {
      socket.off("player_joined");
      socket.off("player_left");
      socket.off("race_started");
      socket.off("progress_broadcast");
      socket.off("leaderboard_update");
      socket.off("race_closed");
    };
  }, []);

  const resetState = () => {
    setView("home");
    setPin("");
    setHostId("");
    setPlayer(null);
    setPlayers([]);
    setRaceText("");
    setStartTime(null);
    setLeaderboard([]);
  };

  const handleCreateRace = () => {
    socket.emit("create_race", null, (response) => {
      if (!response?.ok) {
        alert(response?.error || "Failed to create race");
        return;
      }
      setPin(response.race.pin);
      setHostId(response.race.hostId);
      setView("hostLobby");
    });
  };

  const handleJoinRace = ({ name, pin: inputPin }) => {
    socket.emit(
      "join_race",
      { name, pin: inputPin },
      (response) => {
        if (!response?.ok) {
          alert(response?.error || "Failed to join race");
          return;
        }
        setPin(response.pin);
        setHostId(response.hostId);
        setPlayer(response.player);
        setPlayers(response.players);
        setView(response.hostId === socket.id ? "hostLobby" : "playerLobby");
      }
    );
  };

  const handleStartRace = () => {
    socket.emit("start_race", { pin }, (response) => {
      if (!response?.ok) {
        alert(response?.error || "Failed to start race");
      }
    });
  };

  const handleFinish = ({ wpm, accuracy }) => {
    socket.emit("finish_race", { pin, wpm, accuracy });
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Typing Race</h1>
      </header>
      <main className="app-main">
        {view === "home" && (
          <Home onCreateRace={handleCreateRace} onJoinRace={handleJoinRace} />
        )}
        {view === "hostLobby" && (
          <HostLobby
            pin={pin}
            players={players}
            isHost={socket.id === hostId}
            hostId={hostId}
            onStartRace={handleStartRace}
            onBackHome={resetState}
          />
        )}
        {view === "playerLobby" && (
          <PlayerLobby
            pin={pin}
            players={players}
            hostId={hostId}
            currentPlayerId={player?.id}
          />
        )}
        {view === "race" && (
          <RaceScreen
            text={raceText}
            players={players}
            currentPlayerId={player?.id}
            startTime={startTime}
            onProgress={(payload) =>
              socket.emit("progress_update", { pin, ...payload })
            }
            onFinish={handleFinish}
          />
        )}
        {view === "results" && (
          <ResultsScreen leaderboard={leaderboard} onBackHome={resetState} />
        )}
      </main>
    </div>
  );
}


