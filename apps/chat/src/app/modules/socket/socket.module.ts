import { Module } from "@nestjs/common";
import { ChatSocketGateway } from "./services/socket.service";

@Module({
    providers: [ChatSocketGateway],
    exports: [ChatSocketGateway]
})
export class ChatSocketModule { }