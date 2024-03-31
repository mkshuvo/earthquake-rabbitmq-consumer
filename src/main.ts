import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { rabbitmqConfig } from "./rabbitmq/rabbitmq.config";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: rabbitmqConfig.options.urls,
        queue: rabbitmqConfig.options.queue,
      },
    },
  );
  await app.listen();
}
bootstrap();
