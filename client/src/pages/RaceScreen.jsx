import React, { useEffect, useMemo, useState } from "react";

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

    if (correctChars === chars.length && !finished) {
      setFinished(true);
      onFinish({ wpm, accuracy });
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
  };

  return (
    <div className="card race-card">
      <h2>Race</h2>
      
      {countdown > 0 && (
        <div className="countdown">{countdown}</div>
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

      <input
        className="typing-input"
        type="text"
        value={inputValue}
        onChange={handleChange}
        onPaste={handlePaste}
        placeholder={
          countdown > 0 ? "Get ready..." : "Start typing here..."
        }
        disabled={!started || finished}
        autoFocus
      />

      <div className="progress-list">
        {players.map((p) => (
          <div key={p.id} className="progress-item">
            <div className="progress-label">
              <span>{p.name} {p.id === currentPlayerId && "(You)"}</span>
              <span>{p.wpm || 0} WPM • {p.accuracy != null ? p.accuracy : 100}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-inner"
                style={{ width: `${Math.round((p.progress || 0) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
