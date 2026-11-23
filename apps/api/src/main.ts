import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { validateEnv } from './common/env/env.schema.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Carrega variáveis da raiz do monorepo e de apps/api (sobrescrevendo se houver)
loadEnv({ path: resolve(process.cwd(), '../../.env') });
loadEnv({ path: resolve(process.cwd(), '.env'), override: true });

async function bootstrap() {
  const env = validateEnv();

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger Documentation em /docs
  const config = new DocumentBuilder()
    .setTitle('Prospect API')
    .setDescription('Documentação OpenAPI do Backend NestJS do Prospect')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(env.PORT);
  console.log(`🚀 API rodando em http://localhost:${env.PORT}/api`);
  console.log(`📚 Documentação Swagger disponível em http://localhost:${env.PORT}/docs`);
}

bootstrap();

