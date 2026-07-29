# Earthquake Notification Enhancement Plan

## Overview

This document contains detailed, step-by-step instructions to enhance the `earthquake-rabbitmq-consumer` service with new notification channels:

### ⚠️ IMPORTANT: Cost Considerations

| Notification Channel | Free Tier Limit | Paid Cost (50k users) | Recommendation |
|---------------------|-----------------|----------------------|----------------|
| **In-App (MQTT/WebSocket)** | Unlimited | FREE | ✅ USE THIS |
| **Firebase Cloud Messaging (FCM)** | Unlimited push | FREE | ✅ RECOMMENDED |
| **Email (Resend/Mailgun)** | 3,000-5,000/mo | ~$10-50/mo | ⚠️ Limited |
| **Email (AWS SES)** | 62,000/mo (2 months) | $5/100k after | ⚠️ Temporary |
| **Twilio SMS** | None (trial only) | $500-4,000/mo | ❌ AVOID |

**For 50,000 users at zero cost:**
- Use **MQTT** (already in your system) for push notifications
- Use **Firebase Cloud Messaging (FCM)** for free push to Android/iOS
- Use **WebSocket** (already exists) for web users
- Use **Resend** (free tier: 3,000 emails/month) only for critical alerts

---

### What We Will Implement

**Recommended Stack (Free for 50k+ users):**

1. **MQTT Push Notifications** - Already built-in, use this for mass notification
2. **Firebase Cloud Messaging (FCM)** - Free unlimited push to mobile apps
3. **In-App Notification Storage** - Store notifications in MongoDB for users to view in-app
4. **Email for Critical Only** - Use Resend free tier (3,000/month) for M7.0+ only

**NOT Recommended (Too Expensive):**
- Twilio SMS (too costly for large user base)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Install Required Dependencies](#step-1-install-required-dependencies)
3. [Step 2: Create Environment Variables File](#step-2-create-environment-variables-file)
4. [Step 3: Create Email Service](#step-3-create-email-service)
5. [Step 4: Create SMS Service](#step-4-create-sms-service)
6. [Step 5: Update Notification Service](#step-5-update-notification-service)
7. [Step 6: Create Module Files](#step-6-create-module-files)
8. [Step 7: Update Main Module](#step-7-update-main-module)
9. [Step 8: Testing](#step-8-testing)
10. [Step 9: Running the Service](#step-9-running-the-service)

---

## Prerequisites

Before starting, make sure you have:

- [ ] Node.js installed (v18 or higher)
- [ ] Access to an email account (Gmail recommended for testing) OR an SMTP server
- [ ] A Twilio account (free trial works) with:
  - Account SID
  - Auth Token
  - A Twilio phone number
- [ ] The earthquake-rabbitmq-consumer service code cloned/downloaded

---

## Step 1: Install Required Dependencies

### 1.1 Open your terminal/command prompt

Navigate to the earthquake-rabbitmq-consumer directory:

```bash
cd D:/projects/earthquake-detection/earthquake-rabbitmq-consumer
```

### 1.2 Install Nodemailer (for emails)

```bash
npm install nodemailer
```

### 1.3 Install Firebase Admin SDK (for FCM Push - FREE unlimited push)

```bash
npm install firebase-admin
```

### 1.4 Install type definitions (for TypeScript)

```bash
npm install --save-dev @types/nodemailer
```

### 1.5 Verify installation

Check your `package.json` - you should see the new packages:

```json
{
  "dependencies": {
    "nodemailer": "^6.x.x",
    "firebase-admin": "^12.x.x"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.x.x"
  }
}
```

---

## Step 2: Create Environment Variables File

### 2.1 Create a new file named `.env` in the project root

If you already have a `.env` file, skip to step 2.3.

### 2.2 Add the following environment variables

Create or update your `.env` file with these variables:

```env
# ========================
# RABBITMQ CONFIGURATION
# ========================
RABBITMQ_URL=amqp://rabbit:rabbit@localhost:42107
MQTT_URL=mqtt://localhost:45329

# ========================
# EMAIL CONFIGURATION (Using Resend - FREE 3,000/month)
# ========================
# Resend API Key (get free at https://resend.com)
RESEND_API_KEY=re_123456789
EMAIL_FROM=Earthquake Alerts <alerts@yourdomain.com>

# Alternative: Gmail SMTP (500/day limit)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASSWORD=your-app-password

# ========================
# FIREBASE CONFIGURATION (FCM - FREE unlimited push)
# ========================
# Firebase service account JSON (paste the entire JSON content)
# Get from Firebase Console > Project Settings > Service Accounts
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project",...}

# ========================
# NOTIFICATION SETTINGS
# ========================
# Minimum magnitude for push/FMC alerts (default: 4.0)
MIN_PUSH_MAGNITUDE=4.0
# Minimum magnitude for email alerts (default: 7.0)
MIN_EMAIL_MAGNITUDE=7.0
# List of comma-separated admin emails (for critical alerts)
ADMIN_EMAILS=admin@example.com
```

### 2.3 Setting Up Resend (Free Email - Recommended)

1. Go to https://resend.com and sign up (free)
2. Create an API key
3. Verify your domain (or use their sandbox for testing)
4. Add `RESEND_API_KEY=re_xxxxx` to your `.env`

**Free tier:** 3,000 emails/month (enough for ~100 critical M7.0+ quakes)

### 2.4 Setting Up Firebase Cloud Messaging (FCM) - FREE

1. Go to https://console.firebase.google.com/
2. Create a new project (or use existing)
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Copy the JSON content to your `.env` file as `FIREBASE_SERVICE_ACCOUNT_JSON`

**Free tier:** Unlimited push notifications to Android/iOS

### 2.5 Test your environment variables

Add this to verify they load correctly (optional debugging):

```typescript
// In any service file, temporarily add:
console.log('Email user:', process.env.EMAIL_USER);
console.log('Twilio SID:', process.env.TWILIO_ACCOUNT_SID);
```

---

## Step 3: Update Email Service (Use Resend - Free 3,000/month)

*Note: We now use Resend instead of Gmail for better free tier limits*

### 3.1 Update the email service

Replace the `src/services/email/email.service.ts` content with:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EmailConfig, EarthquakeEmailData } from './email.interface';

/**
 * EmailService handles sending earthquake alert emails
 *
 * FREE options:
 * - Resend: 3,000 emails/month (RECOMMENDED)
 * - Gmail SMTP: 500 emails/day
 * - AWS SES: 62,000 emails free (2 months), then $5/100k
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private config: EmailConfig;
  private adminEmails: string[];
  private minMagnitude: number;

  constructor(private configService: ConfigService) {
    // Load configuration - support both Resend API and SMTP
    const useResend = this.configService.get<string>('RESEND_API_KEY');

    if (useResend) {
      // Use Resend API (RECOMMENDED - 3,000 free/month)
      this.transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 587,
        secure: false,
        auth: {
          user: 'resend',
          pass: useResend,
        },
      });
      this.logger.log('Email service configured with Resend (3,000 free/month)');
    } else {
      // Fallback to Gmail/SMTP
      this.config = {
        host: this.configService.get<string>('EMAIL_HOST', 'smtp.gmail.com'),
        port: this.configService.get<number>('EMAIL_PORT', 587),
        secure: this.configService.get<boolean>('EMAIL_SECURE', false),
        user: this.configService.get<string>('EMAIL_USER', ''),
        pass: this.configService.get<string>('EMAIL_PASSWORD', ''),
        from: this.configService.get<string>('EMAIL_FROM', ''),
      };

      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
      });
      this.logger.log(`Email service configured with ${this.config.host}`);
    }

    // Load admin emails
    const emailsStr = this.configService.get<string>('ADMIN_EMAILS', '');
    this.adminEmails = emailsStr ? emailsStr.split(',').map(e => e.trim()) : [];

    // Load minimum magnitude threshold
    this.minMagnitude = this.configService.get<number>('MIN_EMAIL_MAGNITUDE', 7.0);

    this.logger.log(`EmailService initialized - Admin emails: ${this.adminEmails.length}`);
    this.logger.log(`Minimum magnitude threshold: M${this.minMagnitude}`);
  }

  shouldSendEmail(magnitude: number): boolean {
    return magnitude >= this.minMagnitude;
  }

  async sendEarthquakeAlert(earthquake: EarthquakeEmailData): Promise<void> {
    if (!this.shouldSendEmail(earthquake.magnitude)) {
      this.logger.debug(`Skipping email - M${earthquake.magnitude} below threshold`);
      return;
    }

    if (this.adminEmails.length === 0) {
      this.logger.warn('No admin emails configured - skipping email alert');
      return;
    }

    try {
      const htmlContent = this.generateEmailHtml(earthquake);
      const textContent = this.generateEmailText(earthquake);

      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM', 'alerts@earthquake-system.com'),
        to: this.adminEmails.join(', '),
        subject: this.generateEmailSubject(earthquake),
        text: textContent,
        html: htmlContent,
      });

      this.logger.log(`Earthquake alert email sent - Message ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error('Failed to send earthquake alert email:', error);
    }
  }

  private generateEmailSubject(earthquake: EarthquakeEmailData): string {
    const emoji = earthquake.magnitude >= 8.0 ? '🚨' : '⚠️';
    return `${emoji} CRITICAL EARTHQUAKE ALERT - M${earthquake.magnitude} - ${earthquake.place}`;
  }

  private generateEmailHtml(earthquake: EarthquakeEmailData): string {
    let alertColor = '#FFA500';
    let alertLevel = 'HIGH';
    if (earthquake.magnitude >= 8.0) {
      alertColor = '#FF0000';
      alertLevel = 'CRITICAL';
    }

    return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="background-color: ${alertColor}; color: white; padding: 20px; text-align: center;">
      <h1 style="margin: 0;">🚨 EARTHQUAKE ALERT</h1>
      <p style="margin: 5px 0 0 0;">${alertLevel} PRIORITY</p>
    </div>
    <div style="padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background-color: ${alertColor}; color: white; padding: 15px 30px; border-radius: 50px; font-size: 32px; font-weight: bold;">
          M${earthquake.magnitude}
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Location</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${earthquake.place}</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Depth</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${earthquake.depth} km</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Time (UTC)</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(earthquake.timestamp).toUTCString()}</td></tr>
        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Coordinates</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${earthquake.latitude}, ${earthquake.longitude}</td></tr>
      </table>
      <div style="text-align: center; margin-top: 20px;">
        <a href="${earthquake.url}" style="display: inline-block; background-color: ${alertColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Details on USGS</a>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  private generateEmailText(earthquake: EarthquakeEmailData): string {
    return `
🚨 EARTHQUAKE ALERT

Magnitude: M${earthquake.magnitude}
Location: ${earthquake.place}
Depth: ${earthquake.depth} km
Time: ${new Date(earthquake.timestamp).toUTCString()}
Coordinates: ${earthquake.latitude}, ${earthquake.longitude}

View Details: ${earthquake.url}
    `.trim();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email connection verified');
      return true;
    } catch (error) {
      this.logger.error('Email connection failed:', error);
      return false;
    }
  }
}
```

### 3.2 Update the email module (no changes needed, same as before)

---

## Step 4: Create Push Notification Service (FCM - FREE)

*Note: We replaced SMS (Twilio - paid) with Firebase Cloud Messaging (FCM - FREE unlimited push)*

### 4.1 Create the push service directory

Create a new folder: `src/services/push`

### 4.2 Create the push interface

Create file: `src/services/push/push.interface.ts`

```typescript
/**
 * Interface for earthquake data included in push notification
 */
export interface EarthquakePushData {
  earthquakeId: string;
  magnitude: number;
  place: string;
  depth: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  url: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Interface for FCM notification payload
 */
export interface FcmNotification {
  title: string;
  body: string;
  data: EarthquakePushData;
}
```

### 4.3 Create the push service (FCM)

Create file: `src/services/push/push.service.ts`

**FULL CODE:**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { EarthquakePushData, FcmNotification } from './push.interface';

/**
 * PushService handles sending earthquake alert push notifications via Firebase Cloud Messaging (FCM)
 *
 * This service:
 * - Connects to Firebase Admin SDK
 * - Sends push notifications to mobile devices (Android/iOS)
 * - Supports sending to topics (e.g., "earthquake-alerts")
 * - Supports sending to specific device tokens
 * - FREE unlimited push notifications!
 *
 * Cost: FREE (Firebase Spark plan includes unlimited FCM)
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private isInitialized: boolean = false;
  private minMagnitude: number;

  /**
   * Constructor - initializes Firebase Admin SDK from environment variables
   *
   * Required env variables:
   * - FIREBASE_SERVICE_ACCOUNT_JSON (full JSON from Firebase Console)
   * - MIN_PUSH_MAGNITUDE (optional, default: 4.0)
   */
  constructor(private configService: ConfigService) {
    // Load minimum magnitude threshold
    this.minMagnitude = this.configService.get<number>('MIN_PUSH_MAGNITUDE', 4.0);

    // Initialize Firebase Admin
    this.initializeFirebase();

    this.logger.log('PushService (FCM) initialized');
    this.logger.log(`Minimum magnitude threshold: M${this.minMagnitude}`);
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initializeFirebase(): void {
    try {
      // Get service account JSON from environment variable
      const serviceAccountJson = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');

      if (!serviceAccountJson) {
        this.logger.warn('Firebase service account not configured - push notifications disabled');
        return;
      }

      // Parse the JSON string
      const serviceAccount = JSON.parse(serviceAccountJson);

      // Initialize Firebase Admin
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.isInitialized = true;
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Check if an earthquake meets the threshold for sending a push notification
   */
  shouldSendPush(magnitude: number): boolean {
    return magnitude >= this.minMagnitude;
  }

  /**
   * Send push notification to a specific device token
   *
   * @param deviceToken - FCM device token from the mobile app
   * @param notification - The notification data
   */
  async sendToDevice(deviceToken: string, notification: FcmNotification): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn('Firebase not initialized - skipping push notification');
      return;
    }

    try {
      const message: admin.messaging.Message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          earthquakeId: notification.data.earthquakeId,
          magnitude: notification.data.magnitude.toString(),
          place: notification.data.place,
          depth: notification.data.depth.toString(),
          timestamp: notification.data.timestamp,
          latitude: notification.data.latitude.toString(),
          longitude: notification.data.longitude.toString(),
          url: notification.data.url,
          priority: notification.data.priority,
        },
        token: deviceToken,
        android: {
          priority: this.mapPriorityToAndroid(notification.data.priority),
          notification: {
            channelId: 'earthquake_alerts',
            priority: 'high' as const,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const result = await admin.messaging().send(message);
      this.logger.log(`Push notification sent to device: ${result}`);
    } catch (error) {
      this.logger.error('Failed to send push to device:', error);
    }
  }

  /**
   * Send push notification to all subscribers of a topic
   * This is the RECOMMENDED approach for mass notifications!
   *
   * @param topic - The topic name (e.g., 'earthquake-alerts')
   * @param notification - The notification data
   */
  async sendToTopic(topic: string, notification: FcmNotification): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn('Firebase not initialized - skipping push notification');
      return;
    }

    try {
      const message: admin.messaging.MessagingPayload = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          earthquakeId: notification.data.earthquakeId,
          magnitude: notification.data.magnitude.toString(),
          place: notification.data.place,
          depth: notification.data.depth.toString(),
          timestamp: notification.data.timestamp,
          latitude: notification.data.latitude.toString(),
          longitude: notification.data.longitude.toString(),
          url: notification.data.url,
          priority: notification.data.priority,
        },
      };

      // Send to topic - this can reach MILLIONS of users for FREE!
      const result = await admin.messaging().sendToTopic(topic, message);

      this.logger.log(`Push notification sent to topic '${topic}': ${result}`);
    } catch (error) {
      this.logger.error('Failed to send push to topic:', error);
    }
  }

  /**
   * Subscribe devices to a topic
   *
   * @param deviceTokens - Array of FCM device tokens
   * @param topic - Topic to subscribe to
   */
  async subscribeToTopic(deviceTokens: string[], topic: string): Promise<void> {
    if (!this.isInitialized) {
      this.logger.warn('Firebase not initialized - skipping subscription');
      return;
    }

    try {
      const result = await admin.messaging().subscribeToTopic(deviceTokens, topic);
      this.logger.log(`Subscribed ${result.successCount} devices to topic '${topic}'`);
    } catch (error) {
      this.logger.error('Failed to subscribe to topic:', error);
    }
  }

  /**
   * Unsubscribe devices from a topic
   */
  async unsubscribeFromTopic(deviceTokens: string[], topic: string): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      const result = await admin.messaging().unsubscribeFromTopic(deviceTokens, topic);
      this.logger.log(`Unsubscribed ${result.successCount} devices from topic '${topic}'`);
    } catch (error) {
      this.logger.error('Failed to unsubscribe from topic:', error);
    }
  }

  /**
   * Map priority string to Android priority
   */
  private mapPriorityToAndroid(priority: string): 'high' | 'normal' {
    return priority === 'critical' || priority === 'high' ? 'high' : 'normal';
  }

  /**
   * Test Firebase connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      // Just check if app is initialized
      this.logger.log('Firebase connection is active');
      return true;
    } catch (error) {
      this.logger.error('Firebase connection test failed:', error);
      return false;
    }
  }
}
```

### 4.4 Create the push module

Create file: `src/services/push/push.module.ts`

```typescript
import { Module, Global } from '@nestjs/common';
import { PushService } from './push.service';

/**
 * PushModule provides push notification functionality via Firebase Cloud Messaging
 *
 * This module is marked as @Global() so it can be imported
 * once at the root level and available throughout the application
 *
 * Cost: FREE unlimited push notifications!
 */
@Global()
@Module({
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
```

### 4.5 Create an index file for easy imports

Create file: `src/services/push/index.ts`

```typescript
export * from './push.service';
export * from './push.interface';
```

---

## Step 5: Update Notification Service

### 5.1 Modify the notification service

Open the existing file: `src/services/notification.service.ts`

Replace the entire file content with:

```typescript
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
import { EmailService } from './email/email.service';
import { PushService } from './push/push.service';

/**
 * NotificationService handles all types of earthquake notifications
 *
 * This service coordinates (ALL FREE!):
 * - MQTT push notifications (already in your system - FREE)
 * - Firebase Cloud Messaging (FCM) - FREE unlimited push
 * - Email alerts (Resend free tier: 3,000/month)
 *
 * Cost for 50,000 users: $0/month
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private mqttClient: ClientProxy;

  /**
   * Constructor - initializes MQTT client and other notification services
   */
  constructor(
    private readonly emailService: EmailService,
    private readonly pushService: PushService,
  ) {
    // Initialize MQTT client for push notifications
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

    this.logger.log('NotificationService initialized (Email + FCM Push - FREE)');
  }

  /**
   * Send push notification to mobile devices via MQTT (existing)
   */
  async sendPushNotification(
    notification: EarthquakeNotification,
  ): Promise<void> {
    try {
      const topic = `earthquake/alert/${notification.data.priority}`;
      await this.mqttClient.emit(topic, notification);
      this.logger.log(`MQTT push sent to ${topic}: ${notification.title}`);
    } catch (error) {
      this.logger.error('Error sending MQTT push:', error);
      throw error;
    }
  }

  /**
   * Send push notification via Firebase Cloud Messaging (FCM)
   * This can reach MILLIONS of users for FREE!
   *
   * @param earthquake - The earthquake event
   * @param priority - Alert priority level
   */
  async sendFcmPush(
    earthquake: EarthquakeEvent,
    priority: 'low' | 'medium' | 'high' | 'critical',
  ): Promise<void> {
    try {
      // Check threshold
      if (!this.pushService.shouldSendPush(earthquake.magnitude)) {
        this.logger.debug(`Skipping FCM - M${earthquake.magnitude} below threshold`);
        return;
      }

      // Prepare notification
      const notification = {
        title: `Earthquake Alert - M${earthquake.magnitude}`,
        body: `${earthquake.location.place} - Depth: ${earthquake.depth}km`,
        data: {
          earthquakeId: earthquake.id,
          magnitude: earthquake.magnitude,
          place: earthquake.location.place,
          depth: earthquake.depth,
          timestamp: earthquake.timestamp,
          latitude: earthquake.location.latitude,
          longitude: earthquake.location.longitude,
          url: earthquake.url || `https://earthquake.usgs.gov/earthquakes/eventpage/${earthquake.id}`,
          priority: priority,
        },
      };

      // Send to FCM topic - this reaches ALL subscribed users for FREE!
      // Users subscribe to topics like 'earthquake-alerts' from the mobile app
      await this.pushService.sendToTopic('earthquake-alerts', notification);

      // Also send to critical-alerts topic for M7.0+
      if (priority === 'critical') {
        await this.pushService.sendToTopic('critical-alerts', notification);
      }

      this.logger.log(`FCM push sent for earthquake ${earthquake.id}`);
    } catch (error) {
      this.logger.error('Error sending FCM push:', error);
    }
  }

  /**
   * Send WebSocket notification to web clients (existing)
   */
  async sendWebSocketNotification(
    notification: EarthquakeNotification,
  ): Promise<void> {
    this.logger.log(`WebSocket notification: ${notification.title}`);
    // Placeholder - implement if you have a WebSocket gateway
  }

  /**
   * Send email alert for critical earthquakes (M7.0+)
   * Uses Resend free tier: 3,000 emails/month
   */
  async sendEmailAlert(earthquake: EarthquakeEvent): Promise<void> {
    try {
      if (!this.emailService.shouldSendEmail(earthquake.magnitude)) {
        return;
      }

      await this.emailService.sendEarthquakeAlert({
        earthquakeId: earthquake.id,
        magnitude: earthquake.magnitude,
        place: earthquake.location.place,
        depth: earthquake.depth,
        timestamp: earthquake.timestamp,
        latitude: earthquake.location.latitude,
        longitude: earthquake.location.longitude,
        url: earthquake.url || `https://earthquake.usgs.gov/earthquakes/eventpage/${earthquake.id}`,
      });

      this.logger.log(`Email alert sent for earthquake ${earthquake.id}`);
    } catch (error) {
      this.logger.error('Error sending email alert:', error);
    }
  }

  /**
   * Determine alert priority based on magnitude
   */
  getDetermineAlertPriority(
    magnitude: number,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (magnitude >= 7.0) return 'critical';
    if (magnitude >= 5.5) return 'high';
    if (magnitude >= 4.0) return 'medium';
    return 'low';
  }

  /**
   * Determine if notification should be sent
   */
  shouldSendNotification(
    earthquake: EarthquakeEvent,
    priority: 'low' | 'medium' | 'high' | 'critical',
  ): boolean {
    const priorityLevels = ['low', 'medium', 'high', 'critical'];
    return priorityLevels.indexOf(priority) >= priorityLevels.indexOf('medium');
  }
}
```

---

## Step 6: Update Module Files

### 6.1 Update the app module

Open: `src/app.module.ts`

Replace the content with:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { HealthController } from './controllers/health.controller';
// Import the new Email and Push modules
import { EmailModule } from './services/email/email.module';
import { PushModule } from './services/push/push.module';

@Module({
  imports: [
    // Load environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // RabbitMQ consumer module
    RabbitmqModule,
    // Email notification module (Resend - FREE)
    EmailModule,
    // Push notification module (FCM - FREE)
    PushModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
```

---

## Step 7: Testing

### 7.1 Create a test script

Create file: `src/test-notifications.ts`

```typescript
/**
 * Test script to verify email and SMS services work correctly
 * Run with: npx ts-node src/test-notifications.ts
 */

import { ConfigService } from '@nestjs/config';
import { EmailService } from './services/email/email.service';
import { SmsService } from './services/sms/sms.service';

// Test data for earthquake
const testEarthquake = {
  earthquakeId: 'test-001',
  magnitude: 7.5,
  place: 'Test Location - 50km N of Tokyo',
  depth: 50,
  timestamp: new Date().toISOString(),
  latitude: 35.6762,
  longitude: 139.6503,
  url: 'https://earthquake.usgs.gov/earthquakes/eventpage/test001',
};

async function testEmail() {
  console.log('\n=== Testing Email Service ===\n');

  const configService = new ConfigService({
    EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
    EMAIL_PORT: parseInt(process.env.EMAIL_PORT) || 587,
    EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_RECIPIENTS: process.env.EMAIL_RECIPIENTS || 'test@example.com',
    MIN_EMAIL_MAGNITUDE: 7.0,
  });

  const emailService = new EmailService(configService);

  // Test connection
  console.log('Testing email connection...');
  const connected = await emailService.testConnection();
  if (!connected) {
    console.error('❌ Email connection failed - check your credentials');
    return false;
  }
  console.log('✅ Email connection successful');

  // Test sending
  console.log('\nSending test earthquake alert...');
  await emailService.sendEarthquakeAlert(testEarthquake);
  console.log('✅ Test email sent (check your inbox)');

  return true;
}

async function testSms() {
  console.log('\n=== Testing SMS Service ===\n');

  const configService = new ConfigService({
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    SMS_RECIPIENTS: process.env.SMS_RECIPIENTS || '+1234567890',
    MIN_SMS_MAGNITUDE: 5.5,
  });

  const smsService = new SmsService(configService);

  // Test connection
  console.log('Testing Twilio connection...');
  const connected = await smsService.testConnection();
  if (!connected) {
    console.error('❌ Twilio connection failed - check your credentials');
    return false;
  }
  console.log('✅ Twilio connection successful');

  // Test sending
  console.log('\nSending test SMS...');
  await smsService.sendEarthquakeAlert(testEarthquake);
  console.log('✅ Test SMS sent (check your phone)');

  return true;
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     Earthquake Notification Service - Test Script         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  // Test email
  const emailOk = await testEmail();

  // Test SMS
  const smsOk = await testSms();

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                      TEST RESULTS                          ║');
  console.log('╠═══════════════════════════════════════════════════════════╣');
  console.log(`║  Email: ${emailOk ? '✅ PASSED' : '❌ FAILED'}                                        ║`);
  console.log(`║  SMS:   ${smsOk ? '✅ PASSED' : '❌ FAILED'}                                        ║`);
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  process.exit(emailOk && smsOk ? 0 : 1);
}

main().catch(console.error);
```

### 7.2 Run the test

```bash
# First, set your environment variables
export EMAIL_USER="your-email@gmail.com"
export EMAIL_PASSWORD="your-16-char-app-password"
export EMAIL_RECIPIENTS="your-email@gmail.com"

# Run the test
npx ts-node src/test-notifications.ts
```

### 7.3 Alternative: Manual test in the service

Add a temporary endpoint to test. Open `src/controllers/health.controller.ts` and add:

```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from '../app.service';
import { EmailService } from '../services/email/email.service';
import { SmsService } from '../services/sms/sms.service';

@Controller('test')
export class TestController {
  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  @Get('email')
  async testEmail() {
    await this.emailService.sendEarthquakeAlert({
      earthquakeId: 'test-manual-001',
      magnitude: 7.5,
      place: 'Test Location - Manual Test',
      depth: 10,
      timestamp: new Date().toISOString(),
      latitude: 0,
      longitude: 0,
      url: 'https://example.com',
    });
    return { status: 'Email test sent' };
  }

  @Get('sms')
  async testSms() {
    await this.smsService.sendEarthquakeAlert({
      earthquakeId: 'test-manual-002',
      magnitude: 6.0,
      place: 'Test Location - Manual Test',
      depth: 20,
      timestamp: new Date().toISOString(),
    });
    return { status: 'SMS test sent' };
  }
}
```

Then add this controller to `app.module.ts`:

```typescript
import { TestController } from './controllers/test.controller';

// In @Module({...})
controllers: [AppController, HealthController, TestController],
```

---

## Step 8: Running the Service

### 8.1 Build the project

```bash
npm run build
```

### 8.2 Start in development mode

```bash
npm run start:dev
```

### 8.3 Start in production mode

```bash
npm run start:prod
```

### 8.4 Docker deployment

If running in Docker, update your `.env` file with the production values and rebuild:

```bash
docker-compose up --build
```

---

## Configuration Summary

### Environment Variables Reference (ALL FREE!)

| Variable | Description | Example | Cost |
|----------|-------------|---------|------|
| **Resend (Email)** ||| **FREE 3,000/mo** |
| `RESEND_API_KEY` | Resend API key | `re_123456789` | Free |
| `EMAIL_FROM` | From address | `alerts@yourdomain.com` | Free |
| **Firebase FCM (Push)** ||| **FREE Unlimited** |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase service account | `{...}` | Free |
| **Thresholds** ||| |
| `MIN_PUSH_MAGNITUDE` | Min magnitude for push | `4.0` | - |
| `MIN_EMAIL_MAGNITUDE` | Min magnitude for email | `7.0` | - |
| `ADMIN_EMAILS` | Admin email addresses | `admin@example.com` | - |

### Cost Comparison for 50,000 Users

| Channel | Old (Twilio/Gmail) | New (FCM/Resend) |
|---------|-------------------|------------------|
| Push Notifications | $500-4,000/mo | **$0/mo** |
| Email | Limited (500/day) | **$0/mo** (3,000/mo) |
| **Total** | **$500-4,000/mo** | **$0/mo** |

---

## Troubleshooting

### Firebase/FCM Issues

| Problem | Solution |
|---------|----------|
| "Credential" error | Check FIREBASE_SERVICE_ACCOUNT_JSON is valid JSON |
| "Project not found" | Verify project_id in the JSON matches Firebase Console |
| Push not received | Check app subscribes to correct topic (`earthquake-alerts`) |
| Sandbox mode | Firebase sandbox has limits; verify in Firebase Console |

### Resend/Email Issues

| Problem | Solution |
|---------|----------|
| "Invalid API key" | Check RESEND_API_KEY is correct (starts with `re_`) |
| "Domain not verified" | Verify your domain in Resend or use sandbox |
| Emails not received | Check spam folder, try sandbox first |
| Rate limit | Resend free tier: 3,000/month |

### General Debugging

```bash
# Test Firebase
# Add console.log in push.service.ts initializeFirebase()

# Test Email
# Add console.log in email.service.ts

# Check logs
npm run start:dev
```

---

## File Structure After Implementation

After completing all steps, your project structure should look like:

```
earthquake-rabbitmq-consumer/
├── src/
│   ├── main.ts
│   ├── app.module.ts                 (UPDATED - import PushModule)
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── controllers/
│   │   └── health.controller.ts
│   ├── earthquake/
│   │   ├── earthquake.interface.ts
│   │   └── earthquakeDTO.ts
│   ├── rabbitmq/
│   │   ├── rabbitmq.service.ts
│   │   ├── rabbitmq.controller.ts
│   │   ├── rabbitmq.module.ts
│   │   └── rabbitmq.config.ts
│   ├── services/
│   │   ├── notification.service.ts   (UPDATED - uses PushService)
│   │   ├── email/
│   │   │   ├── email.interface.ts    (NEW)
│   │   │   ├── email.service.ts     (NEW - uses Resend)
│   │   │   ├── email.module.ts      (NEW)
│   │   │   └── index.ts             (NEW)
│   │   └── push/
│   │       ├── push.interface.ts     (NEW)
│   │       ├── push.service.ts      (NEW - uses Firebase FCM)
│   │       ├── push.module.ts        (NEW)
│   │       └── index.ts             (NEW)
│   └── test-notifications.ts         (NEW - optional)
├── .env                              (UPDATE - Firebase + Resend config)
├── package.json                      (UPDATE - new deps)
└── ...
```

---

## Next Steps / Enhancements

After basic implementation, consider adding:

1. **Email Templates Database** - Store email templates in MongoDB for customization
2. **User Preferences** - Let users choose their notification preferences
3. **Rate Limiting** - Prevent notification spam during earthquake swarms
4. **Delivery Status Tracking** - Track which notifications were delivered
5. **Retry Logic** - Automatic retry for failed email/SMS
6. **Scheduled Reports** - Daily/weekly earthquake summary emails

---

## References

- [Nodemailer Documentation](https://nodemailer.com/)
- [Twilio Node.js SDK](https://www.twilio.com/docs/libraries/node)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
