import { io } from "socket.io-client";

// Single shared Socket.io client instance
export const socket = io(import.meta.env.VITE_SERVER_URL, {
  autoConnect: true
});


