// rabbitmq.service.ts
import { Injectable } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Injectable()
export class RabbitmqService {
  @MessagePattern('earthquake_queue')
  handleMessage(data: any): string {
    console.log(`Received message: ${JSON.stringify(data)}`);
    // Process the message as needed
    return 'Message processed successfully';
  }
}
