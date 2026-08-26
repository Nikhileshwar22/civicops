import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as crypto from 'crypto';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/ws',
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private connectedClients: Map<string, { userId: string; tenantId: string }> = new Map();

  constructor(private readonly configService: ConfigService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Simple JWT decode (verify signature in production with proper library)
      const payload = this.decodeJwt(token);
      if (!payload || !payload.sub) {
        client.emit('error', { message: 'Invalid token' });
        client.disconnect();
        return;
      }

      const userId = payload.sub;
      const tenantId = payload.tenantId;

      this.connectedClients.set(client.id, { userId, tenantId });

      client.join(`user:${userId}`);
      client.join(`tenant:${tenantId}`);

      this.logger.debug(`Client connected: ${client.id} (user: ${userId})`);
      client.emit('connected', { userId, tenantId });
    } catch (error) {
      client.emit('error', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:room')
  handleJoinRoom(client: Socket, data: { room: string }) {
    const clientData = this.connectedClients.get(client.id);
    if (!clientData) return;

    const { room } = data;
    const { tenantId } = clientData;

    if (room.startsWith('tenant:') && room !== `tenant:${tenantId}`) {
      client.emit('error', { message: 'Unauthorized room' });
      return;
    }

    client.join(room);
  }

  @SubscribeMessage('leave:room')
  handleLeaveRoom(client: Socket, data: { room: string }) {
    client.leave(data.room);
  }

  emitToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data);
  }

  getConnectedCount(): number {
    return this.connectedClients.size;
  }

  private decodeJwt(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }
}
