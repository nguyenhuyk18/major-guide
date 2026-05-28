import { Module } from '@nestjs/common';
import { ChatAiController } from './controllers/chat-ai.controller';

@Module({
    controllers: [ChatAiController]
})
export class ChatAiModule { }
