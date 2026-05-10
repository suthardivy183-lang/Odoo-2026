import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
  || import.meta.env.VITE_API_URL
  || 'http://localhost:3001';

let socket: Socket | null = null;

export const initSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnection:           true,
      reconnectionDelay:      1000,
      reconnectionDelayMax:   5000,
      reconnectionAttempts:   5,
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const joinTripRoom = (tripId: string) => {
  const s = initSocket();
  s.emit('trip:join', tripId);
};

export const leaveTripRoom = (tripId: string) => {
  socket?.emit('trip:leave', tripId);
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
