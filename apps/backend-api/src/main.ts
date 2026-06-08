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
  const localAllowedOriginPattern =
    /^http:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}):30\d{2}$/;

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (
        !origin ||
        config.corsOrigins.includes(origin) ||
        (config.appEnv === "local" &&
          localAllowedOriginPattern.test(origin))
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`), false);
    },
    credentials: true,
    exposedHeaders: [
      "Content-Disposition",
      "X-Omnia-Row-Count",
      "X-Omnia-Row-Limit",
      "X-Omnia-Truncated",
    ],
  });

  const openApiConfig = new DocumentBuilder()
    .setTitle("Omnia Backend API")
    .setDescription("Central API foundation for Omnia hybrid omnichannel POS.")
    .setVersion(config.version)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup("api/v1/docs", app, document);

  await app.listen(config.port, config.host);
  logger.log(`backend-api listening on ${config.host}:${config.port}`);
}

void bootstrap();
