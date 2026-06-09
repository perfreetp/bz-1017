import React from 'react';
import { View, Text, Image, Button } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { RegistrationOrder } from '../../types';
import StatusTag from '../StatusTag';
import { getStatusText, navigateTo } from '../../utils';

interface OrderCardProps {
  order: RegistrationOrder;
  onStatusChange?: () => void;
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

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const handleCardClick = () => {
    console.log('[OrderCard] click order:', order.id);
    navigateTo(`/pages/review/index?orderId=${order.id}`);
  };

  const handlePay = (e) => {
    e.stopPropagation();
    const baseUrl = `/pages/payment/index?orderId=${order.id}&eventId=${order.eventId}&groupId=${order.groupId}&mode=${order.isTeamRegistration ? 'team' : 'single'}`;
    if (order.isTeamRegistration) {
      navigateTo(
        `${baseUrl}&teamName=${encodeURIComponent(order.teamName || '')}&memberCount=${order.teamMemberCount || order.teamMembers?.length || 1}&totalAmount=${order.amount}`
      );
    } else {
      navigateTo(baseUrl);
    }
  };

  const handleRefund = (e) => {
    e.stopPropagation();
    navigateTo(`/pages/refund/index?orderId=${order.id}`);
  };

  const handleUpload = (e) => {
    e.stopPropagation();
    navigateTo(`/pages/register/index?mode=resubmit&orderId=${order.id}`);
  };

  const handleAssistant = (e) => {
    e.stopPropagation();
    navigateTo(`/pages/assistant/index?orderId=${order.id}`);
  };

  const handleProgress = (e) => {
    e.stopPropagation();
    navigateTo(`/pages/review/index?orderId=${order.id}`);
  };

  const renderActions = () => {
    const actions: React.ReactNode[] = [];

    actions.push(
      <Button key="progress" className={classnames(styles.actionBtn, styles.btnOutline)} onClick={handleProgress}>
        <Text>审核进度</Text>
      </Button>
    );

    if (order.status === 'pending_payment') {
      actions.unshift(
        <Button key="pay" className={classnames(styles.actionBtn, styles.btnPrimary)} onClick={handlePay}>
          <Text>立即支付</Text>
        </Button>
      );
    }

    if (order.status === 'review_failed' && order.reviewMaterials) {
      actions.unshift(
        <Button key="upload" className={classnames(styles.actionBtn, styles.btnPrimary)} onClick={handleUpload}>
          <Text>补件上传</Text>
        </Button>
      );
    }

    if (order.status === 'review_passed') {
      actions.unshift(
        <Button key="assistant" className={classnames(styles.actionBtn, styles.btnPrimary)} onClick={handleAssistant}>
          <Text>参赛助手</Text>
        </Button>
      );
    }

    if (['paid', 'pending_review', 'reviewing'].includes(order.status)) {
      actions.push(
        <Button key="refund" className={classnames(styles.actionBtn, styles.btnOutlineGray)} onClick={handleRefund}>
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
            <Text>{order.runnerInfo?.name || '--'}</Text>
            <Text className={styles.separator}>·</Text>
            <Text>T恤 {order.runnerInfo?.shirtSize || '--'}</Text>
            {order.isTeamRegistration && (
              <>
                <Text className={styles.separator}>·</Text>
                <Text className={styles.teamTag}>{order.teamName}</Text>
                <Text className={styles.separator}>·</Text>
                <Text className={styles.teamSizeTag}>👥 {order.teamMemberCount || order.teamMembers?.length || 1}人</Text>
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
