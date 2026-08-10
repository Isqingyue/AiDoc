"use client";

import { FormEvent, useMemo, useState } from "react";

type View = "chat" | "knowledge" | "manuals" | "analytics";

const histories = [
  { id: 1, title: "如何撤回采购订单？", time: "10:32", group: "今天" },
  { id: 2, title: "供应商信息如何修改", time: "09:18", group: "今天" },
  { id: 3, title: "月末结账操作流程", time: "昨天", group: "最近 7 天" },
  { id: 4, title: "库存盘点差异处理", time: "周五", group: "最近 7 天" },
  { id: 5, title: "新增员工并分配权限", time: "8月2日", group: "更早" },
];

const suggestions = [
  "如何创建新的采购申请？",
  "采购订单审批后还能修改吗？",
  "如何导出本月采购明细？",
];

const kbs = [
  { name: "ERP 业务系统", code: "ERP_CORE", docs: 12, chunks: "3,286", updated: "10 分钟前", color: "teal", status: "已启用" },
  { name: "人力资源系统", code: "HR_PORTAL", docs: 8, chunks: "1,942", updated: "昨天 16:40", color: "blue", status: "已启用" },
  { name: "财务报销平台", code: "FIN_EXPENSE", docs: 6, chunks: "1,150", updated: "8月6日", color: "amber", status: "已启用" },
  { name: "客户服务平台", code: "CRM_SERVICE", docs: 3, chunks: "486", updated: "8月1日", color: "purple", status: "草稿" },
];

const manuals = [
  { name: "ERP采购管理用户手册", file: "ERP采购管理用户手册V2.3.pdf", version: "V2.3", size: "18.6 MB", status: "已发布", progress: 100, updated: "今天 09:42", pages: 126 },
  { name: "ERP库存管理操作指南", file: "库存管理操作指南V1.8.docx", version: "V1.8", size: "9.2 MB", status: "已发布", progress: 100, updated: "昨天 17:20", pages: 84 },
  { name: "ERP财务模块使用说明", file: "财务模块使用说明V3.0.pdf", version: "V3.0", size: "26.4 MB", status: "向量索引中", progress: 72, updated: "2 分钟前", pages: 208 },
  { name: "常见问题与处理办法", file: "ERP常见问题.md", version: "V1.4", size: "368 KB", status: "处理完成", progress: 100, updated: "8月8日", pages: 32 },
];

function BrandMark() {
  return <div className="brand-mark"><span className="spark">✦</span><span className="orbit" /></div>;
}

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

export default function Home() {
  const [view, setView] = useState<View>("chat");
  const [query, setQuery] = useState("");
  const [asked, setAsked] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeHistory, setActiveHistory] = useState(1);
  const [activeCitation, setActiveCitation] = useState(0);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [modal, setModal] = useState<"kb" | "upload" | null>(null);
  const [kb, setKb] = useState("ERP 业务系统");
  const [mobileHistory, setMobileHistory] = useState(false);
  const [mobileSources, setMobileSources] = useState(false);

  const title = useMemo(() => ({ chat: "智能问答", knowledge: "知识库管理", manuals: "手册管理", analytics: "问答分析" }[view]), [view]);

  function submitQuestion(e?: FormEvent) {
    e?.preventDefault();
    if (!query.trim() || generating) return;
    setAsked(true);
    setGenerating(true);
    setFeedback(null);
    window.setTimeout(() => setGenerating(false), 850);
  }

  function askSuggestion(text: string) {
    setQuery(text);
    setAsked(true);
    setGenerating(true);
    window.setTimeout(() => setGenerating(false), 700);
  }

  function startNewChat() {
    setAsked(false);
    setQuery("");
    setActiveHistory(0);
    setMobileHistory(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileHistory(true)} aria-label="打开会话列表">☰</button>
        <button className="brand" onClick={() => setView("chat")} aria-label="返回智能问答">
          <BrandMark />
          <span><b>知问</b><small>AI 智能用户手册</small></span>
        </button>
        <nav className="main-nav" aria-label="主导航">
          <button className={view === "chat" ? "active" : ""} onClick={() => setView("chat")}><Icon>◈</Icon>智能问答</button>
          <button className={view === "knowledge" ? "active" : ""} onClick={() => setView("knowledge")}><Icon>▱</Icon>知识库</button>
          <button className={view === "manuals" ? "active" : ""} onClick={() => setView("manuals")}><Icon>▤</Icon>手册管理</button>
          <button className={view === "analytics" ? "active" : ""} onClick={() => setView("analytics")}><Icon>⌁</Icon>问答分析</button>
        </nav>
        <div className="top-actions">
          <button className="round-button" aria-label="帮助">?</button>
          <button className="round-button notification" aria-label="通知">♧<span /></button>
          <button className="avatar">林</button>
          <span className="user-name">林晓雨<small>知识库管理员</small></span>
          <span className="chevron">⌄</span>
        </div>
      </header>

      {view === "chat" ? (
        <section className="workspace">
          <aside className={`history-panel ${mobileHistory ? "mobile-open" : ""}`}>
            <div className="mobile-panel-head"><b>会话记录</b><button onClick={() => setMobileHistory(false)}>×</button></div>
            <button className="new-chat" onClick={startNewChat}><span>＋</span> 新建会话 <kbd>⌘ K</kbd></button>
            <label className="history-search"><span>⌕</span><input placeholder="搜索历史会话" /></label>
            <div className="history-list">
              {["今天", "最近 7 天", "更早"].map((group) => (
                <div key={group}>
                  <p className="group-label">{group}</p>
                  {histories.filter((h) => h.group === group).map((h) => (
                    <button key={h.id} className={`history-item ${activeHistory === h.id ? "selected" : ""}`} onClick={() => { setActiveHistory(h.id); setAsked(true); setMobileHistory(false); }}>
                      <span className="chat-bubble">◌</span><span>{h.title}<small>{h.time}</small></span><i>•••</i>
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="secure-note"><span>◆</span><p><b>数据安全保护</b><small>全部资料与会话仅在企业内网处理</small></p></div>
          </aside>

          <div className="chat-panel">
            <div className="chat-toolbar">
              <div><span className="online-dot" />当前知识库</div>
              <label className="kb-select"><span className="mini-kb">E</span><select value={kb} onChange={(e) => setKb(e.target.value)}><option>ERP 业务系统</option><option>人力资源系统</option><option>财务报销平台</option></select><span>⌄</span></label>
              <div className="toolbar-spacer" />
              <button onClick={() => setMobileSources(true)}><span>▥</span>引用来源</button>
              <button aria-label="更多操作">•••</button>
            </div>

            <div className="conversation">
              {!asked ? (
                <div className="empty-state">
                  <div className="empty-mark"><BrandMark /></div>
                  <h1>您好，林晓雨</h1>
                  <p>我是您的智能手册助手。关于 <b>{kb}</b>，有什么可以帮您？</p>
                  <div className="starter-grid">
                    {suggestions.map((s, i) => <button key={s} onClick={() => askSuggestion(s)}><span>{["◎", "↻", "⇩"][i]}</span>{s}<i>→</i></button>)}
                  </div>
                </div>
              ) : (
                <div className="messages">
                  <div className="date-divider"><span>今天 10:32</span></div>
                  <div className="user-message"><div className="message-avatar">林</div><div><b>你</b><p>{query || "采购订单提交审批后，发现填错了供应商，应该怎么撤回？"}</p></div></div>
                  <div className="ai-message">
                    <div className="ai-avatar"><BrandMark /></div>
                    <div className="answer-wrap">
                      <div className="answer-meta"><b>知问助手</b><span>基于 3 处手册内容</span></div>
                      {generating ? <div className="thinking"><span /><span /><span /> 正在检索并整理手册内容</div> : <>
                        <div className="answer">
                          <p><strong>结论</strong></p>
                          <p>如果采购订单当前处于<b>「待审核」</b>状态，可以先撤回订单，修改供应商后重新提交审批。已经审核通过的订单无法直接撤回，需联系审批人执行退回。<sup onClick={() => setActiveCitation(0)}>[1]</sup></p>
                          <p><strong>操作步骤</strong></p>
                          <ol>
                            <li>进入 <b>采购管理 → 采购订单 → 订单列表</b>。</li>
                            <li>筛选订单状态为「待审核」，找到需要修改的订单。</li>
                            <li>点击订单右侧的 <b>「更多」</b>，选择 <b>「撤回」</b>。<sup onClick={() => setActiveCitation(0)}>[1]</sup></li>
                            <li>在确认提示中点击「确定」。订单状态会恢复为「草稿」。</li>
                            <li>打开订单修改供应商信息，保存后重新提交审批。<sup onClick={() => setActiveCitation(1)}>[2]</sup></li>
                          </ol>
                          <div className="notice"><span>!</span><p><b>注意事项</b><br />若订单已生成收货单或付款申请，系统将不允许撤回。请先处理关联单据，或联系采购管理员。<sup onClick={() => setActiveCitation(2)}>[3]</sup></p></div>
                        </div>
                        <div className="source-chips"><button onClick={() => { setActiveCitation(0); setMobileSources(true); }}>1&nbsp; 撤回采购订单 · P36</button><button onClick={() => { setActiveCitation(1); setMobileSources(true); }}>2&nbsp; 修改订单信息 · P38</button><button onClick={() => { setActiveCitation(2); setMobileSources(true); }}>3&nbsp; 订单关联规则 · P42</button></div>
                        <div className="answer-actions">
                          <button className={feedback === "up" ? "chosen" : ""} onClick={() => setFeedback("up")} aria-label="回答有帮助">♧</button>
                          <button className={feedback === "down" ? "chosen" : ""} onClick={() => setFeedback("down")} aria-label="回答需改进">♤</button>
                          <button aria-label="复制回答">▣</button><button aria-label="重新生成">↻</button>
                          <span>{feedback ? "感谢您的反馈" : "此回答对您有帮助吗？"}</span>
                        </div>
                      </>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="composer-wrap">
              <form className="composer" onSubmit={submitQuestion}>
                <textarea value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`向“${kb}”提问…`} rows={1} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitQuestion(); } }} />
                <div className="composer-bottom"><button type="button" className="attach" aria-label="添加附件">＋</button><span>内容由 AI 生成，请核对引用原文</span><button type="submit" className="send" disabled={!query.trim() || generating}>{generating ? "■" : "↑"}</button></div>
              </form>
            </div>
          </div>

          <aside className={`source-panel ${mobileSources ? "mobile-open" : ""}`}>
            <div className="source-head"><div><b>引用与原文</b><span>共 3 处依据</span></div><button onClick={() => setMobileSources(false)}>×</button></div>
            <div className="source-tabs"><button className="active">引用来源 <span>3</span></button><button>相关章节</button></div>
            <div className="source-list">
              {[
                { n: 1, title: "撤回采购订单", page: 36, text: "对于处于待审核状态的采购订单，制单人可以在订单列表中选择“更多—撤回”。撤回后订单恢复为草稿状态，可再次编辑并提交审批。", score: "96%" },
                { n: 2, title: "修改订单基本信息", page: 38, text: "草稿状态的采购订单允许修改供应商、交货日期及订单明细。修改完成后需重新提交审批。", score: "91%" },
                { n: 3, title: "采购订单关联规则", page: 42, text: "已经生成收货单、入库单或付款申请的采购订单，不允许执行撤回操作。", score: "87%" },
              ].map((s, i) => (
                <article key={s.n} className={`source-card ${activeCitation === i ? "active" : ""}`} onClick={() => setActiveCitation(i)}>
                  <div className="source-title"><span>{s.n}</span><div><b>{s.title}</b><small>ERP采购管理用户手册</small></div><i>{s.score}</i></div>
                  <div className="source-meta"><span>V2.3</span><span>采购订单管理</span><span>第 {s.page} 页</span></div>
                  <blockquote>{s.text}</blockquote>
                  <button>查看完整手册 <span>↗</span></button>
                </article>
              ))}
            </div>
            <div className="source-footer"><span>✓</span><p><b>引用已核验</b><small>回答仅使用您有权访问的已发布手册</small></p></div>
          </aside>
          {(mobileHistory || mobileSources) && <button className="overlay" onClick={() => { setMobileHistory(false); setMobileSources(false); }} aria-label="关闭面板" />}
        </section>
      ) : (
        <AdminPage view={view} title={title} setModal={setModal} setView={setView} />
      )}

      {modal && <Modal type={modal} onClose={() => setModal(null)} />}
    </main>
  );
}

function AdminPage({ view, title, setModal, setView }: { view: Exclude<View, "chat">; title: string; setModal: (v: "kb" | "upload" | null) => void; setView: (v: View) => void }) {
  return <section className="admin-page">
    <div className="admin-heading"><div><p>管理控制台 / {title}</p><h1>{title}</h1><span>{view === "knowledge" ? "统一管理业务知识与用户访问范围" : view === "manuals" ? "上传、处理并发布您的业务系统手册" : "洞察问答质量，持续完善用户手册"}</span></div>{view !== "analytics" && <button className="primary" onClick={() => setModal(view === "knowledge" ? "kb" : "upload")}>＋ {view === "knowledge" ? "创建知识库" : "上传手册"}</button>}</div>
    {view === "knowledge" && <>
      <div className="stat-row"><Stat value="4" label="知识库总数" delta="3 个已启用" icon="▱" /><Stat value="29" label="已收录手册" delta="共 6,864 个片段" icon="▤" /><Stat value="1,286" label="本月问答" delta="↑ 18.6%" icon="◈" /><Stat value="92.4%" label="有答案率" delta="↑ 2.1%" icon="◎" /></div>
      <div className="section-toolbar"><label><span>⌕</span><input placeholder="搜索知识库名称或编码" /></label><select><option>全部状态</option><option>已启用</option><option>草稿</option></select><button>↻ 刷新</button></div>
      <div className="kb-grid">{kbs.map((item) => <article className="kb-card" key={item.code}><div className={`kb-icon ${item.color}`}>{item.name.slice(0, 1)}</div><div className="kb-card-title"><div><h3>{item.name}</h3><code>{item.code}</code></div><span className={item.status === "草稿" ? "badge draft" : "badge"}>{item.status}</span></div><p>面向公司内部员工的{item.name}操作指南、业务流程与常见问题。</p><div className="kb-numbers"><span><b>{item.docs}</b> 本手册</span><span><b>{item.chunks}</b> 文档片段</span></div><div className="kb-card-footer"><small>更新于 {item.updated}</small><button onClick={() => setView("manuals")}>管理手册 →</button></div></article>)}</div>
    </>}
    {view === "manuals" && <>
      <div className="context-banner"><div className="kb-icon teal">E</div><div><b>ERP 业务系统</b><span>ERP_CORE · 已启用</span></div><button onClick={() => setView("knowledge")}>切换知识库⌄</button></div>
      <div className="stat-row manual-stats"><Stat value="12" label="全部手册" delta="10 个当前版本" icon="▤" /><Stat value="9" label="已发布" delta="可参与智能问答" icon="✓" /><Stat value="2" label="处理中" delta="任务运行正常" icon="↻" /><Stat value="1" label="待发布" delta="处理已完成" icon="◌" /></div>
      <div className="table-card"><div className="section-toolbar"><label><span>⌕</span><input placeholder="搜索手册名称或文件名" /></label><select><option>全部状态</option></select><select><option>全部文件类型</option></select></div><div className="manual-table"><div className="table-row table-head"><span>手册名称</span><span>版本</span><span>处理状态</span><span>更新时间</span><span>操作</span></div>{manuals.map((m) => <div className="table-row" key={m.file}><div className="manual-name"><span className="pdf-icon">{m.file.endsWith("pdf") ? "PDF" : m.file.endsWith("docx") ? "DOC" : "MD"}</span><p><b>{m.name}</b><small>{m.file} · {m.size} · {m.pages} 页</small></p></div><span><b>{m.version}</b><small className="current">当前版本</small></span><span><i className={`status-dot ${m.status.includes("中") ? "processing" : ""}`} />{m.status}{m.progress < 100 && <small className="progress"><i style={{ width: `${m.progress}%` }} /></small>}</span><span>{m.updated}</span><span className="row-actions"><button>预览</button><button>•••</button></span></div>)}</div></div>
    </>}
    {view === "analytics" && <>
      <div className="analytics-filter"><button>近 30 天⌄</button><button>全部知识库⌄</button><span>数据更新于今天 11:00</span><button>⇩ 导出报告</button></div>
      <div className="stat-row"><Stat value="1,286" label="总提问次数" delta="↑ 18.6% 较上期" icon="◈" /><Stat value="186" label="独立用户" delta="↑ 12.3% 较上期" icon="♙" /><Stat value="92.4%" label="有答案率" delta="↑ 2.1% 较上期" icon="◎" /><Stat value="89.7%" label="回答满意度" delta="↑ 3.4% 较上期" icon="♧" /></div>
      <div className="analytics-grid"><article className="chart-card wide"><div className="card-heading"><div><b>问答趋势</b><span>提问量与有答案率</span></div><div className="legend"><i />提问量 <i />有答案率</div></div><div className="chart"><div className="y-labels"><span>160</span><span>120</span><span>80</span><span>40</span><span>0</span></div><div className="bars">{[54,68,62,81,74,90,86,94,78,88,98,91].map((h, i) => <div key={i}><i style={{ height: `${h}%` }} /><span>{i % 2 ? "" : `${7 + i}/8`}</span></div>)}</div><div className="chart-line">⌁⌁⌁⌁⌁⌁⌁</div></div></article><article className="chart-card"><div className="card-heading"><div><b>知识库使用分布</b><span>按提问次数</span></div></div><div className="donut"><div><b>1,286</b><span>总提问</span></div></div><div className="donut-list"><span><i className="teal-dot" />ERP 业务系统 <b>48%</b></span><span><i className="blue-dot" />人力资源系统 <b>26%</b></span><span><i className="amber-dot" />财务报销平台 <b>18%</b></span><span><i className="gray-dot" />其他 <b>8%</b></span></div></article></div>
      <div className="insight-grid"><article className="insight-card"><div className="card-heading"><div><b>高频问题</b><span>用户最关注的操作</span></div><button>查看全部 →</button></div>{["如何撤回采购订单？", "发票抬头如何修改？", "忘记密码怎么办？", "如何导出采购明细？"].map((q, i) => <div className="rank-row" key={q}><i>{i + 1}</i><span>{q}<small>ERP 业务系统</small></span><b>{[86, 64, 51, 43][i]} 次</b></div>)}</article><article className="insight-card warning-card"><div className="card-heading"><div><b>需要关注</b><span>未命中与差评问题</span></div><button>处理建议 →</button></div><div className="attention"><span>28</span><p><b>未命中问题</b><small>较上期减少 6 个</small></p><i>→</i></div><div className="attention"><span>17</span><p><b>收到差评</b><small>主要原因为步骤不完整</small></p><i>→</i></div><div className="quality-tip"><b>✦ AI 内容优化建议</b><p>“跨月红冲发票”相关问题连续未命中，建议补充财务手册对应章节。</p></div></article></div>
    </>}
  </section>;
}

function Stat({ value, label, delta, icon }: { value: string; label: string; delta: string; icon: string }) {
  return <article className="stat-card"><div><span>{label}</span><b>{value}</b><small>{delta}</small></div><i>{icon}</i></article>;
}

function Modal({ type, onClose }: { type: "kb" | "upload"; onClose: () => void }) {
  return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="modal"><div className="modal-head"><div><h2>{type === "kb" ? "创建知识库" : "上传用户手册"}</h2><p>{type === "kb" ? "为新的业务系统建立独立知识空间" : "支持 PDF、DOCX、TXT 和 Markdown，最大 100 MB"}</p></div><button onClick={onClose}>×</button></div>{type === "kb" ? <div className="modal-form"><label>知识库名称<input placeholder="例如：供应链管理系统" autoFocus /></label><div className="two-cols"><label>知识库编码<input placeholder="例如：SCM_CORE" /></label><label>所属业务系统<input placeholder="请输入系统名称" /></label></div><label>知识库描述<textarea rows={3} placeholder="简要说明知识库覆盖的业务范围" /></label><label>默认状态<select><option>草稿 — 仅管理员可测试</option><option>已启用 — 授权用户可查询</option></select></label></div> : <div className="modal-form"><label>所属知识库<select><option>ERP 业务系统</option><option>人力资源系统</option></select></label><button className="dropzone"><span>⇧</span><b>点击选择或拖拽手册到这里</b><small>支持 PDF、DOCX、TXT、MD · 单个文件不超过 100 MB</small></button><div className="two-cols"><label>手册名称<input placeholder="请输入手册名称" /></label><label>版本号<input placeholder="例如：V2.0" /></label></div><label>备注<textarea rows={2} placeholder="可填写本次版本更新内容" /></label></div>}<div className="modal-actions"><button onClick={onClose}>取消</button><button className="primary" onClick={onClose}>{type === "kb" ? "创建知识库" : "开始上传"}</button></div></div></div>;
}
