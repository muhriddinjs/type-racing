import React, { useState } from "react";

export function Home({ onCreateRace, onJoinRace }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !pin.trim()) return;
    onJoinRace({ name: name.trim(), pin: pin.trim() });
  };

  return (
    <div className="card">
      <h2>Welcome to Typing Race</h2>
      <div className="home-actions">
        <button className="primary" onClick={onCreateRace}>
          Host a Race
        </button>
      </div>
      <div className="divider">or join a race</div>
      <form className="form" onSubmit={handleJoinSubmit}>
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
        </label>
        <label>
          Race PIN
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="6-digit PIN"
            maxLength={6}
          />
        </label>
        <button type="submit" className="secondary">
          Join Race
        </button>
      </form>
    </div>
  );
}


