/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';


  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: AppModule.CONFIGURATION.TCP_SERV.TCP_SLOT_SERVICE.transport,
      options: {
        host: AppModule.CONFIGURATION.TCP_SERV.TCP_SLOT_SERVICE.options.host,
        port: AppModule.CONFIGURATION.TCP_SERV.TCP_SLOT_SERVICE.options.port
      },
    },
  )

  // set up lắng nghe đường ống BOOKING HOLD DEMAND
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_DEMAND.transport,
      options: {
        urls: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_DEMAND.options.urls,
        queue: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_DEMAND.options.queue,
        queueOptions: {
          durable: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_DEMAND.options.queueOptions.durable,
        },
        prefetchCount: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_DEMAND.options.prefetchCount,
        noAck: false,
        persistent: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_DEMAND.options.persistent
      }
    },
  )

  // set up lắng nghe đường ống BOOKING HOLD CANCLE
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_CANCEL_SLOT.transport,
      options: {
        urls: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_CANCEL_SLOT.options.urls,
        queue: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_CANCEL_SLOT.options.queue,
        queueOptions: {
          durable: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_CANCEL_SLOT.options.queueOptions.durable,
        },
        prefetchCount: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_CANCEL_SLOT.options.prefetchCount,
        noAck: false,
        persistent: AppModule.CONFIGURATION.RABBIT_CONFIG.BOOKING_HOLD_CANCEL_SLOT.options.persistent
      }
    },
  )

  AppModule.CONFIGURATION.validate();
  app.setGlobalPrefix(globalPrefix);
  const port = AppModule.CONFIGURATION.APP_CONFIG.SLOT_PORT;
  await app.startAllMicroservices();
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
