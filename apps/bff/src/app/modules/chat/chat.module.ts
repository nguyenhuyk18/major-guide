import { Module } from "@nestjs/common";
import { ChatComunityController } from "./controllers/chat-comunity.controller";
import { ClientsModule } from "@nestjs/microservices";
import { TCP_SERVICE, TcpProvider } from "@common/configuration/tcp.config";
import { RoomController } from "./controllers/room.controller";
import { ChatPrivateController } from './controllers/chat-private.controller';

@Module({
    imports: [ClientsModule.registerAsync([TcpProvider(TCP_SERVICE.CHAT_SERVICE)])],
    controllers: [ChatComunityController, RoomController, ChatPrivateController]
})
export class ChatModule { }
