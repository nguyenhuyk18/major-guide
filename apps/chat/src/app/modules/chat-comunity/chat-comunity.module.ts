import { Module } from "@nestjs/common";
import { ChatComunityController } from "./controllers/chat-comunity.controller";
import { ChatComunityRepository } from "./repositories/chat-comunity.repository";
import { ChatComunityService } from "./services/chat-comunity.service";
import { MongooseModule } from "@nestjs/mongoose";
import { ChatComunityDestination } from "@common/schemas/chat/chat-comunity.schema";
import { ChatSocketModule } from "../socket/socket.module";
// import { MongoProvider } from "@common/configuration/mongo.config";

@Module({
    imports: [
        MongooseModule.forFeature([ChatComunityDestination]),

        ChatSocketModule

    ],
    controllers: [ChatComunityController],
    providers: [ChatComunityRepository, ChatComunityService]
})
export class ChatComunityModule {

}