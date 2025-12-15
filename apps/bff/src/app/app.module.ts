import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { CONFIGURATION, TConfiguration } from '../configuration';
import { LoggerMiddleware } from '@common/middlewares/logger.middlewares';
import { SlotModule } from './modules/slot/slot.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ExceptionInterceptor } from '@common/interceptors/exception.interceptor';
import { UserAccessModule } from './modules/user-access/user-access.module';

@Module({
  imports: [ConfigModule.forRoot(
    {
      isGlobal: true,
      load: [() => CONFIGURATION]
    }
  ),
    SlotModule,
    UserAccessModule
  ],
  controllers: [],

  providers: [{
    provide: APP_INTERCEPTOR,
    useClass: ExceptionInterceptor,
  },],
})
export class AppModule implements NestModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION;
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
