import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StatusTagProps {
  type: 'open' | 'full' | 'closed' | 'upcoming' | 'success' | 'warning' | 'error' | 'info' | 'default';
  text: string;
  size?: 'sm' | 'md';
}

const StatusTag: React.FC<StatusTagProps> = ({ type, text, size = 'sm' }) => {
  return (
    <View className={classnames(styles.tag, styles[type], size === 'md' && styles.sizeMd)}>
      <Text className={styles.text}>{text}</Text>
    </View>
  );
};

export default StatusTag;
