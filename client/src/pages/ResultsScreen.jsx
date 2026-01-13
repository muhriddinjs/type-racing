import React from "react";

function formatTime(ms) {
  if (ms == null) return "-";
  return (ms / 1000).toFixed(2) + "s";
}

export function ResultsScreen({ leaderboard, onBackHome }) {
  return (
    <div className="card">
      <h2>Race Results</h2>
      {leaderboard.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No results yet.</p>
      ) : (
        <table className="leaderboard">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Time</th>
              <th>WPM</th>
              <th>Acc</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((p, idx) => (
              <tr key={p.id}>
                <td>
                  <strong>{idx + 1}</strong>
                </td>
                <td>{p.name}</td>
                <td>{formatTime(p.finishTimeMs)}</td>
                <td>{p.wpm}</td>
                <td>{p.accuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="actions-row" style={{ marginTop: '2rem' }}>
        <button className="primary" onClick={onBackHome}>
          Play Again
        </button>
      </div>
    </div>
  );
}
