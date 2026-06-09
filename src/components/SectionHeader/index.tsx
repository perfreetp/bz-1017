import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, extra }) => {
  return (
    <View className={styles.header}>
      <View className={styles.left}>
        <View className={styles.decoration} />
        <View className={styles.texts}>
          <Text className={styles.title}>{title}</Text>
          {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {extra && <View className={styles.extra}>{extra}</View>}
    </View>
  );
};

export default SectionHeader;
