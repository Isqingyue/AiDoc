import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Space, Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import styled from "styled-components";
import type { ApiUser } from "../../../types";
import { getUserRoleLabel } from "./user.constants";

interface UserTableProps {
  users: ApiUser[];
  onEdit: (user: ApiUser) => void;
  onDelete: (user: ApiUser) => void;
}

const TableShell = styled.div`
  overflow-x: auto;

  .ant-table {
    min-width: 800px;
  }

  .ant-table-thead > tr > th {
    background: #f7f8fb;
    color: #667187;
    font-size: 12px;
    font-weight: 600;
  }
`;

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  const columns: TableColumnsType<ApiUser> = [
    {
      title: "姓名",
      dataIndex: "name",
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: "用户名",
      dataIndex: "username",
      render: (value: string) => <Typography.Text code>{value}</Typography.Text>,
    },
    {
      title: "密码",
      dataIndex: "plain_password",
      render: (value: string | null) => value
        ? <Typography.Text>{value}</Typography.Text>
        : <Typography.Text type="secondary">请在编辑中设置</Typography.Text>,
    },
    {
      title: "角色",
      dataIndex: "role",
      render: (value: ApiUser["role"]) => <Tag color="blue">{getUserRoleLabel(value)}</Tag>,
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (value: string) => (
        <Tag color={value === "active" ? "success" : "default"}>
          {value === "active" ? "正常" : "已停用"}
        </Tag>
      ),
    },
    {
      title: "操作",
      key: "actions",
      align: "right",
      render: (_, user) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(user)}>
            编辑
          </Button>
          {user.username !== "admin" && (
            <Button size="small" danger type="text" icon={<DeleteOutlined />} onClick={() => onDelete(user)}>
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <TableShell>
      <Table<ApiUser>
        rowKey="id"
        columns={columns}
        dataSource={users}
        pagination={users.length > 10 ? { pageSize: 10 } : false}
        locale={{ emptyText: "没有匹配的用户" }}
      />
    </TableShell>
  );
}
