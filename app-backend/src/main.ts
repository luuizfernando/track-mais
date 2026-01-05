import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";
import { ValidationPipe } from "@nestjs/common";
import { BigIntSerializerInterceptor } from "./common/interceptors/bigint-serializer.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS (filtra undefined pra não passar valor inválido)
  const allowedOrigins = [
    "http://localhost:3000",
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];
  app.enableCors({
    origin: allowedOrigins,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new BigIntSerializerInterceptor());

  // Render precisa que você escute em 0.0.0.0 e na porta do ambiente
  const port = parseInt(process.env.PORT ?? "3000", 10);
  await app.listen(port, "0.0.0.0");
  // opcional: log pra confirmar no console do Render
  console.log(`Server listening on http://0.0.0.0:${port}`);
}
bootstrap();
