# AGENTS.md

## 项目概述

React 19 + TypeScript + Vite 前端项目，使用 Ant Design、Tailwind CSS 和 styled-components。

## 目录结构

- `/src/features` → 页面与业务模块
- `/src/components` → 跨页面复用组件
- `/src/api` → 领域接口与统一请求层
- `/src/types` → 共享 TypeScript 类型
- `/src/styles` → 全局样式与组件库局部覆盖

## 开发命令

- `npm run dev` → 启动开发服务器
- `npm run typecheck` → TypeScript 类型检查
- `npm run build` → 类型检查并构建生产版本
- `npm run preview` → 预览生产构建
- `npm test` → 执行当前构建校验

## 代码规范

- TypeScript，禁止 `any`，类型使用 `import type`
- 函数式组件 + Hooks；组件使用 PascalCase
- 变量、函数和 Hook 使用 camelCase；常量使用 UPPER_SNAKE_CASE
- 页面或模块以 `index.tsx` 为入口；组件文件与主组件同名
- 标准交互使用 Ant Design；简单样式使用 Tailwind；复杂动态样式使用 styled-components
- 请求只能经由 `/src/api`；组件中禁止直接使用 `fetch` 或 `axios`

## 测试要求

- 新增测试与被测模块相邻，命名为 `*.test.ts(x)`
- 提交前必须运行 `npm run typecheck` 和 `npm run build`

## PR 规范

- 提交信息使用简短英文祈使句：`Add manual filters`
- PR 说明变更目的、验证方式和关联 issue
- 涉及界面改动时附截图
- 禁止提交 `.env`、密钥和构建产物
