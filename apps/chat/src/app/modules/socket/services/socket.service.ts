import {
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
} from '@nestjs/websockets';
// import {  } from 'dgram';
import { Server, Socket } from 'socket.io';
import { MetaDataKeys } from '@common/constant/common.constant';
import { Logger } from '@nestjs/common';
import { RADIO_CHAT } from '@common/constant/enum/radio-chatting.contant';

@WebSocketGateway({
    cors: { origin: '*' }, // Nhớ mở CORS
    transports: ['websocket']
})
export class ChatSocketGateway {
    @WebSocketServer()
    server: Server;

    // hàm này là hàm có sẵn của socket  trong nestjs 
    handleConnection(client: Socket, ...args: any[]) {
        client.join(RADIO_CHAT.SEND_MESSAGE_COMMUNITY)
        Logger.log(`${client.id} đã tham gia vào room ${RADIO_CHAT.SEND_MESSAGE_COMMUNITY}`)
    }

    sendMessageToRoom(room: string, content: { id: string, userId: string, replyTo: string, message: string }) {
        console.log('sádasdasd');
        this.server.to(room).emit(RADIO_CHAT.SEND_MESSAGE_COMMUNITY, content)
    }

}