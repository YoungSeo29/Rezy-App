import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { confirmWaiting, getMyWaitings, leaveLine } from '@/api';
import { errorMessage } from '@/api/client';
import type { MyWaiting } from '@/api/types';
import { ResultPopup } from '@/components/ResultPopup';
import { colors } from '@/constants/theme';
import { formatSlotDatetime, parseLocalDateTime } from '@/utils/format';

const POLL_MS = 5000;

// 내 대기 현황
export default function WaitingStatusScreen() {
  const { waitingId } = useLocalSearchParams<{ waitingId: string }>();

  const [entry, setEntry] = useState<MyWaiting | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  // 대기가 끝났으면(취소·만료·확정) 더 조회하지 않고, 팝업을 닫을 때 My 로 돌아간다
  const ended = useRef(false);
  const leaveOnClose = useRef(false);

  const load = useCallback(async () => {
    if (ended.current) return;
    try {
      const list = await getMyWaitings();
      if (ended.current) return;
      const found = list.find((w) => w.waitingId === waitingId);
      if (found) {
        setEntry(found);
        setNow(Date.now());
      } else {
        // 목록에서 사라짐 = 확정 시간이 지났거나 슬롯이 마감됨
        ended.current = true;
        leaveOnClose.current = true;
        setPopup('대기가 종료되었습니다.');
      }
    } catch (e) {
      setPopup(errorMessage(e));
    }
  }, [waitingId]);

  // 화면이 열려 있는 동안만 5초마다 다시 조회
  useFocusEffect(
    useCallback(() => {
      void load();
      const timer = setInterval(() => void load(), POLL_MS);
      return () => clearInterval(timer);
    }, [load]),
  );

  const offered = entry?.status === 'OFFERED' && !confirmed;
  const expiresAt = offered && entry.offerExpiresAt ? parseLocalDateTime(entry.offerExpiresAt) : null;

  // OFFERED 면 offerExpiresAt 까지 1초 단위 카운트다운
  useEffect(() => {
    if (expiresAt === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const remainingSec = expiresAt === null ? 0 : Math.max(0, Math.floor((expiresAt - now) / 1000));

  const onConfirm = async () => {
    if (!offered || submitting) return;
    setSubmitting(true);
    try {
      await confirmWaiting(waitingId);
      ended.current = true;
      setConfirmed(true);
    } catch (e) {
      setPopup(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onLeave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await leaveLine(waitingId);
      ended.current = true;
      leaveOnClose.current = true;
      setPopup('줄서기가 취소되었습니다.');
    } catch (e) {
      setPopup(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const onClosePopup = () => {
    setPopup(null);
    if (leaveOnClose.current) router.back();
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.header}>내 대기 현황</Text>

      <ScrollView style={styles.card} contentContainerStyle={styles.cardContent}>
        <View style={styles.info}>
          <Text style={styles.storeName}>{entry?.storeName ?? ' '}</Text>
          <Text style={styles.infoText}>{entry ? formatSlotDatetime(entry.slotDatetime) : ' '}</Text>
          <Text style={styles.infoText}>{entry ? `${entry.partySize}인 이하` : ' '}</Text>
        </View>

        <View style={styles.statusBox}>
          {confirmed ? (
            <Text style={styles.statusLarge}>예약이 확정되었습니다.</Text>
          ) : offered ? (
            <>
              <Text style={styles.statusLarge}>차례가 왔어요!</Text>
              <Text style={styles.statusLarge}>
                {Math.floor(remainingSec / 60)}분 {remainingSec % 60}초 안에
              </Text>
              <Text style={styles.statusLarge}>아래 확정 버튼을 눌러주세요</Text>
            </>
          ) : entry ? (
            <>
              <Text style={styles.statusText}>지금 나는</Text>
              <Text style={styles.statusNumber}>{entry.waitingNumber}번째로</Text>
              <Text style={styles.statusText}>대기 중이에요</Text>
            </>
          ) : null}
        </View>

        {confirmed ? (
          <Text style={styles.confirmedGuide}>마이페이지에서{'\n'}예약 확정 내역을 확인해주세요</Text>
        ) : (
          <>
            <View style={styles.buttons}>
              <Pressable style={styles.leaveButton} disabled={submitting || !entry} onPress={onLeave}>
                <Text style={styles.buttonText}>줄서기 취소</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmButton, offered && styles.confirmButtonActive]}
                disabled={!offered || submitting}
                onPress={onConfirm}
              >
                <Text style={styles.buttonText}>확정</Text>
              </Pressable>
            </View>

            <Text style={styles.notice}>
              🚨본인 차례가 왔을 때{'\n'}5분 안에 확정 버튼을 눌러야 예약 확정이 됩니다.{'\n'}누르지 않으면 다음
              대기자에게 넘어가니 주의해주세요.
            </Text>
          </>
        )}
      </ScrollView>

      <ResultPopup message={popup} onClose={onClosePopup} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: {
    marginTop: 24,
    marginBottom: 20,
    fontSize: 22,
    letterSpacing: 2,
    color: colors.text,
    textAlign: 'center',
  },
  card: {
    flex: 1,
    marginHorizontal: 10,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.white,
  },
  cardContent: { paddingBottom: 24 },
  info: { paddingTop: 30, paddingHorizontal: 22 },
  storeName: { fontSize: 18, color: colors.textSub, marginBottom: 8 },
  infoText: { marginTop: 6, fontSize: 15, color: colors.textSub },
  statusBox: {
    marginTop: 40,
    marginHorizontal: 12,
    height: 200,
    borderRadius: 26,
    backgroundColor: colors.box,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  statusText: { fontSize: 22, color: colors.textSub },
  statusNumber: { fontSize: 30, color: colors.textSub },
  statusLarge: { fontSize: 24, color: colors.textSub, textAlign: 'center' },
  buttons: {
    marginTop: 52,
    paddingHorizontal: 34,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leaveButton: {
    width: 120,
    height: 58,
    borderRadius: 10,
    backgroundColor: colors.brown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    width: 120,
    height: 58,
    borderRadius: 10,
    backgroundColor: colors.confirmDisabled,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonActive: { backgroundColor: colors.green },
  buttonText: { fontSize: 21, color: colors.white },
  notice: {
    marginTop: 56,
    paddingHorizontal: 12,
    fontSize: 13,
    lineHeight: 38,
    letterSpacing: 1,
    color: colors.text,
    textAlign: 'center',
  },
  confirmedGuide: {
    marginTop: 40,
    fontSize: 18,
    lineHeight: 36,
    color: colors.textSub,
    textAlign: 'center',
  },
});
