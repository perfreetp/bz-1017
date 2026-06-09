import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useOrderStore } from '../../store/useOrderStore';
import { RegistrationOrder, OrderStatus } from '../../types';
import { navigateTo } from '../../utils';

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

const statusConfigMap: Record<string, { label: string; desc: string; stepKey: string }> = {
  pending_payment: { label: '待支付', desc: '请在规定时间内完成支付，超时订单将自动取消', stepKey: 'create' },
  paid: { label: '支付成功', desc: '您已完成支付，等待系统提交资料审核', stepKey: 'pay' },
  pending_review: { label: '待审核', desc: '资料已提交，正在排队等待审核员处理', stepKey: 'submit' },
  reviewing: { label: '审核中', desc: '审核员正在核实您的报名资料，请耐心等待', stepKey: 'review' },
  review_passed: { label: '审核通过', desc: '恭喜！您的报名资料已通过审核，祝您取得好成绩！', stepKey: 'done' },
  review_failed: { label: '审核未通过', desc: '资料审核未通过，请根据提示补件或修改信息', stepKey: 'fail' },
  refund_applying: { label: '退款申请中', desc: '您的退款申请正在处理，请等待审核', stepKey: 'pay' },
  refunded: { label: '已退款', desc: '退款已完成，金额将在3-7个工作日原路返回', stepKey: 'pay' }
};

const ReviewPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.orderId || '';

  const getOrderById = useOrderStore((s) => s.getOrderById);
  const order: RegistrationOrder | undefined = useMemo(
    () => (orderId ? getOrderById(orderId) : undefined),
    [orderId, getOrderById]
  );

  const statusConfig = useMemo(() => {
    if (!order) return statusConfigMap.pending_payment;
    return statusConfigMap[order.status] || statusConfigMap.pending_payment;
  }, [order]);

  const steps = useMemo<ReviewStep[]>(() => {
    if (!order) return [];
    const status = order.status;

    const createStep: ReviewStep = {
      key: 'create',
      title: '提交报名',
      active: false,
      done: true,
      time: order.createdAt,
      desc: '报名信息提交成功'
    };

    const payStep: ReviewStep = {
      key: 'pay',
      title: '完成支付',
      active: false,
      done: false,
      time: order.paidAt,
      desc: order.paidAt ? '支付已完成' : '等待支付'
    };

    const submitStep: ReviewStep = {
      key: 'submit',
      title: '资料提交',
      active: false,
      done: false,
      desc: '审核资料已提交'
    };

    const reviewStep: ReviewStep = {
      key: 'review',
      title: '资料审核',
      active: false,
      done: false,
      desc: '审核员正在核实资料'
    };

    let finalStep: ReviewStep | null = null;

    if (status === 'pending_payment') {
      payStep.active = true;
    } else if (status === 'paid' || status === 'pending_review') {
      payStep.done = true;
      submitStep.active = true;
    } else if (status === 'reviewing') {
      payStep.done = true;
      submitStep.done = true;
      reviewStep.active = true;
    } else if (status === 'review_passed') {
      payStep.done = true;
      submitStep.done = true;
      reviewStep.done = true;
      finalStep = {
        key: 'done',
        title: '审核通过',
        active: false,
        done: true,
        desc: order.reviewComment || '资料审核通过，报名成功',
        comment: order.reviewComment,
        time: order.reviewComment ? order.createdAt : undefined
      };
    } else if (status === 'review_failed') {
      payStep.done = true;
      submitStep.done = true;
      reviewStep.failed = true;
      reviewStep.done = true;
      reviewStep.desc = '资料审核未通过';
      reviewStep.comment = order.reviewComment;
    }

    const all: ReviewStep[] = [createStep, payStep, submitStep, reviewStep];
    if (finalStep) all.push(finalStep);
    return all;
  }, [order]);

  const handleResubmit = () => {
    if (!order) return;
    navigateTo(`/pages/register/index?mode=resubmit&orderId=${order.id}`);
  };

  const handleBack = () => {
    Taro.switchTab({ url: '/pages/orders/index' }).catch(() => {
      navigateTo('/pages/orders/index');
    });
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

  const showFooterButtons = order.status === 'review_failed' || order.status === 'reviewing' || order.status === 'pending_review';
  const isFailed = order.status === 'review_failed';

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.headerCard}>
        <Text className={styles.statusLabel}>当前状态</Text>
        <Text className={styles.statusValue}>{statusConfig.label}</Text>
        <Text className={styles.statusDesc}>{statusConfig.desc}</Text>
        <View className={styles.progressRow}>
          <View className={styles.progressItem}>
            <Text className={styles.progressNum}>{steps.filter((s) => s.done).length}</Text>
            <Text className={styles.progressText}>已完成</Text>
          </View>
          <View className={styles.progressItem}>
            <Text className={styles.progressNum}>{steps.filter((s) => s.active).length}</Text>
            <Text className={styles.progressText}>进行中</Text>
          </View>
          <View className={styles.progressItem}>
            <Text className={styles.progressNum}>{steps.length}</Text>
            <Text className={styles.progressText}>总步骤</Text>
          </View>
        </View>
      </View>

      <View className={styles.eventCard}>
        <Image className={styles.eventCover} src={order.eventCover} mode='aspectFill' />
        <View className={styles.eventInfo}>
          <Text className={styles.eventTitle}>{order.eventTitle}</Text>
          <View className={styles.eventMeta}>
            <Text>组别：{order.groupName}</Text>
          </View>
          <View className={styles.eventMeta}>
            <Text>金额：¥{order.amount}.00</Text>
            {order.isTeamRegistration && (
              <Text style={{ marginLeft: 16 }}>团队：{order.teamName}</Text>
            )}
          </View>
          <Text className={styles.orderNo}>订单号：{order.orderNo}</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <View className={styles.sectionIcon}>📈</View>
          <Text className={styles.sectionTitle}>审核流程</Text>
        </View>

        <View className={styles.stepList}>
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const lineActive = step.done || step.active;
            return (
              <View key={step.key}>
                {!isLast && (
                  <View
                    className={classnames(styles.stepLine, lineActive && styles.stepLineActive)}
                    style={{ top: 48, bottom: -20 }}
                  />
                )}
                <View className={styles.stepItem}>
                  <View
                    className={classnames(
                      styles.stepCircle,
                      step.active && styles.stepCircleActive,
                      step.done && !step.failed && !step.active && styles.stepCircleDone,
                      step.failed && styles.stepCircleFailed
                    )}
                  >
                    {step.done && !step.failed ? '✓' : step.failed ? '✕' : idx + 1}
                  </View>
                  <View className={styles.stepContent}>
                    <Text
                      className={classnames(
                        styles.stepTitle,
                        step.active && styles.stepTitleActive,
                        step.done && !step.failed && !step.active && styles.stepTitleDone,
                        step.failed && styles.stepTitleFailed
                      )}
                    >
                      {step.title}
                    </Text>
                    {step.time && <Text className={styles.stepTime}>{step.time}</Text>}
                    {step.desc && <Text className={styles.stepDesc}>{step.desc}</Text>}
                    {step.comment && (
                      <View className={classnames(styles.commentBox, step.failed && styles.commentBoxFail)}>
                        <Text className={classnames(styles.commentLabel, step.failed && styles.commentLabelFail)}>
                          {step.failed ? '未通过原因' : '审核备注'}
                        </Text>
                        <Text className={classnames(styles.commentText, step.failed && styles.commentTextFail)}>
                          {step.comment}
                        </Text>
                      </View>
                    )}
                    {isFailed && idx === 3 && order.reviewMaterials && order.reviewMaterials.length > 0 && (
                      <View className={styles.materialBox}>
                        {order.reviewMaterials.map((m) => (
                          <Text key={m} className={styles.materialTag}>需补：{m}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <View className={styles.sectionIcon}>👤</View>
          <Text className={styles.sectionTitle}>参赛信息</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>姓名</Text>
          <Text className={styles.infoValue}>{order.runnerInfo?.name || '--'}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>身份证末4位</Text>
          <Text className={styles.infoValue}>{order.runnerInfo?.idCardLast4 || '--'}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>手机号</Text>
          <Text className={styles.infoValue}>{order.runnerInfo?.phone || '--'}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>T恤尺码</Text>
          <Text className={styles.infoValue}>{order.runnerInfo?.shirtSize || '--'}码</Text>
        </View>
        {order.bibNumber && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>参赛号</Text>
            <Text className={styles.infoValue}>{order.bibNumber}</Text>
          </View>
        )}
        {order.isTeamRegistration && order.teamName && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>团队名称</Text>
            <Text className={styles.infoValue}>{order.teamName}</Text>
          </View>
        )}
      </View>

      {order.status === 'reviewing' && (
        <View style={{ margin: '0 24rpx 24rpx' }}>
          <View className={styles.tipBox}>
            <Text className={styles.tipText}>
              💡 资料审核通常需要1-3个工作日。如遇周末或节假日，审核时间可能延长，请耐心等待。
            </Text>
          </View>
        </View>
      )}

      {showFooterButtons && (
        <View className={styles.footerBar}>
          <View className={classnames(styles.footerBtn, styles.footerBtnSecondary)} onClick={handleBack}>
            返回列表
          </View>
          {isFailed ? (
            <View className={classnames(styles.footerBtn, styles.footerBtnPrimary)} onClick={handleResubmit}>
              补件重提
            </View>
          ) : (
            <View
              className={classnames(styles.footerBtn, styles.footerBtnPrimary)}
              onClick={() => navigateTo(`/pages/assistant/index?orderId=${order.id}`)}
            >
              参赛助手
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default ReviewPage;
