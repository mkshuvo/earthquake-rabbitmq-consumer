# Earthquake Alert Consumer Deployment

## Prerequisites
- Docker & Docker Compose
- Nginx
- External Docker network `earthquake_network`
- RabbitMQ & MQTT Broker running (from server deployment)

## Setup

1. **Nginx Configuration**:
   - Copy `deploy/nginx/rc.quakenow.ovh.conf` to `/etc/nginx/sites-available/`.
   - Symlink to `/etc/nginx/sites-enabled/`.
   - Reload Nginx: `sudo nginx -t && sudo systemctl reload nginx`.

2. **Run Service**:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

3. **Verify**:
   - Health check: `http://rc.quakenow.ovh/health`
