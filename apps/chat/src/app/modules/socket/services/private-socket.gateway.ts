import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RADIO_CHAT } from '@common/constant/enum/radio-chatting.contant';

/**
 * Gateway for community chat (real-time public forum).
 *
 * Mounted at the ROOT namespace so the FE client (which connects without
 * a namespace) can join the community room and receive broadcasts.
 */
@WebSocketGateway({
    namespace: '/private',
    cors: { origin: '*' },
    transports: ['websocket']
})
export class CommunityChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(CommunityChatGateway.name);

    afterInit(server: Server) {
        this.logger.log('[CommunityChatGateway] Initialized at /private namespace "/"');
    }

    handleConnection(client: Socket, ...args: any[]) {

        this.logger.log(`[CommunityChatGateway] Connection from ${client.id}, nsp=${client.nsp.name}`);
        client.join(RADIO_CHAT.SEND_MESSAGE_COMMUNITY);
        this.logger.log(`[CommunityChatGateway] ${client.id} joined community room ${RADIO_CHAT.SEND_MESSAGE_COMMUNITY}`);



    }

    handleDisconnect(client: Socket) {
        this.logger.log(`[CommunityChatGateway] ${client.id} disconnected from community chat`);
    }

    sendMessageToRoom(room: string, content: { id: string; userId: string; replyTo: string; message: string }) {
        this.logger.log(`[CommunityChatGateway] Emitting to room ${room}: ${JSON.stringify(content)}`);
        this.server.to(room).emit(RADIO_CHAT.SEND_MESSAGE_COMMUNITY, content);
    }
}