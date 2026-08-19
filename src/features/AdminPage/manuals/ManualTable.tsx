import { DeleteOutlined, DownloadOutlined, ReloadOutlined, StopOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Empty, Progress, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import styled from 'styled-components';
import type { ManualAction } from '../../../api/manuals';
import type { ApiManual } from '../../../types';
import { getStatusDescription, getStatusLabel } from '../status';

interface Props {
  manuals: ApiManual[];
  hasAny: boolean;
  activeReplacementFor: (manual: ApiManual) => ApiManual | undefined;
  onAction: (manual: ApiManual, action: ManualAction) => void;
  onPublish: (manual: ApiManual) => void;
  onDelete: (manual: ApiManual) => void;
}

const TableShell = styled.div`
  overflow-x: auto;

  .ant-table {
    min-width: 880px;
    background: transparent;
  }

  .ant-table-thead > tr > th {
    padding: 13px 20px;
    background: #f8f9fc;
    color: #778399;
    font-size: 12px;
    font-weight: 600;
  }

  .ant-table-tbody > tr > td {
    padding: 17px 20px;
    vertical-align: middle;
    border-bottom-color: #edf0f5;
  }

  .ant-table-tbody > tr:hover > td {
    background: #fbfcff;
  }

  .ant-tag {
    margin-inline-end: 0;
    border: 0;
    border-radius: 5px;
  }
`;

export function ManualTable({ manuals, hasAny, activeReplacementFor, onAction, onPublish, onDelete }: Props) {
  const columns: TableColumnsType<ApiManual> = [
    {
      title: '手册',
      dataIndex: 'name',
      render: (name: string, manual) => (
        <div className="min-w-0">
          <Space size={8} wrap>
            <Typography.Text strong className="text-[#26324a]">{name}</Typography.Text>
            {manual.is_current && <Tag color="success">当前版本</Tag>}
          </Space>
          {manual.file_name !== name && <Typography.Text className="mt-1 block text-[12px] text-[#8a95a8]">{manual.file_name}</Typography.Text>}
        </div>
      ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      width: 110,
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: '问答状态',
      dataIndex: 'status',
      width: 240,
      render: (status: string, manual) => (
        <div className="space-y-1.5">
          <Space size={7} wrap>
            <Tag color={status === 'published' ? 'success' : status === 'failed' ? 'error' : status === 'ready' ? 'warning' : 'default'}>{getStatusLabel(status)}</Tag>
            <Typography.Text className="text-[12px] text-[#8a95a8]">{getStatusDescription(status)}</Typography.Text>
          </Space>
          {manual.progress < 100 && <Progress percent={manual.progress} size="small" showInfo={false} />}
        </div>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'created_at',
      width: 150,
      render: (value: string) => new Date(value).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      align: 'right',
      width: 405,
      render: (_, manual) => (
        <Space size={4} wrap>
          <Button size="small" icon={<DownloadOutlined />} href={`/api/manuals/${manual.id}/file`} download={manual.file_name}>下载原文件</Button>
          {['ready', 'published', 'disabled', 'failed'].includes(manual.status) && <Button size="small" icon={<ReloadOutlined />} onClick={() => onAction(manual, 'reprocess')}>重新处理</Button>}
          {manual.status === 'ready' && <Button size="small" type="primary" icon={<UploadOutlined />} onClick={() => onPublish(manual)}>发布</Button>}
          {manual.status === 'disabled' && <Button size="small" type="primary" onClick={() => onPublish(manual)}>{activeReplacementFor(manual) ? '恢复此版本' : '重新启用'}</Button>}
          {manual.status === 'published' && <Button size="small" icon={<StopOutlined />} onClick={() => onAction(manual, 'disable')}>停用</Button>}
          <Button size="small" danger type="text" icon={<DeleteOutlined />} onClick={() => onDelete(manual)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <TableShell>
      <Table<ApiManual>
        rowKey="id"
        columns={columns}
        dataSource={manuals}
        pagination={manuals.length > 10 ? { pageSize: 10 } : false}
        locale={{ emptyText: <Empty description={hasAny ? '没有匹配的手册' : '这个知识库还没有手册'} /> }}
      />
    </TableShell>
  );
}
