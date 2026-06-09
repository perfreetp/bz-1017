import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockOrders } from '../../data/orders';
import OrderCard from '../../components/OrderCard';
import EmptyState from '../../components/EmptyState';
import { RegistrationOrder, OrderStatus } from '../../types';
import { showToast, navigateTo, showModal } from '../../utils';

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '进行中' },
  { key: 'passed', label: '已完成' }
];

const pendingStatuses: OrderStatus[] = ['pending_payment', 'review_failed'];
const processingStatuses: OrderStatus[] = ['paid', 'pending_review', 'reviewing', 'refund_applying'];
const passedStatuses: OrderStatus[] = ['review_passed', 'refunded', 'refund_rejected', 'cancelled'];

const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<RegistrationOrder[]>(mockOrders);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    if (activeTab === 'pending') return orders.filter((o) => pendingStatuses.includes(o.status));
    if (activeTab === 'processing') return orders.filter((o) => processingStatuses.includes(o.status));
    if (activeTab === 'passed') return orders.filter((o) => passedStatuses.includes(o.status));
    return orders;
  }, [orders, activeTab]);

  const pendingCount = orders.filter((o) => pendingStatuses.includes(o.status)).length;
  const processingCount = orders.filter((o) => processingStatuses.includes(o.status)).length;
  const passedCount = orders.filter((o) => o.status === 'review_passed').length;
  const totalAmount = orders
    .filter((o) => ['paid', 'pending_review', 'reviewing', 'review_passed'].includes(o.status))
    .reduce((sum, o) => sum + o.amount, 0);

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

  const handlePay = (orderId: string) => {
    console.log('[Orders] pay order:', orderId);
    showModal('支付确认', '确认使用微信支付 ¥200.00？', { confirmText: '立即支付' }).then((res) => {
      if (res) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: 'reviewing' as OrderStatus, paidAt: new Date().toISOString() } : o))
        );
        showToast('支付成功', 'success');
      }
    });
  };

  const handleRefund = (orderId: string) => {
    console.log('[Orders] refund order:', orderId);
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'refund_applying' as OrderStatus } : o))
    );
    showToast('退款申请已提交', 'success');
  };

  const handleUploadMaterial = (orderId: string) => {
    console.log('[Orders] upload material for order:', orderId);
    navigateTo(`/pages/register/index?mode=resubmit&orderId=${orderId}`);
  };

  const handleAssistant = (orderId: string) => {
    console.log('[Orders] open assistant for order:', orderId);
    Taro.switchTab({ url: '/pages/assistant/index' }).catch((err) => console.error(err));
  };

  React.useEffect(() => {
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

  const getStepProgress = (order: RegistrationOrder) => {
    const statusStepMap: Record<OrderStatus, number> = {
      pending_payment: 1,
      paid: 2,
      pending_review: 2,
      reviewing: 2,
      review_failed: 2,
      review_passed: 4,
      refund_applying: 3,
      refunded: 4,
      refund_rejected: 2,
      cancelled: 4
    };
    return statusStepMap[order.status] || 1;
  };

  const stepLabels = ['提交报名', '完成支付', '资料审核', '参赛准备'];

  return (
    <ScrollView scrollY className={styles.page} style={{ height: '100vh' }}>
      <View className="pageContainer">
        <View className={styles.statsCard}>
          <View className={styles.statCol}>
            <Text className={styles.statNum}>{orders.length}</Text>
            <Text className={styles.statDesc}>总报名数</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={styles.statNum}>¥{totalAmount}</Text>
            <Text className={styles.statDesc}>累计缴费</Text>
          </View>
          <View className={styles.statCol}>
            <Text className={styles.statNum}>{passedCount}</Text>
            <Text className={styles.statDesc}>审核通过</Text>
          </View>
        </View>

        <View className={styles.tabs}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const badge =
              tab.key === 'pending' && pendingCount > 0 ? pendingCount : tab.key === 'processing' && processingCount > 0 ? processingCount : 0;
            return (
              <View
                key={tab.key}
                className={classnames(styles.tabItem, isActive && styles.active)}
                onClick={() => setActiveTab(tab.key)}
              >
                <Text className={styles.tabText}>
                  {tab.label}
                  {badge > 0 && <Text className={styles.tabBadge}>{badge}</Text>}
                </Text>
              </View>
            );
          })}
        </View>

        <View className={styles.list}>
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <View key={order.id}>
                {['paid', 'pending_review', 'reviewing'].includes(order.status) && (
                  <View className={styles.stepWrapper}>
                    <View className={styles.stepHeader}>
                      <View>
                        <Text className={styles.stepTitle}>报名进度</Text>
                        <Text className={styles.stepSubtitle}>预计1-3个工作日完成审核</Text>
                      </View>
                    </View>
                    <View className={styles.steps}>
                      <View className={styles.stepConnector}>
                        <View
                          className={styles.stepConnectorFill}
                          style={{ width: `${((getStepProgress(order) - 1) / (stepLabels.length - 1)) * 100}%` }}
                        />
                      </View>
                      {stepLabels.map((label, idx) => {
                        const stepNum = idx + 1;
                        const progress = getStepProgress(order);
                        const isDone = stepNum < progress;
                        const isCurrent = stepNum === progress;
                        return (
                          <View key={label} className={styles.stepNode}>
                            <View
                              className={classnames(
                                styles.stepDot,
                                isDone && styles.done,
                                isCurrent && styles.current
                              )}
                            >
                              {isDone ? '✓' : stepNum}
                            </View>
                            <Text className={classnames(styles.stepLabel, (isDone || isCurrent) && styles.active)}>
                              {label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
                <OrderCard
                  order={order}
                  onPay={handlePay}
                  onRefund={handleRefund}
                  onUploadMaterial={handleUploadMaterial}
                  onAssistant={handleAssistant}
                />
              </View>
            ))
          ) : (
            <EmptyState
              icon="📋"
              title="暂无报名记录"
              description="快去首页看看有哪些精彩的赛事吧"
              actionText="浏览赛事"
              onAction={() => Taro.switchTab({ url: '/pages/home/index' })}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default OrdersPage;
