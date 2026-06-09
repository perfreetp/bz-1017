import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { MarathonEvent } from '../../types';
import StatusTag from '../StatusTag';
import { getStatusText, getQuotaPercentage, navigateTo } from '../../utils';

interface EventCardProps {
  event: MarathonEvent;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const statusTypeMap: Record<string, 'open' | 'full' | 'closed' | 'upcoming'> = {
    open: 'open',
    full: 'full',
    closed: 'closed',
    upcoming: 'upcoming'
  };

  const handleClick = () => {
    console.log('[EventCard] navigate to detail:', event.id);
    navigateTo(`/pages/detail/index?id=${event.id}`);
  };

  const primaryGroup = event.groups[0];
  const quotaPercent = getQuotaPercentage(primaryGroup.remainingQuota, primaryGroup.totalQuota);

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.coverWrapper}>
        <Image className={styles.cover} src={event.coverImage} mode="aspectFill" />
        <View className={styles.statusOverlay}>
          <StatusTag type={statusTypeMap[event.status]} text={getStatusText(event.status)} size="md" />
        </View>
        <View className={styles.featureTags}>
          {event.features.slice(0, 2).map((f, i) => (
            <View key={i} className={styles.featureTag}>
              <Text>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.content}>
        <Text className={styles.title}>{event.title}</Text>
        <Text className={styles.subtitle}>{event.subtitle}</Text>

        <View className={styles.infoRow}>
          <View className={styles.infoItem}>
            <Text className={styles.infoIcon}>📍</Text>
            <Text className={styles.infoText}>{event.location}</Text>
          </View>
        </View>

        <View className={styles.infoRow}>
          <View className={styles.infoItem}>
            <Text className={styles.infoIcon}>📅</Text>
            <Text className={styles.infoText}>{event.date}</Text>
          </View>
        </View>

        <View className={styles.bottomRow}>
          <View className={styles.priceWrapper}>
            <Text className={styles.priceSymbol}>¥</Text>
            <Text className={styles.price}>{Math.min(...event.groups.map(g => g.price))}</Text>
            <Text className={styles.priceSuffix}>起</Text>
          </View>

          <View className={styles.quotaWrapper}>
            {quotaPercent > 0 && event.status === 'open' ? (
              <>
                <View className={styles.quotaBar}>
                  <View
                    className={classnames(
                      styles.quotaFill,
                      quotaPercent < 20 ? styles.quotaLow : quotaPercent < 50 ? styles.quotaMid : styles.quotaHigh
                    )}
                    style={{ width: `${Math.max(100 - quotaPercent, 5)}%` }}
                  />
                </View>
                <Text className={styles.quotaText}>剩余 {primaryGroup.remainingQuota.toLocaleString()} 名</Text>
              </>
            ) : (
              <Text className={styles.quotaText}>名额 {primaryGroup.totalQuota.toLocaleString()}</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default EventCard;
