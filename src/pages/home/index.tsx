import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView, Swiper, SwiperItem, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockEvents, eventCategories } from '../../data/events';
import { mockUser } from '../../data/user';
import { mockOrders } from '../../data/orders';
import EventCard from '../../components/EventCard';
import SectionHeader from '../../components/SectionHeader';
import { MarathonEvent } from '../../types';
import { navigateTo, showToast } from '../../utils';

const HomePage: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredEvents: MarathonEvent[] = useMemo(() => {
    let result = mockEvents;
    if (activeCategory !== 'all') {
      result = result.filter((e) => e.categories.includes(activeCategory));
    }
    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(keyword) ||
          e.location.toLowerCase().includes(keyword) ||
          e.tags.some((t) => t.toLowerCase().includes(keyword))
      );
    }
    return result;
  }, [activeCategory, searchText]);

  const handleRefresh = () => {
    console.log('[Home] pull down refresh');
    setTimeout(() => {
      try {
        if (typeof Taro.stopPullDownRefresh === 'function') {
          Taro.stopPullDownRefresh();
        }
      } catch (e) {
        // ignore
      }
      showToast('刷新成功', 'success');
    }, 1000);
  };

  const passedCount = mockOrders.filter((o) => o.status === 'review_passed').length;

  const banners = mockEvents.slice(0, 3);

  React.useEffect(() => {
    try {
      if (typeof Taro.onPullDownRefresh === 'function') {
        Taro.onPullDownRefresh(handleRefresh);
      }
    } catch (e) {
      console.warn('[Home] onPullDownRefresh not supported');
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

  return (
    <ScrollView scrollY className={styles.page} style={{ height: '100vh' }}>
      <View className="pageContainer">
        <View className={styles.header}>
          <Text className={styles.hello}>你好，{mockUser.nickname} 👋</Text>
          <Text className={styles.title}>开启你的马拉松之旅</Text>

          <View className={styles.searchBar}>
            <Text className={styles.searchIcon}>🔍</Text>
            <Input
              className={styles.searchInput}
              placeholder="搜索赛事名称、城市、标签"
              placeholderClass=""
              value={searchText}
              onInput={(e) => setSearchText(e.detail.value)}
              confirmType="search"
            />
          </View>

          <View className={styles.quickStats}>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{mockOrders.length}</Text>
              <Text className={styles.statLabel}>报名总数</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{passedCount}</Text>
              <Text className={styles.statLabel}>已通过</Text>
            </View>
            <View className={styles.statItem}>
              <Text className={styles.statValue}>{mockUser.bestRecords[0]?.time || '--'}</Text>
              <Text className={styles.statLabel}>全马PB</Text>
            </View>
          </View>
        </View>

        <View className={styles.categorySection}>
          <ScrollView
            scrollX
            className={styles.categoryScroll}
            enhanced
            showScrollbar={false}
          >
            <View className={styles.categoryList}>
              {eventCategories.map((cat) => (
                <View
                  key={cat.id}
                  className={classnames(styles.categoryItem, activeCategory === cat.id && styles.active)}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <Text className={styles.categoryIcon}>{cat.icon}</Text>
                  <Text className={styles.categoryName}>{cat.name}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <Swiper
          className={styles.banner}
          indicatorDots
          autoplay
          interval={4000}
          duration={500}
          circular
          indicatorActiveColor="#FF6B35"
          indicatorColor="rgba(255,255,255,0.5)"
        >
          {banners.map((event) => (
            <SwiperItem key={event.id} onClick={() => navigateTo(`/pages/detail/index?id=${event.id}`)}>
              <View className={styles.banner}>
                <Image className={styles.bannerImage} src={event.coverImage} mode="aspectFill" />
                <View className={styles.bannerOverlay}>
                  <Text className={styles.bannerTitle}>{event.title}</Text>
                  <Text className={styles.bannerSubtitle}>{event.date} · {event.location}</Text>
                </View>
              </View>
            </SwiperItem>
          ))}
        </Swiper>

        <SectionHeader
          title="热门赛事"
          subtitle="精选优质马拉松赛事"
          extra={
            <Text style={{ fontSize: '24rpx', color: '#FF6B35' }}>
              共 {filteredEvents.length} 场 →
            </Text>
          }
        />

        <View className={styles.listContainer}>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => <EventCard key={event.id} event={event} />)
          ) : (
            <View style={{ padding: '80rpx 0', textAlign: 'center' }}>
              <Text style={{ fontSize: '80rpx' }}>🏃‍♂️</Text>
              <Text style={{ display: 'block', marginTop: '24rpx', color: '#A0AEC0', fontSize: '28rpx' }}>
                暂无匹配的赛事
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default HomePage;
