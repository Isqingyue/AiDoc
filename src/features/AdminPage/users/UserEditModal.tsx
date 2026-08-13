import { Alert, Form, Input, Modal, Select } from "antd";
import { useEffect, useState } from "react";
import { getUserKnowledgeBases, setUserKnowledgeBases, updateUser } from "../../../api/users";
import type { ApiKnowledgeBase, ApiUser } from "../../../types";
import { USER_ROLE_OPTIONS, USER_STATUS_OPTIONS } from "./user.constants";
import type { UserEditValues } from "./user.types";

interface UserEditModalProps {
  user: ApiUser;
  knowledgeBases: ApiKnowledgeBase[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export function UserEditModal({ user, knowledgeBases, onClose, onSaved }: UserEditModalProps) {
  const [form] = Form.useForm<UserEditValues>();
  const selectedRole = Form.useWatch("role", form);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    form.setFieldsValue({
      name: user.name,
      password: user.plain_password ?? "",
      role: user.role,
      status: user.status,
      accessIds: [],
    });

    if (user.role === "user") {
      void getUserKnowledgeBases(user.id)
        .then((items) => form.setFieldValue("accessIds", items.map((item) => item.id)))
        .catch((reason: unknown) => {
          setError(reason instanceof Error ? reason.message : "用户知识库权限加载失败");
        });
    }
  }, [form, user]);

  async function handleSave(values: UserEditValues) {
    setSaving(true);
    setError("");

    try {
      await updateUser(user.id, {
        name: values.name,
        role: values.role,
        status: values.status,
        password: values.password !== user.plain_password ? values.password : undefined,
      });
      if (values.role === "user") {
        await setUserKnowledgeBases(user.id, values.accessIds);
      }
      await onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "用户保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      centered
      width={600}
      title={
        <div>
          <b>编辑用户</b>
          <p className="modal-subtitle">
            {user.username} · 修改账号资料、密码、角色与状态
          </p>
        </div>
      }
      okText="保存修改"
      cancelText="取消"
      confirmLoading={saving}
      onOk={() => form.submit()}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form<UserEditValues>
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSave}
      >
        <Form.Item label="姓名" name="name" rules={[{ required: true, message: "请输入姓名" }]}>
          <Input autoFocus />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[
            { required: true, message: "请输入密码" },
            { min: 8, message: "密码至少 8 位" },
          ]}
        >
          <Input />
        </Form.Item>

        <div className="form-grid-2">
          <Form.Item label="角色" name="role">
            <Select options={USER_ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item label="状态" name="status">
            <Select options={USER_STATUS_OPTIONS} />
          </Form.Item>
        </div>

        {selectedRole === "user" && (
          <Form.Item label="允许访问的知识库" name="accessIds">
            <Select
              mode="multiple"
              allowClear
              placeholder="请选择知识库"
              options={knowledgeBases.map((item) => ({ value: item.id, label: item.name }))}
            />
          </Form.Item>
        )}

        {error && <Alert type="error" message={error} showIcon />}
      </Form>
    </Modal>
  );
}
