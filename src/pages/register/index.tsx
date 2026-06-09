import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea, Button, Image, Picker } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockEvents } from '../../data/events';
import { mockUser, shirtSizes, idCardTypes, bloodTypes } from '../../data/user';
import { useOrderStore, generateOrderNo, maskPhone, maskIdCard } from '../../store/useOrderStore';
import { showToast, showModal, navigateTo } from '../../utils';
import { MarathonEvent, EventGroup, RegistrationOrder } from '../../types';

type RegisterMode = 'new' | 'resubmit';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const eventId = router.params.eventId || 'e001';
  const groupId = router.params.groupId || '';
  const modeParam = router.params.mode as RegisterMode || 'new';
  const orderIdParam = router.params.orderId || '';

  const getOrderById = useOrderStore((s) => s.getOrderById);
  const addOrder = useOrderStore((s) => s.addOrder);
  const resubmitMaterials = useOrderStore((s) => s.resubmitMaterials);

  const existingOrder: RegistrationOrder | undefined = useMemo(
    () => (orderIdParam ? getOrderById(orderIdParam) : undefined),
    [orderIdParam, getOrderById]
  );

  const mode: RegisterMode = existingOrder ? 'resubmit' : modeParam;

  const lockedFields = useMemo<string[]>(() => {
    if (mode === 'resubmit' && existingOrder) {
      return existingOrder.lockedFields || ['realName', 'idCardNumber', 'gender', 'groupId'];
    }
    return [];
  }, [mode, existingOrder]);

  const isLocked = (field: string) => lockedFields.includes(field);

  const actualEventId = existingOrder ? existingOrder.eventId : eventId;
  const actualGroupId = existingOrder ? existingOrder.groupId : groupId;

  const event: MarathonEvent = useMemo(
    () => mockEvents.find((e) => e.id === actualEventId) || mockEvents[0],
    [actualEventId]
  );

  const group: EventGroup | undefined = event.groups.find((g) => g.id === actualGroupId) || event.groups[0];

  const initForm = () => {
    if (mode === 'resubmit' && existingOrder) {
      return {
        realName: existingOrder.runnerInfo?.name?.replace(/\*/g, '') || mockUser.realName,
        idCardType: 'idcard',
        idCardNumber: '',
        gender: mockUser.gender,
        birthday: mockUser.birthday,
        phone: mockUser.phone.replace(/\*/g, '8'),
        email: '',
        nationality: '中国',
        address: '',
        shirtSize: existingOrder.runnerInfo?.shirtSize || mockUser.shirtSize,
        bloodType: mockUser.bloodType,
        medicalHistory: '',
        emergencyName: mockUser.emergencyContact.name,
        emergencyPhone: mockUser.emergencyContact.phone.replace(/\*/g, '9'),
        emergencyRelation: mockUser.emergencyContact.relation,
        certificateUrl: '',
        agreeTerms: false
      };
    }
    return {
      realName: mockUser.realName,
      idCardType: 'idcard',
      idCardNumber: '',
      gender: mockUser.gender,
      birthday: mockUser.birthday,
      phone: mockUser.phone.replace(/\*/g, '8'),
      email: '',
      nationality: '中国',
      address: '',
      shirtSize: mockUser.shirtSize,
      bloodType: mockUser.bloodType,
      medicalHistory: '',
      emergencyName: mockUser.emergencyContact.name,
      emergencyPhone: mockUser.emergencyContact.phone.replace(/\*/g, '9'),
      emergencyRelation: mockUser.emergencyContact.relation,
      certificateUrl: '',
      agreeTerms: false
    };
  };

  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: string, value: any) => {
    if (isLocked(field)) return;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleUpload = () => {
    console.log('[Register] upload certificate');
    showToast('模拟上传成功', 'success');
    updateField('certificateUrl', 'https://picsum.photos/id/1025/400/300');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!isLocked('realName') && !form.realName.trim()) newErrors.realName = '请输入真实姓名';
    if (!isLocked('idCardNumber') && !form.idCardNumber.trim()) {
      newErrors.idCardNumber = '请输入证件号码';
    } else if (!isLocked('idCardNumber') && form.idCardType === 'idcard' && form.idCardNumber.length !== 18) {
      newErrors.idCardNumber = '身份证号应为18位';
    }
    if (!form.phone.trim()) newErrors.phone = '请输入手机号';
    else if (!/^1[3-9]\d{9}$/.test(form.phone)) newErrors.phone = '手机号格式不正确';
    if (!form.birthday && !isLocked('birthday')) newErrors.birthday = '请选择出生日期';
    if (!form.shirtSize) newErrors.shirtSize = '请选择T恤尺码';
    if (!form.emergencyName.trim()) newErrors.emergencyName = '请输入紧急联系人姓名';
    if (!form.emergencyPhone.trim()) newErrors.emergencyPhone = '请输入紧急联系人电话';

    const needCertificate = group?.description?.includes('完赛证明') ||
      (mode === 'resubmit' && existingOrder?.reviewMaterials?.includes('成绩证明'));

    if (needCertificate && !form.certificateUrl) {
      newErrors.certificateUrl = mode === 'resubmit' ? '请重新上传成绩证明' : '请上传成绩证明';
    }
    if (!form.agreeTerms) newErrors.agreeTerms = '请阅读并同意报名条款';
    setErrors(newErrors);
    console.log('[Register] validation errors:', Object.keys(newErrors).length);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitNew = async () => {
    if (!validateForm()) {
      showToast('请完善必填信息', 'error');
      return;
    }
    const confirmed = await showModal(
      '确认提交',
      `确认报名 ${event.title} - ${group?.name}？\n报名费：¥${group?.price}`,
      { confirmText: '确认并支付', cancelText: '取消' }
    );
    if (confirmed) {
      setIsSubmitting(true);
      Taro.showLoading({ title: '提交中...' });

      setTimeout(() => {
        Taro.hideLoading();

        const newOrder: RegistrationOrder = {
          id: `o${Date.now()}`,
          orderNo: generateOrderNo(event.id),
          eventId: event.id,
          eventTitle: event.title,
          eventCover: event.coverImage,
          groupId: group?.id || '',
          groupName: group?.name || '',
          amount: group?.price || 0,
          status: 'pending_payment',
          createdAt: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
          runnerInfo: {
            name: form.realName,
            idCardLast4: maskIdCard(form.idCardNumber),
            shirtSize: form.shirtSize,
            phone: maskPhone(form.phone)
          },
          isTeamRegistration: false,
          lockedFields: []
        };

        addOrder(newOrder);
        setIsSubmitting(false);
        showToast('报名成功，前往支付', 'success');

        setTimeout(() => {
          navigateTo(
            `/pages/payment/index?orderId=${newOrder.id}&eventId=${event.id}&groupId=${group?.id}&mode=single`
          );
        }, 1500);
      }, 1000);
    }
  };

  const handleSubmitResubmit = async () => {
    if (!existingOrder) return;
    if (!validateForm()) {
      showToast('请完善补件信息', 'error');
      return;
    }
    const confirmed = await showModal(
      '确认重新提交',
      `确认重新提交 ${existingOrder.eventTitle} 的报名资料？\n修改后将重新进入审核流程。`,
      { confirmText: '确认提交', cancelText: '取消' }
    );
    if (confirmed) {
      setIsSubmitting(true);
      Taro.showLoading({ title: '提交中...' });

      setTimeout(() => {
        Taro.hideLoading();
        resubmitMaterials(existingOrder.id, form.certificateUrl || undefined);
        setIsSubmitting(false);
        showToast('资料已重新提交', 'success');

        setTimeout(() => {
          navigateTo(`/pages/review/index?orderId=${existingOrder.id}`);
        }, 1500);
      }, 1000);
    }
  };

  const handleSubmit = mode === 'resubmit' ? handleSubmitResubmit : handleSubmitNew;

  const showCertificateBlock = group?.description?.includes('完赛证明') ||
    (mode === 'resubmit' && existingOrder?.reviewMaterials?.includes('成绩证明'));

  return (
    <View className={styles.page}>
      <View className="pageContainer">
        {mode === 'resubmit' && existingOrder && (
          <View className={styles.resubmitHeader}>
            <View className={styles.resubmitTitle}>
              <Text>⚠️</Text>
              <Text>资料补件提醒</Text>
            </View>
            {existingOrder.reviewComment && (
              <Text className={styles.resubmitDesc}>
                未通过原因：{existingOrder.reviewComment}
              </Text>
            )}
            {existingOrder.reviewMaterials && existingOrder.reviewMaterials.length > 0 && (
              <Text className={styles.resubmitDesc} style={{ marginTop: 8 }}>
                需补材料：{existingOrder.reviewMaterials.join('、')}
              </Text>
            )}
            <Text className={styles.resubmitDesc} style={{ marginTop: 8 }}>
              灰色字段已锁定不可修改，请补充未锁定字段和材料后重新提交。
            </Text>
          </View>
        )}

        <View className={styles.eventSummary}>
          <Image className={styles.eventCover} src={event.coverImage} mode="aspectFill" />
          <View className={styles.eventInfo}>
            <Text className={styles.eventTitle}>{event.title}</Text>
            <Text className={styles.eventGroup}>
              {group?.name}
              {existingOrder?.isTeamRegistration && existingOrder.teamName && (
                <Text style={{ marginLeft: 8, color: '#4299E1' }}>
                  · {existingOrder.teamName}
                </Text>
              )}
            </Text>
          </View>
          <Text className={styles.eventPrice}>¥{group?.price}</Text>
        </View>

        <View className={styles.formSection}>
          <View className={styles.formSectionTitle}>
            <Text className={styles.formIcon}>🆔</Text>
            <Text className={styles.formTitle}>身份信息</Text>
            <Text className={styles.formRequired}>*必填</Text>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              <Text className={styles.labelText}>
                <Text className={styles.labelRequired}>*</Text>真实姓名
                {isLocked('realName') && (
                  <Text className={styles.lockedBadge}>🔒 已锁定</Text>
                )}
              </Text>
            </View>
            <View className={styles.formInput}>
              <Input
                className={classnames(styles.input, errors.realName && styles.error, isLocked('realName') && styles.inputReadonly)}
                placeholder="请输入身份证上的真实姓名"
                value={form.realName}
                disabled={isLocked('realName')}
                onInput={(e) => updateField('realName', e.detail.value)}
              />
              {errors.realName && <Text className={styles.inputHint} style={{ color: '#E74C3C' }}>{errors.realName}</Text>}
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              <Text className={styles.labelText}>
                <Text className={styles.labelRequired}>*</Text>证件号码
                {isLocked('idCardNumber') && (
                  <Text className={styles.lockedBadge}>🔒 已锁定</Text>
                )}
              </Text>
            </View>
            <View className={styles.formInput}>
              <Input
                className={classnames(styles.input, errors.idCardNumber && styles.error, isLocked('idCardNumber') && styles.inputReadonly)}
                placeholder={isLocked('idCardNumber') ? '证件信息已加密存储' : '请输入证件号码'}
                value={form.idCardNumber}
                disabled={isLocked('idCardNumber')}
                onInput={(e) => updateField('idCardNumber', e.detail.value)}
              />
              {errors.idCardNumber && <Text className={styles.inputHint} style={{ color: '#E74C3C' }}>{errors.idCardNumber}</Text>}
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              <Text className={styles.labelText}>
                <Text className={styles.labelRequired}>*</Text>性别
                {isLocked('gender') && (
                  <Text className={styles.lockedBadge}>🔒 已锁定</Text>
                )}
              </Text>
            </View>
            <View className={styles.formInput}>
              <View className={styles.genderRow}>
                <View
                  className={classnames(
                    styles.genderOption,
                    form.gender === 'male' && styles.active,
                    isLocked('gender') && { opacity: 0.7 }
                  )}
                  onClick={() => updateField('gender', 'male')}
                >
                  <Text>👨 男</Text>
                </View>
                <View
                  className={classnames(
                    styles.genderOption,
                    form.gender === 'female' && styles.active,
                    isLocked('gender') && { opacity: 0.7 }
                  )}
                  onClick={() => updateField('gender', 'female')}
                >
                  <Text>👩 女</Text>
                </View>
              </View>
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              <Text className={styles.labelText}>
                <Text className={styles.labelRequired}>*</Text>出生日期
              </Text>
            </View>
            <View className={styles.formInput}>
              <Picker
                mode="date"
                value={form.birthday}
                end="2010-12-31"
                disabled={isLocked('birthday')}
                onInput={(e) => updateField('birthday', e.detail.value)}
              >
                <View className={classnames(styles.pickerView, !form.birthday && styles.placeholder, isLocked('birthday') && styles.pickerReadonly)}>
                  <Text>{form.birthday || '请选择出生日期'}</Text>
                </View>
              </Picker>
            </View>
          </View>
        </View>

        <View className={styles.formSection}>
          <View className={styles.formSectionTitle}>
            <Text className={styles.formIcon}>📞</Text>
            <Text className={styles.formTitle}>联系方式</Text>
            <Text className={styles.unlockedBadge}>✏️ 可修改</Text>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              <Text className={styles.labelText}>
                <Text className={styles.labelRequired}>*</Text>手机号码
              </Text>
            </View>
            <View className={styles.formInput}>
              <Input
                className={classnames(styles.input, errors.phone && styles.error)}
                type="phone"
                placeholder="请输入11位手机号"
                value={form.phone}
                onInput={(e) => updateField('phone', e.detail.value)}
              />
              {errors.phone && <Text className={styles.inputHint} style={{ color: '#E74C3C' }}>{errors.phone}</Text>}
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              <Text className={styles.labelText}>电子邮箱</Text>
            </View>
            <View className={styles.formInput}>
              <Input
                className={styles.input}
                placeholder="用于接收赛事通知（选填）"
                value={form.email}
                onInput={(e) => updateField('email', e.detail.value)}
              />
            </View>
          </View>
        </View>

        <View className={styles.formSection}>
          <View className={styles.formSectionTitle}>
            <Text className={styles.formIcon}>👕</Text>
            <Text className={styles.formTitle}>参赛装备</Text>
            <Text className={styles.unlockedBadge}>✏️ 可修改</Text>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              <Text className={styles.labelText}>
                <Text className={styles.labelRequired}>*</Text>T恤尺码
              </Text>
            </View>
            <View className={styles.formInput}>
              <View className={styles.sizeGrid}>
                {shirtSizes.map((size) => (
                  <View
                    key={size.value}
                    className={classnames(styles.sizeItem, form.shirtSize === size.value && styles.active)}
                    onClick={() => updateField('shirtSize', size.value)}
                  >
                    <Text className={styles.sizeLabel}>{size.value}</Text>
                    <Text className={styles.sizeDesc}>胸{size.chest}</Text>
                  </View>
                ))}
              </View>
              <Text className={styles.inputHint}>
                提示：参赛服为欧码版型，建议根据实际测量选择
              </Text>
              {errors.shirtSize && <Text className={styles.inputHint} style={{ color: '#E74C3C' }}>{errors.shirtSize}</Text>}
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              <Text className={styles.labelText}>血型</Text>
            </View>
            <View className={styles.formInput}>
              <Picker
                range={bloodTypes}
                value={bloodTypes.indexOf(form.bloodType)}
                onInput={(e) => updateField('bloodType', bloodTypes[parseInt(e.detail.value)])}
              >
                <View className={classnames(styles.pickerView, !form.bloodType && styles.placeholder)}>
                  <Text>{form.bloodType || '请选择血型（选填）'}</Text>
                </View>
              </Picker>
            </View>
          </View>
        </View>

        <View className={styles.formSection}>
          <View className={styles.formSectionTitle}>
            <Text className={styles.formIcon}>👨‍👩‍👧</Text>
            <Text className={styles.formTitle}>紧急联系人</Text>
            <Text className={styles.formRequired}>*必填</Text>
            <Text className={styles.unlockedBadge}>✏️ 可修改</Text>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              <Text className={styles.labelText}>
                <Text className={styles.labelRequired}>*</Text>姓名
              </Text>
            </View>
            <View className={styles.formInput}>
              <Input
                className={classnames(styles.input, errors.emergencyName && styles.error)}
                placeholder="请输入紧急联系人姓名"
                value={form.emergencyName}
                onInput={(e) => updateField('emergencyName', e.detail.value)}
              />
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              <Text className={styles.labelText}>
                <Text className={styles.labelRequired}>*</Text>手机号
              </Text>
            </View>
            <View className={styles.formInput}>
              <Input
                className={classnames(styles.input, errors.emergencyPhone && styles.error)}
                type="phone"
                placeholder="请输入紧急联系人电话"
                value={form.emergencyPhone}
                onInput={(e) => updateField('emergencyPhone', e.detail.value)}
              />
              {errors.emergencyPhone && <Text className={styles.inputHint} style={{ color: '#E74C3C' }}>{errors.emergencyPhone}</Text>}
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              <Text className={styles.labelText}>关系</Text>
            </View>
            <View className={styles.formInput}>
              <Picker
                range={['父母', '配偶', '子女', '兄弟姐妹', '朋友', '同事', '其他']}
                rangeKey="label"
                value={['父母', '配偶', '子女', '兄弟姐妹', '朋友', '同事', '其他'].indexOf(form.emergencyRelation)}
                onInput={(e) => {
                  const rels = ['父母', '配偶', '子女', '兄弟姐妹', '朋友', '同事', '其他'];
                  updateField('emergencyRelation', rels[parseInt(e.detail.value)]);
                }}
              >
                <View className={styles.pickerView}>
                  <Text>{form.emergencyRelation || '请选择与您的关系'}</Text>
                </View>
              </Picker>
            </View>
          </View>
        </View>

        {showCertificateBlock && (
          <View className={styles.formSection}>
            <View className={styles.formSectionTitle}>
              <Text className={styles.formIcon}>📄</Text>
              <Text className={styles.formTitle}>成绩证明</Text>
              <Text className={styles.unlockedBadge} style={{ background: '#FFF5F5', color: '#C53030' }}>
                {mode === 'resubmit' ? '⚠️ 必须重传' : '*必填'}
              </Text>
            </View>
            <View
              className={classnames(styles.uploadBox, form.certificateUrl && styles.hasFile)}
              onClick={handleUpload}
            >
              {form.certificateUrl ? (
                <>
                  <Text className={styles.uploadIcon}>✅</Text>
                  <Text className={styles.uploadText}>成绩证明已上传</Text>
                  <Text className={styles.uploadHint}>点击重新上传</Text>
                </>
              ) : (
                <>
                  <Text className={styles.uploadIcon}>⬆️</Text>
                  <Text className={styles.uploadText}>
                    {mode === 'resubmit' ? '请重新上传清晰的成绩证明' : '点击上传成绩证明'}
                  </Text>
                  <Text className={styles.uploadHint}>支持JPG/PNG/PDF，不超过10MB</Text>
                </>
              )}
            </View>
            {errors.certificateUrl && (
              <Text className={styles.inputHint} style={{ color: '#E74C3C', marginTop: '16rpx' }}>
                {errors.certificateUrl}
              </Text>
            )}
          </View>
        )}

        <View className={styles.formSection}>
          <View className={styles.formSectionTitle}>
            <Text className={styles.formIcon}>📝</Text>
            <Text className={styles.formTitle}>备注信息</Text>
            <Text className={styles.unlockedBadge}>✏️ 可修改</Text>
          </View>
          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              <Text className={styles.labelText}>病史说明</Text>
            </View>
            <View className={styles.formInput}>
              <Textarea
                className={styles.textarea}
                placeholder="如有心脏病、高血压等病史请如实说明（选填）"
                value={form.medicalHistory}
                onInput={(e) => updateField('medicalHistory', e.detail.value)}
                maxlength={200}
              />
            </View>
          </View>
        </View>

        <View className={styles.termsBox} onClick={() => updateField('agreeTerms', !form.agreeTerms)}>
          <View className={classnames(styles.checkbox, form.agreeTerms && styles.checked)}>
            <Text>✓</Text>
          </View>
          <Text className={styles.termsText}>
            我已阅读并同意
            <Text className="link">《赛事报名条款》</Text>
            和
            <Text className="link">《风险告知书》</Text>
            ，确认以上填写信息真实有效，身体健康并具备参加本次赛事的能力。
          </Text>
        </View>
        {errors.agreeTerms && (
          <Text style={{ color: '#E74C3C', fontSize: '24rpx', marginTop: '-16rpx', marginBottom: '24rpx' }}>
            {errors.agreeTerms}
          </Text>
        )}
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.priceRow}>
          <Text className={styles.priceLabel}>
            {mode === 'resubmit' ? '报名费（已支付）' : '应付报名费'}
          </Text>
          <Text className={styles.priceTotal}>{group?.price || 0}</Text>
        </View>
        <Button
          className={classnames(styles.submitBtn, isSubmitting && styles.disabled)}
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          <Text>
            {isSubmitting
              ? '提交中...'
              : mode === 'resubmit'
              ? '重新提交审核'
              : '提交报名并支付'}
          </Text>
        </Button>
      </View>
    </View>
  );
};

export default RegisterPage;
