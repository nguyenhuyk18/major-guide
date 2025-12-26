import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { CONFIGURATION, TConfiguration } from '../configuration';
import { LoggerMiddleware } from '@common/middlewares/logger.middlewares';
import { SlotModule } from './modules/slot/slot.module';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ExceptionInterceptor } from '@common/interceptors/exception.interceptor';
import { UserAccessModule } from './modules/user-access/user-access.module';
import { RedisProvider } from '@common/configuration/redis.config';
import { UserGuard } from '@common/guards/check-token.guard';
import { ClientsModule } from '@nestjs/microservices';
import { TCP_SERVICE, TcpProvider } from '@common/configuration/tcp.config';
import { PermissionGuard } from '@common/guards/permission.guard';

@Module({
  imports: [ConfigModule.forRoot(
    {
      isGlobal: true,
      load: [() => CONFIGURATION]
    }
  ),
    SlotModule,
    UserAccessModule,
    RedisProvider,
  ClientsModule.registerAsync([TcpProvider(TCP_SERVICE.AUTHORIZER_SERVICE)])
  ],
  controllers: [],

  providers: [{
    provide: APP_INTERCEPTOR,
    useClass: ExceptionInterceptor,
  },
  {
    provide: APP_GUARD,
    useClass: UserGuard,
  },
  {
    provide: APP_GUARD,
    useClass: PermissionGuard,
  }
  ],
})
export class AppModule implements NestModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION;
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
