import { SearchOutlined } from "@ant-design/icons";
import { Input, Select } from "antd";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { deleteUser } from "../../../api/users";
import type { ApiKnowledgeBase, ApiUser, Notice } from "../../../types";
import { USER_ROLE_OPTIONS } from "./user.constants";
import { UserEditModal } from "./UserEditModal";
import { UserTable } from "./UserTable";

interface UsersViewProps {
  users: ApiUser[];
  knowledgeBases: ApiKnowledgeBase[];
  reload: () => Promise<void>;
  onNotify: (notice: Notice) => void;
}

export function UsersView({ users, knowledgeBases, reload, onNotify }: UsersViewProps) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [editingUser, setEditingUser] = useState<ApiUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ApiUser | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesKeyword = `${user.name} ${user.username}`.toLowerCase().includes(keyword);
      return matchesKeyword && (role === "all" || user.role === role);
    });
  }, [role, search, users]);

  async function handleDelete() {
    if (!deletingUser) return;
    setDeleteBusy(true);
    try {
      await deleteUser(deletingUser.id);
      await reload();
      setDeletingUser(null);
      onNotify({ type: "success", message: "用户已删除。" });
    } catch (reason) {
      onNotify({ type: "error", message: reason instanceof Error ? reason.message : "删除用户失败" });
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handleSaved() {
    setEditingUser(null);
    await reload();
    onNotify({ type: "success", message: "用户资料与权限已保存。" });
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-[#e4e8f0] bg-white p-2.5 max-[640px]:flex-wrap">
        <Input className="w-full max-w-[360px] max-[640px]:max-w-none" allowClear prefix={<SearchOutlined />} placeholder="搜索姓名或用户名" value={search} onChange={(event) => setSearch(event.target.value)} />
        <Select className="min-w-[140px]" value={role} onChange={setRole} options={[{ value: "all", label: "全部角色" }, ...USER_ROLE_OPTIONS]} />
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e4e8f0] bg-white shadow-[0_2px_10px_rgb(27_45_85_/_3%)]">
        <UserTable users={filteredUsers} onEdit={setEditingUser} onDelete={setDeletingUser} />
      </div>

      {editingUser && <UserEditModal user={editingUser} knowledgeBases={knowledgeBases} onClose={() => setEditingUser(null)} onSaved={handleSaved} />}
      {deletingUser && <ConfirmDialog title="删除这个用户？" description={`“${deletingUser.name}（${deletingUser.username}）”将无法再登录，已有账号数据会被永久删除。`} busy={deleteBusy} onCancel={() => setDeletingUser(null)} onConfirm={() => void handleDelete()} />}
    </>
  );
}
