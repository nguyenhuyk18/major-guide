import { Module } from '@nestjs/common';
import { ChatComunityModule } from './modules/chat-comunity/chat-comunity.module';
import { CONFIGURATION, TConfiguration } from '../configuration';
import { ConfigModule } from '@nestjs/config';
import { MongoProvider } from '@common/configuration/mongo.config';
import { ChatSocketModule } from './modules/socket/socket.module';


@Module({
  imports: [ChatComunityModule,
    ChatSocketModule,
    MongoProvider,
    ConfigModule.forRoot(
      {
        isGlobal: true,
        load: [() => CONFIGURATION]
      }
    )

  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION
}
