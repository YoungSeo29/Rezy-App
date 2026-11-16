import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { signup } from '@/api';
import { errorMessage } from '@/api/client';
import { authStyles } from '@/components/authStyles';
import { ResultPopup } from '@/components/ResultPopup';
import { colors } from '@/constants/theme';
import { useSession } from '@/context/session';

export default function SignupScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState<string | null>(null);

  const onSignup = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await signup(email.trim(), password);
      // 가입 직후에는 needsProfile=true → 프로필 설정 화면으로 넘어간다
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
      <Text style={[authStyles.title, styles.title]}>회원가입을 환영합니다</Text>
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
        onSubmitEditing={onSignup}
      />
      <Pressable style={[authStyles.button, styles.button]} disabled={submitting} onPress={onSignup}>
        <Text style={authStyles.buttonText}>회원가입</Text>
      </Pressable>
      <ResultPopup message={popup} onClose={() => setPopup(null)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: '56%', marginBottom: 54 },
  password: { marginTop: 27 },
  button: { marginTop: 31 },
});
