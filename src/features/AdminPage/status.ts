export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "已启用",
    enabled: "已启用",
    disabled: "已停用",
    uploading: "正在上传",
    parsing: "正在解析",
    chunking: "正在处理",
    ready: "待发布",
    published: "已发布",
    failed: "处理失败",
  };
  return labels[status] ?? status;
}

export function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    uploading: "正在接收文件",
    parsing: "正在读取手册内容",
    chunking: "正在生成检索片段",
    ready: "发布后可用于问答",
    published: "可被智能问答引用",
    disabled: "不会被智能问答引用",
    failed: "请重试或更换文件",
  };
  return descriptions[status] ?? "";
}
