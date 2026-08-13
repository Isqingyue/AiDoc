import {
  BarChartOutlined,
  CheckCircleOutlined,
  CommentOutlined,
  DownloadOutlined,
  LikeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Empty, List, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import styled from 'styled-components';
import type { ApiAnalytics, Notice } from '../../../types';

interface AnalyticsViewProps {
  analytics: ApiAnalytics | null;
  onNotify: (notice: Notice) => void;
  onImprove: () => void;
}

const AnalyticsGrid = styled(Row)`
  .ant-card {
    height: 100%;
    border-color: #e4e8f0;
    box-shadow: 0 2px 10px rgb(27 45 85 / 3%);
  }
`;

export function AnalyticsView({ analytics, onNotify, onImprove }: AnalyticsViewProps) {
  const maxDailyCount = useMemo(
    () => Math.max(...(analytics?.daily_trend.map((item) => item.count) ?? []), 1),
    [analytics?.daily_trend],
  );

  const stats = useMemo(
    () => [
      { title: '总提问次数', value: analytics?.total_questions ?? 0, prefix: <CommentOutlined /> },
      { title: '会话数量', value: analytics?.total_conversations ?? 0, prefix: <UserOutlined /> },
      { title: '有答案率', value: analytics?.answer_rate ?? 0, suffix: '%', prefix: <CheckCircleOutlined /> },
      { title: '回答满意度', value: analytics?.satisfaction_rate ?? 0, suffix: '%', prefix: <LikeOutlined /> },
    ],
    [analytics],
  );

  function exportReport() {
    if (!analytics) {
      onNotify({ type: 'error', message: '暂无可导出的分析数据。' });
      return;
    }

    const rows = [
      ['指标', '数值'],
      ['总提问次数', analytics.total_questions],
      ['总会话', analytics.total_conversations],
      ['有答案率', `${analytics.answer_rate}%`],
      ['满意度', `${analytics.satisfaction_rate}%`],
      ['未命中', analytics.unmatched_count],
      ['差评', analytics.negative_feedback_count],
      [],
      ['高频问题', '次数'],
      ...analytics.frequent_questions.map((item) => [item.question, item.count]),
    ];
    const csv = `\uFEFF${rows
      .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `知问分析-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify({ type: 'success', message: '分析报告已导出。' });
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#e4e8f0] bg-white p-2.5">
        <Space wrap>
          <Tag>全部历史</Tag>
          <Tag>全部知识库</Tag>
          <Typography.Text type="secondary">数据实时读取</Typography.Text>
        </Space>
        <Button className="shrink-0" icon={<DownloadOutlined />} onClick={exportReport}>
          导出报告
        </Button>
      </div>

      <AnalyticsGrid gutter={[14, 14]}>
        {stats.map((stat) => (
          <Col xs={24} sm={12} xl={6} key={stat.title}>
            <Card><Statistic {...stat} /></Card>
          </Col>
        ))}
      </AnalyticsGrid>

      <AnalyticsGrid className="mt-3.5" gutter={[14, 14]}>
        <Col xs={24} xl={15}>
          <Card title={<Space><BarChartOutlined />问答趋势</Space>}>
            {analytics?.daily_trend.length ? (
              analytics.daily_trend.map((item) => (
                <div className="mb-3 grid grid-cols-[42px_1fr] items-center gap-3 last:mb-0" key={item.date}>
                  <Typography.Text>{item.date.slice(5)}</Typography.Text>
                  <Progress
                    percent={Math.round((item.count / maxDailyCount) * 100)}
                    format={() => `${item.count} 次`}
                  />
                </div>
              ))
            ) : <Empty />}
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card title="知识库使用分布">
            <List
              dataSource={analytics?.knowledge_usage ?? []}
              locale={{ emptyText: <Empty /> }}
              renderItem={(item) => (
                <List.Item extra={<Tag color="blue">{item.count} 次</Tag>}>{item.name}</List.Item>
              )}
            />
          </Card>
        </Col>
      </AnalyticsGrid>

      <AnalyticsGrid className="mt-3.5" gutter={[14, 14]}>
        <Col xs={24} xl={15}>
          <Card title="高频问题">
            <List
              dataSource={analytics?.frequent_questions ?? []}
              locale={{ emptyText: <Empty /> }}
              renderItem={(item, index) => (
                <List.Item extra={<Tag>{item.count} 次</Tag>}>
                  <List.Item.Meta
                    avatar={<Tag color={index < 3 ? 'blue' : 'default'}>{index + 1}</Tag>}
                    title={item.question}
                    description="真实问答记录"
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} xl={9}>
          <Card title="需要关注" extra={<Button type="link" onClick={onImprove}>前往知识库</Button>}>
            <Statistic title="未命中问题" value={analytics?.unmatched_count ?? 0} />
            <Statistic className="mt-5" title="收到差评" value={analytics?.negative_feedback_count ?? 0} />
            <Typography.Paragraph className="!mb-0 !mt-5" type="secondary">
              优先分析未命中与差评问题，为对应知识库补充手册章节。
            </Typography.Paragraph>
          </Card>
        </Col>
      </AnalyticsGrid>
    </>
  );
}
