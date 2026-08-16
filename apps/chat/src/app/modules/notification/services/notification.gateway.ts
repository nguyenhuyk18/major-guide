import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { firstValueFrom } from 'rxjs';
import { randomUUID } from 'crypto';
import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import { AuthorizerService } from '@common/interfaces/grpc/authorizer';

@Injectable()
@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*' }, transports: ['websocket'] })
export class NotificationGateway implements OnGatewayConnection, OnModuleInit {
    @WebSocketServer() server: Namespace;
    private authorizer: AuthorizerService;
    constructor(@Inject(GRPC_SERVICES.AUTHORIZE_SERVICE) private readonly client: ClientGrpc) {}
    onModuleInit() { this.authorizer = this.client.getService<AuthorizerService>('AuthorizerService'); }
    async handleConnection(socket: Socket) {
        try {
            const raw = socket.handshake.auth?.token || socket.handshake.headers.authorization;
            const token = typeof raw === 'string' ? raw.replace(/^Bearer\s+/i, '').trim() : '';
            const result = await firstValueFrom(this.authorizer.verifyUserToken({ token, processId: randomUUID() }));
            const user = result?.metadata?.user;
            if (!result?.valid || !user?.id) throw new Error();
            socket.data.user = user;
            await socket.join(`user:${user.id}`);
            await socket.join(`role:${user.roleName}`);
        } catch { socket.emit('notification:error', { message: 'Không có quyền nhận thông báo' }); socket.disconnect(true); }
    }
    publish(notification: any) {
        if (notification.recipientId) this.server.to(`user:${notification.recipientId}`).emit('notification:new', notification);
        if (notification.recipientRole) this.server.to(`role:${notification.recipientRole}`).emit('notification:new', notification);
    }
}
