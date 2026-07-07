import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import session = require('express-session');
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // REQUIRED FOR NGINX / HTTPS REVERSE PROXY:
  app.set('trust proxy', 1);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'ananda-honda-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true on HTTPS
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      },
    }),
  );
  
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 4063);
}
bootstrap();
