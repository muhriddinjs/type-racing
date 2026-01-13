import React from "react";

export function PlayerLobby({ pin, players, hostId, currentPlayerId, onBackHome }) {
  const host = players.find((p) => p.id === hostId);

  return (
    <div className="card">
      <h2>Waiting for Host</h2>
      <div className="pin-display">
        <p>Joined Race PIN</p>
        <span className="pin">{pin}</span>
      </div>
      
      <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
        Host: <strong>{host ? host.name : "Waiting..."}</strong>
      </p>

      <h3>Players</h3>
      <ul className="players-list">
        {players.map((p) => (
          <li key={p.id}>
            {p.name}
            {p.id === hostId && " 👑"}
            {p.id === currentPlayerId && " (You)"}
          </li>
        ))}
      </ul>
      
      <div className="actions-row">
        <button className="secondary" onClick={onBackHome}>
          Leave
        </button>
      </div>
      
      <p className="hint">Waiting for the host to start the race...</p>
    </div>
  );
}
