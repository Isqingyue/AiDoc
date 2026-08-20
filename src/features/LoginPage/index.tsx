import {
  BarChartOutlined,
  EyeInvisibleOutlined,
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
  min-height: 100dvh;
  background: #fff;
`;

const LoginShell = styled.section`
  position: relative;
  display: grid;
  width: 100%;
  min-height: 100dvh;
  margin: 0 auto;
  grid-template-rows: minmax(0, 1fr) auto;
  overflow: hidden;
  background: #fff;

  @media (max-width: 720px) {
    min-height: 100dvh;
  }
`;

const LoginContent = styled.div`
  display: grid;
  min-height: 0;
  grid-template-columns: minmax(0, 1.15fr) minmax(460px, 0.85fr);

  @media (max-width: 980px) {
    grid-template-columns: minmax(0, 1fr) minmax(390px, 0.9fr);
  }

  @media (max-width: 760px) {
    display: block;
  }
`;

const BrandPanel = styled.aside`
  position: relative;
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  padding: clamp(32px, 4vw, 58px) clamp(32px, 4vw, 64px) 28px;
  background:
    linear-gradient(90deg, rgb(248 252 255 / 95%) 0%, rgb(241 248 255 / 77%) 48%, rgb(236 246 255 / 24%) 100%),
    url('/login/ai-city-hero.png') center bottom / cover no-repeat;

  &::after {
    position: absolute;
    top: 8%;
    right: 0;
    bottom: 10%;
    width: 1px;
    background: linear-gradient(transparent, rgb(255 255 255 / 95%), transparent);
    content: '';
  }

  @media (max-width: 760px) {
    min-height: 310px;
    padding: 30px 28px;
    background-position: center 62%;
  }
`;

const BrandHeader = styled.div`
  display: flex;
  align-items: flex-start;

  img {
    display: block;
    width: clamp(126px, 11vw, 168px);
    height: auto;
    object-fit: contain;
  }
`;

const BrandStory = styled.div`
  max-width: 540px;
  margin-top: clamp(64px, 10vh, 130px);
  color: #152d59;

  h1 {
    margin: 0;
    font-size: clamp(34px, 3.1vw, 52px);
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1.18;
  }

  h2 {
    margin: 18px 0 20px;
    color: #63728a;
    font-size: clamp(17px, 1.45vw, 23px);
    font-weight: 500;
    letter-spacing: 0.04em;
    line-height: 1.5;
  }

  p {
    max-width: 39ch;
    margin: 0;
    color: #43536e;
    font-size: 15px;
    line-height: 1.78;
  }

  @media (max-width: 760px) {
    margin-top: 48px;
    h1 { font-size: 32px; }
    h2 { margin: 10px 0; font-size: 16px; }
    p { display: none; }
  }
`;

const FeatureList = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: auto;
  padding-top: 32px;
  background: linear-gradient(90deg, rgb(255 255 255 / 0%), rgb(255 255 255 / 56%), rgb(255 255 255 / 0%));

  article { min-width: 0; padding: 0 18px; text-align: center; }
  article + article { border-left: 1px solid rgb(116 145 187 / 27%); }
  .feature-icon {
    display: grid;
    width: 58px;
    height: 58px;
    margin: 0 auto 14px;
    place-items: center;
    border-radius: 50%;
    background: rgb(255 255 255 / 69%);
    box-shadow: 0 7px 20px rgb(60 116 190 / 10%);
    color: #2875eb;
  }
  svg { font-size: 30px; }
  b, span { display: block; }
  b { color: #253652; font-size: 14px; font-weight: 650; }
  span { margin-top: 8px; color: #617087; font-size: 12px; line-height: 1.55; white-space: pre-line; }

  @media (max-width: 1060px) { article { padding: 0 9px; } }
  @media (max-width: 760px) { display: none; }
`;

const LoginPanel = styled.section`
  display: grid;
  min-width: 0;
  place-items: center;
  padding: clamp(36px, 5vw, 80px) clamp(28px, 4vw, 64px);
  background: #fff;
`;

const LoginCard = styled.div`
  width: min(100%, 540px);
  padding: clamp(38px, 4.2vw, 66px) clamp(30px, 4vw, 58px);
  background: #fff;

  .ant-form-item { margin-bottom: 22px; }
  .ant-input-affix-wrapper { min-height: 54px; padding-inline: 15px; border-color: #dce3ed; border-radius: 7px; background: #fff; }
  .ant-input-affix-wrapper:hover, .ant-input-affix-wrapper-focused { border-color: #4b89ee; }
  .ant-input-affix-wrapper-focused { box-shadow: 0 0 0 3px rgb(43 115 236 / 13%); }
  .ant-input-prefix, .ant-input-suffix { color: #8995a7; }
  .ant-checkbox-wrapper { color: #33445e; font-size: 14px; }
  .ant-btn-primary {
    height: 54px;
    margin-top: 18px;
    border-radius: 6px;
    background: linear-gradient(90deg, #286ee4, #2d78ef);
    box-shadow: 0 9px 18px rgb(44 112 233 / 23%);
    font-size: 17px;
    font-weight: 650;
  }
  .ant-btn-primary:not(:disabled):hover { background: linear-gradient(90deg, #175fd5, #1d6fe8); }
  @media (max-width: 760px) { padding: 34px 26px; }
`;

const FormHeading = styled.header`
  margin-bottom: 38px;
  text-align: center;
  h2 { margin: 0; color: #1f2c42; font-size: 32px; font-weight: 700; line-height: 1.25; }
  p { margin: 14px 0 0; color: #6f7c90; font-size: 15px; }
`;

const FormTools = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
  button { min-height: 28px; padding: 0; color: #2875e8; font-size: 14px; }
`;

const SecurityNote = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 28px;
  color: #8a96a8;
  font-size: 12px;
  line-height: 1.65;
  svg { flex: 0 0 auto; margin-top: 2px; color: #377ce8; }
`;

const Footer = styled.footer`
  display: flex;
  align-items: center;
  min-height: 46px;
  padding: 10px 30px;
  background: linear-gradient(90deg, #2d3c50, #384a61);
  color: rgb(255 255 255 / 76%);
  font-size: 12px;
  span + span::before { margin: 0 16px; color: rgb(255 255 255 / 37%); content: '|'; }
  @media (max-width: 720px) { justify-content: center; padding: 10px 16px; font-size: 11px; span:not(:first-child) { display: none; } }
`;

export function LoginPage({ onLogin }: LoginPageProps) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(values: LoginPayload) {
    setSubmitting(true);
    setError('');
    try { onLogin(await login(values)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '登录失败'); }
    finally { setSubmitting(false); }
  }

  return (
    <LoginBackground>
      <LoginShell>
        <LoginContent>
          <BrandPanel aria-label="AI 智能用户手册产品介绍">
            <BrandHeader><img src="/logoSingle.png" alt="企业标识" /></BrandHeader>
            <BrandStory><h1>AI 智能用户手册</h1><h2>智能检索 · 精准解答 · 高效协作</h2><p>基于先进的大语言模型与企业知识库，为您提供智能化、个性化的用户手册查询与使用体验，助力企业知识高效流转。</p></BrandStory>
            <FeatureList>{FEATURES.map(({ title, description, icon: Icon }) => <article key={title}><span className="feature-icon"><Icon aria-hidden="true" /></span><b>{title}</b><span>{description}</span></article>)}</FeatureList>
          </BrandPanel>
          <LoginPanel>
            <LoginCard>
              <FormHeading><h2>欢迎登录</h2><p>登录 AI 智能用户手册，探索企业知识</p></FormHeading>
              <Form<LoginPayload> layout="vertical" initialValues={{ username: 'admin' }} onFinish={submit} requiredMark={false}>
                <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}><Input prefix={<UserOutlined />} placeholder="请输入用户名或邮箱" autoComplete="username" autoFocus aria-label="用户名或邮箱" /></Form.Item>
                <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}><Input.Password prefix={<LockOutlined />} iconRender={() => <EyeInvisibleOutlined />} placeholder="请输入密码" autoComplete="current-password" aria-label="密码" /></Form.Item>
                {error && <Alert className="mb-4" type="error" message={error} showIcon role="alert" />}
                <FormTools><Checkbox>记住我</Checkbox><Button type="link" onClick={() => setError('请联系系统管理员重置密码。')}>忘记密码？</Button></FormTools>
                <Button type="primary" htmlType="submit" loading={submitting} block>登录</Button>
              </Form>
              <SecurityNote><SafetyCertificateOutlined aria-hidden="true" /><span>该系统仅供授权人员使用。登录行为将受到企业安全策略保护。</span></SecurityNote>
            </LoginCard>
          </LoginPanel>
        </LoginContent>
        <Footer><span>© 2025 AnyCross. All rights reserved.</span><span>隐私政策</span><span>使用条款</span><span>帮助中心</span></Footer>
      </LoginShell>
    </LoginBackground>
  );
}
