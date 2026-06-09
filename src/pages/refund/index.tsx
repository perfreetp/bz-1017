import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useOrderStore } from '../../store/useOrderStore';
import { RegistrationOrder } from '../../types';
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

  const order: RegistrationOrder | undefined = useMemo(
    () => (orderId ? getOrderById(orderId) : undefined),
    [orderId, getOrderById]
  );

  const [selectedReason, setSelectedReason] = useState('');
  const [remark, setRemark] = useState('');
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = selectedReason && agreePolicy && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !order) return;

    const confirmed = await showModal(
      '确认申请退款',
      `确认申请退款？\n退款金额：¥${order.amount}.00\n退款将在3-7个工作日内原路返回。\n提交后不可撤销。`,
      { confirmText: '确认申请', cancelText: '取消' }
    );

    if (confirmed) {
      setIsSubmitting(true);
      Taro.showLoading({ title: '提交中...' });

      setTimeout(() => {
        Taro.hideLoading();
        submitRefund(order.id, `${selectedReason}: ${remark}`);
        setIsSubmitting(false);
        showToast('退款申请已提交', 'success');

        setTimeout(() => {
          Taro.switchTab({ url: '/pages/orders/index' }).catch(() => {
            navigateTo('/pages/orders/index');
          });
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
          </View>
          <View className={styles.orderMeta}>
            <Text>订单号：{order.orderNo}</Text>
          </View>
          <Text className={styles.orderAmount}>¥{order.amount}.00</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <View className={styles.sectionIcon}>💰</View>
          <Text className={styles.sectionTitle}>退款信息</Text>
        </View>

        <View className={styles.refundInfoGrid}>
          <View className={styles.infoCard}>
            <Text className={styles.infoLabel}>实付金额</Text>
            <Text className={classnames(styles.infoValue, styles.infoValueOrange)}>¥{order.amount}.00</Text>
          </View>
          <View className={styles.infoCard}>
            <Text className={styles.infoLabel}>预计退款</Text>
            <Text className={classnames(styles.infoValue, styles.infoValueOrange)}>¥{order.amount}.00</Text>
          </View>
          <View className={styles.infoCard}>
            <Text className={styles.infoLabel}>支付方式</Text>
            <Text className={styles.infoValue}>微信支付</Text>
          </View>
          <View className={styles.infoCard}>
            <Text className={styles.infoLabel}>处理时长</Text>
            <Text className={classnames(styles.infoValue, styles.infoValueGray)}>3-7工作日</Text>
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
          <Text className={styles.policyItem}>赛前30天以上申请，全额退款</Text>
          <Text className={styles.policyItem}>赛前15-30天申请，退款70%</Text>
          <Text className={styles.policyItem}>赛前7-15天申请，退款50%</Text>
          <Text className={styles.policyItem}>赛前7天内不接受退款申请</Text>
          <Text className={styles.policyItem}>审核通过后3-7个工作日原路退回</Text>
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
          {isSubmitting ? '提交中...' : '提交申请'}
        </View>
      </View>
    </ScrollView>
  );
};

export default RefundPage;
