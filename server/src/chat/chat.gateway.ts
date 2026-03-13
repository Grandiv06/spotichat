import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { OnlineUsersService } from './online-users.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
  },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // userId -> Set of socket IDs (for multiple tabs)
  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
    private onlineUsersService: OnlineUsersService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      (client as any).userId = userId;

      // Join personal room
      client.join(`user:${userId}`);

      // Track online status
      if (!this.onlineUsers.has(userId)) {
        this.onlineUsers.set(userId, new Set());
      }
      this.onlineUsers.get(userId)!.add(client.id);

      this.onlineUsersService.add(userId);
      this.server.emit('user:online', { userId });

      console.log(`[WS] User ${userId} connected (socket: ${client.id})`);
    } catch (error) {
      console.error('[WS] Connection auth failed:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (userId) {
      const sockets = this.onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.onlineUsers.delete(userId);
          this.onlineUsersService.remove(userId);
          this.chatService.updateUserLastSeen(userId).catch(() => {});
          this.server.emit('user:offline', { userId });
        }
      }
      console.log(`[WS] User ${userId} disconnected (socket: ${client.id})`);
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      chatId: string;
      text?: string;
      type?: string;
      fileUrl?: string;
      duration?: number;
      replyToId?: string;
    },
  ) {
    const userId = (client as any).userId;
    if (!userId) return;

    try {
      const message = await this.chatService.sendMessage(data.chatId, userId, {
        text: data.text,
        type: data.type,
        fileUrl: data.fileUrl,
        duration: data.duration,
        replyToId: data.replyToId,
      });

      // Get chat participants and send to all
      const participants = await this.chatService.getChatParticipants(data.chatId);
      for (const participantId of participants) {
        this.server.to(`user:${participantId}`).emit('message:new', message);
      }

      // Return acknowledgement to sender
      return { success: true, message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('message:delivered')
  async handleDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      const result = await this.chatService.updateMessageStatus(data.messageId, 'delivered');
      const participants = await this.chatService.getChatParticipants(result.chatId);
      for (const pId of participants) {
        this.server.to(`user:${pId}`).emit('message:status', result);
      }
    } catch (error) {
      // Silently ignore
    }
  }

  @SubscribeMessage('message:seen')
  async handleSeen(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      const result = await this.chatService.updateMessageStatus(data.messageId, 'seen');
      const participants = await this.chatService.getChatParticipants(result.chatId);
      for (const pId of participants) {
        this.server.to(`user:${pId}`).emit('message:status', result);
      }
    } catch (error) {
      // Silently ignore
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; kind?: string },
  ) {
    const userId = (client as any).userId;
    if (!userId) return;

    client.to(`chat:${data.chatId}`).emit('typing:start', {
      chatId: data.chatId,
      userId,
      kind: data.kind || 'text',
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const userId = (client as any).userId;
    if (!userId) return;

    client.to(`chat:${data.chatId}`).emit('typing:stop', {
      chatId: data.chatId,
      userId,
    });
  }

  @SubscribeMessage('chat:join')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    client.join(`chat:${data.chatId}`);
  }

  @SubscribeMessage('chat:leave')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    client.leave(`chat:${data.chatId}`);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId) && this.onlineUsers.get(userId)!.size > 0;
  }
}
