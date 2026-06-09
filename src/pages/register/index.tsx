import React, { useState, useMemo } from 'react';
import { View, Text, Input, Textarea, Button, Image, Picker } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockEvents } from '../../data/events';
import { mockUser, shirtSizes, idCardTypes, bloodTypes } from '../../data/user';
import { showToast, showModal } from '../../utils';
import { MarathonEvent, EventGroup } from '../../types';

const RegisterPage: React.FC = () => {
  const router = useRouter();
  const eventId = router.params.eventId || 'e001';
  const groupId = router.params.groupId || '';
  const mode = router.params.mode || 'new';

  const event: MarathonEvent = useMemo(
    () => mockEvents.find((e) => e.id === eventId) || mockEvents[0],
    [eventId]
  );

  const group: EventGroup | undefined = event.groups.find((g) => g.id === groupId) || event.groups[0];

  const [form, setForm] = useState({
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: any) => {
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
    if (!form.realName.trim()) newErrors.realName = '请输入真实姓名';
    if (!form.idCardNumber.trim()) newErrors.idCardNumber = '请输入证件号码';
    else if (form.idCardType === 'idcard' && form.idCardNumber.length !== 18)
      newErrors.idCardNumber = '身份证号应为18位';
    if (!form.phone.trim()) newErrors.phone = '请输入手机号';
    else if (!/^1[3-9]\d{9}$/.test(form.phone)) newErrors.phone = '手机号格式不正确';
    if (!form.birthday) newErrors.birthday = '请选择出生日期';
    if (!form.shirtSize) newErrors.shirtSize = '请选择T恤尺码';
    if (!form.emergencyName.trim()) newErrors.emergencyName = '请输入紧急联系人姓名';
    if (!form.emergencyPhone.trim()) newErrors.emergencyPhone = '请输入紧急联系人电话';
    if (group?.description?.includes('完赛证明') && !form.certificateUrl) {
      newErrors.certificateUrl = '请上传成绩证明';
    }
    if (!form.agreeTerms) newErrors.agreeTerms = '请阅读并同意报名条款';
    setErrors(newErrors);
    console.log('[Register] validation errors:', Object.keys(newErrors).length);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('请完善必填信息', 'error');
      return;
    }
    console.log('[Register] submit form:', form);
    const confirmed = await showModal(
      '确认提交',
      `确认报名 ${event.title} - ${group?.name}？\n报名费：¥${group?.price}`,
      { confirmText: '确认并支付', cancelText: '取消' }
    );
    if (confirmed) {
      Taro.showLoading({ title: '提交中...' });
      setTimeout(() => {
        Taro.hideLoading();
        showToast('报名成功，请前往支付', 'success');
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/orders/index' }).catch(console.error);
        }, 1500);
      }, 1000);
    }
  };

  return (
    <View className={styles.page}>
      <View className="pageContainer">
        <View className={styles.eventSummary}>
          <Image className={styles.eventCover} src={event.coverImage} mode="aspectFill" />
          <View className={styles.eventInfo}>
            <Text className={styles.eventTitle}>{event.title}</Text>
            <Text className={styles.eventGroup}>{group?.name}</Text>
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
              </Text>
            </View>
            <View className={styles.formInput}>
              <Input
                className={classnames(styles.input, errors.realName && styles.error)}
                placeholder="请输入身份证上的真实姓名"
                value={form.realName}
                onInput={(e) => updateField('realName', e.detail.value)}
              />
              {errors.realName && <Text className={styles.inputHint} style={{ color: '#E74C3C' }}>{errors.realName}</Text>}
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              <Text className={styles.labelText}>
                <Text className={styles.labelRequired}>*</Text>证件类型
              </Text>
            </View>
            <View className={styles.formInput}>
              <Picker
                range={idCardTypes.map((t) => t.label)}
                value={idCardTypes.findIndex((t) => t.value === form.idCardType)}
                onInput={(e) => {
                  const idx = parseInt(e.detail.value);
                  updateField('idCardType', idCardTypes[idx].value);
                }}
              >
                <View className={styles.pickerView}>
                  <Text>{idCardTypes.find((t) => t.value === form.idCardType)?.label}</Text>
                </View>
              </Picker>
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              <Text className={styles.labelText}>
                <Text className={styles.labelRequired}>*</Text>证件号码
              </Text>
            </View>
            <View className={styles.formInput}>
              <Input
                className={classnames(styles.input, errors.idCardNumber && styles.error)}
                placeholder="请输入证件号码"
                value={form.idCardNumber}
                onInput={(e) => updateField('idCardNumber', e.detail.value)}
              />
              {errors.idCardNumber && <Text className={styles.inputHint} style={{ color: '#E74C3C' }}>{errors.idCardNumber}</Text>}
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              <Text className={styles.labelText}>
                <Text className={styles.labelRequired}>*</Text>性别
              </Text>
            </View>
            <View className={styles.formInput}>
              <View className={styles.genderRow}>
                <View
                  className={classnames(styles.genderOption, form.gender === 'male' && styles.active)}
                  onClick={() => updateField('gender', 'male')}
                >
                  <Text>👨 男</Text>
                </View>
                <View
                  className={classnames(styles.genderOption, form.gender === 'female' && styles.active)}
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
                onInput={(e) => updateField('birthday', e.detail.value)}
              >
                <View className={classnames(styles.pickerView, !form.birthday && styles.placeholder)}>
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
                    <Text className={styles.sizeDesc}>
                      胸{size.chest}
                    </Text>
                  </View>
                ))}
              </View>
              <Text className={styles.inputHint}>
                提示：参赛服为欧码版型，建议根据实际测量选择
              </Text>
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
                value={0}
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

        {group?.description?.includes('完赛证明') && (
          <View className={styles.formSection}>
            <View className={styles.formSectionTitle}>
              <Text className={styles.formIcon}>📄</Text>
              <Text className={styles.formTitle}>成绩证明</Text>
              <Text className={styles.formRequired}>*必填</Text>
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
                  <Text className={styles.uploadText}>点击上传成绩证明</Text>
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
          <Text className={styles.priceLabel}>应付报名费</Text>
          <Text className={styles.priceTotal}>{group?.price || 0}</Text>
        </View>
        <Button className={styles.submitBtn} onClick={handleSubmit}>
          <Text>提交报名并支付</Text>
        </Button>
      </View>
    </View>
  );
};

export default RegisterPage;
