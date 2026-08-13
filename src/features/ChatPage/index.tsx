import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { deleteConversation, listConversationMessages, listConversations } from '../../api/conversations';
import { streamChat, submitMessageFeedback } from '../../api/chat';
import { listKnowledgeBases } from '../../api/knowledgeBases';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type {
  ApiCitation,
  ApiConversation,
  ApiKnowledgeBase,
  ApiMessage,
  ApiUser,
  Notice,
} from '../../types';
import { ConversationPanel } from './ConversationPanel';
import { HistoryPanel } from './HistoryPanel';
import { SourcesPanel } from './SourcesPanel';
import { citationsToSources, getReferencedCitations } from './chat.types';
import { getKnowledgeBaseSuggestions } from './chat.utils';

interface ChatPageProps {
  currentUser: ApiUser;
  active: boolean;
  mobileHistoryOpen: boolean;
  onCloseMobileHistory: () => void;
  onKnowledgeBaseReady: (id: string) => void;
  onNotify: (notice: Notice) => void;
}

export function ChatPage({
  currentUser,
  active,
  mobileHistoryOpen,
  onCloseMobileHistory,
  onKnowledgeBaseReady,
  onNotify,
}: ChatPageProps) {
  const [query, setQuery] = useState('');
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [asked, setAsked] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isLiveConversation, setIsLiveConversation] = useState(false);
  const [latestAnswer, setLatestAnswer] = useState('');
  const [error, setError] = useState('');
  const [responseModel, setResponseModel] = useState('');
  const [liveCitations, setLiveCitations] = useState<ApiCitation[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<ApiKnowledgeBase[]>([]);
  const [knowledgeBaseId, setKnowledgeBaseId] = useState('');
  const [knowledgeBaseName, setKnowledgeBaseName] = useState('ERP 业务系统');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [activeHistory, setActiveHistory] = useState<string | number>(0);
  const [activeCitation, setActiveCitation] = useState(0);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [mobileSourcesOpen, setMobileSourcesOpen] = useState(false);
  const [sourcesCollapsed, setSourcesCollapsed] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<ApiConversation | null>(null);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const streamControllerRef = useRef<AbortController | null>(null);

  const suggestedQuestions = useMemo(
    () => getKnowledgeBaseSuggestions(knowledgeBases.find((item) => item.id === knowledgeBaseId)),
    [knowledgeBases, knowledgeBaseId],
  );
  const citationSources = useMemo(() => citationsToSources(liveCitations), [liveCitations]);

  const startNewChat = useCallback(() => {
    streamControllerRef.current?.abort();
    streamControllerRef.current = null;
    setGenerating(false);
    setAsked(false);
    setQuery('');
    setSubmittedQuestion('');
    setIsLiveConversation(false);
    setLatestAnswer('');
    setError('');
    setLiveCitations([]);
    setActiveCitation(0);
    setConversationId(null);
    setMessages([]);
    setActiveHistory(0);
    onCloseMobileHistory();
  }, [onCloseMobileHistory]);

  const loadConversation = useCallback(async (item: ApiConversation) => {
    try {
      const conversationMessages = await listConversationMessages(item.id);
      const lastUser = [...conversationMessages].reverse().find((message) => message.role === 'user');
      const lastAnswerMessage = [...conversationMessages]
        .reverse()
        .find((message) => message.role === 'assistant');

      setActiveHistory(item.id);
      setConversationId(item.id);
      setKnowledgeBaseId(item.knowledge_base_id);
      setKnowledgeBaseName(
        knowledgeBases.find((knowledgeBase) => knowledgeBase.id === item.knowledge_base_id)?.name
          || '知识库',
      );
      setSubmittedQuestion(lastUser?.content || item.title);
      setLatestAnswer(lastAnswerMessage?.content || '');
      setLiveCitations(
        getReferencedCitations(
          lastAnswerMessage?.content || '',
          lastAnswerMessage?.citations || [],
        ),
      );
      setActiveCitation(0);
      setResponseModel(lastAnswerMessage?.model_name || '');
      setMessages(conversationMessages);
      setError('');
      setIsLiveConversation(true);
      setAsked(true);
      onCloseMobileHistory();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '会话加载失败');
    }
  }, [knowledgeBases, onCloseMobileHistory]);

  const refreshConversations = useCallback(async (selectLatest = false) => {
    try {
      const items = (await listConversations()).sort(
        (left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
      );
      setConversations(items);

      if (selectLatest) {
        if (items.length) await loadConversation(items[0]);
        else startNewChat();
      }
    } catch {
      if (selectLatest) startNewChat();
    }
  }, [loadConversation, startNewChat]);

  useEffect(() => {
    void listKnowledgeBases()
      .then((items) => {
        setKnowledgeBases(items);
        const selected = items.find((item) => item.status === 'enabled') || items[0];
        if (selected) {
          setKnowledgeBaseId(selected.id);
          setKnowledgeBaseName(selected.name);
          onKnowledgeBaseReady(selected.id);
        }
      })
      .catch(() => setError('后端服务未启动，暂时无法加载知识库。'));
  }, [onKnowledgeBaseReady]);

  useEffect(() => {
    if (knowledgeBases.length) void refreshConversations(true);
  }, [knowledgeBases.length, refreshConversations]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        startNewChat();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [startNewChat]);

  useEffect(() => () => {
    streamControllerRef.current?.abort();
  }, []);

  function submitQuestion(event?: FormEvent) {
    event?.preventDefault();
    const question = query.trim();
    if (!question || generating) return;
    void sendQuestion(question);
  }

  async function sendQuestion(question: string) {
    if (!knowledgeBaseId) {
      setError('知识库尚未加载完成，请稍后再试。');
      return;
    }

    setSubmittedQuestion(question);
    setQuery('');
    setAsked(true);
    setGenerating(true);
    setIsLiveConversation(true);
    setLatestAnswer('');
    setError('');
    setResponseModel('');
    setLiveCitations([]);
    setActiveCitation(0);
    setFeedback(null);
    const streamController = new AbortController();
    streamControllerRef.current?.abort();
    streamControllerRef.current = streamController;

    const pendingTimestamp = Date.now();
    const pendingUser: ApiMessage = {
      id: `pending-user-${pendingTimestamp}`,
      role: 'user',
      content: question,
      citations: [],
      model_name: '',
      created_at: new Date().toISOString(),
    };
    const pendingAssistant: ApiMessage = {
      id: `pending-assistant-${pendingTimestamp}`,
      role: 'assistant',
      content: '',
      citations: [],
      model_name: 'AI',
      created_at: new Date().toISOString(),
    };
    setMessages((currentMessages) => [...currentMessages, pendingUser, pendingAssistant]);

    try {
      let streamedAnswer = '';
      let completed = false;
      let candidateCitations: ApiCitation[] = [];
      for await (const event of streamChat({
        question,
        knowledge_base_id: knowledgeBaseId,
        conversation_id: conversationId,
      }, streamController.signal)) {
        if (event.type === 'metadata') {
          setConversationId(event.conversation_id);
          setResponseModel(event.model);
          candidateCitations = event.citations;
          setMessages((currentMessages) => currentMessages.map((message) =>
            message.id === pendingAssistant.id
              ? { ...message, model_name: event.model }
              : message,
          ));
          continue;
        }
        if (event.type === 'delta') {
          streamedAnswer += event.delta;
          const referencedCitations = getReferencedCitations(
            streamedAnswer,
            candidateCitations,
          );
          setLatestAnswer(streamedAnswer);
          setLiveCitations(referencedCitations);
          setMessages((currentMessages) => currentMessages.map((message) =>
            message.id === pendingAssistant.id
              ? {
                ...message,
                content: streamedAnswer,
                citations: referencedCitations,
              }
              : message,
          ));
          continue;
        }
        if (event.type === 'error') throw new Error(event.message);
        if (event.type === 'done') {
          completed = true;
          const referencedCitations = getReferencedCitations(
            streamedAnswer,
            event.citations,
          );
          setConversationId(event.conversation_id);
          setResponseModel(event.model);
          setLiveCitations(referencedCitations);
          setMessages((currentMessages) => currentMessages.map((message) =>
            message.id === pendingAssistant.id
              ? {
                ...message,
                id: event.message_id,
                content: streamedAnswer,
                model_name: event.model,
                citations: referencedCitations,
              }
              : message,
          ));
        }
      }
      if (!completed) throw new Error('回答生成意外中断，请重新尝试。');
      void refreshConversations();
    } catch (reason) {
      setMessages((currentMessages) => currentMessages.filter(
        (message) => message.id !== pendingUser.id && message.id !== pendingAssistant.id,
      ));
      setLatestAnswer('');
      if (
        reason instanceof DOMException
        && reason.name === 'AbortError'
        && streamControllerRef.current === streamController
      ) {
        setError('回答生成已停止，可以重新尝试。');
      } else if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
        setError(reason instanceof Error ? reason.message : 'AI 服务连接失败，请稍后重试。');
      }
    } finally {
      if (streamControllerRef.current === streamController) {
        streamControllerRef.current = null;
        setGenerating(false);
      }
    }
  }

  function stopGenerating() {
    streamControllerRef.current?.abort();
  }

  async function submitFeedback(messageId: string | null, rating: 'up' | 'down') {
    setFeedback(rating);
    if (!messageId) return;

    try {
      await submitMessageFeedback(messageId, rating);
      onNotify({ type: 'success', message: '感谢反馈，我们会据此持续优化回答。' });
    } catch {
      setFeedback(null);
      onNotify({ type: 'error', message: '反馈提交失败，请稍后重试。' });
    }
  }

  async function confirmDeleteConversation() {
    if (!conversationToDelete) return;

    setDeletingConversation(true);
    try {
      await deleteConversation(conversationToDelete.id);
      setConversations((items) => items.filter((item) => item.id !== conversationToDelete.id));
      if (conversationId === conversationToDelete.id) startNewChat();
      onNotify({ type: 'success', message: '会话已删除。' });
      setConversationToDelete(null);
    } catch (reason) {
      onNotify({
        type: 'error',
        message: reason instanceof Error ? reason.message : '删除会话失败',
      });
    } finally {
      setDeletingConversation(false);
    }
  }

  function changeKnowledgeBase(id: string) {
    const selected = knowledgeBases.find((item) => item.id === id);
    setKnowledgeBaseId(id);
    setKnowledgeBaseName(selected?.name || '知识库');
    startNewChat();
  }

  function showCitation(message: ApiMessage, index: number) {
    const referencedCitations = getReferencedCitations(message.content, message.citations);
    const selectedIndex = referencedCitations.findIndex(
      (citation) => citation.id === String(index + 1),
    );
    setLiveCitations(referencedCitations);
    setActiveCitation(selectedIndex >= 0 ? selectedIndex : 0);
    setSourcesCollapsed(false);
    setMobileSourcesOpen(true);
  }

  function openSources() {
    setSourcesCollapsed(false);
    setMobileSourcesOpen(true);
  }

  function closeSources() {
    setSourcesCollapsed(true);
    setMobileSourcesOpen(false);
  }

  return (
    <section className={`workspace ${active ? '' : 'chat-page-hidden'} ${sourcesCollapsed ? 'sources-collapsed' : ''}`}>
      <HistoryPanel
        conversations={conversations}
        activeConversationId={activeHistory}
        mobileOpen={mobileHistoryOpen}
        onClose={onCloseMobileHistory}
        onNewChat={startNewChat}
        onSelect={(conversation) => void loadConversation(conversation)}
        onDelete={setConversationToDelete}
      />
      <ConversationPanel
        currentUser={currentUser}
        knowledgeBases={knowledgeBases}
        knowledgeBaseId={knowledgeBaseId}
        knowledgeBaseName={knowledgeBaseName}
        suggestedQuestions={suggestedQuestions}
        messages={messages}
        query={query}
        asked={asked}
        generating={generating}
        error={error}
        responseModel={responseModel}
        feedback={feedback}
        latestAnswer={latestAnswer}
        submittedQuestion={submittedQuestion}
        onKnowledgeBaseChange={changeKnowledgeBase}
        onQueryChange={setQuery}
        onSubmit={submitQuestion}
        onStopGenerating={stopGenerating}
        onAskSuggestion={(question) => {
          if (!generating) void sendQuestion(question);
        }}
        onRetry={(question) => void sendQuestion(question)}
        onCitation={showCitation}
        sourcesCollapsed={sourcesCollapsed}
        onOpenSources={openSources}
        onFeedback={(messageId, rating) => void submitFeedback(messageId, rating)}
        onNotify={onNotify}
      />
      <SourcesPanel
        sources={citationSources}
        citationCount={citationSources.length}
        activeIndex={activeCitation}
        isLiveConversation={isLiveConversation}
        hasLiveCitations={Boolean(liveCitations.length)}
        generating={generating}
        mobileOpen={mobileSourcesOpen}
        onClose={closeSources}
        onSelect={setActiveCitation}
      />
      {(mobileHistoryOpen || mobileSourcesOpen) && (
        <button
          className="overlay"
          type="button"
          onClick={() => {
            onCloseMobileHistory();
            closeSources();
          }}
          aria-label="关闭面板"
        />
      )}
      {conversationToDelete && (
        <ConfirmDialog
          title="删除这个会话？"
          description={`“${conversationToDelete.title}”及其中的全部问答记录将被永久删除，此操作无法撤销。`}
          busy={deletingConversation}
          onCancel={() => setConversationToDelete(null)}
          onConfirm={() => void confirmDeleteConversation()}
        />
      )}
    </section>
  );
}
