import { DeleteOutlined, DownloadOutlined, ReloadOutlined, StopOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Empty, Progress, Space, Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import styled from "styled-components";
import type { ApiManual } from "../../../types";
import type { ManualAction } from "../../../api/manuals";
import { getStatusDescription, getStatusLabel } from "../status";

interface Props { manuals: ApiManual[]; hasAny: boolean; activeReplacementFor: (manual: ApiManual) => ApiManual | undefined; onAction: (manual: ApiManual, action: ManualAction) => void; onPublish: (manual: ApiManual) => void; onDelete: (manual: ApiManual) => void }

const TableShell = styled.div`
  overflow-x: auto;

  .ant-table {
    min-width: 900px;
  }

  .ant-table-thead > tr > th {
    background: #f7f8fb;
    color: #667187;
    font-size: 12px;
    font-weight: 600;
  }

  .ant-table-tbody > tr > td {
    vertical-align: middle;
  }
`;

export function ManualTable({ manuals, hasAny, activeReplacementFor, onAction, onPublish, onDelete }: Props) {
  const columns: TableColumnsType<ApiManual> = [
    { title: "手册", dataIndex: "name", render: (name: string, manual) => <Space><Typography.Text strong>{name}</Typography.Text>{manual.is_current && <Tag color="success">当前使用版本</Tag>}</Space> },
    { title: "版本", dataIndex: "version", width: 100, render: (value: string) => <Tag>{value}</Tag> },
    { title: "问答状态", dataIndex: "status", width: 190, render: (status: string, manual) => <div><Tag color={status === "published" ? "success" : status === "failed" ? "error" : status === "ready" ? "warning" : "default"}>{getStatusLabel(status)}</Tag><Typography.Text type="secondary">{getStatusDescription(status)}</Typography.Text>{manual.progress < 100 && <Progress percent={manual.progress} size="small" showInfo={false} />}</div> },
    { title: "更新时间", dataIndex: "created_at", width: 130, render: (value: string) => new Date(value).toLocaleDateString("zh-CN") },
    { title: "操作", key: "actions", align: "right", width: 360, render: (_, manual) => <Space wrap><Button size="small" icon={<DownloadOutlined />} href={`/api/manuals/${manual.id}/file`} download={manual.file_name}>下载原文件</Button>{manual.status === "ready" && <Button size="small" type="primary" icon={<UploadOutlined />} onClick={() => onPublish(manual)}>发布</Button>}{manual.status === "disabled" && <Button size="small" type="primary" onClick={() => onPublish(manual)}>{activeReplacementFor(manual) ? "恢复此版本" : "重新启用"}</Button>}{manual.status === "published" && <Button size="small" icon={<StopOutlined />} onClick={() => onAction(manual, "disable")}>停用</Button>}{manual.status === "failed" && <Button size="small" icon={<ReloadOutlined />} onClick={() => onAction(manual, "reprocess")}>重新处理</Button>}<Button size="small" danger type="text" icon={<DeleteOutlined />} onClick={() => onDelete(manual)}>删除</Button></Space> },
  ];
  return <TableShell><Table<ApiManual> rowKey="id" columns={columns} dataSource={manuals} pagination={manuals.length > 10 ? { pageSize: 10 } : false} locale={{ emptyText: <Empty description={hasAny ? "没有匹配的手册" : "这个知识库还没有手册"} /> }} /></TableShell>;
}
