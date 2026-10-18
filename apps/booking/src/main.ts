/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ensureRabbitTopology } from '@common/configuration/rabbit-topology';
import { AppModule } from './app/app.module';
// import { CONFIGURATION } from './configuration/index';
import { MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  // Exchanges/queues must exist before the RMQ clients bind to them (fresh broker).
  await ensureRabbitTopology();
  const app = await NestFactory.create(AppModule);

  const globalPrefix = 'api';

  app.setGlobalPrefix(globalPrefix);

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: AppModule.CONFIGURATION.TCP_SERV.TCP_BOOKING_SERVICE.transport,
      options: {
        host: '0.0.0.0', // listen on every interface; *_HOST is only for callers
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
