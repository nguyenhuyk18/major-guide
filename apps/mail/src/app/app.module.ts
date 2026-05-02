import { Module } from '@nestjs/common';
import { MailModule } from './modules/mail/mail.module';
import { CONFIGURATION, TConfiguration } from '../configuration';
import { ConfigModule } from '@nestjs/config';
import { PDFGeneratorModule } from './modules/pdf-generator/pdf-generator.module';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';

@Module({
  imports: [MailModule, PDFGeneratorModule, ConfigModule.forRoot({
    isGlobal: true,
    load: [() => CONFIGURATION],

  })],
  controllers: [],
  providers: [],

})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION
}
