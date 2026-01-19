import { Module } from "@nestjs/common";
import { ChatComunityController } from "./controllers/chat-comunity.controller";
import { ClientsModule } from "@nestjs/microservices";
import { TCP_SERVICE, TcpProvider } from "@common/configuration/tcp.config";

@Module({
    imports: [ClientsModule.registerAsync([TcpProvider(TCP_SERVICE.CHAT_SERVICE)])],
    controllers: [ChatComunityController]
})
export class ChatModule { }