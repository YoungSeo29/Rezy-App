import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

type Props = {
  message: string | null; // null 이면 닫힘
  onClose: () => void;
  // 넘기면 "아니요 / 예" 확인 팝업이 된다
  onConfirm?: () => void;
};

// 예약 완료 / 줄서기 등록 / 취소 / 에러 등 결과 팝업
export function ResultPopup({ message, onClose, onConfirm }: Props) {
  return (
    <Modal visible={message !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.messageBox}>
            <Text style={styles.message}>{message}</Text>
          </View>
          {onConfirm ? (
            <View style={styles.buttons}>
              <Pressable style={[styles.button, styles.buttonSecondary]} onPress={onClose}>
                <Text style={styles.buttonText}>아니요</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={onConfirm}>
                <Text style={styles.buttonText}>예</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.buttons}>
              <Pressable style={styles.button} onPress={onClose}>
                <Text style={styles.buttonText}>확인</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
  },
  messageBox: {
    alignSelf: 'stretch',
    backgroundColor: colors.cream,
    borderRadius: 18,
    paddingVertical: 36,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    lineHeight: 26,
    color: colors.textSub,
    textAlign: 'center',
  },
  buttons: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    minWidth: 88,
    backgroundColor: colors.brown,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.confirmDisabled,
  },
  buttonText: {
    fontSize: 15,
    color: colors.white,
  },
});
