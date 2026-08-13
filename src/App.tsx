import { useCallback, useEffect, useMemo, useState } from 'react';
import { App as AntApp, Spin } from 'antd';
import { getCurrentUser, logout as logoutRequest } from './api/auth';
import { setGlobalApiErrorHandler } from './api/request';
import { AppHeader } from './components/layout/AppHeader';
import { AppModal } from './components/ui/AppModal';
import { AdminPage } from './features/AdminPage';
import { ChatPage } from './features/ChatPage';
import { LoginPage } from './features/LoginPage';
import type { ApiUser, ModalType, Notice, View } from './types';

interface AppRoute {
  view: View;
  knowledgeBaseId?: string;
}

const VIEW_TITLES: Record<View, string> = {
  chat: '智能问答',
  knowledge: '知识库管理',
  manuals: '手册管理',
  analytics: '问答分析',
  users: '用户管理',
};

function routeFromPath(pathname: string): AppRoute {
  const manualMatch = pathname.match(/^\/knowledge-bases\/([^/]+)\/manuals\/?$/);
  if (manualMatch) return { view: 'manuals', knowledgeBaseId: decodeURIComponent(manualMatch[1]) };
  if (pathname.startsWith('/knowledge-bases')) return { view: 'knowledge' };
  if (pathname.startsWith('/analytics')) return { view: 'analytics' };
  if (pathname.startsWith('/users')) return { view: 'users' };
  return { view: 'chat' };
}

function pathForView(view: View, knowledgeBaseId?: string): string {
  if (view === 'knowledge') return '/knowledge-bases';
  if (view === 'manuals') {
    return knowledgeBaseId
      ? `/knowledge-bases/${encodeURIComponent(knowledgeBaseId)}/manuals`
      : '/knowledge-bases';
  }
  if (view === 'analytics') return '/analytics';
  if (view === 'users') return '/users';
  return '/';
}

export default function App() {
  const { message } = AntApp.useApp();
  const initialRoute = useMemo(() => routeFromPath(window.location.pathname), []);
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<View>(initialRoute.view);
  const [modal, setModal] = useState<ModalType | null>(null);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [adminDataVersion, setAdminDataVersion] = useState(0);
  const [adminKnowledgeBaseId, setAdminKnowledgeBaseId] = useState(
    initialRoute.knowledgeBaseId || '',
  );

  const notify = useCallback((notice: Notice) => {
    void message.open({ type: notice.type, content: notice.message });
  }, [message]);

  const closeMobileHistory = useCallback(() => {
    setMobileHistoryOpen(false);
  }, []);

  const setInitialKnowledgeBase = useCallback((id: string) => {
    setAdminKnowledgeBaseId((current) => current || id);
  }, []);

  const navigateTo = useCallback((
    nextView: View,
    knowledgeBaseId = adminKnowledgeBaseId,
    replace = false,
  ) => {
    const nextPath = pathForView(nextView, knowledgeBaseId);
    if (nextPath !== window.location.pathname) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', nextPath);
    }
    if (nextView === 'manuals' && knowledgeBaseId) setAdminKnowledgeBaseId(knowledgeBaseId);
    setView(nextView === 'manuals' && !knowledgeBaseId ? 'knowledge' : nextView);
  }, [adminKnowledgeBaseId]);

  useEffect(() => setGlobalApiErrorHandler((error) => {
    void message.error(error.status === 401 ? '登录状态已失效，请重新登录。' : error.message);
    if (error.status === 401) setCurrentUser(null);
  }), [message]);

  useEffect(() => {
    const handlePopState = () => {
      const route = routeFromPath(window.location.pathname);
      setView(route.view);
      if (route.knowledgeBaseId) setAdminKnowledgeBaseId(route.knowledgeBaseId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    void getCurrentUser()
      .then(setCurrentUser)
      .finally(() => setAuthLoading(false));
  }, []);

  function selectAdminKnowledgeBase(id: string) {
    setAdminKnowledgeBaseId(id);
    if (view === 'manuals') {
      const nextPath = pathForView('manuals', id);
      if (nextPath !== window.location.pathname) window.history.pushState({}, '', nextPath);
    }
  }

  async function logout() {
    await logoutRequest();
    setCurrentUser(null);
    setMobileHistoryOpen(false);
    navigateTo('chat', '', true);
  }

  if (authLoading) {
    return (
      <main className="login-loading">
        <Spin size="large" tip="正在检查登录状态"><div className="login-loading-space" /></Spin>
      </main>
    );
  }

  if (!currentUser) {
    return <LoginPage onLogin={(user) => { setCurrentUser(user); navigateTo('chat'); }} />;
  }

  return (
    <main className="app-shell">
      <AppHeader
        view={view}
        onChangeView={navigateTo}
        onOpenHistory={() => setMobileHistoryOpen(true)}
        user={currentUser}
        onLogout={() => void logout()}
      />

      <ChatPage
        currentUser={currentUser}
        active={view === 'chat'}
        mobileHistoryOpen={mobileHistoryOpen}
        onCloseMobileHistory={closeMobileHistory}
        onKnowledgeBaseReady={setInitialKnowledgeBase}
        onNotify={notify}
      />

      {view !== 'chat' && (
        <AdminPage
          view={view}
          title={VIEW_TITLES[view]}
          setModal={setModal}
          setView={navigateTo}
          onOpenManuals={(id) => navigateTo('manuals', id)}
          dataVersion={adminDataVersion}
          selectedKnowledgeBaseId={adminKnowledgeBaseId}
          onSelectKnowledgeBase={selectAdminKnowledgeBase}
          onNotify={notify}
        />
      )}

      {modal && (
        <AppModal
          type={modal}
          initialKnowledgeBaseId={modal === 'upload' ? adminKnowledgeBaseId : undefined}
          onClose={() => setModal(null)}
          onSuccess={() => {
            notify({
              type: 'success',
              message: modal === 'kb'
                ? '知识库已创建。'
                : modal === 'user'
                  ? '用户已创建。'
                  : '上传成功。系统处理完成后，请点击“发布到问答”使手册生效。',
            });
            setAdminDataVersion((value) => value + 1);
            setModal(null);
          }}
        />
      )}
    </main>
  );
}
