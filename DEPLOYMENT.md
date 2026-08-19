# 知问生产环境部署指南

本文将前端（React + Vite + Nginx）与后端（FastAPI + PostgreSQL + Qdrant）部署到一台 Ubuntu 22.04/24.04 服务器。推荐使用 Docker Compose：服务均运行在私有 Docker 网络，公网只开放 Nginx 的 80/443 端口。

> 本文基于当前两个仓库：`ai-smart-manual`（前端）与其同级目录的 `ai-smart-manual-backend`（后端）。前端默认使用相对地址 `/api`，因此浏览器只访问一个域名；Nginx 再将 API 请求转发给后端容器，避免跨域问题。

## 1. 部署前准备

### 服务器与账号

- 一台 Linux 服务器：建议 2 核 4 GB 内存、40 GB SSD 起步；处理大量 PDF/DOCX 或多人并发时建议 4 核 8 GB。
- Ubuntu 22.04 或 24.04 LTS，具备 `sudo` 权限的非 root 用户。
- 一个已备案（中国大陆服务器）并解析到服务器公网 IP 的域名，例如 `manual.example.com`。
- 云防火墙/安全组仅放行 TCP `22`、`80`、`443`；不要对公网开放 `5432`、`6333`、`6379`、`8000`、`9000`、`9001`。
- 可用的 LLM 和 Embedding 服务地址、模型名及 API Key。问答与向量检索在未配置它们时不能正常工作。

### 必备信息清单

部署前先准备并妥善保存以下值：

| 配置 | 用途 | 生成/示例 |
| --- | --- | --- |
| `POSTGRES_PASSWORD` | PostgreSQL 密码 | `openssl rand -base64 32` |
| `JWT_SECRET` | 登录令牌签名密钥，至少 32 位 | `openssl rand -base64 48` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 初始系统管理员账号 | 使用强密码，首次启动即写入数据库 |
| `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` | AI 回答与图片说明 | 由模型服务商提供 |
| `EMBEDDING_BASE_URL` / `EMBEDDING_API_KEY` / `EMBEDDING_MODEL` | 手册向量化、检索 | 由向量模型服务商提供 |
| 域名 | HTTPS 证书和用户访问地址 | `manual.example.com` |

**重要：** 初始管理员只会在数据库中不存在该用户名时创建。之后即使改 `.env` 中的密码，也不会自动重置已存在账号的密码；请在管理端改密或按后端的管理流程处理。

## 2. 安装服务器软件

以下命令以 Ubuntu 为例。先通过 SSH 登录服务器：

```bash
ssh deploy@YOUR_SERVER_IP
sudo apt update
sudo apt install -y ca-certificates curl git openssl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

重新登录 SSH 使 Docker 用户组生效，并确认：

```bash
docker --version
docker compose version
```

配置主机防火墙（如已由云安全组统一管理，可按安全策略调整）：

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 3. 获取代码并建立部署目录

将两个仓库克隆到服务器同一个目录。下面使用 `/opt/ai-smart-manual`；把两个 Git 地址替换成实际地址。

```bash
sudo mkdir -p /opt/ai-smart-manual
sudo chown "$USER":"$USER" /opt/ai-smart-manual
cd /opt/ai-smart-manual
git clone YOUR_FRONTEND_GIT_URL frontend
git clone YOUR_BACKEND_GIT_URL backend
mkdir -p deploy/nginx/certbot/www deploy/nginx/certbot/conf
```

目录应为：

```text
/opt/ai-smart-manual/
├── frontend/                 # ai-smart-manual
├── backend/                  # ai-smart-manual-backend
└── deploy/                   # 本文随后创建的生产部署文件
```

将 `deploy/` 目录单独建成私有运维仓库也可以；不要将其中的 `.env`、证书或密钥提交到 Git。

## 4. 创建生产部署文件

以下文件在 `/opt/ai-smart-manual/deploy` 下创建。它们不需要改动业务源码。

### 4.1 后端生产环境变量

创建 `deploy/.env`，填入真实值。不要保留示例密码，也不要在聊天、Issue 或 Git 中泄露此文件。

```dotenv
DOMAIN=manual.example.com

POSTGRES_PASSWORD=replace-with-a-long-random-password
JWT_SECRET=replace-with-at-least-32-random-characters
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace-with-a-strong-admin-password
ADMIN_NAME=系统管理员
ACCESS_TOKEN_MINUTES=480

LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=replace-with-your-llm-api-key
LLM_MODEL=your-chat-model
LLM_PROXY_URL=

EMBEDDING_BASE_URL=https://your-embedding-provider.example/v1
EMBEDDING_API_KEY=replace-with-your-embedding-api-key
EMBEDDING_MODEL=your-embedding-model
QDRANT_COLLECTION=manual_chunks
```

设置仅当前用户可读：

```bash
chmod 600 .env
```

### 4.2 前端生产 Nginx 配置

创建 `deploy/nginx/app.conf`：

```nginx
server {
    listen 80;
    server_name _;
    client_max_body_size 100m;

    location /api/ {
        proxy_pass http://api:8000/api/;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_read_timeout 120s;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /usr/share/nginx/html;
        try_files $uri /index.html;
    }
}
```

`proxy_buffering off` 是必要配置之一：聊天接口使用流式响应，开启缓冲会让回答在最后一次性显示。

### 4.3 生产 Docker Compose

创建 `deploy/compose.production.yaml`：

```yaml
services:
  web:
    build:
      context: ../frontend
    restart: unless-stopped
    depends_on:
      api:
        condition: service_healthy
    ports:
      - "127.0.0.1:8080:80"
    volumes:
      - ./nginx/app.conf:/etc/nginx/conf.d/default.conf:ro
    networks: [app_network]

  api:
    build:
      context: ../backend
    restart: unless-stopped
    environment:
      APP_ENV: production
      DATABASE_URL: postgresql+psycopg://manual:${POSTGRES_PASSWORD}@postgres:5432/manual
      FILE_STORAGE_PATH: /data/manuals
      IMAGE_STORAGE_PATH: /data/manual-images
      MAX_UPLOAD_MB: 100
      MAX_IMAGES_PER_MANUAL: 12
      JWT_SECRET: ${JWT_SECRET}
      ACCESS_TOKEN_MINUTES: ${ACCESS_TOKEN_MINUTES}
      ADMIN_USERNAME: ${ADMIN_USERNAME}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      ADMIN_NAME: ${ADMIN_NAME}
      LLM_BASE_URL: ${LLM_BASE_URL}
      LLM_API_KEY: ${LLM_API_KEY}
      LLM_MODEL: ${LLM_MODEL}
      LLM_PROXY_URL: ${LLM_PROXY_URL}
      EMBEDDING_BASE_URL: ${EMBEDDING_BASE_URL}
      EMBEDDING_API_KEY: ${EMBEDDING_API_KEY}
      EMBEDDING_MODEL: ${EMBEDDING_MODEL}
      QDRANT_URL: http://qdrant:6333
      QDRANT_COLLECTION: ${QDRANT_COLLECTION}
    volumes:
      - manual_files:/data/manuals
      - manual_images:/data/manual-images
    depends_on:
      postgres:
        condition: service_healthy
      qdrant:
        condition: service_started
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health')"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 30s
    networks: [app_network]

  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: manual
      POSTGRES_USER: manual
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U manual -d manual"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks: [app_network]

  qdrant:
    image: qdrant/qdrant:v1.15
    restart: unless-stopped
    volumes:
      - qdrant_data:/qdrant/storage
    networks: [app_network]

networks:
  app_network:

volumes:
  postgres_data:
  qdrant_data:
  manual_files:
  manual_images:
```

此部署刻意没有发布数据库、Qdrant 和 API 的端口。当前后端代码实际使用 PostgreSQL、Qdrant 与 Docker volume 保存文件/图片；Redis、MinIO 虽出现在后端开发版 Compose 中，但当前代码路径不依赖它们，故未在生产编排中启动。若后续接入相关能力，再补充对应服务及持久化卷。

### 4.4 启动应用

在部署目录执行：

```bash
cd /opt/ai-smart-manual/deploy
docker compose --env-file .env -f compose.production.yaml up -d --build
docker compose --env-file .env -f compose.production.yaml ps
curl -fsS http://127.0.0.1:8080/api/health
```

最后一条应返回 `{"status":"ok"}`。端口仅监听服务器本机，正式访问将由下一步的 HTTPS 网关提供。

## 5. 配置域名与 HTTPS

推荐由宿主机 Nginx 处理公网 80/443、证书续期和反向代理，应用容器仅监听 `127.0.0.1:8080`。

### 5.1 域名解析

在域名 DNS 管理台添加 A 记录：

```text
manual.example.com  ->  服务器公网 IPv4
```

等待解析生效后确认：

```bash
dig +short manual.example.com
```

### 5.2 安装 Nginx 与 Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx
```

创建 `/etc/nginx/sites-available/ai-smart-manual`，将域名替换为真实值：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name manual.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用站点并签发证书：

```bash
sudo ln -s /etc/nginx/sites-available/ai-smart-manual /etc/nginx/sites-enabled/ai-smart-manual
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d manual.example.com
sudo certbot renew --dry-run
```

Certbot 会把该站点升级为 HTTPS，并自动建立续期定时任务。至此访问 `https://manual.example.com`；登录 Cookie 因后端的 `APP_ENV=production` 会带 `Secure` 属性，因此不能跳过 HTTPS。

## 6. 验收清单

```bash
# 服务状态；全部应为 running，api 应最终显示 healthy
cd /opt/ai-smart-manual/deploy
docker compose --env-file .env -f compose.production.yaml ps

# 仅从服务器本机检查应用与公网 HTTPS
curl -fsS http://127.0.0.1:8080/api/health
curl -fsSI https://manual.example.com

# 若启动失败，查看最近日志
docker compose --env-file .env -f compose.production.yaml logs --tail=200 api
docker compose --env-file .env -f compose.production.yaml logs --tail=200 web
```

在浏览器完成以下人工验收：登录管理员账号、上传一个 PDF/DOCX、处理并发布手册、发起一次问答、检查聊天回答是否流式展示。后两项还能验证 LLM、Embedding 和 Qdrant 的连通性。

## 7. 日常更新、备份与回滚

### 更新

```bash
cd /opt/ai-smart-manual/frontend && git pull
cd /opt/ai-smart-manual/backend && git pull
cd /opt/ai-smart-manual/deploy
docker compose --env-file .env -f compose.production.yaml up -d --build
docker compose --env-file .env -f compose.production.yaml ps
```

不要使用 `docker compose down -v`：`-v` 会删除 PostgreSQL、Qdrant、上传手册和图片等命名卷。

### PostgreSQL 备份与恢复

在服务器创建只允许部署用户读取的备份目录，并定期复制到另一台机器或对象存储：

```bash
mkdir -p /opt/ai-smart-manual/backups
chmod 700 /opt/ai-smart-manual/backups
cd /opt/ai-smart-manual/deploy
docker compose --env-file .env -f compose.production.yaml exec -T postgres \
  pg_dump -U manual -d manual -Fc > /opt/ai-smart-manual/backups/manual-$(date +%F).dump
```

恢复前先停止 API，确认目标库允许覆盖后执行：

```bash
cd /opt/ai-smart-manual/deploy
docker compose --env-file .env -f compose.production.yaml stop api
docker compose --env-file .env -f compose.production.yaml exec -T postgres \
  pg_restore -U manual -d manual --clean --if-exists < /opt/ai-smart-manual/backups/FILE.dump
docker compose --env-file .env -f compose.production.yaml start api
```

数据库备份**不包含**上传的原始手册、提取图片和 Qdrant 向量索引。它们分别在 `manual_files`、`manual_images` 与 `qdrant_data` Docker volume；生产环境必须对这些 volume 做同机外的快照/备份。最简单的恢复策略是先恢复数据库和文件卷，再将手册重新处理、发布以重建向量索引。

### 回滚

为每次可部署版本打 Git tag 或记录 commit SHA。更新异常时，在两个仓库分别切回上一个已验证版本，再运行：

```bash
cd /opt/ai-smart-manual/deploy
docker compose --env-file .env -f compose.production.yaml up -d --build
```

若新版本涉及数据库结构变更，应先在预发布环境验证迁移与回滚；当前后端启动时包含轻量本地迁移，正式环境建议在功能稳定后引入 Alembic 管理 PostgreSQL schema migration。

## 8. 常见问题

| 现象 | 排查方向 |
| --- | --- |
| 页面打开但 API 404/502 | `docker compose ... ps` 确认 `api` healthy；查看 `api` 日志；确认 `app.conf` 中 `proxy_pass http://api:8000/api/` 未改错。 |
| 登录后立即失效 | 确认全站使用 HTTPS、`APP_ENV=production`、`JWT_SECRET` 在重启后保持不变，且服务器时间正确。 |
| 上传返回 413 | 检查宿主 Nginx 与容器 Nginx 的 `client_max_body_size`，并与 `MAX_UPLOAD_MB` 保持一致。 |
| 上传成功但问答无内容 | 检查 Embedding 配置、`api` 日志和 Qdrant 状态；重新处理手册并发布到问答。 |
| AI 请求超时/失败 | 检查 LLM 地址、Key、模型名、服务器到模型服务的网络；代理场景设置 `LLM_PROXY_URL`。 |
| Docker 重启后数据丢失 | 检查是否误执行了 `docker compose down -v`，并从数据库与 Docker volume 备份恢复。 |

## 9. 上线后的安全建议

- 定期更新 Ubuntu、Docker 镜像和依赖；先在测试环境验证再更新生产。
- 将 `.env`、数据库备份及证书排除在 Git 之外，限制文件权限为 `600`/`700`。
- 使用强管理员密码，首次登录后立即修改；定期轮换 LLM、Embedding、数据库和 JWT 密钥（JWT 轮换会使现有登录失效）。
- 设置云主机快照与异地备份，并至少演练一次恢复流程。
- 监控磁盘空间：手册、图片、PostgreSQL 与 Qdrant 都会随使用增长。
- 生产服务器 SSH 使用密钥登录、禁用密码登录和 root 远程登录，并仅向受信任 IP 放行 SSH。
