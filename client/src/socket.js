import { io } from "socket.io-client";

// Single shared Socket.io client instance
export const socket = io("http://localhost:4000", {
  autoConnect: true
});


