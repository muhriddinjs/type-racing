## Real-time Multiplayer Typing Race

A minimal full-stack real-time typing race web app (similar to TypeRacer + Kahoot) built with:

- **Backend**: Node.js, Express, Socket.io
- **Frontend**: React, Vite, Socket.io client
- **Styling**: Simple CSS
- **Storage**: In-memory (no database)

### Project Structure

- **server**: Node.js + Express + Socket.io backend
- **client**: React frontend built with Vite

### Prerequisites

- Node.js (LTS recommended)
- npm

### Installation

From the project root:

```bash
npm install
```

This uses npm workspaces to install dependencies for both `server` and `client`.

### Running the App

- **Start backend only**:

```bash
npm run dev:server
```

- **Start frontend only**:

```bash
npm run dev:client
```

- **Start both (frontend + backend) in parallel**:

```bash
npm run dev
```

Then open the frontend in your browser (by default `http://localhost:5173`).

### High-level Flow

- **Home**: Choose to host a race or join by 6‑digit PIN.
- **Host lobby**: Host sees the generated PIN and a live list of joined players.
- **Player lobby**: Players who joined a race wait for the host to start.
- **Race screen**: All players see the same text, a 3‑2‑1‑Go countdown, real-time progress bars, and typing feedback (correct/incorrect characters, no paste).
- **Results screen**: Shows a live leaderboard with time, WPM, and accuracy, sorted by finish time.

### Socket Events (Overview)

- **create_race**: Host requests creation of a new race.
- **race_created**: Server responds with 6‑digit PIN and race info.
- **join_race**: Player attempts to join with name + PIN.
- **joined_race** / **player_joined**: Confirmation + broadcast of updated player list.
- **start_race**: Host starts the race.
- **race_started**: Server sends race text and timing info.
- **progress_update**: Player sends current progress and stats.
- **progress_broadcast**: Server broadcasts aggregated progress.
- **finish_race**: Player notifies server of finish time, WPM, accuracy.
- **leaderboard_update**: Server broadcasts live leaderboard.

Implementation details for each event are in the code comments.


