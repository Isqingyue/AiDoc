import { Dropdown } from 'antd';
import {
  Books,
  ChartBar,
  ChatCircleDots,
  List,
  SignOut,
  UserCircle,
  UsersThree,
} from '@phosphor-icons/react';
import styled from 'styled-components';
import type { ApiUser, View } from '../../types';
import { BrandMark } from '../ui/BrandMark';

interface AppHeaderProps {
  view: View;
  onChangeView: (view: View) => void;
  onOpenHistory: () => void;
  user: ApiUser;
  onLogout: () => void;
}

interface NavigationItem {
  key: Exclude<View, 'manuals'>;
  label: string;
  icon: typeof ChatCircleDots;
}

const NAV_ITEMS: NavigationItem[] = [
  { key: 'chat', label: '智能问答', icon: ChatCircleDots },
  { key: 'knowledge', label: '知识库', icon: Books },
  { key: 'analytics', label: '分析', icon: ChartBar },
  { key: 'users', label: '用户', icon: UsersThree },
];

const Header = styled.header`
  grid-column: 1;
  grid-row: 1;
  display: flex;
  width: 92px;
  height: 100dvh;
  flex-direction: column;
  align-items: center;
  padding: 16px 10px 14px;
  border-right: 1px solid #e6eaf1;
  background: #fff;
  box-shadow: 2px 0 12px rgb(31 48 84 / 3%);

  @media (max-width: 780px) {
    position: fixed;
    inset: auto 0 0;
    z-index: 50;
    width: 100%;
    height: 64px;
    flex-direction: row;
    padding: 5px 10px;
    border-top: 1px solid #e5e8ef;
    border-right: 0;
    box-shadow: 0 -2px 12px rgb(31 48 84 / 5%);
  }
`;

const BrandButton = styled.button`
  display: grid;
  width: 52px;
  height: 52px;
  flex: 0 0 auto;
  place-items: center;
  margin-bottom: 20px;
  padding: 0;
  border: 0;
  border-radius: 15px;
  background: #f5f7fb;
  cursor: pointer;

  .brand-mark {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    box-shadow: 0 7px 18px rgb(53 109 243 / 22%);
  }

  &:hover {
    background: #edf3ff;
  }

  @media (max-width: 780px) {
    display: none;
  }
`;

const MobileHistoryButton = styled.button`
  display: none;

  @media (max-width: 780px) {
    display: grid;
    width: 42px;
    height: 42px;
    flex: 0 0 auto;
    place-items: center;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: #59667c;
    cursor: pointer;

    svg {
      width: 22px;
      height: 22px;
    }
  }
`;

const Navigation = styled.nav`
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: stretch;
  gap: 7px;

  @media (max-width: 780px) {
    height: 54px;
    flex: 1;
    flex-direction: row;
    gap: 2px;
  }
`;

const NavigationButton = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  width: 100%;
  height: 64px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 3px;
  border: 0;
  border-radius: 13px;
  background: ${({ $active }) => ($active ? '#edf3ff' : 'transparent')};
  color: ${({ $active }) => ($active ? '#356df3' : '#657187')};
  font-size: 12px;
  font-weight: ${({ $active }) => ($active ? 650 : 500)};
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;

  svg {
    width: 25px;
    height: 25px;
    flex: 0 0 auto;
    stroke-width: ${({ $active }) => ($active ? 2.1 : 1.8)};
  }

  &::before {
    position: absolute;
    top: 18px;
    bottom: 18px;
    left: -10px;
    width: 3px;
    border-radius: 0 4px 4px 0;
    background: ${({ $active }) => ($active ? '#356df3' : 'transparent')};
    content: '';
  }

  &:hover {
    background: ${({ $active }) => ($active ? '#e8f0ff' : '#f5f7fb')};
    color: #356df3;
  }

  @media (max-width: 780px) {
    height: 54px;
    flex: 1;
    gap: 3px;
    padding: 4px 2px;
    border-radius: 9px;
    font-size: 10px;

    svg {
      width: 20px;
      height: 20px;
    }

    &::before {
      top: auto;
      right: 30%;
      bottom: -5px;
      left: 30%;
      width: auto;
      height: 3px;
      border-radius: 4px 4px 0 0;
    }
  }
`;

const AccountArea = styled.div`
  width: 100%;
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid #edf0f5;

  @media (max-width: 780px) {
    display: none;
  }
`;

const AccountButton = styled.button`
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 7px 2px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #657187;
  cursor: pointer;

  &:hover {
    background: #f5f7fb;
    color: #356df3;
  }
`;

const AccountAvatar = styled.span`
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  overflow: hidden;
  border: 1px solid #d8dff0;
  border-radius: 12px;
  background: linear-gradient(145deg, #6847d8, #5030bd);
  box-shadow: 0 6px 14px rgb(80 48 189 / 18%);
  color: #fff;

  svg {
    width: 24px;
    height: 24px;
  }
`;

const AccountName = styled.span`
  display: block;
  max-width: 66px;
  overflow: hidden;
  font-size: 10px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

function getRoleLabel(role: ApiUser['role']) {
  if (role === 'system_admin') return '系统管理员';
  if (role === 'knowledge_admin') return '知识库管理员';
  return '普通用户';
}

export function AppHeader({ view, onChangeView, onOpenHistory, user, onLogout }: AppHeaderProps) {
  const items = user.role === 'user'
    ? NAV_ITEMS.filter((item) => item.key === 'chat')
    : NAV_ITEMS;
  const selectedKey = view === 'manuals' ? 'knowledge' : view;

  return (
    <Header>
      <MobileHistoryButton type="button" onClick={onOpenHistory} aria-label="打开会话列表">
        <List />
      </MobileHistoryButton>
      <BrandButton type="button" onClick={() => onChangeView('chat')} aria-label="返回智能问答">
        <BrandMark />
      </BrandButton>
      <Navigation aria-label="主导航">
        {items.map((item) => {
          const Icon = item.icon;
          const active = selectedKey === item.key;
          return (
            <NavigationButton
              $active={active}
              type="button"
              key={item.key}
              onClick={() => onChangeView(item.key)}
              aria-current={active ? 'page' : undefined}
            >
              <Icon weight={active ? 'duotone' : 'regular'} />
              <span>{item.label}</span>
            </NavigationButton>
          );
        })}
      </Navigation>
      <AccountArea>
        <Dropdown
          menu={{
            items: [
              { key: 'identity', label: `${user.name} · ${getRoleLabel(user.role)}`, disabled: true },
              { type: 'divider' },
              { key: 'logout', icon: <SignOut />, label: '退出登录', onClick: onLogout },
            ],
          }}
          trigger={['click']}
          placement="topLeft"
        >
          <AccountButton type="button" aria-label={`打开用户菜单，当前用户 ${user.name}`}>
            <AccountAvatar><UserCircle weight="regular" /></AccountAvatar>
            <AccountName>{user.name}</AccountName>
          </AccountButton>
        </Dropdown>
      </AccountArea>
    </Header>
  );
}
