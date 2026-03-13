import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/', {
      auth: { token: getAccessToken() },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  // Update token before connecting
  s.auth = { token: getAccessToken() };
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function onSocketEvent(event: string, callback: (...args: any[]) => void) {
  const s = getSocket();
  s.on(event, callback);
  return () => {
    s.off(event, callback);
  };
}

export function emitSocket(event: string, data: any): Promise<any> {
  return new Promise((resolve) => {
    const s = getSocket();
    s.emit(event, data, (response: any) => {
      resolve(response);
    });
  });
}
