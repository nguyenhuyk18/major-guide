import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomDestination } from '@common/schemas/chat/room.schema';
import { RoomController } from './controllers/room.controller';
import { RoomRepository } from './repositories/room.repository';
import { RoomService } from './services/room.service';
import { ClientsModule } from '@nestjs/microservices';
import { TCP_SERVICE, TcpProvider } from '@common/configuration/tcp.config';

@Module({
    imports: [
        MongooseModule.forFeature([RoomDestination]),
        ClientsModule.registerAsync([TcpProvider(TCP_SERVICE.USER_ACCESS_SERVICE)])
    ],
    controllers: [RoomController],
    providers: [RoomRepository, RoomService],
    exports: [RoomService, RoomRepository]
})
export class RoomModule { }
