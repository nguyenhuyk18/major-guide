import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { ChatAiController } from './controllers/chat-ai.controller';
import { RabbitProvider, RABBIT_SERVICE } from '@common/configuration/rabbit.config';

@Module({
    imports: [ClientsModule.registerAsync([RabbitProvider(RABBIT_SERVICE.MAIL_SERVICE)])],
    controllers: [ChatAiController]
})
export class ChatAiModule { }
