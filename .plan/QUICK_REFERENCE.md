# Quick Reference Card - COST-FREE Implementation

## Installation Commands

```bash
# Navigate to project
cd D:/projects/earthquake-detection/earthquake-rabbitmq-consumer

# Install dependencies
npm install nodemailer firebase-admin
npm install --save-dev @types/nodemailer
```

## Environment Variables to Add

```env
# ========================
# FIREBASE FCM (FREE unlimited push)
# ========================
# Get from Firebase Console > Project Settings > Service Accounts
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"your-project",...}

# ========================
# EMAIL (Resend - FREE 3,000/month)
# ========================
# Get free API key from https://resend.com
RESEND_API_KEY=re_123456789
EMAIL_FROM=Earthquake Alerts <alerts@yourdomain.com>

# ========================
# THRESHOLDS
# ========================
MIN_PUSH_MAGNITUDE=4.0
MIN_EMAIL_MAGNITUDE=7.0
ADMIN_EMAILS=admin@example.com
```

## Files to Create

```
src/services/
├── email/
│   ├── email.interface.ts
│   ├── email.service.ts      (Resend integration)
│   ├── email.module.ts
│   └── index.ts
└── push/
    ├── push.interface.ts
    ├── push.service.ts       (Firebase FCM - FREE)
    ├── push.module.ts
    └── index.ts
```

## Files to Update

| File | Change |
|------|--------|
| `src/app.module.ts` | Import EmailModule and PushModule |
| `src/services/notification.service.ts` | Use PushService instead of SMS |

## Run Commands

```bash
# Build
npm run build

# Start dev
npm run start:dev
```

## Free Tier Limits

| Service | Free Limit | Cost for 50k users |
|---------|-----------|-------------------|
| **FCM Push** | Unlimited | **$0** |
| **MQTT** | Unlimited | **$0** |
| **Resend Email** | 3,000/month | **$0** |

## Total Cost: $0/month for 50,000+ users! 🚀
