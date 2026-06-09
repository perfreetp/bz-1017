import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useOrderStore } from '../../store/useOrderStore';
import { RegistrationOrder, TeamMember } from '../../types';
import { showToast, showModal, navigateTo } from '../../utils';

const refundReasons = [
  { value: 'schedule', label: '行程冲突，无法参加' },
  { value: 'injury', label: '意外受伤/身体不适' },
  { value: 'duplicate', label: '重复报名/误操作' },
  { value: 'event_change', label: '赛事安排变动' },
  { value: 'other', label: '其他原因' }
];

const RefundPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.orderId || '';

  const getOrderById = useOrderStore((s) => s.getOrderById);
  const submitRefund = useOrderStore((s) => s.submitRefund);
  const _orders = useOrderStore((s) => s.orders);

  const order: RegistrationOrder | undefined = useMemo(
    () => (orderId ? getOrderById(orderId) : undefined),
    [orderId, getOrderById, _orders]
  );

  const isTeamOrder = order?.isTeamRegistration || false;
  const memberCount = order?.teamMemberCount || order?.teamMembers?.length || 1;
  const unitPrice = isTeamOrder ? (order?.amount || 0) / memberCount : order?.amount || 0;
  const alreadyRefunded = order?.refundAmount || 0;
  const remaining = (order?.amount || 0) - alreadyRefunded;

  const [refundMode, setRefundMode] = useState<'full' | 'member'>('full');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [selectedReason, setSelectedReason] = useState('');
  const [remark, setRemark] = useState('');
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleMember = (memberId: string) => {
    const m = order?.teamMembers?.find((x) => x.id === memberId);
    if (!m || (m.refundStatus && ['applying', 'completed'].includes(m.refundStatus))) return;
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const refundAmount = useMemo(() => {
    if (!order) return 0;
    if (refundMode === 'full') return remaining;
    return Math.min(selectedMembers.size * unitPrice, remaining);
  }, [refundMode, selectedMembers, unitPrice, remaining, order]);

  const policyLines = useMemo(() => {
    const lines = [
      '赛前30天以上申请，全额退款',
      '赛前15-30天申请，退款70%',
      '赛前7-15天申请，退款50%',
      '赛前7天内不接受退款申请',
      '审核通过后3-7个工作日原路退回'
    ];
    if (order?.status === 'review_passed') {
      lines.unshift('⚠️ 本订单已审核通过，如临近赛期可能产生已产生费用扣除');
    }
    if (order?.status === 'reviewing' || order?.status === 'paid' || order?.status === 'pending_review') {
      lines.unshift('✅ 审核中订单退款通道优先处理，通常1-2个工作日完成');
    }
    if (isTeamOrder) {
      lines.unshift('👥 团队订单支持「整单退款」或「成员单独退款」');
      lines.unshift('💡 单个成员退款后，团队剩余成员名额保持有效');
    }
    return lines;
  }, [order, isTeamOrder]);

  const canSubmit = selectedReason && agreePolicy && !isSubmitting && refundAmount > 0
    && (refundMode === 'full' || selectedMembers.size > 0);

  const handleSubmit = async () => {
    if (!canSubmit || !order) return;

    const modeText = refundMode === 'full' ? '整单' : `成员(${selectedMembers.size}人)`;
    const confirmed = await showModal(
      '确认申请退款',
      `模式：${modeText}\n退款金额：¥${refundAmount.toFixed(2)}\n将在3-7个工作日原路返回，提交后不可撤销。`,
      { confirmText: '确认申请', cancelText: '取消' }
    );

    if (confirmed) {
      setIsSubmitting(true);
      Taro.showLoading({ title: '提交中...' });

      setTimeout(() => {
        Taro.hideLoading();
        submitRefund(
          order.id,
          `${refundReasons.find((r) => r.value === selectedReason)?.label}: ${remark}`,
          refundMode,
          refundMode === 'member' ? [...selectedMembers] : undefined
        );
        setIsSubmitting(false);
        showToast('退款申请已提交', 'success');

        setTimeout(() => {
          navigateTo(`/pages/orderDetail/index?orderId=${order.id}&anchor=refund`);
        }, 1500);
      }, 1000);
    }
  };

  if (!order) {
    return (
      <ScrollView className={styles.page} scrollY>
        <View style={{ padding: 100, textAlign: 'center' }}>
          <Text style={{ color: '#718096' }}>订单不存在</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.orderCard}>
        <Image className={styles.orderCover} src={order.eventCover} mode='aspectFill' />
        <View className={styles.orderInfo}>
          <Text className={styles.orderTitle}>{order.eventTitle}</Text>
          <View className={styles.orderMeta}>
            <Text>组别：{order.groupName}</Text>
            {isTeamOrder && (
              <Text className={styles.teamBadge}>团队 · {memberCount}人</Text>
            )}
          </View>
          <View className={styles.orderMeta}>
            <Text>订单号：{order.orderNo}</Text>
          </View>
          <Text className={styles.orderAmount}>¥{order.amount}.00</Text>
        </View>
      </View>

      {isTeamOrder && (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionIcon}>👥</View>
            <Text className={styles.sectionTitle}>退款模式</Text>
          </View>
          <View className={styles.modeTabs}>
            <View
              className={classnames(styles.modeTab, refundMode === 'full' && styles.modeTabActive)}
              onClick={() => setRefundMode('full')}
            >
              <Text className={styles.modeTabTitle}>整单退款</Text>
              <Text className={styles.modeTabDesc}>
                ¥{remaining.toFixed(2)} · 全部成员
              </Text>
            </View>
            <View
              className={classnames(styles.modeTab, refundMode === 'member' && styles.modeTabActive)}
              onClick={() => setRefundMode('member')}
            >
              <Text className={styles.modeTabTitle}>成员退款</Text>
              <Text className={styles.modeTabDesc}>
                ¥{(selectedMembers.size * unitPrice).toFixed(2)} · 选中{selectedMembers.size}人
              </Text>
            </View>
          </View>

          {refundMode === 'member' && order.teamMembers && (
            <View className={styles.memberList}>
              {order.teamMembers.map((m) => {
                const disabled = m.refundStatus === 'applying' || m.refundStatus === 'completed';
                const checked = selectedMembers.has(m.id);
                return (
                  <View
                    key={m.id}
                    className={classnames(
                      styles.memberItem,
                      checked && !disabled && styles.memberItemActive,
                      disabled && styles.memberItemDisabled
                    )}
                    onClick={() => !disabled && toggleMember(m.id)}
                  >
                    <View
                      className={classnames(
                        styles.memberCheckbox,
                        checked && !disabled && styles.memberCheckboxChecked,
                        disabled && styles.memberCheckboxDisabled
                      )}
                    >
                      {checked && !disabled && <Text style={{ color: '#fff', fontSize: 22 }}>✓</Text>}
                    </View>
                    <View className={styles.memberMain}>
                      <View className={styles.memberName}>
                        <Text>{m.name}</Text>
                        {m.id === (order.teamMembers && order.teamMembers[0]?.id) && (
                          <Text className={styles.leaderBadgeMini}>队长</Text>
                        )}
                      </View>
                      <View className={styles.memberMeta}>
                        <Text>{m.phone} · T恤{m.shirtSize}</Text>
                      </View>
                    </View>
                    <View className={styles.memberStatus}>
                      {m.refundStatus === 'applying' && <Text className={styles.statusRefunding}>退款中</Text>}
                      {m.refundStatus === 'completed' && <Text className={styles.statusRefunded}>已退款</Text>}
                      {m.refundStatus === 'rejected' && <Text className={styles.statusRejected}>被拒绝</Text>}
                      {(!m.refundStatus || m.refundStatus === 'none') && <Text className={styles.statusAvail}>可退¥{unitPrice.toFixed(0)}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <View className={styles.sectionIcon}>💰</View>
          <Text className={styles.sectionTitle}>退款信息</Text>
        </View>

        <View className={styles.refundInfoGrid}>
          <View className={styles.infoCard}>
            <Text className={styles.infoLabel}>实付金额</Text>
            <Text className={classnames(styles.infoValue, styles.infoValueOrange)}>¥{order.amount.toFixed(2)}</Text>
          </View>
          {alreadyRefunded > 0 && (
            <View className={styles.infoCard}>
              <Text className={styles.infoLabel}>已退款</Text>
              <Text className={classnames(styles.infoValue, styles.infoValueGreen)}>¥{alreadyRefunded.toFixed(2)}</Text>
            </View>
          )}
          <View className={styles.infoCard}>
            <Text className={styles.infoLabel}>本次退款</Text>
            <Text className={classnames(styles.infoValue, styles.infoValueOrange)} style={{ fontSize: 32, fontWeight: 600 }}>
              ¥{refundAmount.toFixed(2)}
            </Text>
          </View>
          <View className={styles.infoCard}>
            <Text className={styles.infoLabel}>预计到账</Text>
            <Text className={classnames(styles.infoValue, styles.infoValueGray)}>7个工作日内</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <View className={styles.sectionIcon}>📝</View>
          <Text className={styles.sectionTitle}>退款原因</Text>
        </View>

        <View className={styles.reasonSectionTitle}>请选择退款原因</View>
        <View className={styles.reasonList}>
          {refundReasons.map((reason) => (
            <View
              key={reason.value}
              className={classnames(styles.reasonItem, selectedReason === reason.value && styles.reasonItemActive)}
              onClick={() => setSelectedReason(reason.value)}
            >
              <View className={classnames(styles.reasonRadio, selectedReason === reason.value && styles.reasonRadioActive)}>
                {selectedReason === reason.value && <View className={styles.reasonRadioInner} />}
              </View>
              <Text className={styles.reasonText}>{reason.label}</Text>
            </View>
          ))}
        </View>

        <View className={styles.formLabel}>补充说明（可选）</View>
        <Textarea
          className={styles.formTextarea}
          placeholder='请详细描述您的退款原因，以便我们更快处理'
          value={remark}
          onInput={(e) => setRemark(e.detail.value)}
          maxlength={200}
        />
      </View>

      <View className={styles.section}>
        <View className={styles.policyBox}>
          <Text className={styles.policyTitle}>📋 退款政策</Text>
          {policyLines.map((line, i) => (
            <Text key={i} className={styles.policyItem}>{line}</Text>
          ))}
        </View>
      </View>

      <View style={{ margin: '0 24rpx 24rpx' }}>
        <View className={styles.tipBox}>
          <Text className={styles.tipText}>
            ⚠️ 温馨提示：提交退款申请后，您的报名资格将被取消。如审核通过后，将无法撤销或恢复报名，请谨慎操作。
          </Text>
        </View>
      </View>

      <View className={styles.footerBar}>
        <View className={styles.agreeBox}>
          <View
            className={classnames(styles.checkbox, agreePolicy && styles.checkboxChecked)}
            onClick={() => setAgreePolicy(!agreePolicy)}
          >
            {agreePolicy && <Text className={styles.checkIcon}>✓</Text>}
          </View>
          <Text className={styles.agreeText}>
            我已阅读并同意<Text className={styles.agreeTextHighlight}>《退款政策》</Text>
          </Text>
        </View>
        <View
          className={classnames(styles.submitBtn, !canSubmit && styles.submitBtnDisabled)}
          onClick={handleSubmit}
        >
          {isSubmitting ? '提交中...' : `申请退款 ¥${refundAmount.toFixed(2)}`}
        </View>
      </View>
    </ScrollView>
  );
};

export default RefundPage;
