import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { RegistrationOrder } from '../../types';
import StatusTag from '../StatusTag';
import { getStatusText, navigateTo, showModal } from '../../utils';

interface OrderCardProps {
  order: RegistrationOrder;
  onPay?: (orderId: string) => void;
  onRefund?: (orderId: string) => void;
  onUploadMaterial?: (orderId: string) => void;
  onAssistant?: (orderId: string) => void;
}

const statusTypeMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  pending_payment: 'warning',
  paid: 'info',
  pending_review: 'warning',
  reviewing: 'info',
  review_passed: 'success',
  review_failed: 'error',
  refund_applying: 'info',
  refunded: 'default',
  refund_rejected: 'error',
  cancelled: 'default'
};

const OrderCard: React.FC<OrderCardProps> = ({ order, onPay, onRefund, onUploadMaterial, onAssistant }) => {
  const handleCardClick = () => {
    console.log('[OrderCard] click order:', order.id);
    // 订单详情页暂使用提示
  };

  const handlePay = (e) => {
    e.stopPropagation();
    onPay?.(order.id);
  };

  const handleRefund = async (e) => {
    e.stopPropagation();
    const confirmed = await showModal('申请退款', '确认申请退款吗？退款将收取30%手续费，款项将在7-15个工作日原路返回。', {
      confirmText: '确认退款',
      cancelText: '取消'
    });
    if (confirmed) {
      onRefund?.(order.id);
    }
  };

  const handleUpload = (e) => {
    e.stopPropagation();
    onUploadMaterial?.(order.id);
  };

  const handleAssistant = (e) => {
    e.stopPropagation();
    onAssistant?.(order.id);
  };

  const renderActions = () => {
    const actions: React.ReactNode[] = [];

    if (order.status === 'pending_payment') {
      actions.push(
        <Button key="pay" className={classnames(styles.actionBtn, styles.btnPrimary)} onClick={handlePay}>
          <Text>立即支付</Text>
        </Button>
      );
    }

    if (order.status === 'review_failed' && order.reviewMaterials) {
      actions.push(
        <Button key="upload" className={classnames(styles.actionBtn, styles.btnPrimary)} onClick={handleUpload}>
          <Text>补件上传</Text>
        </Button>
      );
    }

    if (order.status === 'review_passed') {
      actions.push(
        <Button key="assistant" className={classnames(styles.actionBtn, styles.btnPrimary)} onClick={handleAssistant}>
          <Text>参赛助手</Text>
        </Button>
      );
    }

    if (['paid', 'pending_review', 'reviewing'].includes(order.status)) {
      actions.push(
        <Button key="refund" className={classnames(styles.actionBtn, styles.btnOutline)} onClick={handleRefund}>
          <Text>申请退款</Text>
        </Button>
      );
    }

    return actions;
  };

  return (
    <View className={styles.card} onClick={handleCardClick}>
      <View className={styles.header}>
        <View className={styles.orderNo}>
          <Text className={styles.orderNoLabel}>订单号：</Text>
          <Text className={styles.orderNoValue}>{order.orderNo}</Text>
        </View>
        <StatusTag type={statusTypeMap[order.status]} text={getStatusText(order.status)} />
      </View>

      <View className={styles.eventInfo}>
        <Image className={styles.eventCover} src={order.eventCover} mode="aspectFill" />
        <View className={styles.eventDetail}>
          <Text className={styles.eventTitle}>{order.eventTitle}</Text>
          <Text className={styles.groupName}>{order.groupName}</Text>
          <View className={styles.runnerInfo}>
            <Text>{order.runnerInfo.name}</Text>
            <Text className={styles.separator}>·</Text>
            <Text>T恤 {order.runnerInfo.shirtSize}</Text>
            {order.isTeamRegistration && (
              <>
                <Text className={styles.separator}>·</Text>
                <Text className={styles.teamTag}>{order.teamName}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {order.status === 'review_failed' && order.reviewComment && (
        <View className={styles.failNotice}>
          <Text className={styles.failIcon}>⚠️</Text>
          <Text className={styles.failText}>{order.reviewComment}</Text>
        </View>
      )}

      {order.status === 'review_passed' && order.bibNumber && (
        <View className={styles.bibNotice}>
          <Text className={styles.bibLabel}>参赛号</Text>
          <Text className={styles.bibValue}>{order.bibNumber}</Text>
        </View>
      )}

      <View className={styles.footer}>
        <View className={styles.amountWrapper}>
          <Text className={styles.amountLabel}>订单金额</Text>
          <Text className={styles.amountValue}>¥{order.amount.toFixed(2)}</Text>
        </View>
        <View className={styles.actions}>{renderActions()}</View>
      </View>
    </View>
  );
};

export default OrderCard;
