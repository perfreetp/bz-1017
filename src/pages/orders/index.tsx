import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useOrderStore } from '../../store/useOrderStore';
import OrderCard from '../../components/OrderCard';
import SectionHeader from '../../components/SectionHeader';
import EmptyState from '../../components/EmptyState';
import { OrderStatus, RegistrationOrder } from '../../types';
import { showToast } from '../../utils';

const TABS = [
  { key: 'all', label: '全部', statuses: null },
  { key: 'pending', label: '待处理', statuses: ['pending_payment', 'review_failed'] },
  { key: 'reviewing', label: '审核中', statuses: ['paid', 'pending_review', 'reviewing'] },
  { key: 'completed', label: '已完成', statuses: ['review_passed', 'refunded', 'refund_applying', 'refund_rejected', 'cancelled'] }
];

const OrdersPage: React.FC = () => {
  const orders = useOrderStore((s) => s.orders);
  const [activeTab, setActiveTab] = useState('all');

  const filteredOrders = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    if (!tab || !tab.statuses) return orders;
    return orders.filter((o) => tab.statuses!.includes(o.status));
  }, [orders, activeTab]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) =>
      ['pending_payment', 'review_failed'].includes(o.status)
    ).length;
    const reviewing = orders.filter((o) =>
      ['paid', 'pending_review', 'reviewing'].includes(o.status)
    ).length;
    const passed = orders.filter((o) => o.status === 'review_passed').length;
    return { total, pending, reviewing, passed };
  }, [orders]);

  const handleRefresh = () => {
    console.log('[Orders] refresh');
    setTimeout(() => {
      try {
        if (typeof Taro.stopPullDownRefresh === 'function') {
          Taro.stopPullDownRefresh();
        }
      } catch (e) {
        // ignore
      }
      showToast('刷新成功', 'success');
    }, 800);
  };

  useEffect(() => {
    try {
      if (typeof Taro.onPullDownRefresh === 'function') {
        Taro.onPullDownRefresh(handleRefresh);
      }
    } catch (e) {
      console.warn('[Orders] onPullDownRefresh not supported');
    }
    return () => {
      try {
        if (typeof Taro.offPullDownRefresh === 'function') {
          Taro.offPullDownRefresh(handleRefresh);
        }
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const getCurrentStep = (order: RegistrationOrder): number => {
    const map: Record<OrderStatus, number> = {
      pending_payment: 1,
      paid: 2,
      pending_review: 3,
      reviewing: 3,
      review_passed: 4,
      review_failed: 3,
      refund_applying: 2,
      refunded: 1,
      refund_rejected: 1,
      cancelled: 0
    };
    return map[order.status] || 0;
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>我的报名</Text>
        <Text className={styles.headerSubtitle}>管理您的所有赛事订单</Text>
      </View>

      <View className={styles.statsBar}>
        <View className={styles.statItem}>
          <Text className={styles.statNum}>{stats.total}</Text>
          <Text className={styles.statLabel}>全部订单</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={classnames(styles.statNum, styles.orange)}>{stats.pending}</Text>
          <Text className={styles.statLabel}>待处理</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={classnames(styles.statNum, styles.blue)}>{stats.reviewing}</Text>
          <Text className={styles.statLabel}>审核中</Text>
        </View>
        <View className={styles.statDivider} />
        <View className={styles.statItem}>
          <Text className={classnames(styles.statNum, styles.green)}>{stats.passed}</Text>
          <Text className={styles.statLabel}>已通过</Text>
        </View>
      </View>

      <View className={styles.tabs}>
        {TABS.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.tab, activeTab === tab.key && styles.tabActive)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.content}>
        <SectionHeader title='报名进度说明' icon='📊' />
        <View className={styles.progressBar}>
          {['提交报名', '完成支付', '资料审核', '参赛准备'].map((step, idx) => {
            const activeIdx = idx + 1;
            return (
              <View key={step} className={styles.progressStep}>
                <View
                  className={classnames(
                    styles.stepCircle,
                    1 >= activeIdx && styles.stepCircleActive,
                    2 >= activeIdx + 0.5 && styles.stepCircleDone
                  )}
                >
                  {activeIdx < 1 ? idx + 1 : '✓'}
                </View>
                <Text className={styles.stepText}>{step}</Text>
                {idx < 3 && (
                  <View
                    className={classnames(
                      styles.stepLine,
                      activeIdx < 2 && styles.stepLineActive
                    )}
                  />
                )}
              </View>
            );
          })}
        </View>

        <SectionHeader title={`订单列表（${filteredOrders.length}）`} icon='📋' style={{ marginTop: 32 }} />

        <ScrollView className={styles.orderList} scrollY>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <EmptyState
              icon='�'
              title='暂无订单'
              desc='去赛事首页挑选一场心仪的赛事报名吧！'
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
};

export default OrdersPage;
