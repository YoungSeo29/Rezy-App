import { request } from './client';
import type {
  DailySlots,
  MyProfile,
  MyReservation,
  MyWaiting,
  NicknameExistsResponse,
  Paged,
  Reservation,
  ReservationListType,
  ReserveResponse,
  Store,
  StoreSummary,
  TokenResponse,
  UserRole,
  WaitingPreview,
} from './types';

// AuthController
export const login = (email: string, password: string) =>
  request<TokenResponse>('/api/auth/login', { method: 'POST', body: { email, password } });

export const signup = (email: string, password: string) =>
  request<TokenResponse>('/api/auth/signup', { method: 'POST', body: { email, password } });

// UserController
export const checkNickname = (nickname: string) =>
  request<NicknameExistsResponse>('/api/users/nickname/exists', { query: { nickname } });

export const completeProfile = (nickname: string, role: UserRole) =>
  request<null>('/api/users/me/profile', { method: 'PATCH', body: { nickname, role } });

// StoreController
export const getStores = (page = 0, size = 20) =>
  request<Paged<StoreSummary>>('/api/stores', { query: { page, size } });

export const getStore = (storeId: string) => request<Store>(`/api/stores/${storeId}`);

// SlotQueryController
export const getAvailableDates = (storeId: string, year: number, month: number) =>
  request<string[]>(`/api/stores/${storeId}/slots/dates`, { query: { year, month } });

export const getSlotsByDate = (storeId: string, date: string) =>
  request<DailySlots>(`/api/stores/${storeId}/slots`, { query: { date } });

// ReservationController
export const getWaitingPreview = (capacityId: string) =>
  request<WaitingPreview>(`/api/reservations/slots/${capacityId}/waiting`);

// 자리가 있으면 예약(RESERVED), 만석이면 줄서기(WAITING)
export const reserve = (slotCapacityId: string) =>
  request<ReserveResponse>('/api/reservations', { method: 'POST', body: { slotCapacityId } });

export const getMyProfile = () => request<MyProfile>('/api/users/me');

export const getMyReservations = (type: ReservationListType) =>
  request<MyReservation[]>('/api/reservations/me', { query: { type } });

export const cancelReservation = (reservationId: string) =>
  request<null>(`/api/reservations/${reservationId}`, { method: 'DELETE' });

export const getMyWaitings = () => request<MyWaiting[]>('/api/reservations/waitings/me');

// 자리를 넘겨받은(OFFERED) 뒤 offerExpiresAt 전에 눌러야 한다
export const confirmWaiting = (waitingId: string) =>
  request<Reservation>(`/api/reservations/waitings/${waitingId}/confirm`, { method: 'POST' });

export const leaveLine = (waitingId: string) =>
  request<null>(`/api/reservations/waitings/${waitingId}`, { method: 'DELETE' });
