import React, { useState, useMemo } from 'react';
import { View, Text, Input, Image, ScrollView, Picker } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockEvents } from '../../data/events';
import { mockUser, mockTeams, shirtSizes } from '../../data/user';
import { useOrderStore, generateOrderNo, maskPhone, maskIdCard } from '../../store/useOrderStore';
import { showToast, showModal, copyToClipboard, navigateTo } from '../../utils';
import { MarathonEvent, EventGroup, TeamMember, RegistrationOrder } from '../../types';

const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TEAM';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

interface MemberFormData {
  name: string;
  phone: string;
  shirtSize: string;
  idCardNumber: string;
}

const TeamPage: React.FC = () => {
  const router = useRouter();
  const eventId = router.params.eventId || 'e001';
  const groupId = router.params.groupId || '';

  const addOrder = useOrderStore((s) => s.addOrder);
  const updateTeamMembers = useOrderStore((s) => s.updateTeamMembers);

  const event: MarathonEvent = useMemo(
    () => mockEvents.find((e) => e.id === eventId) || mockEvents[0],
    [eventId]
  );

  const group: EventGroup | undefined = useMemo(() => {
    return event.groups.find((g) => g.id === groupId) || event.groups[0];
  }, [event, groupId]);

  const existingTeam = useMemo(() => {
    return mockTeams.find((t) => t.eventId === eventId && t.leaderId === mockUser.id);
  }, [eventId]);

  const [activeTab, setActiveTab] = useState<'create' | 'join'>(existingTeam ? 'create' : 'create');
  const [teamName, setTeamName] = useState(existingTeam?.name || '');
  const [inviteCode, setInviteCode] = useState(existingTeam?.inviteCode || '');
  const [joinCode, setJoinCode] = useState('');
  const [members, setMembers] = useState<TeamMember[]>(
    existingTeam?.members || [
      {
        id: 'self',
        name: mockUser.realName,
        phone: mockUser.phone,
        status: 'registered',
        shirtSize: mockUser.shirtSize
      }
    ]
  );
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState<MemberFormData>({
    name: '',
    phone: '',
    shirtSize: 'L',
    idCardNumber: ''
  });

  const unitPrice = group?.price || 0;
  const totalAmount = members.length * unitPrice;
  const paidCount = members.filter((m) => m.status === 'paid').length;
  const pendingCount = members.filter((m) => m.status === 'pending').length;

  const handleGenerateCode = () => {
    if (!teamName.trim()) {
      showToast('请先输入团队名称', 'none');
      return;
    }
    const code = generateInviteCode();
    setInviteCode(code);
    showToast('邀请码已生成', 'success');
  };

  const handleCopyCode = () => {
    if (inviteCode) {
      copyToClipboard(inviteCode, '邀请码已复制');
    }
  };

  const handleShareInvite = () => {
    if (!inviteCode) {
      showToast('请先生成邀请码', 'none');
      return;
    }
    console.log('[Team] share invite code:', inviteCode);
    showToast('邀请链接已复制', 'success');
  };

  const updateMemberField = (field: keyof MemberFormData, value: string) => {
    setMemberForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddMember = () => {
    if (!memberForm.name.trim()) {
      showToast('请输入成员姓名', 'none');
      return;
    }
    if (!memberForm.phone.trim()) {
      showToast('请输入成员手机号', 'none');
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(memberForm.phone)) {
      showToast('手机号格式不正确', 'none');
      return;
    }
    if (!memberForm.idCardNumber.trim()) {
      showToast('请输入成员证件号', 'none');
      return;
    }
    if (memberForm.idCardNumber.length !== 18) {
      showToast('身份证号应为18位', 'none');
      return;
    }
    if (members.length >= 10) {
      showToast('团队最多10名成员', 'none');
      return;
    }

    const newMember: TeamMember = {
      id: `m${Date.now()}`,
      name: memberForm.name,
      phone: memberForm.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      status: 'registered',
      shirtSize: memberForm.shirtSize
    };

    setMembers((prev) => [...prev, newMember]);
    setShowMemberModal(false);
    setMemberForm({ name: '', phone: '', shirtSize: 'L', idCardNumber: '' });
    showToast('成员添加成功', 'success');
  };

  const handleRemoveMember = (memberId: string) => {
    if (memberId === 'self') {
      showToast('不能移除自己', 'none');
      return;
    }
    const member = members.find((m) => m.id === memberId);
    if (member?.status === 'paid') {
      showToast('已支付成员不能移除', 'none');
      return;
    }
    Taro.showModal({
      title: '移除成员',
      content: `确认移除成员「${member?.name}」？`,
      success: (res) => {
        if (res.confirm) {
          setMembers((prev) => prev.filter((m) => m.id !== memberId));
          showToast('已移除成员', 'success');
        }
      }
    });
  };

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) {
      showToast('请输入邀请码', 'none');
      return;
    }
    console.log('[Team] join team with code:', joinCode);
    Taro.showLoading({ title: '验证中...' });
    setTimeout(() => {
      Taro.hideLoading();
      showToast('加入成功', 'success');
      setTeamName('风行者跑团');
      setInviteCode(joinCode);
      setActiveTab('create');
    }, 1000);
  };

  const validateTeam = (): boolean => {
    if (!teamName.trim()) {
      showToast('请输入团队名称', 'none');
      return false;
    }
    if (members.length < 2) {
      showToast('团队至少需要2名成员', 'none');
      return false;
    }
    if (!inviteCode) {
      showToast('请生成团队邀请码', 'none');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateTeam()) return;

    const confirmed = await showModal(
      '确认提交报名',
      `团队名称：${teamName}\n成员人数：${members.length}人\n报名费合计：¥${totalAmount}\n\n确认提交团队报名？`,
      { confirmText: '确认并支付', cancelText: '取消' }
    );

    if (confirmed) {
      Taro.showLoading({ title: '提交中...' });
      setTimeout(() => {
        Taro.hideLoading();

        const membersWithStatus = members.map((m) => ({ ...m, status: 'pending' as const }));
        const newOrder: RegistrationOrder = {
          id: `o${Date.now()}`,
          orderNo: generateOrderNo(event.id),
          eventId: event.id,
          eventTitle: event.title,
          eventCover: event.coverImage,
          groupId: group?.id || '',
          groupName: group?.name || '',
          amount: totalAmount,
          status: 'pending_payment',
          createdAt: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
          runnerInfo: {
            name: mockUser.realName,
            idCardLast4: maskIdCard(mockUser.idCardNumber),
            shirtSize: mockUser.shirtSize,
            phone: maskPhone(mockUser.phone)
          },
          isTeamRegistration: true,
          teamName: teamName,
          teamMemberCount: members.length,
          teamMembers: membersWithStatus,
          lockedFields: []
        };

        addOrder(newOrder);

        showToast('团队报名提交成功', 'success');
        setTimeout(() => {
          navigateTo(
            `/pages/payment/index?orderId=${newOrder.id}&eventId=${event.id}&groupId=${group?.id}&mode=team&teamName=${encodeURIComponent(teamName)}&memberCount=${members.length}&totalAmount=${totalAmount}`
          );
        }, 1500);
      }, 1500);
    }
  };

  const getStatusStyle = (status: string) => {
    const map: Record<string, { bg: string; text: string; color: string }> = {
      registered: { bg: '#EBF8FF', text: '已报名', color: '#3182CE' },
      pending: { bg: '#FFFAF0', text: '待支付', color: '#DD6B20' },
      paid: { bg: '#F0FFF4', text: '已支付', color: '#38A169' }
    };
    return map[status] || map.registered;
  };

  const shirtSizeOptions = shirtSizes.map((s) => s.label);
  const getShirtSizeValue = (index: number) => shirtSizes[index]?.value || 'L';
  const getShirtSizeIndex = (value: string) => shirtSizes.findIndex((s) => s.value === value);

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.eventCard}>
        <Image className={styles.eventCover} src={event.coverImage} mode='aspectFill' />
        <View className={styles.eventInfo}>
          <Text className={styles.eventTitle}>{event.title}</Text>
          <View className={styles.eventMeta}>
            <Text>{event.location} · {event.date}</Text>
          </View>
          <View className={styles.groupTag}>
            {group?.name} · ¥{group?.price}
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        <View
          className={classnames(styles.tab, activeTab === 'create' && styles.tabActive)}
          onClick={() => setActiveTab('create')}
        >
          创建团队
        </View>
        <View
          className={classnames(styles.tab, activeTab === 'join' && styles.tabActive)}
          onClick={() => setActiveTab('join')}
        >
          加入团队
        </View>
      </View>

      {activeTab === 'create' ? (
        <>
          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <View className={styles.sectionIcon}>🏃</View>
              <Text className={styles.sectionTitle}>团队信息</Text>
            </View>

            <View className={styles.formItem}>
              <View className={styles.formLabel}>
                <Text className={styles.required}>*</Text>
                团队名称
              </View>
              <Input
                className={styles.formInput}
                placeholder='请输入团队名称（2-20字）'
                value={teamName}
                onInput={(e) => setTeamName(e.detail.value)}
                maxlength={20}
              />
            </View>

            {inviteCode ? (
              <View className={styles.teamCodeCard}>
                <Text className={styles.codeLabel}>团队邀请码</Text>
                <Text className={styles.codeValue}>{inviteCode}</Text>
                <View className={styles.codeActions}>
                  <View className={styles.codeBtn} onClick={handleCopyCode}>
                    复制邀请码
                  </View>
                  <View className={styles.codeBtn} onClick={handleShareInvite}>
                    邀请好友
                  </View>
                </View>
              </View>
            ) : (
              <View
                className={classnames(styles.addMemberBtn)}
                onClick={handleGenerateCode}
                style={{ marginTop: 0 }}
              >
                🔑 生成团队邀请码
              </View>
            )}

            <View className={styles.teamStats}>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{members.length}</Text>
                <Text className={styles.statLabel}>总成员</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{paidCount}</Text>
                <Text className={styles.statLabel}>已支付</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>{pendingCount}</Text>
                <Text className={styles.statLabel}>待支付</Text>
              </View>
              <View className={styles.statItem}>
                <Text className={styles.statValue}>¥{totalAmount}</Text>
                <Text className={styles.statLabel}>总金额</Text>
              </View>
            </View>
          </View>

          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <View className={styles.sectionIcon}>👥</View>
              <Text className={styles.sectionTitle}>成员管理</Text>
            </View>

            <View className={styles.tipsCard}>
              <Text className={styles.tipsText}>
                💡 团队可添加2-10名成员，已支付成员不可移除。未支付成员可由队长代付。
              </Text>
            </View>

            <View className={styles.memberList}>
              {members.map((member, index) => {
                const statusStyle = getStatusStyle(member.status);
                return (
                  <View key={member.id} className={styles.memberItem}>
                    <View className={styles.memberAvatar}>
                      {member.name.charAt(0)}
                    </View>
                    <View className={styles.memberInfo}>
                      <View className={styles.memberName}>
                        {member.name}
                        {index === 0 && <Text className={styles.leaderBadge}>队长</Text>}
                        <Text
                          style={{
                            padding: '2rpx 12rpx',
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            fontSize: '20rpx',
                            borderRadius: '6rpx',
                            fontWeight: '500'
                          }}
                        >
                          {statusStyle.text}
                        </Text>
                      </View>
                      <Text className={styles.memberPhone}>{member.phone}</Text>
                      <View className={styles.memberMeta}>
                        <Text className={styles.shirtBadge}>尺码 {member.shirtSize}</Text>
                      </View>
                    </View>
                    <View
                      className={styles.memberRemove}
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      ✕
                    </View>
                  </View>
                );
              })}
            </View>

            <View className={styles.addMemberBtn} onClick={() => setShowMemberModal(true)}>
              ➕ 添加成员（代报名）
            </View>
          </View>

          <View className={styles.section}>
            <View className={styles.sectionHeader}>
              <View className={styles.sectionIcon}>📋</View>
              <Text className={styles.sectionTitle}>团队规则</Text>
            </View>
            <View className={styles.rulesBox}>
              <Text className={styles.ruleItem}>团队报名需由队长创建，邀请码用于邀请成员加入</Text>
              <Text className={styles.ruleItem}>团队人数下限2人，上限10人，可混合不同性别</Text>
              <Text className={styles.ruleItem}>所有成员需在报名截止前完成资料提交与支付</Text>
              <Text className={styles.ruleItem}>队长可代成员支付，退款需成员个人申请</Text>
              <Text className={styles.ruleItem}>团队报名成功后，队员可在「我的报名」中查看详情</Text>
            </View>
          </View>
        </>
      ) : (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionIcon}>🔐</View>
            <Text className={styles.sectionTitle}>加入团队</Text>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              <Text className={styles.required}>*</Text>
              团队邀请码
            </View>
            <Input
              className={styles.formInput}
              placeholder='请输入6位邀请码'
              value={joinCode}
              onInput={(e) => setJoinCode(e.detail.value.toUpperCase())}
              maxlength={10}
            />
          </View>

          <View className={styles.tipsCard}>
            <Text className={styles.tipsText}>
              💡 请向团队队长索取邀请码，加入后可在「我的报名」中查看团队详情。
            </Text>
          </View>

          <View
            className={classnames(styles.addMemberBtn)}
            onClick={handleJoinTeam}
            style={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F65 100%)',
              color: '#FFFFFF',
              border: 'none',
              marginTop: '32rpx',
              fontWeight: '600'
            }}
          >
            申请加入团队
          </View>
        </View>
      )}

      {activeTab === 'create' && (
        <View className={styles.footerBar}>
          <View className={styles.footerInfo}>
            <Text className={styles.footerPrice}>共 {members.length} 人 · 合计</Text>
            <Text className={styles.footerPriceValue}>¥{totalAmount}</Text>
          </View>
          <View
            className={classnames(
              styles.submitBtn,
              (members.length < 2 || !inviteCode) && styles.submitBtnDisabled
            )}
            onClick={handleSubmit}
          >
            提交并支付
          </View>
        </View>
      )}

      {showMemberModal && (
        <View className={styles.modalMask} onClick={() => setShowMemberModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>添加团队成员</Text>

            <View className={styles.formItem}>
              <View className={styles.formLabel}>
                <Text className={styles.required}>*</Text>
                成员姓名
              </View>
              <Input
                className={styles.formInput}
                placeholder='请输入真实姓名'
                value={memberForm.name}
                onInput={(e) => updateMemberField('name', e.detail.value)}
                maxlength={20}
              />
            </View>

            <View className={styles.formItem}>
              <View className={styles.formLabel}>
                <Text className={styles.required}>*</Text>
                手机号码
              </View>
              <Input
                className={styles.formInput}
                type='number'
                placeholder='请输入11位手机号'
                value={memberForm.phone}
                onInput={(e) => updateMemberField('phone', e.detail.value)}
                maxlength={11}
              />
            </View>

            <View className={styles.formItem}>
              <View className={styles.formLabel}>
                <Text className={styles.required}>*</Text>
                身份证号
              </View>
              <Input
                className={styles.formInput}
                placeholder='请输入18位身份证号'
                value={memberForm.idCardNumber}
                onInput={(e) => updateMemberField('idCardNumber', e.detail.value)}
                maxlength={18}
              />
            </View>

            <View className={styles.formItem}>
              <View className={styles.formLabel}>
                <Text className={styles.required}>*</Text>
                T恤尺码
              </View>
              <Picker
                mode='selector'
                range={shirtSizeOptions}
                value={getShirtSizeIndex(memberForm.shirtSize)}
                onChange={(e) => {
                  const idx = Number(e.detail.value);
                  updateMemberField('shirtSize', getShirtSizeValue(idx));
                }}
              >
                <View className={styles.formInput} style={{ display: 'flex', alignItems: 'center' }}>
                  {shirtSizes.find((s) => s.value === memberForm.shirtSize)?.label || '请选择尺码'}
                </View>
              </Picker>
            </View>

            <View className={styles.modalActions}>
              <View
                className={classnames(styles.modalBtn, styles.modalBtnCancel)}
                onClick={() => setShowMemberModal(false)}
              >
                取消
              </View>
              <View
                className={classnames(styles.modalBtn, styles.modalBtnConfirm)}
                onClick={handleAddMember}
              >
                确认添加
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default TeamPage;
