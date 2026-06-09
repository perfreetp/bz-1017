import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useOrderStore, generateOrderNo, maskPhone, maskIdCard } from '../../store/useOrderStore';
import { mockEvents } from '../../data/events';
import { mockUser, shirtSizes } from '../../data/user';
import { MarathonEvent, EventGroup, RegistrationOrder, TeamMember } from '../../types';
import { showToast, navigateTo } from '../../utils';

type PaymentMode = 'single' | 'team';
type PayMethod = 'wechat' | 'alipay';

const PaymentPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.orderId || '';
  const eventId = router.params.eventId || '';
  const groupId = router.params.groupId || '';
  const mode = (router.params.mode as PaymentMode) || 'single';
  const teamNameParam = router.params.teamName || '';
  const memberCountParam = Number(router.params.memberCount || '1');
  const totalAmountParam = Number(router.params.totalAmount || '0');

  const addOrder = useOrderStore((s) => s.addOrder);
  const markOrderPaid = useOrderStore((s) => s.markOrderPaid);
  const getOrderById = useOrderStore((s) => s.getOrderById);
  const updateTeamMembers = useOrderStore((s) => s.updateTeamMembers);

  const existingOrder = orderId ? getOrderById(orderId) : undefined;

  const event: MarathonEvent = useMemo(
    () => mockEvents.find((e) => e.id === eventId) || mockEvents.find((e) => e.id === existingOrder?.eventId) || mockEvents[0],
    [eventId, existingOrder]
  );

  const group: EventGroup | undefined = useMemo(() => {
    if (existingOrder) {
      return event.groups.find((g) => g.id === existingOrder.groupId);
    }
    return event.groups.find((g) => g.id === groupId) || event.groups[0];
  }, [event, groupId, existingOrder]);

  const unitPrice = group?.price || 0;
  const isTeamOrder = existingOrder?.isTeamRegistration || mode === 'team';

  const finalAmount = existingOrder?.amount
    || totalAmountParam
    || (isTeamOrder ? unitPrice * memberCountParam : unitPrice);

  const finalMemberCount = existingOrder?.isTeamRegistration
    ? (existingOrder.teamMemberCount || existingOrder.teamMembers?.length || 1)
    : (mode === 'team' ? memberCountParam : 1);

  const finalTeamName = existingOrder?.teamName || teamNameParam || '';

  const [payMethod, setPayMethod] = useState<PayMethod>('wechat');
  const [countdown, setCountdown] = useState(30 * 60);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const teamMembers = useMemo<TeamMember[]>(() => {
    if (existingOrder?.isTeamRegistration && existingOrder.teamMembers && existingOrder.teamMembers.length > 0) {
      console.log('[Payment] use store teamMembers:', existingOrder.teamMembers.length);
      return existingOrder.teamMembers;
    }
    if (mode === 'team' && memberCountParam > 1) {
      return [
        { id: 'self', name: mockUser.realName, phone: mockUser.phone, status: 'pending', shirtSize: mockUser.shirtSize },
        ...Array.from({ length: memberCountParam - 1 }, (_, i) => ({
          id: `m${i}`,
          name: `成员${i + 1}`,
          phone: `138****${String(1000 + i).padStart(4, '0')}`,
          status: 'pending' as const,
          shirtSize: shirtSizes[(i + 2) % shirtSizes.length]?.value || 'L'
        }))
      ];
    }
    return [
      { id: 'self', name: mockUser.realName, phone: mockUser.phone, status: 'pending', shirtSize: mockUser.shirtSize }
    ];
  }, [mode, existingOrder, memberCountParam]);

  const memberStatusStyle = (status: string) => {
    const map: Record<string, { bg: string; text: string; color: string }> = {
      registered: { bg: '#EBF8FF', text: '已报名', color: '#3182CE' },
      pending: { bg: '#FFFAF0', text: '待支付', color: '#DD6B20' },
      paid: { bg: '#F0FFF4', text: '已支付', color: '#38A169' }
    };
    return map[status] || map.pending;
  };

  const handlePay = async () => {
    if (isPaying) return;
    if (countdown <= 0) {
      showToast('支付超时，请重新下单', 'none');
      return;
    }

    setIsPaying(true);
    Taro.showLoading({ title: payMethod === 'wechat' ? '调起微信支付...' : '调起支付宝支付...' });

    setTimeout(() => {
      Taro.hideLoading();

      let targetOrderId = orderId;
      if (!existingOrder) {
        const finalMembers: TeamMember[] = isTeamOrder
          ? teamMembers.map((m) => ({ ...m, status: 'pending' as const }))
          : [];

        const newOrder: RegistrationOrder = {
          id: `o${Date.now()}`,
          orderNo: generateOrderNo(event.id),
          eventId: event.id,
          eventTitle: event.title,
          eventCover: event.coverImage,
          groupId: group?.id || '',
          groupName: group?.name || '',
          amount: finalAmount,
          status: 'pending_payment',
          createdAt: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
          runnerInfo: {
            name: mockUser.realName,
            idCardLast4: maskIdCard(mockUser.idCardNumber),
            shirtSize: mockUser.shirtSize,
            phone: maskPhone(mockUser.phone)
          },
          isTeamRegistration: isTeamOrder,
          teamName: isTeamOrder ? (finalTeamName || '我的团队') : undefined,
          teamMemberCount: isTeamOrder ? finalMemberCount : undefined,
          teamMembers: isTeamOrder ? finalMembers : undefined,
          lockedFields: []
        };
        addOrder(newOrder);
        targetOrderId = newOrder.id;
      }

      setTimeout(() => {
        if (targetOrderId) {
          markOrderPaid(targetOrderId);
        }
        showToast('支付成功！', 'success');

        setTimeout(() => {
          Taro.switchTab({ url: '/pages/orders/index' }).catch(() => {
            navigateTo('/pages/orders/index');
          });
        }, 1500);
      }, 500);
    }, 1500);
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.eventCard}>
        <Image className={styles.eventCover} src={event.coverImage} mode='aspectFill' />
        <View className={styles.eventInfo}>
          <Text className={styles.eventTitle}>{event.title}</Text>
          <View className={styles.eventMeta}>
            <Text>{event.location} · {event.date}</Text>
          </View>
          <View>
            <Text className={styles.groupTag}>{group?.name}</Text>
            {existingOrder?.isTeamRegistration && (
              <Text className={styles.teamTag}>团队</Text>
            )}
          </View>
        </View>
      </View>

      {countdown > 0 && (
        <View style={{ margin: '0 24rpx 24rpx' }}>
          <View className={styles.countdown}>
            <Text className={styles.countdownText}>请在</Text>
            <Text className={styles.countdownValue}>{formatCountdown(countdown)}</Text>
            <Text className={styles.countdownText}> 内完成支付，超时订单自动取消</Text>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <View className={styles.sectionIcon}>📋</View>
          <Text className={styles.sectionTitle}>订单信息</Text>
        </View>

        <View className={styles.orderRow}>
          <Text className={styles.orderLabel}>订单号</Text>
          <Text className={styles.orderValue}>{existingOrder?.orderNo || '生成中...'}</Text>
        </View>
        <View className={styles.orderRow}>
          <Text className={styles.orderLabel}>报名类型</Text>
          <Text className={styles.orderValue}>{isTeamOrder ? '团队报名' : '个人报名'}</Text>
        </View>
        {isTeamOrder && (
          <View className={styles.orderRow}>
            <Text className={styles.orderLabel}>团队名称</Text>
            <Text className={styles.orderValue}>{finalTeamName || '--'}</Text>
          </View>
        )}
        <View className={styles.orderRow}>
          <Text className={styles.orderLabel}>参赛人数</Text>
          <Text className={styles.orderValue}>{finalMemberCount} 人</Text>
        </View>
        <View className={styles.orderRow}>
          <Text className={styles.orderLabel}>报名单价</Text>
          <Text className={styles.orderValue}>¥{unitPrice}.00 / 人</Text>
        </View>
        <View className={styles.orderRow}>
          <Text className={styles.orderLabel}>应付金额</Text>
          <Text className={classnames(styles.orderValue, styles.orderValueHighlight)}>¥{finalAmount}.00</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <View className={styles.sectionIcon}>👥</View>
          <Text className={styles.sectionTitle}>
            {isTeamOrder ? '团队成员' : '参赛人员'}
          </Text>
        </View>

        {teamMembers.map((member, index) => {
          const style = memberStatusStyle(member.status);
          return (
            <View key={member.id} className={styles.runnerCard}>
              <View className={styles.runnerAvatar}>
                {member.name.charAt(0)}
              </View>
              <View className={styles.runnerInfo}>
                <View className={styles.runnerName}>
                  {member.name}
                  {index === 0 && <Text className={styles.leaderBadge}>队长</Text>}
                  {isTeamOrder && (
                    <Text className={styles.memberStatusBadge} style={{ background: style.bg, color: style.color }}>
                      {style.text}
                    </Text>
                  )}
                </View>
                <View className={styles.runnerDetail}>
                  {member.phone} · T恤 {member.shirtSize}码
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <View className={styles.sectionIcon}>💳</View>
          <Text className={styles.sectionTitle}>支付方式</Text>
        </View>

        <View className={styles.payMethodList}>
          <View
            className={classnames(styles.payMethodItem, payMethod === 'wechat' && styles.payMethodItemActive)}
            onClick={() => setPayMethod('wechat')}
          >
            <View className={classnames(styles.payIcon, styles.payIconWechat)}>💚</View>
            <Text className={styles.payMethodName}>微信支付</Text>
            <View className={classnames(styles.payRadio, payMethod === 'wechat' && styles.payRadioActive)}>
              {payMethod === 'wechat' && <View className={styles.payRadioInner} />}
            </View>
          </View>

          <View
            className={classnames(styles.payMethodItem, payMethod === 'alipay' && styles.payMethodItemActive)}
            onClick={() => setPayMethod('alipay')}
          >
            <View className={classnames(styles.payIcon, styles.payIconAlipay)}>💙</View>
            <Text className={styles.payMethodName}>支付宝</Text>
            <View className={classnames(styles.payRadio, payMethod === 'alipay' && styles.payRadioActive)}>
              {payMethod === 'alipay' && <View className={styles.payRadioInner} />}
            </View>
          </View>
        </View>

        <View className={styles.payNotice}>
          <Text className={styles.payNoticeText}>
            💡 支付成功后，系统将自动提交审核，一般1-3个工作日完成。审核结果将通过站内通知告知。
          </Text>
        </View>
      </View>

      <View className={styles.footerBar}>
        <View className={styles.footerInfo}>
          <Text className={styles.footerLabel}>应付金额</Text>
          <Text className={styles.footerPrice}>¥{finalAmount}.00</Text>
        </View>
        <View
          className={classnames(styles.payBtn, isPaying && styles.payBtnDisabled)}
          onClick={handlePay}
        >
          {isPaying ? '支付中...' : '立即支付'}
        </View>
      </View>
    </ScrollView>
  );
};

export default PaymentPage;
