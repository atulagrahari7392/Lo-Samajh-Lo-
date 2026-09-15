import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('lsl_token');
    // Connect to same origin or VITE_API_URL host
    const socketUrl = import.meta.env.VITE_API_URL
      ? new URL(import.meta.env.VITE_API_URL, window.location.href).origin
      : window.location.origin;

    socket = io(socketUrl, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });
  }

  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  const token = localStorage.getItem('lsl_token');
  if (token) {
    s.auth = { token };
  }
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
