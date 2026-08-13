# 前端工程规范

本文件约束本仓库内所有前端代码的新增、修改和重构。目标是保持页面结构清晰、模块职责单一，并在不过度抽象的前提下提高组件复用性。

## 1. 技术栈

- React 19 + TypeScript + Vite + Ant Design
- Tailwind CSS 优先用于布局、间距、颜色、排版和常见交互状态
- styled-components 用于复杂动态样式、伪元素和高度封装的业务组件
- 全局 CSS 只保留重置、设计变量、Ant Design 局部覆盖和暂未迁移的历史样式
- React Hooks 管理局部状态；只有出现跨页面共享状态时才引入 Zustand 或 Jotai
- npm 管理依赖，提交 `package-lock.json`

所有实现必须与以上技术栈保持一致。不得擅自切换 React 主版本、包管理器、组件库或样式方案；如确需迁移，必须作为独立任务完成，并同步修改配置、锁文件、脚本和文档。

## 2. 页面与模块目录

一级目录按页面划分

```text
src/features/
├── LoginPage/
│   └── index.tsx
└── AdminPage/
    ├── index.tsx
    ├── AdminHeading.tsx
    ├── types.ts
    ├── status.ts
    ├── knowledge/
    │   ├── index.tsx
    │   ├── KnowledgeBaseCard.tsx
    │   └── KnowledgeBaseEditModal.tsx
    ├── manuals/
    │   ├── index.tsx
    │   └── ManualTable.tsx
    ├── users/
    │   ├── index.tsx
    │   ├── UserTable.tsx
    │   ├── UserEditModal.tsx
    │   ├── user.constants.ts
    │   └── user.types.ts
    └── analytics/
        └── index.tsx

src/api/
├── request.ts
├── auth.ts
├── knowledgeBases.ts
├── manuals.ts
├── users.ts
├── analytics.ts
├── conversations.ts
└── chat.ts
```

规则：

- 每个页面和业务模块必须以 `index.tsx` 作为公开入口。
- 页面入口只负责数据加载、模块切换和回调编排，不放大段业务视图。
- 模块入口负责该模块的筛选状态、弹窗状态和业务流程编排。
- 其他模块只能从模块目录导入，不得跨目录引用模块内部组件。
- 跨页面复用的组件放在 `src/components/`；只在当前页面复用的组件留在页面目录。
- 常量和界面私有类型优先放在所属模块中；只有两个以上模块确实共享时才提升到页面根目录或 `src/types/`。
- 所有服务端请求统一放在 `src/api/`，禁止在页面或业务模块目录中创建 `*.api.ts`。

## 3. API 与请求层

### 目录与职责

- `src/api/request.ts` 是项目唯一的底层请求入口。
- `src/api/` 下按业务领域拆分文件，如 `auth.ts`、`users.ts`、`manuals.ts`，禁止按页面复制相同请求。
- API 文件只负责请求参数转换、接口调用、响应类型定义或引用，不包含组件状态和 UI 行为。
- 页面、组件、Hook 和业务模块只能调用 `src/api/` 导出的领域方法。
- 组件和业务模块中禁止直接使用 `fetch`、`XMLHttpRequest` 或 `axios`。
- 如需更换底层请求库，只允许修改 `request.ts`，不得影响领域 API 和调用方。

### `request.ts` 必须统一处理

- `baseURL` 拼接和环境配置。
- Token、Cookie 或其他鉴权信息。
- 通用请求头、JSON 序列化和 FormData 等请求体处理。
- HTTP 状态码、网络异常、超时和通用业务错误。
- 响应数据解包，并向调用方返回明确的泛型结果。
- 401 等全局鉴权失效行为，但不得与具体页面组件耦合。
- 可取消请求或 AbortSignal 透传，适用于搜索、轮询和页面卸载场景。

### 类型约束

- 每个 API 函数必须声明完整的 TypeScript 入参和返回值类型。
- 请求参数使用明确的 `XxxParams`、`XxxPayload` 类型；返回值使用领域实体或 `XxxResponse` 类型。
- 禁止返回未收窄的 `unknown`、隐式 `Promise<any>` 或原始 `Response` 给组件处理。
- 分页、列表和错误结构必须使用项目统一类型，禁止在各模块重复定义近似结构。
- 文件上传和下载也必须通过请求层提供的类型化方法完成。

### 错误处理边界

- `request.ts` 负责网络错误、HTTP 错误、鉴权错误和统一错误结构转换。
- 领域 API 可以补充接口上下文，但默认应将错误继续上抛。
- API 文件禁止直接调用 `message.error`、Modal、Toast、路由跳转或修改组件状态。
- 是否向用户展示错误以及展示何种业务文案，由页面或业务 Hook 决定；全局不可恢复错误由请求层统一事件机制处理。
- 禁止在每个组件中重复解析 `response.ok`、`response.json()` 或后端 `detail` 字段。

## 4. 组件拆分边界

应拆成独立组件的情况：

- 有明确业务语义的视觉单元，如知识库卡片、用户表格、编辑弹窗。
- JSX 较复杂，包含多处分支、列表、表单校验或交互状态。
- 同一结构会被重复使用。
- 独立后可以明显缩短模块入口并降低理解成本。

应保留在 `index.tsx` 的情况：

- 只使用一次且结构简单的搜索栏、筛选栏或说明区域。
- 仅包装少量组件、没有独立业务行为。
- 拆分后只会增加文件跳转，不能形成清晰职责。

禁止为了“每个组件一个文件”而机械拆分。复用来自稳定职责和清晰接口，不来自文件数量。

## 5. UI 组件使用原则
- 标准交互优先使用 Ant Design：Form、Input、Select、Table、Modal、Button、Menu、Tag、Alert、Message 等。
- 强定制业务卡片、布局和非标准交互区域，优先使用语义化 HTML + Tailwind CSS，不强制套用 Ant Design Card。
- 需要伪元素、复杂选择器、基于 props 的动态样式或独立视觉封装时使用 styled-components。
- 简单静态样式禁止新建 styled-component，应直接使用 Tailwind 工具类。
- 仅服务于单个页面或组件的 styled-components 默认与组件写在同一文件；只有样式规模明显过大或被多个组件复用时才拆分为独立样式文件。
- 封装业务组件时通过明确的 props 输入数据和回调，不在展示组件中直接请求接口。
- **样式隔离要求**：
  - 禁止用旧的全局样式类名包装 Ant Design 组件。
  - 新增全局样式必须使用模块或组件专属前缀，避免与历史样式冲突。
  - 避免宽泛选择器（如 `.ant-xxx`、全局 tag 选择器）污染其他页面。
- Tailwind 或 styled-components 与 Ant Design 冲突时，以 Ant Design 组件自身样式为准，必要时通过局部 styled-component 包装覆盖。
- 禁止用 `!important` 作为常规优先级方案。

## 6. TypeScript 规范

- 必须使用 TypeScript，禁止 `any`。
- 如果第三方库确实无法正确建模，可临时使用 `unknown` 并在边界处收窄类型。
- 只有无法避免时才允许 `any`，必须附带说明原因和移除条件。
- API 响应、组件 props、表单数据和业务状态必须有明确类型。
- 共享领域类型放在 `src/types/`；模块私有类型放在模块的 `*.types.ts`。
- 使用类型导入：`import type { ... }`。
- 不使用不安全的类型断言绕过编译错误。

## 7. React 规范

- 只使用函数组件和 Hooks，禁止 class 组件。
- 组件使用命名导出；页面和模块通过目录 `index.tsx` 统一暴露。
- Hook 必须遵守调用顺序，不得在条件分支中调用。
- 相关且可复用的状态逻辑抽离为 `useXxx` 自定义 Hook；简单页面状态不要过度 Hook 化。
- 副作用放在 `useEffect`，事件行为放在语义明确的处理函数中。
- 请求逻辑只能通过 `src/api/` 领域方法调用；视图组件不直接发请求，也不解析底层响应格式。
- 列表必须使用稳定业务 ID 作为 key，禁止使用数组索引作为可变列表 key。

## 8. 性能规范

- 先保持代码正确和清晰，再针对真实重渲染问题优化。
- 昂贵计算、复杂筛选和稳定列配置使用 `useMemo`。
- 传给 memo 子组件且影响重渲染的回调使用 `useCallback`。
- 不要为所有简单值和函数机械添加 `useMemo` / `useCallback`。
- 静态配置、选项和常量放到组件外，避免每次 render 重建。
- 大页面或重量级模块按需使用动态导入和路由级懒加载。

## 9. 命名与文件

- 组件、类型、接口：PascalCase。
- 变量、函数、Hook：camelCase；Hook 必须以 `use` 开头。
- 常量：UPPER_SNAKE_CASE。
- 组件文件与主导出组件同名，如 `UserTable.tsx`。
- API 文件位于 `src/api/`，以复数领域名命名，如 `users.ts`、`manuals.ts`。
- 类型文件使用领域名加 `.types.ts`，如 `user.types.ts`。
- 常量文件使用领域名加 `.constants.ts`。
- `index.tsx` 只作为页面或模块入口，不作为无边界的导出桶。

## 10. 格式与可读性

- 使用 Prettier 默认排版，字符串使用单引号，保留分号和尾逗号。
- 禁止把完整表格列、Modal、Form 或多层 JSX 压成一行。
- 一个语句只完成一个主要动作；异步流程使用清晰的换行和错误处理。
- 每个文件只导出一个主组件；允许额外导出与主组件强相关的类型或常量。
- 单个组件超过约 150 行时必须检查是否存在可拆分的稳定职责，但行数不是唯一标准。
- 避免超过三层的嵌套三元表达式，复杂分支应提取变量或函数。

## 11. 可访问性

- 使用 `main`、`section`、`nav`、`header`、`article` 等语义化标签。
- 所有交互必须使用 `button`、`a`、表单控件等原生可交互元素。
- 不得用只有 `onClick` 的 `div` 或 `span` 模拟按钮。
- 图标按钮必须提供 `aria-label` 或可见文本。
- 图片必须有准确的 `alt`；纯装饰图片使用空 `alt`。
- 弹窗、表单校验和焦点行为优先交给成熟组件库处理。
- 自定义交互必须支持键盘操作和可见焦点。

## 12. 注释

- 只注释复杂业务约束、兼容性原因和非显而易见的设计决策。
- 禁止描述代码表面行为的废话注释。
- TODO 必须说明待办原因和完成条件，不能只写 `TODO`。

## 13. 修改与验证

- 修改前先阅读目标模块及其直接依赖，避免重复实现已有能力。
- 保持现有业务行为和接口兼容，除非需求明确要求变化。
- 修改后至少运行：

```bash
npm run typecheck
npm run build
```

## 14. 代码交付格式

当用户要求提供代码方案时：

1. 先提供完整、可运行的代码或直接完成仓库修改。
2. 代码后用不超过 5 行说明关键设计决策。
3. 存在多种实现时，选择职责边界更清楚、长期维护成本更低的方案。
4. 不展示无关代码，不用伪代码代替应当可运行的实现。
