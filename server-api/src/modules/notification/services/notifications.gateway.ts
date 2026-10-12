import { Logger, OnModuleInit } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import type { Server, Socket } from 'socket.io';
import User from 'src/database/models/users.model';
import { RealtimeService } from './realtime.service';

/** Socket.IO gateway, namespace /sn: rooms user:{id}. JWT from handshake auth.token or ?token=. */
@WebSocketGateway({ namespace: '/sn', cors: { origin: true, credentials: true } })
export class NotificationsGateway implements OnGatewayConnection, OnModuleInit {
  private readonly logger = new Logger(NotificationsGateway.name);
  @WebSocketServer() server: Server;

  constructor(
    private readonly realtime: RealtimeService,
    private readonly jwt: JwtService,
  ) {}

  onModuleInit() {
    this.realtime.onMessage((userId, event, payload) => {
      this.server?.to(`user:${userId}`).emit(event, payload);
    });
  }

  async handleConnection(client: Socket) {
    try {
      const token = String(client.handshake.auth?.token || client.handshake.query?.token || '').replace(/^Bearer /, '');
      const payload: any = this.jwt.verify(token, { algorithms: ['HS256'], secret: process.env.JWT_SECRET_KEY });
      const user = await User.findByPk(payload.sub, { attributes: ['id', 'is_active', 'company_id', 'role'] });
      if (!user || !user.is_active) throw new Error('inactive');
      await client.join(`user:${user.id}`);
      client.emit('ready', { user_id: user.id });
    } catch {
      client.emit('unauthorized');
      client.disconnect(true);
    }
  }
}
