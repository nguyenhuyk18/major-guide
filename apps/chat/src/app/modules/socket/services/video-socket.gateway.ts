import {
    ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect,
    SubscribeMessage, WebSocketGateway, WebSocketServer,
} from '@nestjs/websockets';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Namespace, Socket } from 'socket.io';
import { firstValueFrom } from 'rxjs';
import { randomUUID } from 'crypto';
import { GRPC_SERVICES } from '@common/configuration/grpc.config';
import { TCP_SERVICE } from '@common/configuration/tcp.config';
import { TCP_BOOKING_SERVICE_MESSAGE } from '@common/constant/enum/tcp-message-pattern.constant';
import { AuthorizerService } from '@common/interfaces/grpc/authorizer';
import { TcpClient } from '@common/interfaces/tcp/common/tcp-client.interface';
import { ROLE } from '@common/constant/enum/action.constant';

@Injectable()
@WebSocketGateway({ namespace: '/video', cors: { origin: '*' }, transports: ['websocket'] })
export class VideoSocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    @WebSocketServer() server: Namespace;
    private authorizerService: AuthorizerService;
    private readonly logger = new Logger(VideoSocketGateway.name);
    private readonly participants = new Map<string, Map<string, string>>();

    constructor(
        @Inject(GRPC_SERVICES.AUTHORIZE_SERVICE) private readonly authorizerClient: ClientGrpc,
        @Inject(TCP_SERVICE.BOOKING_SERVICE) private readonly bookingClient: TcpClient,
    ) {}

    onModuleInit() {
        this.authorizerService = this.authorizerClient.getService<AuthorizerService>('AuthorizerService');
    }

    handleConnection(client: Socket) {
        client.data.authentication = this.authenticate(client);
    }

    private async authenticate(client: Socket) {
        try {
            const raw = client.handshake.auth?.token || client.handshake.headers.authorization;
            const token = typeof raw === 'string' ? raw.replace(/^Bearer\s+/i, '').trim() : '';
            if (!token) throw new Error('Missing token');
            const result = await firstValueFrom(this.authorizerService.verifyUserToken({ token, processId: randomUUID() }));
            const user = result?.metadata?.user;
            if (!result?.valid || !user?.id || ![ROLE.MEMBER, ROLE.EXPERT].includes(user.roleName as ROLE)) throw new Error('Invalid user');
            client.data.user = user;
            return user;
        } catch (error: any) {
            this.logger.warn(`Từ chối video socket ${client.id}: ${error?.message || error}`);
            client.emit('video:error', { message: 'Không có quyền kết nối phòng gọi' });
            client.disconnect(true);
            return null;
        }
    }

    handleDisconnect(client: Socket) { this.leaveCurrentRoom(client); }

    @SubscribeMessage('video:join')
    async join(@ConnectedSocket() client: Socket, @MessageBody() body: { bookingId?: string }) {
        const bookingId = typeof body?.bookingId === 'string' ? body.bookingId.trim() : '';
        const user = client.data.user || await client.data.authentication;
        if (!user?.id) return { ok: false, message: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại' };
        if (!bookingId) return { ok: false, message: 'Mã phòng gọi không hợp lệ' };

        let response: any;
        try {
            response = await firstValueFrom(this.bookingClient.send<any, { bookingId: string; userId: string; roleName: string }>(
                TCP_BOOKING_SERVICE_MESSAGE.VIDEO_CALL_ACCESS,
                { data: { bookingId, userId: user.id, roleName: user.roleName }, processId: randomUUID() }
            ));
        } catch (error) {
            this.logger.error(`Không thể xác thực video room ${bookingId}: ${error}`);
            return { ok: false, message: 'Không thể xác thực phòng gọi lúc này' };
        }
        const access = response?.data;
        if (!access?.canJoin) return { ok: false, message: access?.reason || 'Không thể tham gia phòng gọi' };

        const room = this.roomName(bookingId);
        const current = this.participants.get(bookingId) || new Map<string, string>();
        const previousSocketId = current.get(user.id);
        if (previousSocketId && previousSocketId !== client.id) {
            const previous = this.server.sockets.get(previousSocketId);
            previous?.emit('video:error', { message: 'Phòng gọi đã được mở ở một tab khác' });
            previous?.disconnect(true);
        }
        if (!current.has(user.id) && current.size >= 2) return { ok: false, message: 'Phòng gọi đã đủ người tham gia' };

        current.set(user.id, client.id);
        this.participants.set(bookingId, current);
        client.data.videoBookingId = bookingId;
        client.data.videoRole = access.participantRole;
        await client.join(room);
        client.to(room).emit('video:peer-ready', { role: access.participantRole, userId: user.id });
        return { ok: true, role: access.participantRole, peerPresent: current.size > 1 };
    }

    @SubscribeMessage('video:offer')
    offer(@ConnectedSocket() client: Socket, @MessageBody() body: { sdp: unknown }) {
        if (client.data.videoRole !== 'member') return;
        this.forward(client, 'video:offer', { sdp: body?.sdp });
    }

    @SubscribeMessage('video:answer')
    answer(@ConnectedSocket() client: Socket, @MessageBody() body: { sdp: unknown }) {
        if (client.data.videoRole !== 'expert') return;
        this.forward(client, 'video:answer', { sdp: body?.sdp });
    }

    @SubscribeMessage('video:ice-candidate')
    ice(@ConnectedSocket() client: Socket, @MessageBody() body: { candidate: unknown }) {
        this.forward(client, 'video:ice-candidate', { candidate: body?.candidate });
    }

    @SubscribeMessage('video:media-state')
    mediaState(@ConnectedSocket() client: Socket, @MessageBody() body: { audio: boolean; video: boolean }) {
        this.forward(client, 'video:media-state', { audio: !!body?.audio, video: !!body?.video });
    }

    @SubscribeMessage('video:leave')
    leave(@ConnectedSocket() client: Socket) { this.leaveCurrentRoom(client); }

    private forward(client: Socket, event: string, payload: object) {
        const bookingId = client.data.videoBookingId;
        if (bookingId) client.to(this.roomName(bookingId)).emit(event, payload);
    }

    private leaveCurrentRoom(client: Socket) {
        const bookingId = client.data.videoBookingId;
        const userId = client.data.user?.id;
        if (!bookingId || !userId) return;
        const room = this.participants.get(bookingId);
        if (room?.get(userId) === client.id) room.delete(userId);
        if (!room?.size) this.participants.delete(bookingId);
        client.to(this.roomName(bookingId)).emit('video:peer-left', { userId });
        client.leave(this.roomName(bookingId));
        client.data.videoBookingId = undefined;
    }

    private roomName(bookingId: string) { return `video:${bookingId}`; }
}
