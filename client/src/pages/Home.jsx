import React, { useState } from "react";

export function Home({ onCreateRace, onJoinRace }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !pin.trim()) return;
    onJoinRace({ name: name.trim(), pin: pin.trim() });
  };

  return (
    <div className="card">
      <h2>Type Racing</h2>
      
      {!showJoinForm ? (
        <div className="home-actions">
          <button className="primary" onClick={onCreateRace}>
            Create a Race
          </button>
          <button className="secondary" onClick={() => setShowJoinForm(true)}>
            Join the Race
          </button>
          <button className="ghost">
            Practice Solo
          </button>
        </div>
      ) : (
        <form className="form" onSubmit={handleJoinSubmit}>
          <label>
            Your Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Speedster"
              autoFocus
            />
          </label>
          <label>
            Race PIN
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter 6-digit PIN"
              maxLength={6}
            />
          </label>
          <div className="actions-row">
            <button type="button" className="secondary" onClick={() => setShowJoinForm(false)}>
              Back
            </button>
            <button type="submit" className="primary">
              Join
            </button>
          </div>
        </form>
      )}
      
      <p className="hint">Race against friends and see who types the fastest!</p>
    </div>
  );
}
