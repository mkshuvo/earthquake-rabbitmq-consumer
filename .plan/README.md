# .plan Folder

This folder contains detailed implementation plans for the earthquake-rabbitmq-consumer service.

## Available Plans

### 1. IMPLEMENTATION_EMAIL_SMS_NOTIFICATIONS.md

A comprehensive, step-by-step guide to adding notification capabilities using **FREE** services.

**What it implements:**

| Channel | Technology | Free Limit | Cost for 50k |
|---------|-----------|------------|--------------|
| **Push Notifications** | Firebase FCM | Unlimited | **$0** |
| **Email** | Resend | 3,000/month | **$0** |
| **MQTT** | (Already exists) | Unlimited | **$0** |

**Total Cost: $0/month for 50,000+ users!**

## How to Use This Plan

1. Read the overview section (includes cost analysis)
2. Follow each step in order (Step 1 → Step 8)
3. Each step includes:
   - What to do
   - Why you need to do it
   - Full code examples
   - Troubleshooting tips
4. Test using the provided test scripts
5. Run the service

## Prerequisites

Before starting, you need:

- [ ] A Firebase project (free at https://console.firebase.google.com)
- [ ] A Resend account (free at https://resend.com)
- [ ] The earthquake-rabbitmq-consumer project

## Quick Start

1. Install dependencies:
   ```bash
   npm install nodemailer firebase-admin
   ```

2. Update `.env` file with Firebase and Resend credentials

3. Create the new service files as outlined in the plan

4. Run:
   ```bash
   npm run start:dev
   ```

## Need Help?

- Check the Troubleshooting section at the end of the implementation guide
- Verify your environment variables are correct
- Test with the provided test scripts first
