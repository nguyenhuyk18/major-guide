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
  const port = AppModule.CONFIGURATION.APP_CONFIG.CHAT_PORT;

  app.enableCors({
    origin: '*'
  });

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: AppModule.CONFIGURATION.TCP_SERV.TCP_CHAT_SERVICE.transport,
      options: {
        host: '0.0.0.0', // listen on every interface; *_HOST is only for callers
        port: AppModule.CONFIGURATION.TCP_SERV.TCP_CHAT_SERVICE.options.port
      },
    },
  )

  AppModule.CONFIGURATION.validate();
  await app.startAllMicroservices();

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
