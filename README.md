# 知问前端

AI 智能用户手册的独立 React 前端。后端项目位于桌面目录 `ai-smart-manual-backend`。

## 本地启动

```bash
cd /Users/xhh/Desktop/ai-smart-manual
npm install
npm run dev
```

前端地址：http://127.0.0.1:3000

开发服务器会把 `/api` 请求代理到 `http://127.0.0.1:8000`，请在另一个终端启动后端：

```bash
cd /Users/xhh/Desktop/ai-smart-manual-backend
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

## 构建与测试

```bash
npm test
```

## Docker

后端在宿主机的 8000 端口运行后，执行：

```bash
docker compose up --build
```
