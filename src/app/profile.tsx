import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { checkNickname, completeProfile as completeProfileApi } from '@/api';
import { errorMessage } from '@/api/client';
import type { UserRole } from '@/api/types';
import { authStyles } from '@/components/authStyles';
import { ResultPopup } from '@/components/ResultPopup';
import { colors } from '@/constants/theme';
import { useSession } from '@/context/session';

export default function ProfileScreen() {
  const { completeProfile } = useSession();
  const [role, setRole] = useState<UserRole>('USER');
  const [nickname, setNickname] = useState('');
  const [nicknameExists, setNicknameExists] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState<string | null>(null);

  const onChangeNickname = (text: string) => {
    setNickname(text);
    setNicknameExists(false);
  };

  const onCheckNickname = async () => {
    const value = nickname.trim();
    if (!value) return;
    try {
      const res = await checkNickname(value);
      setNicknameExists(res.exists);
    } catch (e) {
      setPopup(errorMessage(e));
    }
  };

  const onSubmit = async () => {
    // 사장님 가입은 화면 틀만 — 동작 없음
    if (role === 'MANAGER') return;
    if (submitting) return;
    setSubmitting(true);
    try {
      await completeProfileApi(nickname.trim(), role);
      await completeProfile();
    } catch (e) {
      setPopup(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={authStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={[authStyles.title, styles.title]}>나는 Rezy에</Text>

      <View style={styles.toggle}>
        <Pressable
          style={[styles.toggleItem, role === 'USER' && styles.toggleItemSelected]}
          onPress={() => setRole('USER')}
        >
          <Text style={styles.toggleText}>손님</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleItem, role === 'MANAGER' && styles.toggleItemSelected]}
          onPress={() => setRole('MANAGER')}
        >
          <Text style={styles.toggleText}>사장님</Text>
        </Pressable>
      </View>

      <Text style={[authStyles.title, styles.subtitle]}>으로 가입할 거에요</Text>

      <View style={styles.nicknameRow}>
        <TextInput
          style={styles.nicknameInput}
          placeholder="닉네임"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
          value={nickname}
          onChangeText={onChangeNickname}
        />
        <Pressable style={styles.checkButton} onPress={onCheckNickname}>
          <Text style={styles.checkButtonText}>중복 확인</Text>
        </Pressable>
      </View>
      <Text style={styles.nicknameMessage}>{nicknameExists ? '이미 존재하는 닉네임입니다' : ' '}</Text>

      <Pressable style={[authStyles.button, styles.submit]} disabled={submitting} onPress={onSubmit}>
        <Text style={authStyles.buttonText}>가입 완료</Text>
      </Pressable>
      <ResultPopup message={popup} onClose={() => setPopup(null)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: '56%' },
  toggle: {
    marginTop: 46,
    flexDirection: 'row',
    height: 60,
    borderRadius: 26,
    backgroundColor: colors.white,
  },
  toggleItem: {
    minWidth: 82,
    paddingHorizontal: 8,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleItemSelected: { backgroundColor: colors.brown },
  toggleText: { fontSize: 22, letterSpacing: 2, color: colors.text },
  subtitle: { marginTop: 44 },
  nicknameRow: {
    marginTop: 22,
    width: '54%',
    height: 34,
    flexDirection: 'row',
    borderRadius: 10,
    backgroundColor: colors.ivory,
  },
  nicknameInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 16,
    color: colors.text,
  },
  checkButton: {
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: colors.brown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonText: { fontSize: 14, color: colors.white },
  nicknameMessage: {
    width: '54%',
    marginTop: 4,
    fontSize: 12,
    color: colors.placeholder,
    textAlign: 'right',
  },
  submit: { marginTop: 12 },
});
