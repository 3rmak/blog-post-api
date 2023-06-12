import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule, { logger });
  app.setGlobalPrefix(process.env.GLOBAL_PREFIX || 'api');
  app.useGlobalPipes(new ValidationPipe());

  const port = process.env.GLOBAL_PORT || 5000;
  await app.listen(port);
  logger.debug(`Application started on port: ${port}`);
}
bootstrap();
