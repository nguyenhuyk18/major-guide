import { Module } from '@nestjs/common';
import { ProvinceModule } from './modules/province/province.module';
import { ConfigModule } from '@nestjs/config';
import { CONFIGURATION, TConfiguration } from '../configuration';
import { MongoProvider } from '@common/configuration/mongo.config';
import { WardModule } from './modules/ward/ward.module';
import { UserModule } from './modules/user/user.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => CONFIGURATION]
    }),
    ProvinceModule,
    WardModule,
    UserModule,
    MongoProvider
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION
}
