# Tencent Cloud Deployment Guide

This guide deploys AI Bridge on a Tencent Cloud CVM using Docker Compose.

## 1. Recommended Tencent Cloud Resources

### Minimum CVM

```text
Instance: Lightweight CVM or standard CVM
OS: Ubuntu 22.04 LTS
CPU: 1-2 cores
Memory: 2 GB+
Disk: 40 GB+
Bandwidth: 3 Mbps+
```

### Network

Open these ports in the security group:

```text
22    SSH
80    HTTP, optional if using Nginx
443   HTTPS, required for GPT Actions production use
3000  AI Bridge direct API, optional for initial testing only
```

For production, expose only 80/443 and proxy to local port 3000 through Nginx.

## 2. Install Docker

SSH into the server:

```bash
ssh ubuntu@YOUR_SERVER_IP
```

Install Docker:

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg git
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Log out and log in again, then check:

```bash
docker --version
```

Install Docker Compose plugin if missing:

```bash
sudo apt install -y docker-compose-plugin
```

## 3. Clone Repository

```bash
git clone https://github.com/kelvin381539960-cyber/Ai-bridge.git
cd Ai-bridge
```

## 4. Create `.env`

```bash
cp .env.example .env
nano .env
```

Fill these values:

```env
PORT=3000
BRIDGE_API_KEY=replace-with-a-long-random-secret
GITHUB_TOKEN=github-token-with-repo-contents-read-write
DEFAULT_OWNER=kelvin381539960-cyber
DEFAULT_BRANCH=main
ALLOWED_REPOS=kelvin381539960-cyber/Ai-bridge
ALLOWED_PATH_PREFIXES=
MAX_BATCH_OPERATIONS=20
MAX_TEXT_BYTES=1000000
MAX_BINARY_BYTES=5000000
```

Important:

- Do not commit `.env`.
- `GITHUB_TOKEN` should be a fine-grained token.
- Restrict the token to the repositories AI Bridge may operate.
- Minimum GitHub permission: repository contents read/write, metadata read.

## 5. Start Service

```bash
docker compose up -d --build
```

Check logs:

```bash
docker compose logs -f ai-bridge
```

Test health:

```bash
curl http://localhost:3000/health
```

Expected result:

```json
{"ok":true,"service":"ai-bridge","version":"0.1.0"}
```

## 6. Test API With API Key

```bash
curl "http://localhost:3000/api/tree?owner=kelvin381539960-cyber&repo=Ai-bridge&recursive=false" \
  -H "x-bridge-api-key: YOUR_BRIDGE_API_KEY"
```

## 7. Configure Nginx + HTTPS

Install Nginx:

```bash
sudo apt install -y nginx
```

Create config:

```bash
sudo nano /etc/nginx/sites-available/ai-bridge
```

Paste:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable:

```bash
sudo ln -s /etc/nginx/sites-available/ai-bridge /etc/nginx/sites-enabled/ai-bridge
sudo nginx -t
sudo systemctl reload nginx
```

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Issue certificate:

```bash
sudo certbot --nginx -d YOUR_DOMAIN
```

Test:

```bash
curl https://YOUR_DOMAIN/health
```

## 8. Update `openapi.yaml`

Replace:

```yaml
servers:
  - url: https://YOUR_DEPLOYED_AI_BRIDGE_DOMAIN
```

with:

```yaml
servers:
  - url: https://YOUR_DOMAIN
```

Use this updated schema in GPT Actions.

## 9. Updating AI Bridge Later

```bash
cd Ai-bridge
git pull
docker compose up -d --build
```

## 10. Common Problems

### 401 Unauthorized

Check `x-bridge-api-key` matches `.env` `BRIDGE_API_KEY`.

### 403 Repository is not allowed

Check `ALLOWED_REPOS` includes the target repo in `owner/repo` format.

### GitHub API permission error

Check `GITHUB_TOKEN` has repository contents read/write permission.

### GPT Actions cannot connect

Check:

- Domain uses HTTPS.
- Security group allows 443.
- Nginx proxy is active.
- `/health` is publicly reachable.

## 11. Production Safety

Recommended production settings:

```text
Do not expose port 3000 publicly after HTTPS proxy is ready.
Restrict ALLOWED_REPOS.
Restrict ALLOWED_PATH_PREFIXES for sensitive repositories.
Use a separate GitHub token only for AI Bridge.
Rotate BRIDGE_API_KEY regularly.
Review Git commit history for all AI Bridge operations.
```
