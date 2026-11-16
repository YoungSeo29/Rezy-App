import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAvailableDates, getSlotsByDate, getStore, getWaitingPreview, reserve } from '@/api';
import { errorMessage } from '@/api/client';
import type { Slot, Store } from '@/api/types';
import { ResultPopup } from '@/components/ResultPopup';
import { colors } from '@/constants/theme';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (n: number) => String(n).padStart(2, '0');
const toDateString = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`;
// "2026-12-16T13:00:00" → "13:00"
const toTimeLabel = (slotDateTime: string) => slotDateTime.slice(11, 16);

export default function StoreDetailScreen() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();

  const [store, setStore] = useState<Store | null>(null);
  const [popup, setPopup] = useState<string | null>(null);

  // 달력
  const [{ year, month }, setYearMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 선택한 날짜의 슬롯
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedPartySize, setSelectedPartySize] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // 만석일 때 "지금 서면 몇 번째"
  const [waitingPreview, setWaitingPreview] = useState<{ capacityId: string; nextNumber: number } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getStore(storeId)
      .then((res) => {
        if (!cancelled) setStore(res);
      })
      .catch((e) => {
        if (!cancelled) setPopup(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  // 달(月)이 바뀌면 예약 가능 날짜 다시 조회
  useEffect(() => {
    let cancelled = false;
    getAvailableDates(storeId, year, month)
      .then((dates) => {
        if (!cancelled) setAvailableDates(new Set(dates));
      })
      .catch((e) => {
        if (!cancelled) setPopup(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [storeId, year, month]);

  const loadSlots = useCallback(
    async (date: string) => {
      const res = await getSlotsByDate(storeId, date);
      setSlots(res.slots);
    },
    [storeId],
  );

  // 날짜 → 인원 → 시간 순서. 앞 단계를 바꾸거나 해제하면 뒤 단계 선택은 초기화된다
  const onSelectDate = async (date: string) => {
    setSelectedPartySize(null);
    setSelectedTime(null);
    setSlots([]);
    // 선택된 날짜를 한 번 더 누르면 해제
    if (date === selectedDate) {
      setSelectedDate(null);
      return;
    }
    setSelectedDate(date);
    try {
      await loadSlots(date);
    } catch (e) {
      setPopup(errorMessage(e));
    }
  };

  const onSelectPartySize = (size: number) => {
    setSelectedPartySize((prev) => (prev === size ? null : size));
    setSelectedTime(null);
  };

  const onSelectTime = (slotDateTime: string) => {
    setSelectedTime((prev) => (prev === slotDateTime ? null : slotDateTime));
  };

  const moveMonth = (delta: number) => {
    setAvailableDates(new Set());
    setYearMonth((prev) => {
      const d = new Date(prev.year, prev.month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  };

  // 달력 칸: 앞쪽 빈칸(null) + 1..말일, 7칸씩
  const weeks = useMemo(() => {
    const firstWeekday = new Date(year, month - 1, 1).getDay();
    const lastDay = new Date(year, month, 0).getDate();
    const cells: (number | null)[] = [
      ...Array<null>(firstWeekday).fill(null),
      ...Array.from({ length: lastDay }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [year, month]);

  // 인원 버튼 = 서버가 그날 슬롯에 내려준 partySize 만 (오름차순). 없는 인원은 표시하지 않는다
  const partySizes = useMemo(() => {
    const sizes = new Set<number>();
    for (const slot of slots) for (const c of slot.capacities) sizes.add(c.partySize);
    return [...sizes].sort((a, b) => a - b);
  }, [slots]);

  // 시간 버튼 = 선택한 인원을 받는 슬롯만
  const timeSlots = useMemo(
    () =>
      selectedPartySize === null
        ? []
        : slots.filter((s) => s.capacities.some((c) => c.partySize === selectedPartySize)),
    [slots, selectedPartySize],
  );

  const selectedCapacity = useMemo(() => {
    if (selectedTime === null || selectedPartySize === null) return null;
    const slot = slots.find((s) => s.slotDateTime === selectedTime);
    return slot?.capacities.find((c) => c.partySize === selectedPartySize) ?? null;
  }, [slots, selectedTime, selectedPartySize]);

  const isFull = selectedCapacity !== null && !selectedCapacity.available;
  const fullCapacityId = isFull ? selectedCapacity.slotCapacityId : null;

  // 만석이면 대기 미리보기 조회
  useEffect(() => {
    if (!fullCapacityId) return;
    let cancelled = false;
    getWaitingPreview(fullCapacityId)
      .then((res) => {
        if (!cancelled) setWaitingPreview({ capacityId: fullCapacityId, nextNumber: res.nextNumber });
      })
      .catch((e) => {
        if (!cancelled) setPopup(errorMessage(e));
      });
    return () => {
      cancelled = true;
    };
  }, [fullCapacityId]);

  const nextNumber =
    waitingPreview && waitingPreview.capacityId === fullCapacityId ? waitingPreview.nextNumber : null;

  const onSubmit = async () => {
    if (!selectedCapacity || !selectedDate || submitting) return;
    setSubmitting(true);
    try {
      const res = await reserve(selectedCapacity.slotCapacityId);
      if (res.result === 'RESERVED') {
        setPopup('예약이 완료되었습니다.');
      } else {
        setPopup(`${res.waiting?.waitingNumber ?? ''}번째로 줄서기 등록되었습니다.`);
      }
      setSelectedPartySize(null);
      setSelectedTime(null);
      await loadSlots(selectedDate).catch(() => undefined);
    } catch (e) {
      setPopup(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} hitSlop={10} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        {/* 가게 사진 자리 — 회색 박스 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photos}
        >
          <View style={styles.photo} />
          <View style={styles.photo} />
        </ScrollView>

        <View style={styles.info}>
          <Text style={styles.storeName}>{store?.storeName ?? ' '}</Text>
          <Text style={styles.address}>{store?.address ?? ' '}</Text>
          <Text style={styles.hours}>{store ? `영업 시간  ${store.businessHours}` : ' '}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.card}>
          {/* 달력 */}
          <View style={styles.monthRow}>
            <Pressable hitSlop={12} onPress={() => moveMonth(-1)}>
              <View style={styles.arrowLeft} />
            </Pressable>
            <Text style={styles.monthText}>
              {year}.{pad(month)}
            </Text>
            <Pressable hitSlop={12} onPress={() => moveMonth(1)}>
              <View style={styles.arrowRight} />
            </Pressable>
          </View>

          <View style={styles.calendar}>
            <View style={styles.week}>
              {WEEKDAYS.map((w) => (
                <View key={w} style={styles.cell}>
                  <Text style={styles.weekdayText}>{w}</Text>
                </View>
              ))}
            </View>
            {weeks.map((week, i) => (
              <View key={i} style={styles.week}>
                {week.map((day, j) => {
                  if (day === null) return <View key={j} style={styles.cell} />;
                  const date = toDateString(year, month, day);
                  const available = availableDates.has(date);
                  const selected = selectedDate === date;
                  return (
                    <Pressable
                      key={j}
                      style={styles.cell}
                      disabled={!available}
                      onPress={() => onSelectDate(date)}
                    >
                      <View style={[styles.day, selected && styles.daySelected]}>
                        <Text
                          style={[
                            styles.dayText,
                            !available && styles.dayTextDisabled,
                            selected && styles.dayTextSelected,
                          ]}
                        >
                          {day}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
          <View style={styles.cardLine} />

          {/* 인원 */}
          {partySizes.length > 0 && (
            <View style={styles.partyRow}>
              {partySizes.map((size) => {
                const selected = selectedPartySize === size;
                return (
                  <Pressable
                    key={size}
                    style={[styles.pill, selected && styles.pillSelected]}
                    onPress={() => onSelectPartySize(size)}
                  >
                    <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                      {size}인 이하
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* 시간 */}
          {timeSlots.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.timeScroll}
              contentContainerStyle={styles.timeRow}
            >
              {timeSlots.map((slot) => {
                const selected = selectedTime === slot.slotDateTime;
                return (
                  <Pressable
                    key={slot.slotDateTime}
                    style={[styles.pill, styles.timePill, selected && styles.pillSelected]}
                    onPress={() => onSelectTime(slot.slotDateTime)}
                  >
                    <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                      {toTimeLabel(slot.slotDateTime)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* 예약 하기 / N번째로 줄서기 */}
          {selectedCapacity !== null && !isFull && (
            <View style={styles.actionArea}>
              <Pressable style={styles.actionButton} disabled={submitting} onPress={onSubmit}>
                <Text style={styles.actionButtonText}>예약 하기</Text>
              </Pressable>
            </View>
          )}
          {isFull && nextNumber !== null && (
            <View style={styles.actionArea}>
              <Text style={styles.notice}>
                본인 순서가 왔을 때 5분내로 확정 버튼을 누르지 않으면 다음 차례로 넘어가요
              </Text>
              <Pressable style={styles.actionButton} disabled={submitting} onPress={onSubmit}>
                <Text style={styles.actionButtonText}>{nextNumber}번째로 줄서기</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
      <ResultPopup message={popup} onClose={() => setPopup(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  content: { flexGrow: 1 },
  back: { alignSelf: 'flex-start', marginLeft: 12, marginTop: 10, marginBottom: 8 },
  backText: { fontSize: 34, lineHeight: 38, color: colors.text },
  photos: { paddingHorizontal: 15, gap: 20 },
  photo: {
    width: 200,
    height: 235,
    borderRadius: 26,
    backgroundColor: colors.photo,
  },
  info: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14 },
  storeName: { fontSize: 19, fontWeight: '700', color: colors.text },
  address: { marginTop: 16, fontSize: 14, color: colors.textSub },
  hours: { marginTop: 12, fontSize: 14, color: colors.textSub },
  divider: { height: 1, backgroundColor: colors.text },
  card: {
    flexGrow: 1,
    marginTop: 8,
    marginHorizontal: 12,
    paddingBottom: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.white,
  },
  monthRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  monthText: { fontSize: 19, color: colors.text },
  arrowLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: colors.text,
  },
  arrowRight: {
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.text,
  },
  calendar: { marginTop: 12, paddingHorizontal: 40 },
  week: { flexDirection: 'row' },
  cell: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center' },
  weekdayText: { fontSize: 15, color: colors.textSub },
  day: { width: 29, height: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: colors.brown },
  dayText: { fontSize: 15, color: colors.textSub },
  dayTextDisabled: { color: colors.disabledDate },
  dayTextSelected: { color: colors.white },
  cardLine: { marginTop: 6, marginHorizontal: 12, height: 1, backgroundColor: colors.line },
  partyRow: { marginTop: 20, paddingHorizontal: 30, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pill: {
    height: 28,
    paddingHorizontal: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSelected: { backgroundColor: colors.brown, borderColor: colors.brown },
  pillText: { fontSize: 12, color: colors.textSub },
  pillTextSelected: { color: colors.white },
  timeScroll: { marginTop: 30, flexGrow: 0 },
  timeRow: { paddingHorizontal: 30, gap: 12 },
  timePill: { minWidth: 59 },
  actionArea: { marginTop: 24, paddingHorizontal: 12, alignItems: 'flex-end' },
  notice: { alignSelf: 'stretch', marginBottom: 8, fontSize: 10, color: colors.textSub },
  actionButton: {
    marginRight: 8,
    minWidth: 98,
    height: 31,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: colors.brown,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: { fontSize: 12, color: colors.white },
});
