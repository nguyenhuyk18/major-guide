/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { createProxyMiddleware } from 'http-proxy-middleware';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { rawBody: true });
    const globalPrefix = AppModule.CONFIGURATION.GLOBAL_PREFIX;
    const chatServiceHost =
      process.env['TCP_CHAT_SERVICE_HOST'] ||
      'localhost';

    const socketProxy = createProxyMiddleware({
      pathFilter: '/socket.io',
      target: `http://${chatServiceHost}:${AppModule.CONFIGURATION.APP_CONFIG.CHAT_PORT}`,
      changeOrigin: true,
      ws: true
    });

    app.use(socketProxy);


    // console.log(AppModule.CONFIGURATION.GRPC_CONFIG.GRPC_AUTHORIZE_SERVICE)

    // validate mấy cái config đã được thêm chưa
    AppModule.CONFIGURATION.validate();

    // set up đường route api để chuẩn hóa
    app.setGlobalPrefix(globalPrefix);

    // set up validate dto
    app.useGlobalPipes(new ValidationPipe({ transform: true }))

    // set up swagger
    const config = new DocumentBuilder()
      .setTitle('MAJOR GUIDE API')
      .setDescription('The MAJOR GUIDE API description')
      .setVersion('1.0.0')
      .addBearerAuth({
        description: 'Default JWT Authorization',
        type: 'http',
        in: 'header',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
      })
      .build();

    app.enableCors({
      origin: '*'
    })

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${globalPrefix}/docs`, app, documentFactory, {
      jsonDocumentUrl: "swagger-json"
    });

    // Endpoint để xuất Swagger JSON file cho frontend
    app.getHttpAdapter().get(`${globalPrefix}/docs-json`, (req, res) => {
      res.setHeader('Content-Disposition', 'attachment; filename=swagger.json');
      res.setHeader('Content-Type', 'application/json');
      res.json(documentFactory());
    });

    // set up port cho module này nó chạy
    const port = AppModule.CONFIGURATION.APP_CONFIG.PORT || 3000;

    const httpServer = await app.listen(port);
    httpServer.on('upgrade', socketProxy.upgrade);

    Logger.log(
      `🚀 See all the api on: http://localhost:${port}/${globalPrefix}/docs`
    );

    Logger.log(
      `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
    );
  } catch (error) {
    Logger.error(
      `🚀 Application failed to start: ${error}`, '', 'Bootstrap', false
    );
  }

}

bootstrap();
