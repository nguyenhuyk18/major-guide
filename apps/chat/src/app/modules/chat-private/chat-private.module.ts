import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatPrivateDestination } from '@common/schemas/chat/chat-private.schema';
import { ChatPrivateController } from './controllers/chat-private.controller';
import { ChatPrivateRepository } from './repositories/chat-private.repository';
import { ChatPrivateService } from './services/chat-private.service';
import { RoomModule } from '../room/room.module';
import { ChatSocketModule } from '../socket/socket.module';

@Module({
    imports: [
        MongooseModule.forFeature([ChatPrivateDestination]),
        RoomModule,
        ChatSocketModule
    ],
    controllers: [ChatPrivateController],
    providers: [ChatPrivateRepository, ChatPrivateService]
})
export class ChatPrivateModule { }
