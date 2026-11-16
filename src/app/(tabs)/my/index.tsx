import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cancelReservation, getMyProfile, getMyReservations, getMyWaitings } from '@/api';
import { errorMessage } from '@/api/client';
import type { MyProfile, MyReservation, MyWaiting } from '@/api/types';
import { ResultPopup } from '@/components/ResultPopup';
import { colors } from '@/constants/theme';
import { useSession } from '@/context/session';
import { formatSlotDatetime } from '@/utils/format';

const ROLE_LABEL: Record<string, string> = { USER: '손님', MANAGER: '사장님' };

export default function MyScreen() {
  const { signOut } = useSession();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [waitings, setWaitings] = useState<MyWaiting[]>([]);
  const [upcoming, setUpcoming] = useState<MyReservation[]>([]);
  const [past, setPast] = useState<MyReservation[]>([]);
  const [popup, setPopup] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MyReservation | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, w, u, pa] = await Promise.all([
        getMyProfile(),
        getMyWaitings(),
        getMyReservations('UPCOMING'),
        getMyReservations('PAST'),
      ]);
      setProfile(p);
      setWaitings(w);
      setUpcoming(u);
      setPast(pa);
    } catch (e) {
      setPopup(errorMessage(e));
    }
  }, []);

  // 탭에 들어올 때마다 다시 조회
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onConfirmCancel = async () => {
    const target = cancelTarget;
    if (!target) return;
    setCancelTarget(null);
    try {
      await cancelReservation(target.reservationId);
      setPopup('예약이 취소되었습니다.');
      await load();
    } catch (e) {
      setPopup(errorMessage(e));
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text style={styles.header}>My</Text>
      <View style={styles.divider} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <PersonIcon />
          <View style={styles.profileTexts}>
            <Text style={styles.email} numberOfLines={1}>
              {profile?.email ?? ' '}
            </Text>
            <Text style={styles.role}>{profile ? (ROLE_LABEL[profile.role] ?? profile.role) : ' '}</Text>
          </View>
        </View>
        <Pressable style={styles.logout} onPress={() => void signOut()}>
          <Text style={styles.smallButtonText}>로그아웃</Text>
        </Pressable>

        {/* 대기 중인 예약 — 없으면 생략 */}
        {waitings.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>대기 중인 예약</Text>
            <View style={styles.section}>
              {waitings.map((w) => (
                <Pressable
                  key={w.waitingId}
                  style={styles.waitingRow}
                  onPress={() =>
                    router.push({
                      pathname: '/my/waiting/[waitingId]',
                      params: { waitingId: w.waitingId },
                    })
                  }
                >
                  <View style={[styles.item, styles.waitingItem]}>
                    <View style={styles.photo} />
                    <ItemTexts name={w.storeName} datetime={w.slotDatetime} partySize={w.partySize} />
                  </View>
                  <View style={styles.numberBox}>
                    <Text style={styles.numberText}>
                      {w.status === 'OFFERED' ? '내 차례' : `${w.waitingNumber}번째`}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>다가오는 예약</Text>
        {upcoming.length > 0 && (
          <View style={styles.section}>
            {upcoming.map((r) => (
              <View key={r.reservationId} style={styles.item}>
                <View style={styles.photo} />
                <ItemTexts name={r.storeName} datetime={r.slotDatetime} partySize={r.partySize} />
                <Pressable style={styles.cancel} hitSlop={6} onPress={() => setCancelTarget(r)}>
                  <Text style={styles.smallButtonText}>취소</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.sectionTitle}>지난 예약</Text>
        {past.length > 0 && (
          <View style={styles.section}>
            {past.map((r) => (
              <View key={r.reservationId} style={styles.item}>
                <View style={styles.photo} />
                <ItemTexts name={r.storeName} datetime={r.slotDatetime} partySize={r.partySize} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <ResultPopup
        message={
          cancelTarget
            ? `${cancelTarget.storeName}\n${formatSlotDatetime(cancelTarget.slotDatetime)}\n예약을 취소할까요?`
            : null
        }
        onClose={() => setCancelTarget(null)}
        onConfirm={onConfirmCancel}
      />
      <ResultPopup message={popup} onClose={() => setPopup(null)} />
    </SafeAreaView>
  );
}

function ItemTexts({ name, datetime, partySize }: { name: string; datetime: string; partySize: number }) {
  return (
    <View style={styles.itemTexts}>
      <Text style={styles.itemName} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.itemSub} numberOfLines={1}>
        {formatSlotDatetime(datetime)}
      </Text>
      <Text style={styles.itemSub}>{partySize}인 이하</Text>
    </View>
  );
}

function PersonIcon() {
  return (
    <View style={styles.icon}>
      <View style={styles.iconHead} />
      <View style={styles.iconBody} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: {
    marginTop: 26,
    marginBottom: 16,
    marginLeft: 34,
    fontSize: 21,
    letterSpacing: 2,
    color: colors.text,
  },
  divider: { height: 1, backgroundColor: colors.text },
  content: { paddingTop: 20, paddingBottom: 24 },

  profileCard: {
    marginHorizontal: 30,
    height: 102,
    borderRadius: 26,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  profileTexts: { flex: 1, marginLeft: 34 },
  email: { fontSize: 17, color: colors.textSub },
  role: { marginTop: 14, fontSize: 14, color: colors.textSub },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2.5,
    borderColor: colors.icon,
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconHead: {
    marginTop: 9,
    width: 17,
    height: 17,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: colors.icon,
  },
  iconBody: {
    marginTop: 2,
    width: 28,
    height: 24,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderWidth: 2.5,
    borderColor: colors.icon,
  },
  logout: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginRight: 30,
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.brown,
    justifyContent: 'center',
  },
  smallButtonText: { fontSize: 12, color: colors.white },

  sectionTitle: {
    marginTop: 26,
    marginLeft: 45,
    marginBottom: 12,
    fontSize: 18,
    letterSpacing: 2,
    color: colors.text,
  },
  section: {
    marginHorizontal: 30,
    padding: 14,
    gap: 14,
    borderRadius: 26,
    backgroundColor: colors.white,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 86,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: colors.box,
  },
  photo: {
    width: 70,
    height: 62,
    borderRadius: 16,
    backgroundColor: colors.photo,
  },
  itemTexts: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 17, color: colors.textSub },
  itemSub: { marginTop: 2, fontSize: 15, color: colors.textSub },
  cancel: {
    position: 'absolute',
    top: 10,
    right: 12,
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.brown,
    justifyContent: 'center',
  },

  waitingRow: { flexDirection: 'row', gap: 6 },
  waitingItem: { flex: 1, paddingHorizontal: 8 },
  numberBox: {
    width: 86,
    borderRadius: 24,
    backgroundColor: colors.box,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { fontSize: 21, color: colors.textSub },
});
