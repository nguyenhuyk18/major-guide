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

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: AppModule.CONFIGURATION.TCP_SERV.TCP_AUTHORIZER_SERVICE.transport,
      options: {
        host: '0.0.0.0', // listen on every interface; *_HOST is only for callers
        port: AppModule.CONFIGURATION.TCP_SERV.TCP_AUTHORIZER_SERVICE.options.port
      },
    },
  )


  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: AppModule.CONFIGURATION.GRPC_CONFIG.GRPC_AUTHORIZE_SERVICE.transport,
      options: {
        package: AppModule.CONFIGURATION.GRPC_CONFIG.GRPC_AUTHORIZE_SERVICE.name,
        protoPath: AppModule.CONFIGURATION.GRPC_CONFIG.GRPC_AUTHORIZE_SERVICE.options.protoPath,
        url: `0.0.0.0:${AppModule.CONFIGURATION.GRPC_CONFIG.GRPC_AUTHORIZE_SERVICE.options.url.split(":").pop()}` // listen on every interface
      },
    },
  )




  const port = AppModule.CONFIGURATION.APP_CONFIG.AUTHORIZER_PORT;

  AppModule.CONFIGURATION.validate()
  await app.startAllMicroservices();
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );

}

bootstrap();
