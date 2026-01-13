import React from "react";

export function HostLobby({
  pin,
  players,
  isHost,
  hostId,
  onStartRace,
  onBackHome
}) {
  return (
    <div className="card">
      <h2>Host Lobby</h2>
      <p className="pin-display">
        Share this PIN with players:
        <span className="pin">{pin}</span>
      </p>
      <h3>Players joined</h3>
      <ul className="players-list">
        {players.length === 0 && <li>No players yet...</li>}
        {players.map((p) => (
          <li key={p.id}>
            {p.name} {p.id === hostId ? "(Host)" : ""}
          </li>
        ))}
      </ul>
      <div className="actions-row">
        <button onClick={onBackHome}>Back to Home</button>
        {isHost && (
          <button className="primary" onClick={onStartRace}>
            Start Race
          </button>
        )}
      </div>
    </div>
  );
}


