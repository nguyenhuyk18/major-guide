import { Module } from '@nestjs/common';
import { MailModule } from './modules/mail.module';
import { CONFIGURATION, TConfiguration } from '../configuration';
import { ConfigModule } from '@nestjs/config';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';

@Module({
  imports: [MailModule, ConfigModule.forRoot({
    isGlobal: true,
    load: [() => CONFIGURATION]
  })],
  controllers: [],
  providers: [],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION
}
