import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { login } from '@/api';
import { errorMessage } from '@/api/client';
import { authStyles } from '@/components/authStyles';
import { ResultPopup } from '@/components/ResultPopup';
import { colors } from '@/constants/theme';
import { useSession } from '@/context/session';

export default function LoginScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState<string | null>(null);

  const disabled = !email.trim() || !password || submitting;

  const onLogin = async () => {
    if (disabled) return;
    setSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      await signIn(res.accessToken, res.needsProfile);
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
      <Text style={[authStyles.title, styles.title]}>로그인을 해주세요</Text>
      <TextInput
        style={authStyles.input}
        placeholder="이메일"
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={[authStyles.input, styles.password]}
        placeholder="비밀번호"
        placeholderTextColor={colors.placeholder}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={onLogin}
      />
      <Pressable
        style={[authStyles.button, styles.button, disabled && authStyles.buttonDisabled]}
        disabled={disabled}
        onPress={onLogin}
      >
        <Text style={[authStyles.buttonText, disabled && authStyles.buttonTextDisabled]}>로그인</Text>
      </Pressable>
      <Pressable style={styles.signup} hitSlop={8} onPress={() => router.push('/signup')}>
        <Text style={styles.signupText}>회원가입</Text>
      </Pressable>
      <ResultPopup message={popup} onClose={() => setPopup(null)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: '58%', marginBottom: 48 },
  password: { marginTop: 27 },
  button: { marginTop: 21 },
  signup: { marginTop: 26 },
  signupText: { fontSize: 16, color: colors.textSub },
});
