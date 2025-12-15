import { Module } from '@nestjs/common';
import { ShiftModule } from './modules/shift/shift.module';
import { MongoProvider } from '@common/configuration/mongo.config';
import { ConfigModule } from '@nestjs/config';
import { CONFIGURATION, TConfiguration } from '../configuration';
import { RegisterModule } from './modules/register/register.module';


@Module({
  imports: [

    ConfigModule.forRoot(
      {
        isGlobal: true,
        load: [() => CONFIGURATION]
      }
    ),
    ShiftModule,
    RegisterModule,
    MongoProvider
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION

}
