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
      <h2>Race Lobby</h2>
      <div className="pin-display">
        <p>Share this PIN with players</p>
        <span className="pin">{pin}</span>
      </div>
      
      <h3>Players Joined</h3>
      <ul className="players-list">
        {players.length === 0 && <li>Waiting for players...</li>}
        {players.map((p) => (
          <li key={p.id}>
            {p.name} {p.id === hostId ? "👑" : ""}
          </li>
        ))}
      </ul>
      
      <div className="actions-row">
        <button className="secondary" onClick={onBackHome}>
          Leave Race
        </button>
        {isHost && (
          <button className="primary" onClick={onStartRace} disabled={players.length === 0}>
            Start Race
          </button>
        )}
      </div>
    </div>
  );
}
