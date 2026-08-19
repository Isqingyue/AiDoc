import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Select } from 'antd';
import {
  ArrowClockwise,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChatCircleDots,
  Copy,
  FileText,
  Stop,
  ThumbsDown,
  ThumbsUp,
} from '@phosphor-icons/react';
import { AnswerContent } from '../../components/ui/AnswerContent';
import { BrandMark } from '../../components/ui/BrandMark';
import type { ApiKnowledgeBase, ApiMessage, ApiUser, Notice } from '../../types';

interface ConversationPanelProps {
  currentUser: ApiUser;
  knowledgeBases: ApiKnowledgeBase[];
  knowledgeBaseId: string;
  knowledgeBaseName: string;
  suggestedQuestions: string[];
  messages: ApiMessage[];
  query: string;
  asked: boolean;
  generating: boolean;
  error: string;
  responseModel: string;
  feedback: 'up' | 'down' | null;
  latestAnswer: string;
  submittedQuestion: string;
  onKnowledgeBaseChange: (id: string) => void;
  onQueryChange: (value: string) => void;
  onSubmit: (event?: FormEvent) => void;
  onStopGenerating: () => void;
  onAskSuggestion: (question: string) => void;
  onRetry: (question: string) => void;
  onCitation: (message: ApiMessage, index: number) => void;
  sourcesCollapsed: boolean;
  onOpenSources: () => void;
  onFeedback: (messageId: string | null, rating: 'up' | 'down') => void;
  onNotify: (notice: Notice) => void;
}

export function ConversationPanel({
  currentUser,
  knowledgeBases,
  knowledgeBaseId,
  knowledgeBaseName,
  suggestedQuestions,
  messages,
  query,
  asked,
  generating,
  error,
  responseModel,
  feedback,
  latestAnswer,
  submittedQuestion,
  onKnowledgeBaseChange,
  onQueryChange,
  onSubmit,
  onStopGenerating,
  onAskSuggestion,
  onRetry,
  onCitation,
  sourcesCollapsed,
  onOpenSources,
  onFeedback,
  onNotify,
}: ConversationPanelProps) {
  const latestMessage = messages.at(-1);
  const conversationRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const shouldFollowRef = useRef(true);
  const [followingLatest, setFollowingLatest] = useState(true);

  useEffect(() => {
    if (!asked || !shouldFollowRef.current) return;
    bottomAnchorRef.current?.scrollIntoView({ block: 'end' });
  }, [asked, messages, generating, error]);

  function handleConversationScroll() {
    const container = conversationRef.current;
    if (!container) return;

    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const shouldFollow = distanceToBottom < 80;
    shouldFollowRef.current = shouldFollow;
    setFollowingLatest(shouldFollow);
  }

  function scrollToLatest() {
    shouldFollowRef.current = true;
    setFollowingLatest(true);
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  function followBeforeRequest() {
    shouldFollowRef.current = true;
    setFollowingLatest(true);
  }

  function copyAnswer(content: string) {
    void navigator.clipboard.writeText(content).then(() => {
      onNotify({ type: 'success', message: '回答已复制。' });
    });
  }

  return (
    <section className="chat-panel" aria-label="智能问答">
      <div className="chat-toolbar">
        <div><span className="online-dot" />当前知识库</div>
        <Select
          className="kb-select antd-kb-select"
          value={knowledgeBaseId || undefined}
          loading={!knowledgeBases.length}
          disabled={!knowledgeBases.length}
          options={knowledgeBases.map((item) => ({ value: item.id, label: item.name }))}
          onChange={onKnowledgeBaseChange}
        />
        {sourcesCollapsed && (
          <button className="show-sources" type="button" onClick={onOpenSources}>
            <FileText weight="duotone" />
            <span>显示引用</span>
          </button>
        )}
      </div>

      <div className="conversation" ref={conversationRef} onScroll={handleConversationScroll}>
        {!asked ? (
          <div className="empty-state">
            <div className="empty-mark"><BrandMark /></div>
            <h1>您好，{currentUser.name}</h1>
            <p>我是您的智能手册助手。关于 <b>{knowledgeBaseName}</b>，有什么可以帮您？</p>
            <div className="starter-grid">
              {suggestedQuestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  onClick={() => {
                    followBeforeRequest();
                    onAskSuggestion(suggestion);
                  }}
                >
                  <span><ChatCircleDots /></span>
                  {suggestion}
                  <i><ArrowRight /></i>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages">
            <div className="date-divider"><span>当前会话</span></div>
            {messages.map((message) => message.role === 'user' ? (
              <div className="user-message" key={message.id}>
                <p>{message.content}</p>
              </div>
            ) : (
              <div className="ai-message" key={message.id}>
                <div className="ai-avatar"><BrandMark /></div>
                <div className="answer-wrap">
                  <div className="answer-meta"><b>知问助手</b><span>{message.model_name || 'AI'}</span></div>
                  {message.content ? (
                    <>
                      <div className={`answer live-answer ${generating && message.id === latestMessage?.id ? 'streaming-answer' : ''}`}>
                        <AnswerContent
                          content={message.content}
                          citations={message.citations}
                          onCitation={(index) => onCitation(message, index)}
                        />
                      </div>
                    </>
                  ) : generating && message.id === latestMessage?.id ? (
                    <div className="thinking"><span /><span /><span /> 正在检索手册并生成回答</div>
                  ) : null}
                </div>
              </div>
            ))}

            {error && (
              <div className="ai-message">
                <div className="ai-avatar"><BrandMark /></div>
                <div className="answer-wrap">
                  <div className="answer-meta">
                    <b>知问助手</b><span>{responseModel || '正在调用真实 AI'}</span>
                  </div>
                  <div className="api-error">
                    <b>调用失败</b>
                    <p>{error}</p>
                    <button
                      type="button"
                      onClick={() => {
                        followBeforeRequest();
                        onRetry(submittedQuestion);
                      }}
                    >
                      重新尝试
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!generating && !error && latestMessage?.role === 'assistant' && (
              <div className="latest-answer-actions answer-actions">
                <button
                  type="button"
                  className={feedback === 'up' ? 'chosen' : ''}
                  onClick={() => onFeedback(latestMessage.id || null, 'up')}
                  aria-label="回答有帮助"
                >
                  <ThumbsUp />
                </button>
                <button
                  type="button"
                  className={feedback === 'down' ? 'chosen' : ''}
                  onClick={() => onFeedback(latestMessage.id || null, 'down')}
                  aria-label="回答需改进"
                >
                  <ThumbsDown />
                </button>
                <button
                  type="button"
                  onClick={() => copyAnswer(latestAnswer || latestMessage.content)}
                  aria-label="复制回答"
                >
                  <Copy />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    followBeforeRequest();
                    onRetry(submittedQuestion);
                  }}
                  aria-label="重新生成"
                >
                  <ArrowClockwise />
                </button>
                <span>{feedback ? '感谢您的反馈' : '此回答对您有帮助吗？'}</span>
              </div>
            )}
            <div className="conversation-bottom-anchor" ref={bottomAnchorRef} />
          </div>
        )}
      </div>

      {!followingLatest && asked && (
        <button
          className="scroll-to-latest"
          type="button"
          onClick={scrollToLatest}
          aria-label="回到最新消息"
        >
          <ArrowDown weight="bold" />
        </button>
      )}

      <div className="composer-wrap">
        <form
          className="composer"
          onSubmit={(event) => {
            followBeforeRequest();
            onSubmit(event);
          }}
        >
          <textarea
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={`向“${knowledgeBaseName}”提问…`}
            rows={1}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                followBeforeRequest();
                onSubmit();
              }
            }}
          />
          <div className="composer-bottom">
            <span>AI 生成内容可能存在误差，请核对引用原文</span>
            {generating ? (
              <button
                type="button"
                className="send stop-generation"
                onClick={onStopGenerating}
                aria-label="停止生成"
              >
                <Stop weight="fill" />
              </button>
            ) : (
              <button
                type="submit"
                className="send"
                disabled={!query.trim() || !knowledgeBaseId}
                aria-label="发送问题"
              >
                <ArrowUp />
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
