import React, { useEffect, useMemo, useState } from "react";

// Utility to compute WPM and accuracy
function computeStats({ correctChars, totalTyped, startTime }) {
  const now = Date.now();
  const elapsedMs = Math.max(1, now - startTime);
  const elapsedMinutes = elapsedMs / 60000;
  const wordsTyped = correctChars / 5;
  const wpm = elapsedMinutes > 0 ? Math.round(wordsTyped / elapsedMinutes) : 0;
  const accuracy =
    totalTyped > 0 ? Math.round((correctChars / totalTyped) * 100) : 100;
  return { wpm, accuracy };
}

export function RaceScreen({
  text,
  players,
  currentPlayerId,
  startTime,
  onProgress,
  onFinish
}) {
  const [inputValue, setInputValue] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  const chars = useMemo(() => text.split(""), [text]);

  useEffect(() => {
    // Simple 3,2,1,Go countdown handled client-side
    let intervalId;
    if (startTime) {
      setCountdown(3);
      let ticks = 3;
      intervalId = setInterval(() => {
        ticks -= 1;
        if (ticks <= 0) {
          setCountdown(0);
          setStarted(true);
          clearInterval(intervalId);
        } else {
          setCountdown(ticks);
        }
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [startTime]);

  const handleChange = (e) => {
    if (!started || finished) return;
    const value = e.target.value;
    setInputValue(value);

    // Compute correctness
    let correctChars = 0;
    for (let i = 0; i < value.length && i < chars.length; i += 1) {
      if (value[i] === chars[i]) correctChars += 1;
    }
    const totalTyped = value.length;
    const progress = Math.min(1, correctChars / chars.length);
    const { wpm, accuracy } = computeStats({
      correctChars,
      totalTyped,
      startTime: startTime || Date.now()
    });

    onProgress({ progress, wpm, accuracy });

    // If reached end of text, finish
    if (correctChars === chars.length && !finished) {
      setFinished(true);
      onFinish({ wpm, accuracy });
    }
  };

  const handlePaste = (e) => {
    // Prevent pasting to keep race fair
    e.preventDefault();
  };

  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  return (
    <div className="card race-card">
      <h2>Race</h2>
      {countdown > 0 && (
        <div className="countdown">Starting in {countdown}...</div>
      )}
      {countdown === 0 && !finished && (
        <div className="countdown go">Go!</div>
      )}

      <div className="race-text">
        {chars.map((ch, idx) => {
          const typedChar = inputValue[idx];
          let cls = "";
          if (typedChar == null) {
            cls = "";
          } else if (typedChar === ch) {
            cls = "correct";
          } else {
            cls = "incorrect";
          }
          return (
            <span key={idx} className={cls}>
              {ch}
            </span>
          );
        })}
      </div>

      <textarea
        className="typing-input"
        value={inputValue}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder={
          countdown > 0 ? "Get ready..." : "Start typing the text above..."
        }
        disabled={!started || finished}
      />

      <h3>Live progress</h3>
      <ul className="progress-list">
        {players.map((p) => (
          <li key={p.id} className="progress-item">
            <div className="progress-label">
              {p.name}
              {p.id === currentPlayerId && " (You)"}
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-inner"
                style={{ width: `${Math.round((p.progress || 0) * 100)}%` }}
              />
            </div>
            <div className="progress-stats">
              <span>{p.wpm || 0} WPM</span>
              <span>{p.accuracy != null ? p.accuracy : 100}% accuracy</span>
            </div>
          </li>
        ))}
      </ul>

      {currentPlayer && (
        <div className="hint">
          You are: <strong>{currentPlayer.name}</strong>
        </div>
      )}
    </div>
  );
}


