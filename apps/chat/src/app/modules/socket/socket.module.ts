import { Module } from "@nestjs/common";
import { ChatSocketGateway } from "./services/socket.service";
import { PrivateChatGateway } from './services/private-socket.gateway';
import { ClientsModule } from '@nestjs/microservices';
import { GRPC_SERVICES, GrpcProvider } from '@common/configuration/grpc.config';
import { TCP_SERVICE, TcpProvider } from '@common/configuration/tcp.config';
import { VideoSocketGateway } from './services/video-socket.gateway';

@Module({
    imports: [ClientsModule.registerAsync([
        GrpcProvider(GRPC_SERVICES.AUTHORIZE_SERVICE),
        TcpProvider(TCP_SERVICE.BOOKING_SERVICE),
    ])],
    providers: [ChatSocketGateway, PrivateChatGateway, VideoSocketGateway],
    exports: [ChatSocketGateway, PrivateChatGateway, VideoSocketGateway]
})
export class ChatSocketModule { }
