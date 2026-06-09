import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useOrderStore } from '../../store/useOrderStore';
import { RegistrationOrder, OrderStatus, PaymentRecord, TeamMember } from '../../types';
import { getStatusText, navigateTo } from '../../utils';

interface ReviewStep {
  key: string;
  title: string;
  active: boolean;
  done: boolean;
  failed?: boolean;
  time?: string;
  desc?: string;
  comment?: string;
}

const statusColorMap: Partial<Record<OrderStatus, { title: string; tip: string; icon?: string }>> = {
  pending_payment: { title: '待支付', tip: '请在30分钟内完成支付，超时订单自动取消', icon: '⏳' },
  paid: { title: '支付成功', tip: '支付已确认，即将进入审核队列', icon: '✅' },
  pending_review: { title: '待审核', tip: '资料已提交，即将由工作人员进行审核', icon: '📦' },
  reviewing: { title: '审核中', tip: '资料审核中，预计1-3个工作日完成', icon: '🔍' },
  review_passed: { title: '审核通过', tip: '恭喜！资料审核已通过', icon: '🎉' },
  review_failed: { title: '审核未通过', tip: '资料审核未通过，请按要求补充或修改资料', icon: '⚠️' },
  refund_applying: { title: '退款申请中', tip: '您的退款申请已提交，将在3-7个工作日处理', icon: '💸' },
  refunded: { title: '已退款', tip: '退款已完成，款项已原路退回', icon: '💰' },
  refund_rejected: { title: '退款被拒绝', tip: '退款申请未通过，您可继续参赛', icon: '❌' },
  cancelled: { title: '订单已取消', tip: '订单已取消，欢迎下次报名', icon: '🚫' }
};

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.orderId || '';
  const getOrderById = useOrderStore((s) => s.getOrderById);
  const _orders = useOrderStore((s) => s.orders);

  // 订阅整个orders以响应状态更新
  useDidShow(() => {
    console.log('[OrderDetail] didShow, orderId:', orderId);
  });

  const order: RegistrationOrder | undefined = useMemo(
    () => (orderId ? getOrderById(orderId) : undefined),
    [orderId, getOrderById, _orders]
  );

  const statusInfo = order ? (statusColorMap[order.status] || { title: getStatusText(order.status), tip: '订单状态正常' }) : null;

  const reviewSteps = useMemo<ReviewStep[]>(() => {
    if (!order) return [];
    const steps: ReviewStep[] = [
      { key: 'submit', title: '提交报名', done: true, active: false, time: order.createdAt, desc: '报名信息已提交' }
    ];
    if (order.status !== 'pending_payment' && order.status !== 'cancelled') {
      steps.push({
        key: 'pay',
        title: '完成支付',
        done: true,
        active: false,
        time: order.paidAt,
        desc: `¥${order.amount.toFixed(2)} 支付成功`
      });
    }
    if (['pending_review', 'reviewing', 'review_passed', 'review_failed', 'refund_applying', 'refunded'].includes(order.status)) {
      steps.push({
        key: 'materials',
        title: '资料提交',
        done: true,
        active: false,
        time: order.paidAt,
        desc: order.paymentRecords ? '报名资料完整' : '等待提交资料'
      });
    }
    if (['reviewing', 'review_passed', 'review_failed', 'refund_applying', 'refunded'].includes(order.status)) {
      steps.push({
        key: 'review',
        title: '资料审核',
        done: ['review_passed', 'review_failed', 'refund_applying', 'refunded'].includes(order.status),
        active: order.status === 'reviewing',
        time: order.status === 'reviewing' ? undefined : order.paidAt,
        desc: order.status === 'reviewing' ? '审核人员正在处理您的资料...' : '资料审核完成'
      });
    }
    if (order.status === 'review_passed') {
      steps.push({
        key: 'passed',
        title: '审核通过',
        done: true,
        active: false,
        time: order.paidAt,
        desc: order.reviewComment || '资料审核通过，祝您参赛顺利！'
      });
    }
    if (order.status === 'review_failed') {
      steps.push({
        key: 'failed',
        title: '审核未通过',
        done: true,
        failed: true,
        active: false,
        desc: order.reviewComment,
        comment: order.reviewMaterials?.join('、')
      });
    }
    if (order.status === 'refund_applying' || order.status === 'refunded') {
      steps.push({
        key: 'refund',
        title: order.status === 'refunded' ? '退款已完成' : '退款处理中',
        done: order.status === 'refunded',
        active: order.status === 'refund_applying',
        desc: order.status === 'refunded' ? '款项已原路退回' : '预计3-7个工作日内完成退款'
      });
    }
    return steps;
  }, [order]);

  const memberStatusStyle = (status: TeamMember['status']) => {
    const map: Record<string, string> = {
      registered: '',
      pending: styles.statusPending,
      paid: styles.statusPaid
    };
    return map[status] || styles.statusPending;
  };

  const memberStatusText = (status: TeamMember['status']) => {
    const map: Record<string, string> = {
      registered: '已报名',
      pending: '待支付',
      paid: '已支付'
    };
    return map[status] || '--';
  };

  const methodInfo = (m: PaymentRecord) => {
    if (m.method === 'wechat') return { icon: '💚', label: '微信支付', cls: styles.payIconWechat };
    if (m.method === 'alipay') return { icon: '💙', label: '支付宝', cls: styles.payIconAlipay };
    return { icon: '↩️', label: '退款', cls: styles.payIconRefund };
  };

  const statusTagText = (s: PaymentRecord['status']) => {
    const map = { success: '成功', pending: '处理中', failed: '失败' };
    return map[s] || '--';
  };

  // ====== 操作按钮 ======
  const handleBack = () => {
    Taro.switchTab({ url: '/pages/orders/index' }).catch(() => {
      navigateTo('/pages/orders/index');
    });
  };

  const handlePay = () => {
    if (!order) return;
    const base = `/pages/payment/index?orderId=${order.id}&eventId=${order.eventId}&groupId=${order.groupId}&mode=${order.isTeamRegistration ? 'team' : 'single'}`;
    if (order.isTeamRegistration) {
      navigateTo(
        `${base}&teamName=${encodeURIComponent(order.teamName || '')}&memberCount=${order.teamMemberCount || order.teamMembers?.length || 1}&totalAmount=${order.amount}`
      );
    } else {
      navigateTo(base);
    }
  };

  const handleReview = () => {
    if (!order) return;
    navigateTo(`/pages/review/index?orderId=${order.id}`);
  };

  const handleResubmit = () => {
    if (!order) return;
    navigateTo(`/pages/register/index?mode=resubmit&orderId=${order.id}`);
  };

  const handleRefund = () => {
    if (!order) return;
    navigateTo(`/pages/refund/index?orderId=${order.id}`);
  };

  const handleAssistant = () => {
    if (!order) return;
    navigateTo(`/pages/assistant/index?orderId=${order.id}`);
  };

  const renderFooter = () => {
    if (!order) return null;
    const buttons: { key: string; text: string; onClick: () => void; cls: string }[] = [];
    const backBtn = { key: 'back', text: '返回列表', onClick: handleBack, cls: styles.btnSecondary };

    if (order.status === 'pending_payment') {
      buttons.push({ ...backBtn, cls: backBtn.cls });
      buttons.unshift({ key: 'pay', text: '立即支付', onClick: handlePay, cls: styles.btnPrimary });
    } else if (order.status === 'review_failed') {
      buttons.push({ ...backBtn });
      buttons.unshift({ key: 'resubmit', text: '补件上传', onClick: handleResubmit, cls: styles.btnPrimary });
    } else if (order.status === 'review_passed') {
      buttons.push({ ...backBtn });
      buttons.unshift({ key: 'assistant', text: '参赛助手', onClick: handleAssistant, cls: styles.btnPrimary });
    } else if (['paid', 'pending_review', 'reviewing'].includes(order.status)) {
      buttons.push({ key: 'refund', text: '申请退款', onClick: handleRefund, cls: styles.btnDanger });
      buttons.push({ key: 'progress', text: '审核进度', onClick: handleReview, cls: styles.btnPrimary });
    } else if (order.status === 'refund_applying') {
      buttons.push({ ...backBtn });
      buttons.unshift({ key: 'progress', text: '查看进度', onClick: handleReview, cls: styles.btnPrimary });
    } else {
      buttons.push({ ...backBtn });
    }

    return (
      <View className={classnames(styles.footerBar, buttons.length > 1 ? styles.twoBtns : styles.singleBtn)}>
        {buttons.map((b) => (
          <View key={b.key} className={classnames(styles.footerBtn, b.cls)} onClick={b.onClick}>
            <Text>{b.text}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (!order) {
    return (
      <ScrollView className={styles.page} scrollY>
        <View style={{ padding: 120, textAlign: 'center' }}>
          <Text style={{ color: '#718096' }}>订单不存在</Text>
        </View>
        {renderFooter()}
      </ScrollView>
    );
  }

  return (
    <ScrollView className={styles.page} scrollY>
      {/* ===== 顶部状态卡 ===== */}
      <View className={styles.statusHeader}>
        <View className={styles.statusIcon}>
          <View className={styles.statusDot} />
          <Text>{statusInfo?.icon} {statusInfo?.title}</Text>
        </View>
        <View className={styles.statusTitle}>
          <Text>{statusInfo?.tip}</Text>
        </View>
        <View className={styles.statusExtra}>
          <Text>订单号 {order.orderNo}</Text>
          <Text>下单 {order.createdAt}</Text>
        </View>
      </View>

      {/* ===== 赛事信息 ===== */}
      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionIcon}>🏃</Text>
          <Text className={styles.sectionTitle}>赛事信息</Text>
        </View>
        <View className={styles.eventRow}>
          <Image className={styles.eventCover} src={order.eventCover} mode="aspectFill" />
          <View className={styles.eventInfo}>
            <Text className={styles.eventTitle}>{order.eventTitle}</Text>
            <Text className={styles.groupTag}>{order.groupName}</Text>
            <View className={styles.eventMeta}>
              {order.isTeamRegistration && (
                <Text className={styles.eventMetaItem}>
                  👥 {order.teamName || '团队'} · {order.teamMemberCount || order.teamMembers?.length || 1}人
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* ===== 报名资料 ===== */}
      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionIcon}>📝</Text>
          <Text className={styles.sectionTitle}>报名资料</Text>
        </View>
        <View className={styles.infoGrid}>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>姓名</Text>
            <Text className={styles.infoValue}>{order.runnerInfo?.name || '--'}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>证件后4位</Text>
            <Text className={styles.infoValue}>****{order.runnerInfo?.idCardLast4 || '--'}</Text>
          </View>
          {order.runnerInfo?.gender && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>性别</Text>
              <Text className={styles.infoValue}>{order.runnerInfo.gender}</Text>
            </View>
          )}
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>手机号</Text>
            <Text className={styles.infoValue}>{order.runnerInfo?.phone || '--'}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>参赛组别</Text>
            <Text className={classnames(styles.infoValue, styles.infoValueHighlight)}>{order.groupName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>T恤尺码</Text>
            <Text className={styles.infoValue}>{order.runnerInfo?.shirtSize || '--'}</Text>
          </View>
          {order.bibNumber && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>参赛号</Text>
              <Text className={classnames(styles.infoValue, styles.infoValueHighlight)}>
                {order.bibNumber}
              </Text>
            </View>
          )}
          {order.status === 'review_failed' && order.reviewComment && (
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>未通过原因</Text>
              <Text className={classnames(styles.infoValue, styles.failedTag)} style={{ color: '#E74C3C' }}>
                {order.reviewComment}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ===== 团队成员 ===== */}
      {order.isTeamRegistration && order.teamMembers && order.teamMembers.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>👥</Text>
            <Text className={styles.sectionTitle}>团队成员清单</Text>
          </View>
          <View className={styles.teamHeader}>
            <Text className={styles.teamName}>{order.teamName || '团队'}</Text>
            <Text className={styles.teamCount}>
              共 {order.teamMemberCount || order.teamMembers.length} 人
            </Text>
          </View>
          {order.teamMembers.map((m, i) => (
            <View key={m.id} className={styles.memberCard}>
              <View className={styles.memberAvatar}>{m.name.charAt(0)}</View>
              <View className={styles.memberInfo}>
                <View className={styles.memberName}>
                  <Text>{m.name}</Text>
                  {i === 0 && <Text className={styles.leaderBadge}>队长</Text>}
                  <Text className={classnames(styles.statusBadge, memberStatusStyle(m.status))}>
                    {memberStatusText(m.status)}
                  </Text>
                </View>
                <View className={styles.memberDetail}>
                  {m.phone} · T恤 {m.shirtSize}码
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ===== 支付记录 ===== */}
      {(order.paymentRecords && order.paymentRecords.length > 0) || order.status !== 'pending_payment' ? (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>💳</Text>
            <Text className={styles.sectionTitle}>支付/退款记录</Text>
          </View>
          {order.paymentRecords && order.paymentRecords.length > 0 ? (
            order.paymentRecords.map((p) => {
              const mi = methodInfo(p);
              return (
                <View key={p.id} className={styles.payRecord}>
                  <View className={classnames(styles.payIcon, mi.cls)}>{mi.icon}</View>
                  <View className={styles.payContent}>
                    <View className={styles.payTitle}>
                      <View className={styles.payTitleText}>
                        <Text>{mi.label}</Text>
                        <Text
                          className={classnames(
                            styles.payStatusTag,
                            p.status === 'pending' && styles.payStatusPending
                          )}
                        >
                          {statusTagText(p.status)}
                        </Text>
                      </View>
                      <Text
                        className={classnames(
                          styles.payAmount,
                          p.method === 'refund' ? styles.payAmountIn : styles.payAmountOut
                        )}
                      >
                        {p.method === 'refund' ? '+' : '-'}¥{p.amount.toFixed(2)}
                      </Text>
                    </View>
                    <View className={styles.payMeta}>
                      <Text>{p.paidAt || p.refundedAt || '--'}</Text>
                      {p.transactionNo && <Text>单号 {p.transactionNo}</Text>}
                    </View>
                    {p.remark && (
                      <View className={styles.payMeta}>
                        <Text>备注：{p.remark}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={{ padding: '24rpx 0', textAlign: 'center' }}>
              <Text style={{ color: '#A0AEC0', fontSize: 24 }}>暂无支付记录</Text>
            </View>
          )}
          <View className={styles.infoGrid} style={{ marginTop: 24 }}>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>应付金额</Text>
              <Text className={styles.infoValue}>¥{order.amount.toFixed(2)}</Text>
            </View>
            {order.refundAmount !== undefined && (
              <View className={styles.infoRow}>
                <Text className={styles.infoLabel}>已退款</Text>
                <Text className={classnames(styles.infoValue, styles.infoValueHighlight)}>
                  ¥{order.refundAmount.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : null}

      {/* ===== 审核进度时间线 ===== */}
      {reviewSteps.length > 0 && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>📊</Text>
            <Text className={styles.sectionTitle}>审核进度</Text>
            <Text className={styles.sectionArrow} onClick={handleReview}>查看详情 ›</Text>
          </View>
          <View className={styles.timeline}>
            {reviewSteps.map((step) => (
              <View key={step.key} className={styles.timelineStep}>
                <View
                  className={classnames(
                    styles.timelineDot,
                    step.done && !step.failed && styles.timelineDotDone,
                    step.active && styles.timelineDotActive,
                    step.failed && styles.timelineDotFailed
                  )}
                />
                <View className={styles.timelineContent}>
                  <View
                    className={classnames(
                      styles.timelineTitle,
                      step.done && !step.active && !step.failed && styles.timelineTitleDone,
                      step.failed && styles.timelineTitleFailed
                    )}
                  >
                    <Text>{step.title}</Text>
                  </View>
                  {step.time && (
                    <View className={styles.timelineTime}>
                      <Text>{step.time}</Text>
                    </View>
                  )}
                  {step.desc && (
                    <View className={styles.timelineDesc}>
                      <Text>{step.desc}</Text>
                    </View>
                  )}
                  {step.comment && (
                    <View className={styles.failedTag}>
                      需补充：{step.comment}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ===== 参赛信息（审核通过时展示） ===== */}
      {order.status === 'review_passed' && order.bibNumber && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>🎫</Text>
            <Text className={styles.sectionTitle}>参赛信息</Text>
          </View>
          <View className={styles.infoGrid}>
            <View className={styles.infoRow}>
              <Text className={styles.infoLabel}>参赛号</Text>
              <Text className={classnames(styles.infoValue, styles.infoValueHighlight)} style={{ fontSize: 32 }}>
                {order.bibNumber}
              </Text>
            </View>
            {order.pickupInfo && (
              <>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>领物日期</Text>
                  <Text className={styles.infoValue}>{order.pickupInfo.date}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>领物时间</Text>
                  <Text className={styles.infoValue}>{order.pickupInfo.time}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>领物地点</Text>
                  <Text className={styles.infoValue}>{order.pickupInfo.location}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>展台号</Text>
                  <Text className={styles.infoValue}>{order.pickupInfo.booth}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {renderFooter()}
    </ScrollView>
  );
};

export default OrderDetailPage;
