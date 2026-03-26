import { createServer } from 'http';
import next from 'next';
import { Server } from 'socket.io';
import { setupSocketHandlers } from './lib/socket-server';
import type { ClientToServerEvents, ServerToClientEvents } from './lib/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  // Socket.IO 서버 생성
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: dev ? `http://${hostname}:${port}` : false,
    },
  });

  setupSocketHandlers(io);

  httpServer.listen(port, () => {
    console.log(`> 서버 시작: http://${hostname}:${port}`);
    console.log(`> Socket.IO 연결 대기 중`);
  });
});
