import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  });

  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend - allow requests from frontend and main backend
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      process.env.MAIN_BACKEND_URL || 'http://localhost:8000',
      'http://localhost:3000', // Next.js default
      'http://localhost:3001', // Alternative frontend port
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const config = new DocumentBuilder()
    .setTitle('Soprano')
    .setDescription('Soprano Bot API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();