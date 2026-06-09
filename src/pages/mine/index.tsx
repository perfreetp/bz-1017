import React from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { mockUser, mockTeams } from '../../data/user';
import { showToast, navigateTo } from '../../utils';

const MinePage: React.FC = () => {
  const menus = [
    {
      title: '个人资料',
      subtitle: `${mockUser.realName} · ${mockUser.gender === 'male' ? '男' : '女'} · ${mockUser.birthday}`,
      icon: '👤',
      action: () => showToast('资料编辑功能开发中', 'none')
    },
    {
      title: '紧急联系人',
      subtitle: `${mockUser.emergencyContact.name} · ${mockUser.emergencyContact.relation}`,
      icon: '📞',
      action: () => showToast('紧急联系人编辑开发中', 'none')
    },
    {
      title: '我的团队',
      subtitle: `已创建 ${mockTeams.length} 个团队`,
      icon: '👥',
      badge: '',
      action: () => navigateTo('/pages/team/index')
    },
    {
      title: '参赛号管理',
      subtitle: '查看历史参赛号与完赛证书',
      icon: '🎫',
      action: () => showToast('参赛号管理开发中', 'none')
    }
  ];

  const settings = [
    { title: '消息通知设置', icon: '🔔', action: () => showToast('通知设置开发中', 'none') },
    { title: '地址管理', icon: '📍', action: () => showToast('地址管理开发中', 'none') },
    { title: '发票管理', icon: '🧾', action: () => showToast('发票管理开发中', 'none') },
    { title: '帮助与客服', icon: '💬', action: () => showToast('客服开发中', 'none') },
    { title: '关于我们', icon: 'ℹ️', action: () => showToast('版本 v1.0.0', 'none') }
  ];

  return (
    <ScrollView scrollY className={styles.page} style={{ height: '100vh' }}>
      <View className="pageContainer">
        <View className={styles.profileHeader}>
          <View className={styles.profileCard}>
            <Image className={styles.avatar} src={mockUser.avatar} mode="aspectFill" />
            <View className={styles.profileInfo}>
              <Text className={styles.nickname}>{mockUser.nickname}</Text>
              <View className={styles.userMeta}>
                <View className={styles.metaTag}>
                  <Text>📱 {mockUser.phone}</Text>
                </View>
                <View className={styles.metaTag}>
                  <Text>👕 T恤 {mockUser.shirtSize}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.statsCard}>
          <View className={styles.statsCol}>
            <Text className={styles.statsValue}>
              {mockUser.totalRaces}
              <Text className={styles.statsUnit}>场</Text>
            </Text>
            <Text className={styles.statsLabel}>累计参赛</Text>
          </View>
          <View className={styles.statsCol}>
            <Text className={styles.statsValue}>
              {mockUser.totalDistance}
              <Text className={styles.statsUnit}>km</Text>
            </Text>
            <Text className={styles.statsLabel}>总跑量</Text>
          </View>
          <View className={styles.statsCol}>
            <Text className={styles.statsValue}>
              {mockUser.bestRecords.length}
              <Text className={styles.statsUnit}>项</Text>
            </Text>
            <Text className={styles.statsLabel}>PB记录</Text>
          </View>
        </View>

        <View className={styles.recordsCard}>
          <View className={styles.recordsHeader}>
            <Text className={styles.recordsTitle}>🏆 个人最佳记录</Text>
          </View>
          {mockUser.bestRecords.map((record) => (
            <View key={record.distance} className={styles.recordItem}>
              <View className={styles.recordLabel}>
                <Text style={{ fontSize: '28rpx' }}>⏱️</Text>
                <Text className={styles.recordDist}>{record.distance}</Text>
              </View>
              <Text className={styles.recordTime}>{record.time}</Text>
            </View>
          ))}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>个人信息</View>
          {menus.map((menu) => (
            <View
              key={menu.title}
              className={styles.menuItem}
              onClick={() => {
                console.log('[Mine] click menu:', menu.title);
                menu.action();
              }}
            >
              <View className={styles.menuIcon}>
                <Text>{menu.icon}</Text>
              </View>
              <View className={styles.menuContent}>
                <Text className={styles.menuTitle}>{menu.title}</Text>
                <Text className={styles.menuSubtitle}>{menu.subtitle}</Text>
              </View>
              {menu.badge && <Text className={styles.menuBadge}>{menu.badge}</Text>}
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>设置与帮助</View>
          {settings.map((setting) => (
            <View
              key={setting.title}
              className={styles.menuItem}
              onClick={() => {
                console.log('[Mine] click setting:', setting.title);
                setting.action();
              }}
            >
              <View className={styles.menuIcon}>
                <Text>{setting.icon}</Text>
              </View>
              <View className={styles.menuContent}>
                <Text className={styles.menuTitle}>{setting.title}</Text>
              </View>
              <Text className={styles.menuArrow}>›</Text>
            </View>
          ))}
        </View>

        <View style={{ padding: '48rpx 0 80rpx', textAlign: 'center' }}>
          <Text style={{ fontSize: '22rpx', color: '#A0AEC0' }}>
            马拉松报名平台 v1.0.0
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
