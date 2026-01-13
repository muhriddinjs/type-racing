import React from "react";

function formatTime(ms) {
  if (ms == null) return "-";
  return (ms / 1000).toFixed(2) + "s";
}

export function ResultsScreen({ leaderboard, onBackHome }) {
  return (
    <div className="card">
      <h2>Results</h2>
      {leaderboard.length === 0 ? (
        <p>No results yet.</p>
      ) : (
        <table className="leaderboard">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Time</th>
              <th>WPM</th>
              <th>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((p, idx) => (
              <tr key={p.id}>
                <td>{idx + 1}</td>
                <td>{p.name}</td>
                <td>{formatTime(p.finishTimeMs)}</td>
                <td>{p.wpm}</td>
                <td>{p.accuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button className="primary" onClick={onBackHome}>
        Back to Home
      </button>
    </div>
  );
}


