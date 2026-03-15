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
  app.setGlobalPrefix(globalPrefix);
  const port = AppModule.CONFIGURATION.APP_CONFIG.MAIL_SERVICE_PORT || 3305;


  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: AppModule.CONFIGURATION.RABBIT_CONFIG.RABBIT_MAIL_SERVICE.transport,
      options: {
        urls: AppModule.CONFIGURATION.RABBIT_CONFIG.RABBIT_MAIL_SERVICE.options.urls,
        queue: AppModule.CONFIGURATION.RABBIT_CONFIG.RABBIT_MAIL_SERVICE.options.queue,
        queueOptions: {
          durable: AppModule.CONFIGURATION.RABBIT_CONFIG.RABBIT_MAIL_SERVICE.options.queueOptions.durable,
        },
        prefetchCount: AppModule.CONFIGURATION.RABBIT_CONFIG.RABBIT_MAIL_SERVICE.options.prefetchCount,
        noAck: false,
        persistent: AppModule.CONFIGURATION.RABBIT_CONFIG.RABBIT_MAIL_SERVICE.options.persistent
      }
    },
  )

  await app.listen(port);
  await app.startAllMicroservices();
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
