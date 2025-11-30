import { Injectable, Logger } from '@nestjs/common';
import {
  EarthquakeEvent,
  EarthquakeNotification,
} from '../earthquake/earthquake.interface';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private mqttClient: ClientProxy;

  constructor() {
    // Initialize MQTT client for push notifications
    // Use environment variable for MQTT URL, default to docker container name when running in Docker
    const mqttUrl = process.env.MQTT_URL || 'mqtt://emqx:1883';
    this.mqttClient = ClientProxyFactory.create({
      transport: Transport.MQTT,
      options: {
        url: mqttUrl,
        clientId: 'earthquake-notifier',
        clean: true,
        connectTimeout: 4000,
        username: 'earthquake_user',
        password: 'earthquake_pass',
        reconnectPeriod: 1000,
      },
    });
  }

  async sendPushNotification(
    notification: EarthquakeNotification,
  ): Promise<void> {
    try {
      // Publish to MQTT topic based on priority
      const topic = `earthquake/alert/${notification.data.priority}`;

      // Send notification to MQTT broker
      await this.mqttClient.emit(topic, notification);

      this.logger.log(
        `Push notification sent to MQTT topic ${topic}: ${notification.title}`,
      );
    } catch (error) {
      this.logger.error('Error sending push notification via MQTT:', error);
      throw error;
    }
  }

  async sendWebSocketNotification(
    notification: EarthquakeNotification,
  ): Promise<void> {
    try {
      // TODO: Implement WebSocket broadcast to web clients
      this.logger.log(
        `WebSocket notification would be sent: ${notification.title}`,
      );

      // Placeholder for WebSocket implementation
      // this.socketGateway.broadcast('earthquake.alert', notification);
    } catch (error) {
      this.logger.error('Error sending WebSocket notification:', error);
      throw error;
    }
  }

  async sendEmailAlert(earthquake: EarthquakeEvent): Promise<void> {
    try {
      // Only send email for critical earthquakes (magnitude >= 7.0)
      if (earthquake.magnitude >= 7.0) {
        this.logger.log(
          `Critical earthquake email alert would be sent for M${earthquake.magnitude}`,
        );

        // TODO: Implement email service (using NodeMailer or AWS SES)
        // const emailContent = {
        //   to: 'alerts@earthquake-system.com',
        //   subject: `🚨 CRITICAL EARTHQUAKE ALERT - M${earthquake.magnitude}`,
        //   html: `
        //     <h2>Critical Earthquake Detected</h2>
        //     <p><strong>Magnitude:</strong> ${earthquake.magnitude}</p>
        //     <p><strong>Location:</strong> ${earthquake.location.place}</p>
        //     <p><strong>Depth:</strong> ${earthquake.depth}km</p>
        //     <p><strong>Time:</strong> ${earthquake.timestamp}</p>
        //     <p><strong>Coordinates:</strong> ${earthquake.location.latitude}, ${earthquake.location.longitude}</p>
        //     <p><a href="${earthquake.url}">View Details</a></p>
        //   `
        // };

        // await this.emailService.send(emailContent);
      }
    } catch (error) {
      this.logger.error('Error sending email alert:', error);
      throw error;
    }
  }

  getDetermineAlertPriority(
    magnitude: number,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (magnitude >= 7.0) {
      return 'critical';
    } else if (magnitude >= 5.5) {
      return 'high';
    } else if (magnitude >= 4.0) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  shouldSendNotification(
    earthquake: EarthquakeEvent,
    priority: 'low' | 'medium' | 'high' | 'critical',
  ): boolean {
    // Only send notifications for medium priority and above
    const priorityLevels = ['low', 'medium', 'high', 'critical'];
    const minPriorityIndex = priorityLevels.indexOf('medium');
    const currentPriorityIndex = priorityLevels.indexOf(priority);

    return currentPriorityIndex >= minPriorityIndex;
  }
}
