import { Alert } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { getAnalytics } from '../../api/analytics';
import { listKnowledgeBases } from '../../api/knowledgeBases';
import { listManuals } from '../../api/manuals';
import { listUsers } from '../../api/users';
import type { ApiAnalytics, ApiKnowledgeBase, ApiManual, ApiUser } from '../../types';
import { AdminHeading } from './AdminHeading';
import { AnalyticsView } from './analytics';
import { KnowledgeBaseView } from './knowledge';
import { ManualsView } from './manuals';
import type { AdminPageProps } from './types';
import { UsersView } from './users';

const PROCESSING_MANUAL_STATUSES = new Set<ApiManual['status']>([
  'uploading',
  'parsing',
  'chunking',
]);

export function AdminPage({
  view,
  title,
  setModal,
  setView,
  onOpenManuals,
  dataVersion,
  selectedKnowledgeBaseId,
  onSelectKnowledgeBase,
  onNotify,
}: AdminPageProps) {
  const [knowledgeBases, setKnowledgeBases] = useState<ApiKnowledgeBase[]>([]);
  const [manuals, setManuals] = useState<ApiManual[]>([]);
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      const [knowledgeBaseData, manualData, analyticsData, userData] = await Promise.all([
        listKnowledgeBases(),
        listManuals(),
        getAnalytics(),
        listUsers(),
      ]);

      setKnowledgeBases(knowledgeBaseData);
      setManuals(manualData);
      setAnalytics(analyticsData);
      setUsers(userData);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '管理数据加载失败');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [dataVersion, reload]);

  useEffect(() => {
    const hasProcessingManual = manuals.some((manual) => (
      PROCESSING_MANUAL_STATUSES.has(manual.status)
    ));
    if (view !== 'manuals' || !hasProcessingManual) return;

    const controller = new AbortController();
    let timer: number | undefined;

    const refreshProcessingManuals = async () => {
      try {
        const manualData = await listManuals(controller.signal);
        setManuals(manualData);
        setError('');

        if (manualData.some((manual) => PROCESSING_MANUAL_STATUSES.has(manual.status))) {
          timer = window.setTimeout(() => void refreshProcessingManuals(), 2500);
        }
      } catch (reason) {
        if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
          setError(reason instanceof Error ? reason.message : '手册状态刷新失败');
        }
      }
    };

    timer = window.setTimeout(() => void refreshProcessingManuals(), 2500);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      controller.abort();
    };
  }, [manuals, view]);

  const selectedKnowledgeBase = knowledgeBases.find(
    (item) => item.id === selectedKnowledgeBaseId,
  );

  function openManuals(knowledgeBaseId: string) {
    onSelectKnowledgeBase(knowledgeBaseId);
    onOpenManuals(knowledgeBaseId);
  }

  return (
    <section className="[grid-column:2] [grid-row:1] h-dvh w-full overflow-y-auto bg-[#f6f7fb] px-8 pb-16 pt-7 max-[780px]:h-[calc(100dvh-64px)] max-[780px]:px-4 max-[780px]:pb-20 max-[780px]:pt-5">
      <AdminHeading
        view={view}
        title={title}
        selectedKnowledgeBase={selectedKnowledgeBase}
        onBack={() => setView('knowledge')}
        onOpenModal={setModal}
      />

      {error && <Alert className="mb-4" type="error" message={error} showIcon />}

      {view === 'knowledge' && (
        <KnowledgeBaseView
          knowledgeBases={knowledgeBases}
          manuals={manuals}
          reload={reload}
          onManageManuals={openManuals}
          onNotify={onNotify}
        />
      )}

      {view === 'manuals' && (
        <ManualsView
          knowledgeBases={knowledgeBases}
          manuals={manuals}
          reload={reload}
          selectedKnowledgeBaseId={selectedKnowledgeBaseId}
          onSelectKnowledgeBase={onSelectKnowledgeBase}
          onNotify={onNotify}
        />
      )}

      {view === 'analytics' && (
        <AnalyticsView
          analytics={analytics}
          onNotify={onNotify}
          onImprove={() => setView('knowledge')}
        />
      )}

      {view === 'users' && (
        <UsersView
          users={users}
          knowledgeBases={knowledgeBases}
          reload={reload}
          onNotify={onNotify}
        />
      )}
    </section>
  );
}
