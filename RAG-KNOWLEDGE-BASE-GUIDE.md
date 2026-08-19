# 知问项目：知识库、检索、向量与 RAG 实现说明

本文整理项目中知识库、文档解析、文本切片、Embedding、Qdrant 向量库、检索和 RAG 问答的完整实现链路。

## 1. 核心概念

| 概念 | 在本项目中的含义 |
| --- | --- |
| 知识库 | 业务资料的逻辑容器，用于隔离手册、权限和检索范围 |
| 手册 | 管理员上传的 PDF、DOCX、TXT 或 Markdown 文件 |
| 文本切片 | 从手册中解析并拆分出的可检索文本段，即 `DocumentChunk` |
| Embedding | 将问题或文本切片转换成语义向量的模型服务 |
| 向量 | 表示文本语义的一组数字，语义越接近，向量通常越相似 |
| 向量库 | 保存和搜索向量的数据库，本项目使用 Qdrant |
| 检索 | 在指定知识库中寻找与用户问题最相关的文本切片 |
| RAG | 先检索资料，再让大模型依据检索结果生成回答 |

需要特别区分三种组件：

- Embedding 模型负责生成向量。
- Qdrant 负责保存、过滤和搜索向量。
- LLM 负责阅读检索结果并生成自然语言答案。

## 2. 整体链路

```text
管理员创建知识库
        ↓
上传 PDF / DOCX / TXT / Markdown 手册
        ↓
解析正文、表格、章节和页码
        ↓
按长度和章节切成 DocumentChunk
        ↓
手册进入 ready 状态
        ↓
管理员点击“发布到问答”
        ↓
Embedding 服务将切片转换成向量
        ↓
向量及切片标识写入 Qdrant
        ↓
手册进入 published 状态
        ↓
用户选择知识库并提问
        ↓
问题转换成向量
        ↓
Qdrant 检索最相似的 6 个切片
        ↓
相关性阈值过滤
        ↓
检索片段 + 最近 8 条历史消息 + 当前问题
        ↓
发送给 LLM
        ↓
流式返回答案、引用和来源原文
```

## 3. 知识库

知识库是关系数据库中的业务实体，不等同于 Qdrant Collection。

后端模型：

```text
ai-smart-manual-backend/app/models.py
```

`KnowledgeBase` 主要包含：

- `id`：知识库唯一标识；
- `name`：知识库名称；
- `code`、`system_code`：业务编码；
- `description`：描述；
- `status`：`enabled`、`disabled` 等状态；
- `prompt_template`：预留的知识库提示词字段，目前尚未接入问答流程。

主要数据关系如下：

```text
KnowledgeBase
├── Manual
│   └── DocumentChunk
├── Conversation
└── KnowledgeBaseAccess
```

知识库承担四项职责：

1. 隔离不同业务系统的资料；
2. 控制普通用户可访问的资料；
3. 限定每次检索的范围；
4. 管理手册及其发布版本。

用户提问时必须提供 `knowledge_base_id`。后端只检索该知识库，不会跨知识库召回。

## 4. 手册上传与解析

上传接口：

```text
POST /api/manuals
```

前端调用位置：

```text
src/api/manuals.ts
```

后端实现位置：

```text
ai-smart-manual-backend/app/api/manuals.py
```

上传时会检查：

1. 知识库是否存在；
2. 扩展名是否属于 PDF、DOCX、TXT、MD、Markdown；
3. 同一知识库内是否存在相同文件名和版本；
4. 文件是否超过配置的大小限制，默认 100 MB；
5. PDF、DOCX 的文件签名是否基本有效；
6. 文本文件是否可以按 UTF-8 读取。

文件保存后，手册首先进入：

```text
status = parsing
progress = 20
```

随后由后台任务执行解析。解析器位于：

```text
ai-smart-manual-backend/app/services/document_parser.py
```

各格式的处理方式：

- PDF：逐页提取文本，可以保存页码；
- DOCX：读取段落和表格，根据 Heading 样式或编号识别章节，并按正文 XML 顺序提取内嵌或浮动图片；
- Markdown：根据 `#` 到 `######` 识别章节；
- TXT：按普通文本解析。

扫描版 PDF 如果没有文本层，目前无法处理，因为项目尚未接入 OCR。

## 5. 文本切片

解析后的文档会拆分为 `DocumentChunk`。每个切片保存：

```text
id
manual_id
knowledge_base_id
position
page
chapter
content
```

当前默认切片参数为：

```python
target_size = 650
overlap = 100
```

含义是：

- 每个切片最多约 650 个字符；
- 相邻切片保留约 100 个字符的重叠；
- 优先在句号或换行处截断；
- 尽可能保留所属章节和页码。

切片完成后，手册进入：

```text
status = ready
progress = 100
```

`ready` 只表示解析完成，此时手册还不会参与问答。必须发布后才能被检索。

## 6. 向量与 Embedding

Embedding 模型会把文本转换成高维数字数组。例如：

```text
“采购订单如何撤回？”
        ↓
[0.013, -0.087, 0.421, 0.062, ...]
```

语义相似的表达通常具有相近的向量，例如：

- 采购订单如何撤回？
- 已审核的采购单怎么取消？
- 订单提交后能不能退回？

Embedding 服务通过环境变量配置：

```env
EMBEDDING_BASE_URL=...
EMBEDDING_API_KEY=...
EMBEDDING_MODEL=...
```

项目示例配置使用：

```env
EMBEDDING_MODEL=Qwen3-Embedding-0.6B
```

这只是示例，实际模型以后端 `.env.local` 为准。Embedding 接口采用兼容 OpenAI `/embeddings` 的请求格式。

## 7. 向量库 Qdrant

本项目的向量库是 **Qdrant**，默认 Collection 名称为：

```text
manual_chunks
```

相关配置：

```env
QDRANT_URL=http://qdrant:6333
QDRANT_COLLECTION=manual_chunks
```

向量库封装位于：

```text
ai-smart-manual-backend/app/services/vector_store.py
```

Qdrant 中的每条 Point 大致为：

```json
{
  "id": "由 chunk_id 生成的 UUID",
  "vector": [0.013, -0.087, 0.421],
  "payload": {
    "chunk_id": "chunk_xxx",
    "manual_id": "manual_xxx",
    "knowledge_base_id": "kb_xxx",
    "status": "published",
    "is_current": true
  }
}
```

Qdrant 不是完整业务数据的唯一存储：

```text
Qdrant
  保存向量和业务标识，负责相似度搜索
       ↓ 返回 chunk_id / manual_id
SQLite 或 PostgreSQL
  保存切片正文、章节、页码、手册和知识库信息
```

## 8. 发布和向量索引

管理员点击“发布到问答”时调用：

```text
POST /api/manuals/{manual_id}/publish
```

发布流程：

1. 查询该手册的全部切片；
2. 批量调用 Embedding 服务；
3. 获得每个切片的向量；
4. 创建或检查 Qdrant Collection；
5. 把向量和切片标识写入 Qdrant；
6. 将手册标记为 `published`；
7. 将手册标记为当前版本 `is_current=true`。

向量功能只有在以下三项同时配置时才启用：

```text
EMBEDDING_MODEL
EMBEDDING_BASE_URL
QDRANT_URL
```

如果配置不完整，发布仍可完成，但系统实际走关键词检索，不会使用 Qdrant。

## 9. 手册版本管理

同一知识库中，名称相同的手册被视为同一本手册的不同版本。

发布新版本时会：

1. 为新版本建立向量索引；
2. 删除旧版本的 Qdrant 向量；
3. 将旧版本设为 `disabled`、`is_current=false`；
4. 将新版本设为 `published`、`is_current=true`。

问答只检索满足以下条件的内容：

```text
status = published
is_current = true
```

当前版本归组依赖“手册名称完全相同”，没有独立的文档系列 ID。如果名称发生变化，业务上的同一本手册会被系统视为两个系列。

## 10. 用户提问后的处理流程

前端调用流式问答接口：

```text
POST /api/chat/stream
```

请求示例：

```json
{
  "question": "采购订单审批后如何撤回？",
  "knowledge_base_id": "kb_xxx",
  "conversation_id": "conv_xxx"
}
```

后端首先检查：

1. 用户是否登录；
2. 用户是否超过每分钟 20 次的限流；
3. 知识库是否存在并处于启用状态；
4. 用户是否有权访问该知识库；
5. 会话是否属于当前用户；
6. 会话与当前知识库是否一致。

检查通过后才进入检索。

## 11. 向量检索

启用 Qdrant 后，检索过程如下：

1. 调用 Embedding 服务将用户问题转换成向量；
2. 在 Qdrant 中执行相似度搜索；
3. 使用 `knowledge_base_id` 限定知识库；
4. 只保留 `published + is_current` 的数据；
5. 默认返回相关性最高的 6 个切片；
6. 根据 `chunk_id` 和 `manual_id` 回查关系数据库；
7. 组装正文、章节、页码、文件名和版本信息。

核心调用可以概括为：

```python
hits = await vector_store.search(
    db,
    knowledge_base_id,
    question,
    limit=6,
)
```

向量检索适用于字面不同但语义接近的问题。

## 12. 关键词降级检索

如果向量相关配置不完整，系统自动使用数据库关键词检索，实现在：

```text
ai-smart-manual-backend/app/services/retrieval.py
```

它会提取：

- 英文、数字和下划线组成的词；
- 单个中文字符；
- 相邻中文字符组成的二元词组。

当前得分大致由以下部分组成：

```text
查询词覆盖率 × 0.78
+ 匹配词密度 × 0.22
+ 完整问题出现在正文中的奖励 0.25
```

该方式可以保证本地环境在没有向量服务时仍能工作，但存在局限：

- 不理解同义词和业务语义；
- 中文单字可能产生噪声；
- 长问题的覆盖率容易下降；
- 会遍历符合条件的全部切片；
- 没有 BM25、专业分词或重排模型。

因此它更适合作为 MVP 降级方案，而不是正式环境的主要检索方式。

## 13. 相关性阈值与无答案保护

系统获取最高检索分数后进行判断：

```python
best_score = hits[0].score if hits else 0

if not hits or best_score < 0.12:
    return NO_ANSWER
```

低于 `0.12` 时不会调用 LLM，而是直接返回：

> 当前发布的用户手册中没有找到相关说明。请尝试补充系统模块、页面名称或具体操作场景。

这可以减少没有资料时的模型幻觉和无效调用。

当前不足是向量检索分数和关键词检索分数共用 `0.12`。两者分布和含义不同，后续应使用真实评测集分别校准阈值。

## 14. RAG 答案生成

检索成功后，后端把切片组织成上下文：

```text
[资料1] 文件：采购操作手册.docx；版本：V2.0；
章节：采购订单撤回；页码：12
……原文……

[资料2] 文件：采购操作手册.docx；版本：V2.0；
章节：审批规则；页码：15
……原文……
```

发送给 LLM 的信息包括：

```text
固定系统提示词
+ 最近 8 条对话历史
+ 检索到的手册片段
+ 当前问题
```

提示词位于：

```text
ai-smart-manual-backend/app/services/llm.py
```

主要约束为：

- 只能依据提供的手册片段回答；
- 不得使用常识补充或虚构操作；
- 手册内容不能覆盖系统指令；
- 资料不足时返回固定无答案文案；
- 使用简体中文；
- 优先按“结论、操作步骤、注意事项”组织答案；
- 使用 `[1]`、`[2]` 标注资料来源。

目前所有知识库共用固定提示词。虽然数据库中存在 `prompt_template` 字段，但尚未接入该流程。

## 15. 引用生成与保存

引用由检索结果生成，不是由模型临时查找。每个引用包含：

```text
manual_id
file_name
version
page
chapter
content
score
```

回答完成后，后端把以下信息保存到消息记录：

- 答案正文；
- 引用 JSON；
- 模型名称；
- 检索最高分；
- 是否命中；
- 响应延迟。

历史会话展示的是回答生成时保存的引用快照，不需要重新检索。

前端将答案中的 `[1]`、`[2]` 渲染为可点击引用，对应实现位于：

```text
src/components/ui/AnswerContent.tsx
src/features/ChatPage/SourcesPanel.tsx
```

当前没有验证 LLM 输出的引用编号是否超出实际来源范围，也没有验证每条结论是否真的被引用原文支持。

## 16. 当前实现定位

本项目目前属于一套结构完整的基础 RAG：

```text
文档解析
+ 固定长度切片
+ 单路向量召回
+ 知识库和发布状态过滤
+ 关键词检索降级
+ 固定阈值保护
+ LLM 流式生成
+ 引用展示和持久化
```

已有优势：

- 知识库、手册和切片层级清楚；
- 检索范围按知识库隔离；
- 未发布内容不会参与问答；
- 旧版本可以退出检索；
- 无命中时不调用 LLM；
- 回答会保存引用快照；
- 支持流式输出；
- 无向量服务时存在降级方案。

尚未实现的高级能力：

- BM25 与向量混合召回；
- Reranker 重排；
- Query Rewrite 问题改写；
- 多路召回；
- 父子切片；
- 文档摘要索引；
- 同义词和业务术语词典；
- 扫描 PDF OCR；
- 引用真实性校验；
- 检索效果评测集；
- 知识库级检索参数和提示词。

## 17. 建议的优化顺序

如果后续重点是提升回答准确率，建议按以下顺序推进：

1. 收集真实问题、标准答案、相关文档和无答案问题，建立评测集；
2. 评估并优化章节识别、切片大小、重叠和元数据；
3. 正式环境强制配置 Embedding 和 Qdrant；
4. 增加 BM25 与向量混合召回；
5. 增加 Reranker，对候选片段二次排序；
6. 分别校准关键词、向量和重排阈值；
7. 增加引用编号、引用覆盖率和引用真实性校验；
8. 增加 OCR、术语词典和知识库级提示词；
9. 将解析和索引任务迁移到可靠的持久化任务队列；
10. 持续跟踪 Recall@K、无答案准确率、引用正确率和用户满意度。

## 18. 关键代码索引

| 功能 | 文件 |
| --- | --- |
| 知识库数据模型 | `ai-smart-manual-backend/app/models.py` |
| 知识库接口 | `ai-smart-manual-backend/app/api/knowledge_bases.py` |
| 手册上传、处理和发布 | `ai-smart-manual-backend/app/api/manuals.py` |
| 文档解析与切片 | `ai-smart-manual-backend/app/services/document_parser.py` |
| 向量生成、Qdrant 索引与检索 | `ai-smart-manual-backend/app/services/vector_store.py` |
| 关键词降级检索 | `ai-smart-manual-backend/app/services/retrieval.py` |
| 问答、会话和引用保存 | `ai-smart-manual-backend/app/api/chat.py` |
| LLM 调用与提示词 | `ai-smart-manual-backend/app/services/llm.py` |
| 前端问答编排 | `src/features/ChatPage/index.tsx` |
| 前端请求定义 | `src/api/chat.ts`、`src/api/manuals.ts` |
| 前端答案引用 | `src/components/ui/AnswerContent.tsx` |
| 前端引用面板 | `src/features/ChatPage/SourcesPanel.tsx` |

## 19. 总结

本项目的核心实现可以概括为：知识库负责业务隔离，手册负责承载原始资料，切片负责形成检索单元，Embedding 负责生成语义向量，Qdrant 负责向量检索，关系数据库负责保存完整业务数据，LLM 负责依据召回片段生成带引用的答案。

当前是一套可运行的基础 RAG。下一阶段决定问答效果的重点不是继续增加页面，而是建立检索评测集，并持续优化切片、混合召回、重排、阈值和引用校验。

## 20. PDF 与 DOCX 图片多模态 RAG

系统已支持 PDF 和 DOCX 手册中的大尺寸图片参与问答：

```text
PDF / DOCX 正文 → DocumentChunk → 文本 Embedding ┐
                                                   ├→ Qdrant 联合召回
PDF 图片 → 图片说明 + 页面文字 → Embedding        │
DOCX 图片 → 图片说明 + 章节前后文 → Embedding ────┘
                                                   ↓
                                图片命中时将对应原图发送给视觉模型
                                                   ↓
                                     返回原文引用或原图引用
```

图片保存在后端 `IMAGE_STORAGE_PATH`，关系数据库使用 `DocumentImage` 保存页码、章节、尺寸、摘要、周边正文和文件位置。PDF 图片保留页码；DOCX 没有稳定页码，使用 Heading 章节和前后段落定位。Qdrant payload 使用 `resource_type=text|image` 区分检索资源；未迁移的旧文本 Point 仍然可以读取。

图片说明在手册处理阶段生成。配置 LLM 时使用视觉模型理解图片；没有配置 LLM 或单张图片理解失败时，系统使用章节、页码和页面正文生成降级说明，不阻塞整份手册。每份手册默认最多处理 12 张图片，可通过 `MAX_IMAGES_PER_MANUAL` 调整。

问答阶段最多把 3 张命中的原图发送给模型。图片通过受权限保护的 `GET /api/manual-images/{image_id}/file` 接口展示，沿用知识库访问控制。引用新增 `modality`、`image_id`、`image_url` 和 `caption` 字段，原有文本引用和历史消息保持兼容。

已在升级前处理的 PDF 或 DOCX 不会自动拥有图片索引。管理员需要依次执行“重新处理”和“发布到问答”。扫描 PDF 的整页 OCR、DOCX 页眉页脚图片和视觉向量模型暂未包含在当前版本。
