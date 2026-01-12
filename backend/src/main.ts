import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log();
  console.log(`\x1b[32m✓\x1b[0m Backend API running at: \x1b[36mhttp://localhost:${port}\x1b[0m`);
  console.log(`\x1b[32m✓\x1b[0m API Docs: \x1b[36mhttp://localhost:${port}/categories\x1b[0m`);
  console.log();
}
bootstrap();
