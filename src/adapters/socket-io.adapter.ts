/* eslint-disable @typescript-eslint/no-unsafe-return */
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions, Server } from 'socket.io';

export class SocketIOAdapter extends IoAdapter {
  private static ioServer: Server;

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: '*',
        credentials: true,
      },
    });
    
    SocketIOAdapter.ioServer = server;
    console.log('Socket.IO server created and stored');
    return server;
  }

  static getServer(): Server {
    if (!SocketIOAdapter.ioServer) {
      throw new Error('Socket.IO server not initialized');
    }
    return SocketIOAdapter.ioServer;
  }
}