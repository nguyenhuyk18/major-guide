import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CONFIGURATION, TConfiguration } from '../configuration';
import { ReverseModule } from './modules/reserve/reserve.module';
import { MongoProvider } from '@common/configuration/mongo.config';
import { PaymentModule } from './modules/payment/payment.module';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => CONFIGURATION]
    }),
    ReverseModule,
    PaymentModule,
    MongoProvider
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION
}
