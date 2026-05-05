import "reflect-metadata";

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { appConfig } from "./config/app.config";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(appConfig.KEY);
  const logger = new Logger("Bootstrap");

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
  });

  const openApiConfig = new DocumentBuilder()
    .setTitle("Omnia Backend API")
    .setDescription("Central API foundation for Omnia hybrid omnichannel POS.")
    .setVersion(config.version)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup("api/v1/docs", app, document);

  await app.listen(config.port);
  logger.log(`backend-api listening on port ${config.port}`);
}

void bootstrap();
