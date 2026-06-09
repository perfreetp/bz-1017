import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockEvents } from '../../data/events';
import { mockUser } from '../../data/user';
import { MarathonEvent, EventGroup } from '../../types';
import { getQuotaPercentage, showToast, navigateTo, showModal } from '../../utils';

const DetailPage: React.FC = () => {
  const router = useRouter();
  const eventId = router.params.id || 'e001';

  const event: MarathonEvent = useMemo(
    () => mockEvents.find((e) => e.id === eventId) || mockEvents[0],
    [eventId]
  );

  const [selectedGroup, setSelectedGroup] = useState<string>(
    event.groups.find((g) => g.remainingQuota > 0)?.id || ''
  );

  const selectedGroupData: EventGroup | undefined = event.groups.find((g) => g.id === selectedGroup);

  const canSignup = event.status === 'open' && selectedGroupData && selectedGroupData.remainingQuota > 0;

  const handleSignup = () => {
    if (!canSignup) return;
    console.log('[Detail] signup for event:', event.id, 'group:', selectedGroup);
    navigateTo(`/pages/register/index?eventId=${event.id}&groupId=${selectedGroup}`);
  };

  const handleTeamSignup = () => {
    if (!canSignup) return;
    console.log('[Detail] team signup for event:', event.id);
    navigateTo(`/pages/team/index?eventId=${event.id}&groupId=${selectedGroup}`);
  };

  const handleSelectGroup = (groupId: string) => {
    const group = event.groups.find((g) => g.id === groupId);
    if (!group || group.remainingQuota === 0) {
      showToast('该组别名额已满', 'none');
      return;
    }
    if (event.status !== 'open' && event.status !== 'upcoming') {
      showToast('当前赛事不可报名', 'none');
      return;
    }
    setSelectedGroup(groupId);
  };

  return (
    <ScrollView scrollY className={styles.page} style={{ height: '100vh' }}>
      <View className="pageContainer">
        <View className={styles.cover}>
          <Image className={styles.coverImage} src={event.coverImage} mode="aspectFill" />
          <View className={styles.coverOverlay}>
            <Text className={styles.coverTitle}>{event.title}</Text>
            <Text className={styles.coverSubtitle}>{event.subtitle}</Text>
            {event.features.length > 0 && (
              <View className={styles.featureRow}>
                {event.features.map((f, i) => (
                  <View key={i} className={styles.featureTag}>
                    <Text>{f}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View className={styles.infoCard}>
          <View className={styles.infoRow}>
            <View className={styles.infoIcon}>📍</View>
            <View className={styles.infoTextWrapper}>
              <Text className={styles.infoLabel}>比赛地点</Text>
              <Text className={styles.infoValue}>{event.location}</Text>
            </View>
          </View>
          <View className={styles.infoRow}>
            <View className={styles.infoIcon}>📅</View>
            <View className={styles.infoTextWrapper}>
              <Text className={styles.infoLabel}>比赛时间</Text>
              <Text className={styles.infoValue}>{event.date}</Text>
            </View>
          </View>
          <View className={styles.infoRow}>
            <View className={styles.infoIcon}>⏰</View>
            <View className={styles.infoTextWrapper}>
              <Text className={styles.infoLabel}>报名截止</Text>
              <Text className={styles.infoValue}>{event.signupDeadline}</Text>
            </View>
          </View>
          <View className={styles.infoRow}>
            <View className={styles.infoIcon}>🏛️</View>
            <View className={styles.infoTextWrapper}>
              <Text className={styles.infoLabel}>主办单位</Text>
              <Text className={styles.infoValue}>{event.organizer}</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>🎯</Text>
            <Text className={styles.sectionTitle}>选择参赛组别</Text>
          </View>
          {event.groups.map((group) => {
            const isSelected = selectedGroup === group.id;
            const isDisabled = group.remainingQuota === 0 || event.status === 'closed';
            const quotaPct = 100 - getQuotaPercentage(group.remainingQuota, group.totalQuota);
            return (
              <View
                key={group.id}
                className={classnames(
                  styles.groupCard,
                  isSelected && styles.selected,
                  isDisabled && styles.disabled
                )}
                onClick={() => handleSelectGroup(group.id)}
              >
                <View className={styles.groupCheck}>✓</View>
                <View className={styles.groupHeader}>
                  <Text className={styles.groupName}>{group.name}</Text>
                  <View>
                    <Text className={styles.groupPrice}>
                      <Text className={styles.groupPriceSym}>¥</Text>
                      {group.price}
                    </Text>
                  </View>
                </View>
                <View className={styles.groupMeta}>
                  <View className={styles.groupMetaItem}>
                    距离：<Text className={styles.groupMetaValue}>{group.distance}</Text>
                  </View>
                  <View className={styles.groupMetaItem}>
                    关门：<Text className={styles.groupMetaValue}>{group.cutoffTime}</Text>
                  </View>
                </View>
                {group.description && (
                  <Text className={styles.groupDesc}>{group.description}</Text>
                )}
                <View className={styles.quotaBar}>
                  <View className={styles.quotaLabel}>
                    <Text className={styles.quotaTextLeft}>
                      已报 {group.totalQuota - group.remainingQuota}/{group.totalQuota.toLocaleString()}
                    </Text>
                    <Text className={styles.quotaTextRight}>
                      {group.remainingQuota > 0 ? `剩余${group.remainingQuota.toLocaleString()}名` : '已满员'}
                    </Text>
                  </View>
                  <View className={styles.quotaProgress}>
                    <View
                      className={styles.quotaFill}
                      style={{ width: `${Math.min(quotaPct, 100)}%` }}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>📖</Text>
            <Text className={styles.sectionTitle}>赛事介绍</Text>
          </View>
          <Text className={styles.descText}>{event.description}</Text>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>📋</Text>
            <Text className={styles.sectionTitle}>参赛规则</Text>
          </View>
          {event.rules.length > 0 ? (
            <View className={styles.ruleList}>
              {event.rules.map((rule, idx) => (
                <View key={idx} className={styles.ruleItem}>
                  <View className={styles.ruleIndex}>
                    <Text>{idx + 1}</Text>
                  </View>
                  <Text className={styles.ruleText}>{rule}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className={styles.descText}>暂无赛事规则</Text>
          )}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>🗺️</Text>
            <Text className={styles.sectionTitle}>赛道路线</Text>
          </View>
          <Image className={styles.routeImage} src={event.routeImage} mode="aspectFill" />
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionIcon}>🏅</Text>
            <Text className={styles.sectionTitle}>完赛奖牌</Text>
          </View>
          <View className={styles.medalWrapper}>
            <Image className={styles.medalImage} src={event.medalImage} mode="aspectFill" />
            <View className={styles.medalInfo}>
              <Text className={styles.medalTitle}>{event.title}完赛奖牌</Text>
              <Text className={styles.medalDesc}>
                精心设计的完赛奖牌，采用高品质金属材质制作，融入{event.location.split('·')[0]}地域文化元素，具有收藏意义。
              </Text>
            </View>
          </View>
        </View>

        {event.faqs.length > 0 && (
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionIcon}>❓</Text>
              <Text className={styles.sectionTitle}>常见问题</Text>
            </View>
            {event.faqs.map((faq, idx) => (
              <View key={idx} className={styles.faqItem}>
                <View className={styles.faqQ}>
                  <View className={styles.faqQTag}>
                    <Text>Q</Text>
                  </View>
                  <Text className={classnames(styles.faqText, styles.faqQText)}>{faq.question}</Text>
                </View>
                <View className={styles.faqQ}>
                  <View className={styles.faqATag}>
                    <Text>A</Text>
                  </View>
                  <Text className={classnames(styles.faqText, styles.faqAText)}>{faq.answer}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.bottomInfo}>
          <Text className={styles.bottomLabel}>
            {selectedGroupData ? selectedGroupData.name : '请选择组别'}
          </Text>
          {selectedGroupData && (
            <>
              <Text className={styles.bottomPrice}>{selectedGroupData.price}</Text>
              <Text className={styles.bottomGroup}>
                剩余 {selectedGroupData.remainingQuota.toLocaleString()} 名
              </Text>
            </>
          )}
        </View>
        <View className={styles.actionBtns}>
          <Button
            className={classnames(
              styles.actionBtn,
              styles.secondary,
              !canSignup && styles.disabled
            )}
            disabled={!canSignup}
            onClick={handleTeamSignup}
          >
            <Text>团队报名</Text>
          </Button>
          <Button
            className={classnames(
              styles.actionBtn,
              styles.primary,
              !canSignup && styles.disabled
            )}
            disabled={!canSignup}
            onClick={handleSignup}
          >
            <Text>{event.status === 'open' ? '立即报名' : event.status === 'upcoming' ? '即将开始' : '报名结束'}</Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

export default DetailPage;
