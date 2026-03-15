/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
// import { CONFIGURATION } from './configuration/index';
import { MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const globalPrefix = 'api';

  app.setGlobalPrefix(globalPrefix);

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: AppModule.CONFIGURATION.TCP_SERV.TCP_BOOKING_SERVICE.transport,
      options: {
        host: AppModule.CONFIGURATION.TCP_SERV.TCP_BOOKING_SERVICE.options.host,
        port: AppModule.CONFIGURATION.TCP_SERV.TCP_BOOKING_SERVICE.options.port
      },
    },
  )

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_CANCEL.transport,
      options: {
        urls: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_CANCEL.options.urls,
        queue: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_CANCEL.options.queue,
        queueOptions: {
          durable: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_CANCEL.options.queueOptions.durable,
        },
        prefetchCount: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_CANCEL.options.prefetchCount,
        noAck: false,
        persistent: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_CANCEL.options.persistent
      }
    },
  )

  AppModule.CONFIGURATION.validate();

  const port = AppModule.CONFIGURATION.APP_CONFIG.BOOKING_PORT;
  await app.startAllMicroservices();
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
