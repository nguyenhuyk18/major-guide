import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect
} from '@nestjs/websockets';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Server, Socket } from 'socket.io';
import { firstValueFrom } from 'rxjs';
import { randomUUID } from 'crypto';
import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import { AuthorizerService } from '@common/interfaces/grpc/authorizer';
import { ROLE } from '@common/constant/enum/action.constant';
import { RADIO_CHAT } from '@common/constant/enum/radio-chatting.contant';
import { Room } from '@common/schemas/chat/room.schema';
import { ChatPrivate } from '@common/schemas/chat/chat-private.schema';

@Injectable()
@WebSocketGateway({
    namespace: '/private',
    cors: { origin: '*' },
    transports: ['websocket']
})
export class PrivateChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    @WebSocketServer()
    server: Server;

    private authorizerService: AuthorizerService;
    private readonly logger = new Logger(PrivateChatGateway.name);

    constructor(
        @Inject(GRPC_SERVICES.AUTHORIZE_SERVICE)
        private readonly authorizerClient: ClientGrpc
    ) { }

    onModuleInit() {
        this.authorizerService = this.authorizerClient.getService<AuthorizerService>('AuthorizerService');
    }

    async handleConnection(client: Socket) {
        try {
            const token = this.extractToken(client);
            if (!token) throw new Error('Missing token');
            const result = await firstValueFrom(
                this.authorizerService.verifyUserToken({ token, processId: randomUUID() })
            );
            const user = result?.metadata?.user;
            if (!result?.valid || !user?.id || ![ROLE.MEMBER, ROLE.EXPERT].includes(user.roleName as ROLE)) {
                throw new Error('Invalid user');
            }
            client.data.user = user;
            await client.join(this.userChannel(user.id));
        } catch (error) {
            this.logger.warn(`Từ chối private socket ${client.id}: ${error?.message || error}`);
            client.emit('private:error', { message: 'Không có quyền kết nối private chat' });
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.debug(`Private socket disconnected: ${client.id}`);
    }

    emitNewMessage(room: Room, message: ChatPrivate) {
        const payload = { roomId: room.id || room._id?.toString(), message };
        this.server.to(this.userChannel(room.id_member)).to(this.userChannel(room.id_expert))
            .emit(RADIO_CHAT.PRIVATE_MESSAGE_NEW, payload);
    }

    emitRoomRead(room: Room, payload: { roomId: string; readerId: string; readAt: Date }) {
        this.server.to(this.userChannel(room.id_member)).to(this.userChannel(room.id_expert))
            .emit(RADIO_CHAT.PRIVATE_ROOM_READ, payload);
    }

    private extractToken(client: Socket): string | undefined {
        const authToken = client.handshake.auth?.token;
        const header = client.handshake.headers.authorization;
        const raw = typeof authToken === 'string' ? authToken : header;
        return raw?.replace(/^Bearer\s+/i, '').trim();
    }

    private userChannel(userId: string) {
        return `user:${userId}`;
    }
}
