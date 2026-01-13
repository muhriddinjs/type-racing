import React from "react";

export function PlayerLobby({ pin, players, hostId, currentPlayerId }) {
  const host = players.find((p) => p.id === hostId);

  return (
    <div className="card">
      <h2>Waiting Room</h2>
      <p>
        Joined race <span className="pin">{pin}</span>
      </p>
      <p>
        Host: <strong>{host ? host.name : "Unknown"}</strong>
      </p>
      <h3>Players</h3>
      <ul className="players-list">
        {players.map((p) => (
          <li key={p.id}>
            {p.name}
            {p.id === hostId && " (Host)"}
            {p.id === currentPlayerId && " (You)"}
          </li>
        ))}
      </ul>
      <p className="hint">Waiting for the host to start the race...</p>
    </div>
  );
}


