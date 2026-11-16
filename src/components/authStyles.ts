import { StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';

// 로그인 / 회원가입 / 프로필 화면 공통 스타일
export const authStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.mint,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    letterSpacing: 2,
    color: colors.text,
    textAlign: 'center',
  },
  input: {
    width: '54%',
    height: 31,
    borderRadius: 8,
    backgroundColor: colors.ivory,
    paddingHorizontal: 9,
    paddingVertical: 0,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    width: '54%',
    height: 31,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.greenDisabled,
  },
  buttonText: {
    fontSize: 16,
    color: colors.white,
  },
  buttonTextDisabled: {
    color: colors.placeholder,
  },
});
