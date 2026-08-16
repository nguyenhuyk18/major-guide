import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule } from '@nestjs/microservices';
import { NotificationDestination } from '@common/schemas/chat/notification.schema';
import { GRPC_SERVICES, GrpcProvider } from '@common/configuration/grpc.config';
import { NotificationController } from './controllers/notification.controller';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationService } from './services/notification.service';
import { NotificationGateway } from './services/notification.gateway';
@Module({ imports: [MongooseModule.forFeature([NotificationDestination]), ClientsModule.registerAsync([GrpcProvider(GRPC_SERVICES.AUTHORIZE_SERVICE)])], controllers: [NotificationController], providers: [NotificationRepository, NotificationService, NotificationGateway] })
export class NotificationModule {}
