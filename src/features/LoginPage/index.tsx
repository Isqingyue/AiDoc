import {
  CheckCircleFilled,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Alert, Button, Form, Input } from 'antd';
import { useState } from 'react';
import styled from 'styled-components';
import { login, type LoginPayload } from '../../api/auth';
import { BrandMark } from '../../components/ui/BrandMark';
import type { ApiUser } from '../../types';

interface LoginPageProps {
  onLogin: (user: ApiUser) => void;
}

const BENEFITS = [
  '基于已发布手册生成回答',
  '每条答案均可追溯引用原文',
  '企业数据在受控环境中处理',
];

const LoginBackground = styled.main`
  position: relative;
  min-height: 100dvh;
  overflow: hidden;
  background:
    radial-gradient(circle at 8% 8%, #eaf0ff 0, transparent 30%),
    radial-gradient(circle at 92% 92%, #edf3ff 0, transparent 28%),
    #f5f7fb;

  &::before {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(#356df307 1px, transparent 1px),
      linear-gradient(90deg, #356df307 1px, transparent 1px);
    background-size: 32px 32px;
    content: '';
    mask-image: linear-gradient(to bottom right, #0005, transparent 65%);
    pointer-events: none;
  }
`;

const LoginShell = styled.section`
  position: relative;
  z-index: 1;
  box-shadow: 0 30px 90px #20315b1c;
`;

const BrandPanel = styled.aside`
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, #285bd8 0%, #356df3 52%, #5b85f5 100%);

  &::after {
    position: absolute;
    right: -100px;
    bottom: -135px;
    width: 360px;
    height: 360px;
    border: 1px solid #ffffff24;
    border-radius: 50%;
    box-shadow: 0 0 0 55px #ffffff08, 0 0 0 110px #ffffff07;
    content: '';
  }
`;

const LoginFormArea = styled.div`
  .ant-form-item {
    margin-bottom: 22px;
  }

  .ant-form-item-label {
    padding-bottom: 8px;
  }

  .ant-form-item-label > label {
    color: #344056;
    font-size: 13px;
    font-weight: 650;
  }

  .ant-input-affix-wrapper {
    height: 48px;
    padding-inline: 14px;
    border-color: #dfe4ed;
    border-radius: 9px;
    background: #fbfcfe;
  }

  .ant-input-affix-wrapper:hover,
  .ant-input-affix-wrapper-focused {
    border-color: #648bf4;
    background: #fff;
  }

  .ant-input-affix-wrapper-focused {
    box-shadow: 0 0 0 3px #356df312;
  }

  .ant-input-prefix {
    margin-inline-end: 10px;
    color: #8b97aa;
  }

  .ant-btn-lg {
    height: 48px;
    margin-top: 4px;
    border-radius: 9px;
    box-shadow: 0 8px 20px #356df32c;
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
    <LoginBackground className="grid place-items-center p-10">
      <LoginShell className="grid min-h-[610px] w-full max-w-[980px] grid-cols-[1.05fr_0.95fr] overflow-hidden rounded-[22px] border border-slate-200 bg-white">
        <BrandPanel className="flex min-w-0 flex-col p-12 text-white" aria-label="产品介绍">
          <div className="absolute top-[180px] -left-20 size-[260px] rounded-full bg-blue-300/20 blur-[35px]" />

          <div className="relative z-10 flex items-center gap-3">
            <BrandMark />
            <div className="flex flex-col">
              <b className="text-[21px]">知问</b>
              <span className="mt-0.5 text-[11px] text-blue-100">AI 智能用户手册</span>
            </div>
          </div>

          <div className="relative z-10 my-auto">
            <span className="mb-[17px] inline-block rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] text-blue-50">
              企业知识，从此触手可及
            </span>
            <h1 className="m-0 text-[38px] leading-[1.35] font-bold tracking-[-1px] text-white">
              让每一本手册
              <br />
              都成为可靠答案
            </h1>
            <p className="mt-[22px] max-w-[390px] text-[13px] leading-[1.9] text-blue-100">
              统一管理业务知识，快速检索可信内容，让团队随时获得准确、可追溯的操作指引。
            </p>
          </div>

          <ul className="relative z-10 m-0 grid list-none gap-3 p-0">
            {BENEFITS.map((benefit) => (
              <li className="flex items-center gap-2 text-xs text-blue-50" key={benefit}>
                <CheckCircleFilled className="text-blue-200" />
                {benefit}
              </li>
            ))}
          </ul>
        </BrandPanel>

        <LoginFormArea className="flex flex-col justify-center px-[54px] pt-[62px] pb-11">
          <div className="mb-8">
            <span className="mb-2 block text-xs font-semibold text-[#356df3]">欢迎回来</span>
            <h2 className="m-0 text-[27px] leading-[1.35] font-bold text-slate-800">登录您的账号</h2>
            <p className="mt-2 text-xs text-slate-400">请输入管理员分配的内部账号信息</p>
          </div>

          <Form<LoginPayload>
            layout="vertical"
            initialValues={{ username: 'admin' }}
            onFinish={submit}
            requiredMark={false}
          >
            <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" autoComplete="username" autoFocus />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
            </Form.Item>
            {error && <Alert className="mb-5" type="error" message={error} showIcon />}
            <Button type="primary" htmlType="submit" loading={submitting} block size="large">
              登录
            </Button>
          </Form>

          <div className="mt-7 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-[10px] text-slate-400">
            <SafetyCertificateOutlined className="text-blue-400" />
            <span>仅限企业内部账号访问，请妥善保管登录凭据</span>
          </div>
        </LoginFormArea>
      </LoginShell>
    </LoginBackground>
  );
}
