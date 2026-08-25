import {
  BarChartOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Alert, Button, Checkbox, Form, Input } from 'antd';
import { BookOpenText, Database, ShieldCheck } from '@phosphor-icons/react';
import { useState } from 'react';
import styled from 'styled-components';
import { login, type LoginPayload } from '../../api/auth';
import type { ApiUser } from '../../types';

interface LoginPageProps {
  onLogin: (user: ApiUser) => void;
}

const FEATURES = [
  { title: '智能问答', description: '自然语言理解\n精准回答问题', icon: BookOpenText },
  { title: '知识整合', description: '企业知识统一管理\n快速检索', icon: Database },
  { title: '安全可靠', description: '企业级安全防护\n数据隐私保障', icon: ShieldCheck },
  { title: '高效协同', description: '多角色协作\n提升工作效率', icon: BarChartOutlined },
];

const LoginBackground = styled.main`
  --login-blue: #246ff0;
  --login-navy: #15345f;
  min-height: 100dvh;
  background: #eef7ff;
  color: var(--login-navy);
`;

const LoginShell = styled.section`
  position: relative;
  isolation: isolate;
  display: grid;
  width: 100%;
  min-height: 100dvh;
  grid-template-rows: minmax(0, 1fr) auto;
  overflow: hidden;
  background: url('/login/ai-city-hero.png') center bottom / cover no-repeat;

  &::before {
    position: absolute;
    z-index: -1;
    inset: 0;
    background:
      linear-gradient(90deg, rgb(255 255 255 / 78%) 0%, rgb(248 252 255 / 63%) 45%, rgb(238 247 255 / 34%) 100%),
      linear-gradient(180deg, rgb(239 247 255 / 8%) 42%, rgb(238 247 255 / 35%) 100%);
    content: '';
  }
`;

const LoginContent = styled.div`
  display: grid;
  min-height: 0;
  grid-template-columns: minmax(0, 1.04fr) minmax(440px, 0.96fr);

  @media (max-width: 1080px) {
    grid-template-columns: minmax(0, 1fr) minmax(410px, 0.94fr);
  }

  @media (max-width: 820px) {
    display: flex;
    min-height: auto;
    flex-direction: column;
  }
`;

const BrandPanel = styled.aside`
  display: flex;
  min-width: 0;
  flex-direction: column;
  padding: clamp(34px, 5.2vh, 66px) clamp(34px, 4.3vw, 80px) clamp(30px, 4vh, 52px);

  @media (max-width: 820px) {
    min-height: 260px;
    padding: 28px clamp(24px, 7vw, 54px) 22px;
  }
`;

const BrandHeader = styled.div`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 13px;

  img {
    display: block;
    width: clamp(78px, 7vw, 106px);
    height: auto;
    object-fit: contain;
  }

  .brand-name {
    display: flex;
    flex-direction: column;
    color: #153a69;
    line-height: 1;
  }

  strong {
    font-size: clamp(20px, 1.75vw, 28px);
    font-weight: 750;
    letter-spacing: 0.04em;
  }

  small {
    margin-top: 8px;
    font-size: clamp(8px, 0.65vw, 11px);
    font-weight: 650;
    letter-spacing: 0.025em;
  }

  @media (max-width: 820px) {
    gap: 9px;
    img { width: 68px; }
    strong { font-size: 19px; }
    small { margin-top: 5px; font-size: 8px; }
  }
`;

const BrandStory = styled.div`
  max-width: 600px;
  margin-top: clamp(72px, 13vh, 148px);

  h1 {
    margin: 0;
    color: #123665;
    font-size: clamp(40px, 4vw, 64px);
    font-weight: 760;
    letter-spacing: 0.025em;
    line-height: 1.13;
    text-shadow: 0 2px 18px rgb(255 255 255 / 72%);
  }

  h2 {
    margin: 28px 0 34px;
    color: #566c8d;
    font-size: clamp(18px, 1.75vw, 27px);
    font-weight: 580;
    letter-spacing: 0.045em;
    line-height: 1.45;
  }

  p {
    max-width: 39ch;
    margin: 0;
    color: #3c5578;
    font-size: clamp(14px, 1.05vw, 17px);
    font-weight: 500;
    line-height: 1.9;
  }

  @media (max-width: 1080px) {
    margin-top: 74px;
    h1 { font-size: 42px; }
  }

  @media (max-width: 820px) {
    margin-top: 36px;
    h1 { font-size: clamp(30px, 8vw, 40px); }
    h2 { margin: 10px 0 0; font-size: 16px; }
    p { display: none; }
  }
`;

const FeatureList = styled.div`
  display: grid;
  max-width: 660px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: auto;
  padding-top: 46px;

  article {
    min-width: 0;
    padding: 0 16px;
    text-align: center;
  }

  article:first-child { padding-left: 0; }
  article:last-child { padding-right: 0; }

  .feature-icon {
    display: grid;
    width: 58px;
    height: 58px;
    margin: 0 auto 15px;
    place-items: center;
    border: 1px solid rgb(255 255 255 / 74%);
    border-radius: 50%;
    background: rgb(255 255 255 / 76%);
    box-shadow: 0 10px 30px rgb(58 111 175 / 12%);
    color: var(--login-blue);
    backdrop-filter: blur(8px);
  }

  svg { font-size: 29px; }
  b, span { display: block; }
  b { color: #243e63; font-size: 14px; font-weight: 700; }
  span { margin-top: 7px; color: #61738e; font-size: 12px; line-height: 1.55; white-space: pre-line; }

  @media (max-width: 1080px) {
    article { padding-inline: 8px; }
    .feature-icon { width: 52px; height: 52px; }
  }

  @media (max-width: 820px) { display: none; }
`;

const LoginPanel = styled.section`
  display: grid;
  min-width: 0;
  place-items: center;
  padding-block: clamp(42px, 7vh, 92px);
  padding-left: clamp(20px, 2vw, 36px);
  padding-right: clamp(52px, 7vw, 128px);

  @media (max-width: 1080px) { padding-inline: 34px; }

  @media (max-width: 820px) {
    padding: 18px 20px 32px;
  }
`;

const LoginCard = styled.div`
  width: min(100%, 480px);
  padding: clamp(42px, 5vh, 64px) clamp(34px, 4vw, 60px) clamp(36px, 4.5vh, 56px);
  border: 1px solid rgb(255 255 255 / 88%);
  border-radius: 24px;
  background: rgb(255 255 255 / 92%);
  box-shadow: 0 24px 70px rgb(45 88 145 / 18%);
  backdrop-filter: blur(20px);

  .ant-form-item { margin-bottom: 22px; }
  .ant-form-item-explain-error { padding-top: 5px; font-size: 12px; }
  .ant-input-affix-wrapper {
    min-height: 58px;
    padding-inline: 17px;
    border-color: #dce4ef;
    border-radius: 8px;
    background: rgb(255 255 255 / 88%);
    font-size: 16px;
  }
  .ant-input-affix-wrapper:hover { border-color: #6ca0f4; }
  .ant-input-affix-wrapper-focused {
    border-color: var(--login-blue);
    box-shadow: 0 0 0 3px rgb(36 111 240 / 13%);
  }
  .ant-input-prefix { margin-inline-end: 12px; }
  .ant-input-prefix, .ant-input-suffix { color: #7f8da2; }
  .ant-input-password-icon { display: grid; min-width: 32px; min-height: 32px; place-items: center; }
  .ant-checkbox-wrapper { min-height: 32px; align-items: center; color: #334965; font-size: 14px; }
  .ant-btn-primary {
    height: 58px;
    margin-top: 20px;
    border: 0;
    border-radius: 8px;
    background: linear-gradient(90deg, #2469e7, #2c7df5);
    box-shadow: 0 12px 24px rgb(38 111 235 / 25%);
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 0.28em;
  }
  .ant-btn-primary:not(:disabled):hover {
    background: linear-gradient(90deg, #185dd6, #216fe3);
    box-shadow: 0 14px 28px rgb(38 111 235 / 32%);
    transform: translateY(-1px);
  }
  .ant-btn-primary:not(:disabled):active { transform: translateY(0); }

  @media (max-width: 820px) {
    max-width: 540px;
    padding: 34px 24px 30px;
    border-radius: 18px;
  }

  @media (prefers-reduced-motion: reduce) {
    .ant-btn-primary { transition: none; }
  }
`;

const FormHeading = styled.header`
  margin-bottom: 40px;
  text-align: center;

  h2 { margin: 0; color: #18365e; font-size: clamp(30px, 2.5vw, 38px); font-weight: 750; line-height: 1.25; }
  p { margin: 14px 0 0; color: #718097; font-size: 15px; }

  @media (max-width: 820px) {
    margin-bottom: 30px;
    h2 { font-size: 29px; }
    p { font-size: 14px; }
  }
`;

const FormTools = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;

  button {
    min-width: 96px;
    min-height: 44px;
    padding: 0 8px;
    color: var(--login-blue);
    font-size: 14px;
    font-weight: 600;
  }
`;

const SecurityNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-top: 30px;
  color: #7a899e;
  font-size: 12px;
  line-height: 1.65;

  svg { flex: 0 0 auto; margin-top: 2px; color: #377ce8; }
`;

const Footer = styled.footer`
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: center;
  padding: 12px 30px;
  border-top: 1px solid rgb(205 220 238 / 55%);
  background: rgb(255 255 255 / 84%);
  color: #75849a;
  font-size: 12px;
  backdrop-filter: blur(14px);

  span + span::before { margin: 0 20px; color: #bcc7d5; content: '|'; }

  @media (max-width: 720px) {
    min-height: 48px;
    padding: 10px 16px;
    font-size: 11px;
    span:not(:first-child) { display: none; }
  }
`;

export function LoginPage({ onLogin }: LoginPageProps) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(values: LoginPayload) {
    setSubmitting(true);
    setError('');
    try {
      onLogin(await login(values));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '登录失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LoginBackground>
      <LoginShell>
        <LoginContent>
          <BrandPanel aria-label="AI 智能用户手册产品介绍">
            <BrandHeader>
              <img src="/logoSingle.png" alt="中国铁建标识" />
              <span className="brand-name">
                <strong>中国铁建</strong>
                <small>CHINA RAILWAY CONSTRUCTION</small>
              </span>
            </BrandHeader>

            <BrandStory>
              <h1>AI 智能用户手册</h1>
              <h2>智能检索 · 精准解答 · 高效协作</h2>
              <p>基于先进的大语言模型与企业知识库，为您提供智能化、个性化的用户手册查询与使用体验，助力企业知识高效流转。</p>
            </BrandStory>

            <FeatureList>
              {FEATURES.map(({ title, description, icon: Icon }) => (
                <article key={title}>
                  <span className="feature-icon"><Icon aria-hidden="true" /></span>
                  <b>{title}</b>
                  <span>{description}</span>
                </article>
              ))}
            </FeatureList>
          </BrandPanel>

          <LoginPanel aria-labelledby="login-heading">
            <LoginCard>
              <FormHeading>
                <h2 id="login-heading">欢迎登录</h2>
                <p>登录 AI 智能用户手册，探索企业知识</p>
              </FormHeading>

              <Form<LoginPayload>
                layout="vertical"
                initialValues={{ username: 'admin' }}
                onFinish={submit}
                requiredMark={false}
              >
                <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                  <Input
                    prefix={<UserOutlined aria-hidden="true" />}
                    placeholder="请输入用户名或邮箱"
                    autoComplete="username"
                    autoFocus
                    aria-label="用户名或邮箱"
                  />
                </Form.Item>
                <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                  <Input.Password
                    prefix={<LockOutlined aria-hidden="true" />}
                    iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                    placeholder="请输入密码"
                    autoComplete="current-password"
                    aria-label="密码"
                  />
                </Form.Item>
                {error && <Alert className="mb-4" type="error" message={error} showIcon role="alert" />}
                <FormTools>
                  <Checkbox>记住我</Checkbox>
                  <Button type="link" onClick={() => setError('请联系系统管理员重置密码。')}>忘记密码？</Button>
                </FormTools>
                <Button type="primary" htmlType="submit" loading={submitting} block>登录</Button>
              </Form>

              <SecurityNote>
                <SafetyCertificateOutlined aria-hidden="true" />
                <span>该系统仅供授权人员使用。登录行为将受到企业安全策略保护。</span>
              </SecurityNote>
            </LoginCard>
          </LoginPanel>
        </LoginContent>

        <Footer>
          <span>© 2025 AnyCross. All rights reserved.</span>
          <span>隐私政策</span>
          <span>使用条款</span>
          <span>帮助中心</span>
        </Footer>
      </LoginShell>
    </LoginBackground>
  );
}
