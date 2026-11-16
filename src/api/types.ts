// 백엔드(Rezy) DTO 와 1:1

export type UserRole = 'USER' | 'MANAGER';

export type TokenResponse = {
  tokenType: string;
  accessToken: string;
  needsProfile: boolean;
};

export type NicknameExistsResponse = {
  exists: boolean;
};

export type StoreSummary = {
  storeId: string;
  storeName: string;
  address: string;
  businessHours: string;
};

export type Store = StoreSummary & {
  managerId: string;
};

// Spring PagedModel
export type Paged<T> = {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
};

export type SlotCapacity = {
  slotCapacityId: string;
  partySize: number;
  remainingTeams: number;
  available: boolean;
};

export type Slot = {
  slotDateTime: string; // LocalDateTime, 예: 2026-12-16T13:00:00
  capacities: SlotCapacity[];
};

export type DailySlots = {
  storeId: string;
  storeName: string;
  date: string;
  slots: Slot[];
};

export type WaitingPreview = {
  slotCapacityId: string;
  waitingCount: number;
  nextNumber: number;
};

export type Reservation = {
  reservationId: string;
  storeId: string;
  slotStartTime: string;
  partySize: number;
  status: string;
};

export type Waiting = {
  waitingId: string;
  slotCapacityId: string;
  waitingNumber: number;
  status: string;
};

export type ReserveResponse = {
  result: 'RESERVED' | 'WAITING';
  reservation: Reservation | null;
  waiting: Waiting | null;
};

export type MyProfile = {
  userId: string;
  email: string;
  nickname: string;
  role: UserRole;
  provider: string;
  createdAt: string;
};

export type ReservationListType = 'UPCOMING' | 'PAST';

export type MyReservation = {
  reservationId: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  slotDatetime: string;
  partySize: number;
  status: string;
};

export type MyWaiting = {
  waitingId: string;
  storeName: string;
  slotDatetime: string;
  partySize: number;
  status: 'WAITING' | 'OFFERED';
  waitingNumber: number; // WAITING: 1,2,3... / OFFERED: 0 (내 차례)
  offerExpiresAt: string | null; // OFFERED 일 때만
};
