import Taro from '@tarojs/taro';

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
};

export const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    open: '报名中',
    full: '已满员',
    closed: '已结束',
    upcoming: '即将开始',
    pending_payment: '待支付',
    paid: '已支付',
    pending_review: '待审核',
    reviewing: '审核中',
    review_passed: '审核通过',
    review_failed: '审核未通过',
    refund_applying: '退款中',
    refunded: '已退款',
    refund_rejected: '退款拒绝',
    cancelled: '已取消'
  };
  return map[status] || status;
};

export const getQuotaPercentage = (remaining: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((remaining / total) * 100);
};

export const navigateTo = (url: string): void => {
  Taro.navigateTo({ url }).catch((err) => {
    console.error('[Navigate] failed:', err);
    Taro.showToast({ title: '页面跳转失败', icon: 'none' });
  });
};

export const showToast = (title: string, icon: 'success' | 'error' | 'none' | 'loading' = 'none', duration = 2000): void => {
  Taro.showToast({ title, icon, duration });
};

export const showModal = (title: string, content: string, options?: { confirmText?: string; cancelText?: string }): Promise<boolean> => {
  return new Promise((resolve) => {
    Taro.showModal({
      title,
      content,
      confirmText: options?.confirmText || '确认',
      cancelText: options?.cancelText || '取消',
      success: (res) => resolve(!!res.confirm),
      fail: () => resolve(false)
    });
  });
};

export const copyToClipboard = (text: string, successMsg = '已复制'): void => {
  Taro.setClipboardData({
    data: text,
    success: () => {
      showToast(successMsg, 'success');
    },
    fail: (err) => {
      console.error('[Clipboard] copy failed:', err);
    }
  });
};

export const countdownTo = (targetDate: string): { days: number; hours: number; minutes: number; seconds: number; total: number } => {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds, total: diff };
};
