import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Search,
  X,
  Check,
  BookmarkCheck,
  Minus,
  Star,
  QrCode,
  Timer,
  Compass,
  History,
  RotateCcw,
  LayoutGrid,
  Map
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { STANDALONE_HTML_CODE, GAS_BACKEND_CODE } from './data/standaloneCode';
import { OccupancyPieCharts } from './components/OccupancyPieCharts';

export interface Seat {
  seat_id: string;
  room_id: 'R1' | 'R2' | 'R3';
  room_name: string;
  seat_number: string;
  zone: string;
  has_power: boolean;
}

export interface Reservation {
  reservation_id: string;
  user_id: string;
  seat_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status?: 'CONFIRMED' | 'CANCELLED';
}

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST';
  url: string;
  payload?: string;
  responsePreview: string;
}

type RoomFilterKey = 'ALL' | 'R1' | 'R2' | 'R3';
type StatusFilterKey = 'ALL_STATUS' | 'AVAILABLE' | 'MY_RES' | 'OCCUPIED';
type LayoutModeKey = 'ARCHITECTURAL' | 'COMPACT';

interface RoomTheme {
  id: RoomFilterKey;
  name: string;
  subtitle: string;
  shapeName: string;
  shapeSymbol: string;
  activeTabClass: string;
  inactiveTabClass: string;
  sectionBorderClass: string;
  sectionHeaderClass: string;
  sectionBgClass: string;
  indicatorClass: string;
}

const ROOM_THEMES: Record<RoomFilterKey, RoomTheme> = {
  ALL: {
    id: 'ALL',
    name: '전체 열람실',
    subtitle: '제1·2·3열람실 통합 평면도',
    shapeName: '통합 레이아웃',
    shapeSymbol: '■',
    activeTabClass: 'bg-zinc-900 text-white border-2 border-zinc-900 shadow-sm rounded-xl',
    inactiveTabClass: 'bg-zinc-100 text-zinc-800 border border-zinc-300 hover:bg-zinc-200/75 rounded-xl',
    sectionBorderClass: 'border-zinc-300',
    sectionHeaderClass: 'bg-zinc-100 border-zinc-200 text-zinc-900',
    sectionBgClass: 'bg-zinc-50/60',
    indicatorClass: 'bg-zinc-900 rounded-none'
  },
  R1: {
    id: 'R1',
    name: '제1열람실 (일반)',
    subtitle: '아치형 라운딩 데스크 · 2열 대칭 배치',
    shapeName: '라운딩 아치형',
    shapeSymbol: '●',
    activeTabClass: 'bg-teal-700 text-white border-2 border-teal-700 shadow-sm rounded-2xl',
    inactiveTabClass: 'bg-teal-50/70 text-teal-950 border border-teal-200 hover:bg-teal-100/80 rounded-2xl',
    sectionBorderClass: 'border-teal-200',
    sectionHeaderClass: 'bg-teal-50/90 border-teal-200 text-teal-950',
    sectionBgClass: 'bg-teal-50/15',
    indicatorClass: 'bg-teal-600 rounded-full'
  },
  R2: {
    id: 'R2',
    name: '제2열람실 (노트북)',
    subtitle: '듀얼모니터 워크스테이션 · 2인 페어 배치',
    shapeName: '와이드 모니터형',
    shapeSymbol: '◆',
    activeTabClass: 'bg-indigo-700 text-white border-2 border-indigo-700 shadow-sm rounded-lg',
    inactiveTabClass: 'bg-indigo-50/70 text-indigo-950 border border-indigo-200 hover:bg-indigo-100/80 rounded-lg',
    sectionBorderClass: 'border-indigo-200',
    sectionHeaderClass: 'bg-indigo-50/90 border-indigo-200 text-indigo-950',
    sectionBgClass: 'bg-indigo-50/15',
    indicatorClass: 'bg-indigo-600 rotate-45 rounded-2xs'
  },
  R3: {
    id: 'R3',
    name: '제3열람실 (집중 캐럴)',
    subtitle: '3면 파티션 독립 부스 · 프라이빗 단독 배치',
    shapeName: 'U-파티션 부스형',
    shapeSymbol: '▲',
    activeTabClass: 'bg-violet-700 text-white border-2 border-violet-700 shadow-sm rounded-md border-t-4',
    inactiveTabClass: 'bg-violet-50/70 text-violet-950 border border-violet-200 hover:bg-violet-100/80 rounded-md border-t-4',
    sectionBorderClass: 'border-violet-200',
    sectionHeaderClass: 'bg-violet-50/90 border-violet-200 text-violet-950',
    sectionBgClass: 'bg-violet-50/15',
    indicatorClass: 'bg-violet-600 rounded-xs'
  }
};

const DEFAULT_GAS_URL = '[YOUR_GAS_WEB_APP_URL]';
const FAVORITES_STORAGE_KEY = 'LIB_FAVORITE_SEATS_V1';
const RECENT_HISTORY_STORAGE_KEY = 'LIB_RECENT_BOOKING_HISTORY_V1';

const INITIAL_SEATS: Seat[] = [
  // 제1열람실 (일반열람실 - 10석)
  { seat_id: 'R1-A01', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'A-01', zone: '창가 자연채광석', has_power: true },
  { seat_id: 'R1-A02', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'A-02', zone: '창가 자연채광석', has_power: true },
  { seat_id: 'R1-A03', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'A-03', zone: '창가 자연채광석', has_power: false },
  { seat_id: 'R1-A04', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'A-04', zone: '창가 자연채광석', has_power: false },
  { seat_id: 'R1-A05', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'A-05', zone: '중앙 개방형열람석', has_power: true },
  { seat_id: 'R1-B01', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'B-01', zone: '중앙 개방형열람석', has_power: true },
  { seat_id: 'R1-B02', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'B-02', zone: '중앙 개방형열람석', has_power: false },
  { seat_id: 'R1-B03', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'B-03', zone: '중앙 개방형열람석', has_power: false },
  { seat_id: 'R1-B04', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'B-04', zone: '벽면 집중열람석', has_power: true },
  { seat_id: 'R1-B05', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'B-05', zone: '벽면 집중열람석', has_power: true },

  // 제2열람실 (노트북/미디어열람실 - 10석)
  { seat_id: 'R2-C01', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'C-01', zone: '듀얼모니터 데스크', has_power: true },
  { seat_id: 'R2-C02', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'C-02', zone: '듀얼모니터 데스크', has_power: true },
  { seat_id: 'R2-C03', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'C-03', zone: '노트북 전용석', has_power: true },
  { seat_id: 'R2-C04', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'C-04', zone: '노트북 전용석', has_power: true },
  { seat_id: 'R2-C05', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'C-05', zone: '노트북 전용석', has_power: true },
  { seat_id: 'R2-D01', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'D-01', zone: '와이드 테이블석', has_power: true },
  { seat_id: 'R2-D02', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'D-02', zone: '와이드 테이블석', has_power: true },
  { seat_id: 'R2-D03', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'D-03', zone: '노트북 전용석', has_power: true },
  { seat_id: 'R2-D04', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'D-04', zone: '노트북 전용석', has_power: true },
  { seat_id: 'R2-D05', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'D-05', zone: '노트북 전용석', has_power: true },

  // 제3열람실 (집중 캐럴 - 5석)
  { seat_id: 'R3-E01', room_id: 'R3', room_name: '제3열람실 (집중 캐럴)', seat_number: 'E-01', zone: '1인 독립 캐럴', has_power: true },
  { seat_id: 'R3-E02', room_id: 'R3', room_name: '제3열람실 (집중 캐럴)', seat_number: 'E-02', zone: '1인 독립 캐럴', has_power: true },
  { seat_id: 'R3-E03', room_id: 'R3', room_name: '제3열람실 (집중 캐럴)', seat_number: 'E-03', zone: '1인 독립 캐럴', has_power: true },
  { seat_id: 'R3-E04', room_id: 'R3', room_name: '제3열람실 (집중 캐럴)', seat_number: 'E-04', zone: '1인 독립 캐럴', has_power: true },
  { seat_id: 'R3-E05', room_id: 'R3', room_name: '제3열람실 (집중 캐럴)', seat_number: 'E-05', zone: '1인 독립 캐럴', has_power: true },
];

const START_HOURS = Array.from({ length: 17 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);
const END_HOURS = Array.from({ length: 17 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getOffsetDateString(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isOverlapping(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && endA > startB;
}

function normalizeTimeString(val: unknown, fallback: string): string {
  if (val === undefined || val === null || val === '') return fallback;
  const str = String(val).trim();
  const match = str.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return fallback;
}

function normalizeDateString(val: unknown, fallback: string): string {
  if (val === undefined || val === null || val === '') return fallback;
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return fallback;
}

function normalizeSeats(rawInput: unknown): { seats: Seat[]; statusOccupiedSeatIds: string[] } {
  if (!Array.isArray(rawInput) || rawInput.length === 0) {
    return { seats: INITIAL_SEATS, statusOccupiedSeatIds: [] };
  }

  const rawItems = rawInput.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'));
  if (rawItems.length === 0) {
    return { seats: INITIAL_SEATS, statusOccupiedSeatIds: [] };
  }

  const detectExplicitRoom = (item: Record<string, unknown>, seatIdStr: string): 'R1' | 'R2' | 'R3' | null => {
    const rawRoom = String(
      item.room_id ??
      item.roomId ??
      item.room ??
      item.room_name ??
      item.roomName ??
      item['열람실'] ??
      item['열람실명'] ??
      item['열람실ID'] ??
      ''
    ).trim().toUpperCase();

    const upperSeatId = seatIdStr.toUpperCase();

    if (
      rawRoom === 'R1' ||
      rawRoom.includes('제1') ||
      rawRoom.includes('1열람') ||
      rawRoom.includes('일반') ||
      rawRoom === '1' ||
      rawRoom === 'ROOM1' ||
      rawRoom === 'ROOM 1' ||
      upperSeatId.startsWith('R1')
    ) {
      return 'R1';
    }
    if (
      rawRoom === 'R2' ||
      rawRoom.includes('제2') ||
      rawRoom.includes('2열람') ||
      rawRoom.includes('노트북') ||
      rawRoom.includes('미디어') ||
      rawRoom === '2' ||
      rawRoom === 'ROOM2' ||
      rawRoom === 'ROOM 2' ||
      upperSeatId.startsWith('R2')
    ) {
      return 'R2';
    }
    if (
      rawRoom === 'R3' ||
      rawRoom.includes('제3') ||
      rawRoom.includes('3열람') ||
      rawRoom.includes('캐럴') ||
      rawRoom.includes('집중') ||
      rawRoom === '3' ||
      rawRoom === 'ROOM3' ||
      rawRoom === 'ROOM 3' ||
      upperSeatId.startsWith('R3')
    ) {
      return 'R3';
    }
    return null;
  };

  const explicitRooms = rawItems.map((item, idx) => {
    const rawSeatId = String(
      item.seat_id ?? item.seatId ?? item.id ?? item.ID ?? item['좌석ID'] ?? item['좌석번호'] ?? item.seat_number ?? item.name ?? `S-${String(idx + 1).padStart(2, '0')}`
    ).trim();
    return detectExplicitRoom(item, rawSeatId);
  });

  const uniqueExplicit = new Set(explicitRooms.filter(Boolean));
  const r1Zones = ['창가 자연채광석', '중앙 개방형열람석', '벽면 집중열람석'];
  const r2Zones = ['듀얼모니터 데스크', '노트북 전용석', '와이드 테이블석'];
  const r3Zones = ['1인 독립 캐럴'];
  const roomCounters: Record<'R1' | 'R2' | 'R3', number> = { R1: 0, R2: 0, R3: 0 };
  const statusOccupiedSeatIds: string[] = [];

  const normalizedSeats: Seat[] = rawItems.map((item, idx) => {
    const total = rawItems.length;
    const rawSeatId = String(
      item.seat_id ?? item.seatId ?? item.id ?? item.ID ?? item['좌석ID'] ?? item['좌석번호'] ?? item.seat_number ?? item.name ?? ''
    ).trim();

    let roomId: 'R1' | 'R2' | 'R3';
    const detected = explicitRooms[idx];
    if (detected && uniqueExplicit.size >= 2) {
      roomId = detected;
    } else {
      // Distribute proportionally across R1 (제1열람실), R2 (제2열람실), R3 (제3열람실)
      const r1Cutoff = Math.max(1, Math.ceil(total * 0.42));
      const r2Cutoff = Math.max(r1Cutoff + 1, Math.ceil(total * 0.75));
      if (idx < r1Cutoff) roomId = 'R1';
      else if (idx < r2Cutoff) roomId = 'R2';
      else roomId = 'R3';
    }

    const indexInRoom = roomCounters[roomId]++;
    const defaultPrefix =
      roomId === 'R1'
        ? indexInRoom < Math.ceil((total * 0.42) / 2)
          ? 'A'
          : 'B'
        : roomId === 'R2'
        ? indexInRoom < Math.ceil((total * 0.33) / 2)
          ? 'C'
          : 'D'
        : 'E';

    const fallbackSeatNumber = `${defaultPrefix}-${String(indexInRoom + 1).padStart(2, '0')}`;
    const seatId = rawSeatId || `${roomId}-${defaultPrefix}${String(indexInRoom + 1).padStart(2, '0')}`;

    const rawSeatNumber = String(
      item.seat_number ?? item.seatNumber ?? item.number ?? item.label ?? item['좌석명'] ?? ''
    ).trim();

    const seatNumber =
      rawSeatNumber ||
      (rawSeatId.includes('-') ? rawSeatId.split('-').slice(1).join('-') : rawSeatId) ||
      fallbackSeatNumber;

    const roomName =
      roomId === 'R1'
        ? '제1열람실 (일반)'
        : roomId === 'R2'
        ? '제2열람실 (노트북)'
        : '제3열람실 (집중 캐럴)';

    const rawZone = String(
      item.zone ?? item.sub_zone ?? item.area ?? item.location ?? item['세부구역'] ?? item['위치'] ?? ''
    ).trim();

    const defaultZone =
      roomId === 'R1'
        ? r1Zones[indexInRoom % r1Zones.length]
        : roomId === 'R2'
        ? r2Zones[indexInRoom % r2Zones.length]
        : r3Zones[0];

    const zone = rawZone || defaultZone;

    const rawPower = item.has_power ?? item.hasPower ?? item.power ?? item['콘센트'];
    let hasPower: boolean;
    if (typeof rawPower === 'boolean') {
      hasPower = rawPower;
    } else if (rawPower !== undefined && rawPower !== null && String(rawPower).trim() !== '') {
      const s = String(rawPower).trim().toUpperCase();
      hasPower =
        s === 'TRUE' ||
        s === 'Y' ||
        s === 'YES' ||
        s === '1' ||
        s.includes('있음') ||
        s.includes('콘센트') ||
        s === 'O';
    } else {
      hasPower = roomId === 'R2' || roomId === 'R3' ? true : indexInRoom % 2 === 0;
    }

    // Check if the seat row itself carries an occupied status in Google Sheets
    const rawSeatStatus = String(item.status ?? item['상태'] ?? '').trim().toUpperCase();
    if (
      rawSeatStatus === 'OCCUPIED' ||
      rawSeatStatus === 'RESERVED' ||
      rawSeatStatus === 'IN_USE' ||
      rawSeatStatus.includes('사용') ||
      rawSeatStatus.includes('예약') ||
      item.is_reserved === true ||
      item.occupied === true
    ) {
      statusOccupiedSeatIds.push(seatId);
    }

    return {
      seat_id: seatId,
      room_id: roomId,
      room_name: roomName,
      seat_number: seatNumber,
      zone,
      has_power: hasPower
    };
  });

  return { seats: normalizedSeats, statusOccupiedSeatIds };
}

function normalizeReservations(
  rawInput: unknown,
  targetDate: string,
  statusOccupiedSeatIds: string[] = []
): Reservation[] {
  const list = Array.isArray(rawInput) ? rawInput : [];
  const normalized: Reservation[] = list
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item, idx) => {
      const reservationId = String(
        item.reservation_id ?? item.reservationId ?? item.id ?? item['예약번호'] ?? `RES-${1000 + idx}`
      ).trim();
      const userId = String(
        item.user_id ?? item.userId ?? item.user ?? item['이용자ID'] ?? item['사용자'] ?? 'user_001'
      ).trim();
      const seatId = String(
        item.seat_id ?? item.seatId ?? item.seat ?? item['좌석ID'] ?? item['좌석번호'] ?? ''
      ).trim();
      const dateStr = normalizeDateString(item.date ?? item['날짜'] ?? item['예약일자'], targetDate);
      const startT = normalizeTimeString(item.start_time ?? item.startTime ?? item['시작시간'], '09:00');
      const endT = normalizeTimeString(item.end_time ?? item.endTime ?? item['종료시간'], '18:00');
      const rawStatus = String(item.status ?? item['상태'] ?? 'CONFIRMED').trim().toUpperCase();
      const status: 'CONFIRMED' | 'CANCELLED' =
        rawStatus === 'CANCELLED' || rawStatus === 'CANCELED' || rawStatus.includes('취소')
          ? 'CANCELLED'
          : 'CONFIRMED';

      return {
        reservation_id: reservationId,
        user_id: userId,
        seat_id: seatId,
        date: dateStr,
        start_time: startT,
        end_time: endT,
        status
      };
    })
    .filter(r => r.seat_id !== '' && r.status !== 'CANCELLED');

  // If the Seats sheet marked certain seats as occupied directly and no reservation record exists for them, synthesize one
  statusOccupiedSeatIds.forEach((occSeatId, idx) => {
    const alreadyExists = normalized.some(r => r.seat_id === occSeatId && r.date === targetDate);
    if (!alreadyExists) {
      normalized.push({
        reservation_id: `SHEET-${idx + 1}`,
        user_id: 'sheet_user',
        seat_id: occSeatId,
        date: targetDate,
        start_time: '06:00',
        end_time: '23:00',
        status: 'CONFIRMED'
      });
    }
  });

  return normalized;
}

interface CountdownInfo {
  mode: 'UPCOMING' | 'ACTIVE' | 'NEXT_CYCLE';
  label: string;
  formattedTime: string;
  progressPercent: number;
  subLabel: string;
}

interface SeatRecommendation {
  seat: Seat;
  reasons: string[];
  preferenceSummary: string;
}

function computeReservationCountdown(res: Reservation, now: Date): CountdownInfo {
  const start = new Date(`${res.date}T${res.start_time}:00`);
  const end = new Date(`${res.date}T${res.end_time}:00`);
  const nowMs = now.getTime();
  const startMs = start.getTime();
  const endMs = end.getTime();

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const hhmmss = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return days > 0 ? `${days}일 ${hhmmss}` : hhmmss;
  };

  if (nowMs < startMs) {
    const diff = startMs - nowMs;
    const windowMs = 12 * 3600 * 1000;
    const progressPercent = Math.min(100, Math.max(8, Math.round(((windowMs - Math.min(diff, windowMs)) / windowMs) * 100)));
    return {
      mode: 'UPCOMING',
      label: '입실 시작까지 남은 시간',
      formattedTime: formatDuration(diff),
      progressPercent,
      subLabel: `${res.date} ${res.start_time} 입실 예정`
    };
  }

  if (nowMs >= startMs && nowMs < endMs) {
    const remaining = endMs - nowMs;
    const totalDuration = Math.max(1, endMs - startMs);
    const elapsed = nowMs - startMs;
    const progressPercent = Math.min(100, Math.max(5, Math.round((elapsed / totalDuration) * 100)));
    return {
      mode: 'ACTIVE',
      label: '현재 이용 중 · 퇴실까지 남은 시간',
      formattedTime: formatDuration(remaining),
      progressPercent,
      subLabel: `${res.start_time} - ${res.end_time} 좌석 이용 중`
    };
  }

  const [startH, startM] = res.start_time.split(':').map(Number);
  const nextStart = new Date(now);
  nextStart.setHours(startH || 9, startM || 0, 0, 0);
  if (nextStart.getTime() <= nowMs) {
    nextStart.setDate(nextStart.getDate() + 1);
  }
  const diffNext = nextStart.getTime() - nowMs;
  const cycleWindow = 24 * 3600 * 1000;
  const progressPercent = Math.min(100, Math.max(10, Math.round(((cycleWindow - diffNext) / cycleWindow) * 100)));

  return {
    mode: 'NEXT_CYCLE',
    label: `다음 ${res.start_time} 입실까지 남은 시간`,
    formattedTime: formatDuration(diffNext),
    progressPercent,
    subLabel: `예약 시간대 (${res.start_time} - ${res.end_time}) 기준`
  };
}

export default function App() {
  const [endpointUrl, setEndpointUrl] = useState<string>(() => {
    return localStorage.getItem('LIB_GAS_ENDPOINT_URL') || DEFAULT_GAS_URL;
  });
  const [tempEndpointInput, setTempEndpointInput] = useState<string>(endpointUrl);

  const [userId, setUserId] = useState<string>('user_001');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('13:00');
  const [selectedRoom, setSelectedRoom] = useState<RoomFilterKey>('ALL');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL_ZONES');
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('ALL_STATUS');
  const [layoutMode, setLayoutMode] = useState<LayoutModeKey>('ARCHITECTURAL');
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Favorite seats state persisted in localStorage
  const [favoriteSeatIds, setFavoriteSeatIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return ['R1-A02', 'R2-C02'];
      }
    }
    const initialFavs = ['R1-A02', 'R2-C02'];
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(initialFavs));
    return initialFavs;
  });
  const [onlyFavoritesFilter, setOnlyFavoritesFilter] = useState<boolean>(false);

  // Recent reservations history (previous successful bookings) & target future date for quick re-booking
  const [rebookTargetDate, setRebookTargetDate] = useState<string>(() => getOffsetDateString(1));
  const [recentHistory, setRecentHistory] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem(RECENT_HISTORY_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fall through to seed
      }
    }
    const seedHistory: Reservation[] = [
      {
        reservation_id: 'RES-260942',
        user_id: 'user_001',
        seat_id: 'R1-A02',
        date: getOffsetDateString(-2),
        start_time: '09:00',
        end_time: '13:00',
        status: 'CONFIRMED'
      },
      {
        reservation_id: 'RES-260889',
        user_id: 'user_001',
        seat_id: 'R2-C02',
        date: getOffsetDateString(-5),
        start_time: '13:00',
        end_time: '18:00',
        status: 'CONFIRMED'
      },
      {
        reservation_id: 'RES-260815',
        user_id: 'user_001',
        seat_id: 'R3-E01',
        date: getOffsetDateString(-8),
        start_time: '10:00',
        end_time: '15:00',
        status: 'CONFIRMED'
      }
    ];
    localStorage.setItem(RECENT_HISTORY_STORAGE_KEY, JSON.stringify(seedHistory));
    return seedHistory;
  });

  const [seats, setSeats] = useState<Seat[]>(INITIAL_SEATS);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Modals & UI Views
  const [activeView, setActiveView] = useState<'workspace' | 'code'>('workspace');
  const [codeTab, setCodeTab] = useState<'html' | 'gas'>('html');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [completedReservation, setCompletedReservation] = useState<Reservation | null>(null);
  const [qrReservation, setQrReservation] = useState<Reservation | null>(null);
  const [recommendation, setRecommendation] = useState<SeatRecommendation | null>(null);
  const [recommendationIndex, setRecommendationIndex] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const isRealGasConnected = useMemo(() => {
    return Boolean(
      endpointUrl &&
      endpointUrl !== DEFAULT_GAS_URL &&
      endpointUrl.startsWith('http')
    );
  }, [endpointUrl]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3400);
  }, []);

  const handleToggleFavorite = useCallback((seatId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setFavoriteSeatIds(prev => {
      const exists = prev.includes(seatId);
      const next = exists ? prev.filter(id => id !== seatId) : [...prev, seatId];
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      addToast(
        exists
          ? `${seatId} 좌석이 즐겨찾기에서 해제되었습니다.`
          : `${seatId} 좌석이 즐겨찾기에 추가되었습니다.`,
        exists ? 'info' : 'success'
      );
      return next;
    });
  }, [addToast]);

  const appendApiLog = useCallback((method: 'GET' | 'POST', url: string, payload: string | undefined, responsePreview: string) => {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    setApiLogs(prev => [
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp,
        method,
        url,
        payload,
        responsePreview
      },
      ...prev.slice(0, 9)
    ]);
  }, []);

  const loadDemoReservations = useCallback((dateStr: string): Reservation[] => {
    const storageKey = 'LIB_GAS_DEMO_RESERVATIONS_V1';
    const raw = localStorage.getItem(storageKey);
    let list: Reservation[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    } else {
      const today = getTodayDateString();
      list = [
        {
          reservation_id: 'RES-261001',
          user_id: 'user_001',
          seat_id: 'R1-A01',
          date: today,
          start_time: '09:00',
          end_time: '13:00',
          status: 'CONFIRMED'
        },
        {
          reservation_id: 'RES-261002',
          user_id: 'user_104',
          seat_id: 'R1-A04',
          date: today,
          start_time: '08:00',
          end_time: '12:00',
          status: 'CONFIRMED'
        },
        {
          reservation_id: 'RES-261003',
          user_id: 'user_208',
          seat_id: 'R1-B02',
          date: today,
          start_time: '10:00',
          end_time: '15:00',
          status: 'CONFIRMED'
        },
        {
          reservation_id: 'RES-261004',
          user_id: 'user_312',
          seat_id: 'R2-C01',
          date: today,
          start_time: '09:00',
          end_time: '14:00',
          status: 'CONFIRMED'
        },
        {
          reservation_id: 'RES-261005',
          user_id: 'user_089',
          seat_id: 'R3-E02',
          date: today,
          start_time: '11:00',
          end_time: '18:00',
          status: 'CONFIRMED'
        }
      ];
      localStorage.setItem(storageKey, JSON.stringify(list));
    }
    return list.filter(r => r.date === dateStr && r.status !== 'CANCELLED');
  }, []);

  const fetchSeatsAndReservations = useCallback(async (targetDate: string) => {
    setIsLoading(true);
    const getSeatsUrl = `${endpointUrl}?action=getSeats`;
    const getResUrl = `${endpointUrl}?action=getReservations&date=${encodeURIComponent(targetDate)}`;

    try {
      if (!isRealGasConnected) {
        await new Promise(resolve => setTimeout(resolve, 260));
        const demoRes = loadDemoReservations(targetDate);
        setSeats(INITIAL_SEATS);
        setReservations(demoRes);
        appendApiLog('GET', getSeatsUrl, undefined, `200 OK · ${INITIAL_SEATS.length} seats loaded`);
        appendApiLog('GET', getResUrl, undefined, `200 OK · ${demoRes.length} reservations on ${targetDate}`);
      } else {
        const [seatsRes, resResponse] = await Promise.all([
          fetch(getSeatsUrl, { method: 'GET', redirect: 'follow' }),
          fetch(getResUrl, { method: 'GET', redirect: 'follow' })
        ]);

        if (!seatsRes.ok) throw new Error(`좌석 데이터 조회 실패 (HTTP ${seatsRes.status})`);
        if (!resResponse.ok) throw new Error(`예약 현황 조회 실패 (HTTP ${resResponse.status})`);

        const seatsJson = await seatsRes.json();
        const resJson = await resResponse.json();

        const rawSeatsList = Array.isArray(seatsJson)
          ? seatsJson
          : (seatsJson.data || seatsJson.seats || INITIAL_SEATS);

        const rawResList = Array.isArray(resJson)
          ? resJson
          : (resJson.data || resJson.reservations || []);

        const { seats: parsedSeats, statusOccupiedSeatIds } = normalizeSeats(rawSeatsList);
        const parsedReservations = normalizeReservations(rawResList, targetDate, statusOccupiedSeatIds);

        setSeats(parsedSeats);
        setReservations(parsedReservations);

        appendApiLog('GET', getSeatsUrl, undefined, `200 OK (${parsedSeats.length}건)`);
        appendApiLog('GET', getResUrl, undefined, `200 OK (${parsedReservations.length}건)`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '데이터 조회 중 네트워크 오류가 발생했습니다.';
      addToast(message, 'error');
      appendApiLog('GET', getResUrl, undefined, `ERROR: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [endpointUrl, isRealGasConnected, loadDemoReservations, appendApiLog, addToast]);

  useEffect(() => {
    fetchSeatsAndReservations(selectedDate);
  }, [selectedDate, fetchSeatsAndReservations]);

  const getOverlappingReservation = useCallback((seatId: string): Reservation | undefined => {
    return reservations.find(
      res =>
        res.seat_id === seatId &&
        res.date === selectedDate &&
        res.status !== 'CANCELLED' &&
        isOverlapping(startTime, endTime, res.start_time, res.end_time)
    );
  }, [reservations, selectedDate, startTime, endTime]);

  useEffect(() => {
    if (selectedSeatId && getOverlappingReservation(selectedSeatId)) {
      setSelectedSeatId(null);
    }
  }, [selectedSeatId, getOverlappingReservation]);

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeatId) {
      addToast('배치도에서 예약할 좌석을 먼저 선택해 주세요.', 'error');
      return;
    }
    if (startTime >= endTime) {
      addToast('이용 종료 시간은 시작 시간보다 이후여야 합니다.', 'error');
      return;
    }
    if (getOverlappingReservation(selectedSeatId)) {
      addToast('선택한 시간대에 이미 예약된 좌석입니다.', 'error');
      return;
    }

    const requestBody = {
      action: 'createReservation',
      user_id: userId.trim() || 'user_001',
      seat_id: selectedSeatId,
      date: selectedDate,
      start_time: startTime,
      end_time: endTime
    };

    const stringifiedBody = JSON.stringify(requestBody);
    setIsSubmitting(true);

    try {
      let createdReservationId = `RES-${Math.floor(100000 + Math.random() * 900000)}`;

      if (!isRealGasConnected) {
        await new Promise(resolve => setTimeout(resolve, 350));
        const storageKey = 'LIB_GAS_DEMO_RESERVATIONS_V1';
        const existing: Reservation[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const newEntry: Reservation = {
          reservation_id: createdReservationId,
          user_id: requestBody.user_id,
          seat_id: requestBody.seat_id,
          date: requestBody.date,
          start_time: requestBody.start_time,
          end_time: requestBody.end_time,
          status: 'CONFIRMED'
        };
        existing.push(newEntry);
        localStorage.setItem(storageKey, JSON.stringify(existing));
        appendApiLog('POST', endpointUrl, stringifiedBody, JSON.stringify({ success: true, reservation_id: createdReservationId }));
      } else {
        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: stringifiedBody,
          redirect: 'follow'
        });

        if (!response.ok) {
          throw new Error(`예약 신청 실패 (HTTP ${response.status})`);
        }
        const resJson = await response.json();
        if (resJson.success === false) {
          throw new Error(resJson.message || '서버에서 예약 요청을 거부했습니다.');
        }
        createdReservationId = resJson.reservation_id || (resJson.data && resJson.data.reservation_id) || createdReservationId;
        appendApiLog('POST', endpointUrl, stringifiedBody, JSON.stringify(resJson));
      }

      const confirmed: Reservation = {
        reservation_id: createdReservationId,
        user_id: requestBody.user_id,
        seat_id: requestBody.seat_id,
        date: requestBody.date,
        start_time: requestBody.start_time,
        end_time: requestBody.end_time,
        status: 'CONFIRMED'
      };

      setCompletedReservation(confirmed);
      setSelectedSeatId(null);

      setRecentHistory(prev => {
        const filtered = prev.filter(
          item => !(item.seat_id === confirmed.seat_id && item.start_time === confirmed.start_time && item.end_time === confirmed.end_time)
        );
        const updated = [confirmed, ...filtered].slice(0, 6);
        localStorage.setItem(RECENT_HISTORY_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });

      addToast(`예약이 완료되었습니다 (${createdReservationId})`, 'success');
      await fetchSeatsAndReservations(selectedDate);
    } catch (error) {
      const message = error instanceof Error ? error.message : '예약 처리 중 오류가 발생했습니다.';
      addToast(message, 'error');
      appendApiLog('POST', endpointUrl, stringifiedBody, `ERROR: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    const requestBody = {
      action: 'cancelReservation',
      reservation_id: reservationId
    };
    const stringifiedBody = JSON.stringify(requestBody);
    setCancellingId(reservationId);

    try {
      if (!isRealGasConnected) {
        await new Promise(resolve => setTimeout(resolve, 280));
        const storageKey = 'LIB_GAS_DEMO_RESERVATIONS_V1';
        const existing: Reservation[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const updated = existing.filter(r => r.reservation_id !== reservationId);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        appendApiLog('POST', endpointUrl, stringifiedBody, JSON.stringify({ success: true, reservation_id: reservationId }));
      } else {
        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: stringifiedBody,
          redirect: 'follow'
        });

        if (!response.ok) {
          throw new Error(`예약 취소 실패 (HTTP ${response.status})`);
        }
        const resJson = await response.json();
        if (resJson.success === false) {
          throw new Error(resJson.message || '예약 취소에 실패했습니다.');
        }
        appendApiLog('POST', endpointUrl, stringifiedBody, JSON.stringify(resJson));
      }

      addToast(`예약 번호 ${reservationId} 취소가 완료되었습니다.`, 'success');
      await fetchSeatsAndReservations(selectedDate);
    } catch (error) {
      const message = error instanceof Error ? error.message : '예약 취소 중 오류가 발생했습니다.';
      addToast(message, 'error');
      appendApiLog('POST', endpointUrl, stringifiedBody, `ERROR: ${message}`);
    } finally {
      setCancellingId(null);
    }
  };

  const visibleRoomKeys: ('R1' | 'R2' | 'R3')[] = useMemo(() => {
    if (selectedRoom === 'ALL') return ['R1', 'R2', 'R3'];
    return [selectedRoom];
  }, [selectedRoom]);

  // Distinct sub-zones available across the currently visible rooms
  const availableSubZones = useMemo(() => {
    const roomFiltered = selectedRoom === 'ALL' ? seats : seats.filter(s => s.room_id === selectedRoom);
    return Array.from(new Set(roomFiltered.map(s => s.zone)));
  }, [seats, selectedRoom]);

  // Reset sub-zone filter if not applicable when room changes
  useEffect(() => {
    if (selectedZoneFilter !== 'ALL_ZONES' && !availableSubZones.includes(selectedZoneFilter)) {
      setSelectedZoneFilter('ALL_ZONES');
    }
  }, [availableSubZones, selectedZoneFilter]);

  const favoriteSeatsList = useMemo(() => {
    return seats.filter(s => favoriteSeatIds.includes(s.seat_id));
  }, [seats, favoriteSeatIds]);

  const stats = useMemo(() => {
    const total = seats.length;
    let occupied = 0;
    seats.forEach(s => {
      if (getOverlappingReservation(s.seat_id)) occupied++;
    });
    const available = Math.max(0, total - occupied);
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    const myReservationsCount = reservations.filter(r => r.user_id === userId && r.status !== 'CANCELLED').length;
    return { total, available, occupied, occupancyRate, myReservationsCount };
  }, [seats, reservations, userId, getOverlappingReservation]);

  const myReservations = useMemo(() => {
    return reservations.filter(r => r.user_id === userId && r.status !== 'CANCELLED');
  }, [reservations, userId]);

  const userRecentHistory = useMemo(() => {
    return recentHistory.filter(r => r.user_id === userId);
  }, [recentHistory, userId]);

  const handleQuickRebookSelect = useCallback((pastBooking: Reservation) => {
    const targetDate = rebookTargetDate || getOffsetDateString(1);
    setSelectedDate(targetDate);
    setStartTime(pastBooking.start_time);
    setEndTime(pastBooking.end_time);
    setSelectedSeatId(pastBooking.seat_id);
    if (selectedRoom !== 'ALL' && !pastBooking.seat_id.startsWith(selectedRoom)) {
      setSelectedRoom('ALL');
    }
    addToast(
      `${targetDate} (${pastBooking.start_time}-${pastBooking.end_time}) · ${pastBooking.seat_id} 좌석이 재예약 폼에 설정되었습니다.`,
      'success'
    );
  }, [rebookTargetDate, selectedRoom, addToast]);

  const primaryCountdownTarget = useMemo(() => {
    if (myReservations.length === 0) return null;
    const nowMs = currentTime.getTime();
    const sorted = [...myReservations].sort((a, b) => {
      const aStart = new Date(`${a.date}T${a.start_time}:00`).getTime();
      const bStart = new Date(`${b.date}T${b.start_time}:00`).getTime();
      const aFuture = aStart >= nowMs ? 0 : 1;
      const bFuture = bStart >= nowMs ? 0 : 1;
      if (aFuture !== bFuture) return aFuture - bFuture;
      return aStart - bStart;
    });
    const targetRes = sorted[0];
    return {
      reservation: targetRes,
      countdown: computeReservationCountdown(targetRes, currentTime)
    };
  }, [myReservations, currentTime]);

  const filteredTableReservations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reservations.filter(r => {
      if (r.status === 'CANCELLED') return false;
      if (!q) return true;
      return (
        r.reservation_id.toLowerCase().includes(q) ||
        r.seat_id.toLowerCase().includes(q) ||
        r.user_id.toLowerCase().includes(q)
      );
    });
  }, [reservations, searchQuery]);

  const selectedSeatObj = useMemo(() => {
    return seats.find(s => s.seat_id === selectedSeatId) || null;
  }, [seats, selectedSeatId]);

  const rankedAvailableSeats = useMemo((): SeatRecommendation[] => {
    const availableSeats = seats.filter(s => !getOverlappingReservation(s.seat_id));
    if (availableSeats.length === 0) return [];

    const favSeats = seats.filter(s => favoriteSeatIds.includes(s.seat_id));
    const historySeats = myReservations
      .map(r => seats.find(s => s.seat_id === r.seat_id))
      .filter((s): s is Seat => Boolean(s));
    const referenceSeats = [...favSeats, ...historySeats];

    const roomCounts: Record<string, number> = {};
    const zoneCounts: Record<string, number> = {};
    let powerCount = 0;

    referenceSeats.forEach(s => {
      roomCounts[s.room_id] = (roomCounts[s.room_id] || 0) + 1;
      zoneCounts[s.zone] = (zoneCounts[s.zone] || 0) + 1;
      if (s.has_power) powerCount++;
    });

    const preferredRoomId =
      Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'R1';
    const preferredZone =
      Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '창가 자연채광석';
    const prefersPower =
      referenceSeats.length === 0 ? true : powerCount / referenceSeats.length >= 0.5;

    const preferredRoomName =
      ROOM_THEMES[preferredRoomId as RoomFilterKey]?.name || '제1열람실 (일반)';
    const preferenceSummary =
      referenceSeats.length > 0
        ? `선호 분석: ${preferredRoomName} · ${preferredZone} · ${prefersPower ? '콘센트 선호' : '일반석 선호'}`
        : '기본 선호 분석: 콘센트 완비 및 쾌적한 창가/독립 좌석 우선';

    return availableSeats
      .map(seat => {
        let score = 0;
        const reasons: string[] = [];

        if (favoriteSeatIds.includes(seat.seat_id)) {
          score += 50;
          reasons.push('내 즐겨찾기 등록 좌석');
        }
        if (seat.room_id === preferredRoomId) {
          score += 25;
          reasons.push(`선호 열람실(${seat.room_name})`);
        }
        if (seat.zone === preferredZone) {
          score += 20;
          reasons.push(`선호 구역(${seat.zone})`);
        }
        if (seat.has_power === prefersPower) {
          score += 15;
          reasons.push(seat.has_power ? '콘센트 완비' : '일반 열람석');
        }
        if (reasons.length === 0) {
          reasons.push('현재 시간대 즉시 이용 가능');
        }

        return {
          seat,
          score,
          reasons,
          preferenceSummary
        };
      })
      .sort((a, b) => b.score - a.score)
      .map(({ seat, reasons, preferenceSummary: summary }) => ({
        seat,
        reasons,
        preferenceSummary: summary
      }));
  }, [seats, favoriteSeatIds, myReservations, getOverlappingReservation]);

  const handleFindBestSeat = useCallback(() => {
    if (rankedAvailableSeats.length === 0) {
      addToast('선택한 시간대에 이용 가능한 빈 좌석이 없습니다.', 'error');
      return;
    }

    const nextIdx =
      recommendation && selectedSeatId === recommendation.seat.seat_id
        ? (recommendationIndex + 1) % Math.min(3, rankedAvailableSeats.length)
        : 0;

    const chosen = rankedAvailableSeats[nextIdx];
    setRecommendationIndex(nextIdx);
    setRecommendation(chosen);
    setSelectedSeatId(chosen.seat.seat_id);
    if (selectedRoom !== 'ALL' && selectedRoom !== chosen.seat.room_id) {
      setSelectedRoom('ALL');
    }
    setStatusFilter('ALL_STATUS');
    setSelectedZoneFilter('ALL_ZONES');
    addToast(
      `맞춤 좌석 추천: ${chosen.seat.seat_id} (${chosen.reasons.slice(0, 2).join(' · ')})`,
      'success'
    );
  }, [rankedAvailableSeats, recommendation, selectedSeatId, recommendationIndex, selectedRoom, addToast]);

  const customizedStandaloneHtml = useMemo(() => {
    if (endpointUrl && endpointUrl !== DEFAULT_GAS_URL) {
      return STANDALONE_HTML_CODE.replace(
        `const DEFAULT_PLACEHOLDER_URL = '[YOUR_GAS_WEB_APP_URL]';`,
        `const DEFAULT_PLACEHOLDER_URL = '${endpointUrl}';`
      );
    }
    return STANDALONE_HTML_CODE;
  }, [endpointUrl]);

  const handleCopyCode = async () => {
    const targetText = codeTab === 'html' ? customizedStandaloneHtml : GAS_BACKEND_CODE;
    await navigator.clipboard.writeText(targetText);
    setCopiedCode(true);
    addToast(
      codeTab === 'html'
        ? '단일 index.html 전체 코드가 클립보드에 복사되었습니다.'
        : 'Google Apps Script (Code.gs) 코드가 복사되었습니다.',
      'success'
    );
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([customizedStandaloneHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
    addToast('index.html 파일 다운로드가 시작되었습니다.', 'success');
  };

  const handleSaveEndpoint = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = tempEndpointInput.trim() || DEFAULT_GAS_URL;
    setEndpointUrl(cleaned);
    localStorage.setItem('LIB_GAS_ENDPOINT_URL', cleaned);
    setShowConfigModal(false);
    addToast('백엔드 Endpoint URL 설정이 적용되었습니다.', 'success');
  };

  // Renders an individual seat tile with distinct Room Shape + Status Color/Shape
  const renderSeatTile = (seat: Seat) => {
    const overlappingRes = getOverlappingReservation(seat.seat_id);
    const isOccupied = Boolean(overlappingRes);
    const isSelected = selectedSeatId === seat.seat_id;
    const isMyReservation = Boolean(overlappingRes) && overlappingRes?.user_id === userId;
    const isFavorite = favoriteSeatIds.includes(seat.seat_id);

    // 1) Room-Specific Architectural Desk Shape Geometry
    let roomShapeGeometry = 'rounded-xl';
    if (layoutMode === 'ARCHITECTURAL') {
      if (seat.room_id === 'R1') {
        // R1: Arched Reading Desk (Rounded top arch, crisp bottom base)
        roomShapeGeometry = 'rounded-t-2xl rounded-b-md border-b-4';
      } else if (seat.room_id === 'R2') {
        // R2: Dual-Monitor Workstation Pod (Top monitor bar accent, wide angular frame)
        roomShapeGeometry = 'rounded-lg border-t-4';
      } else if (seat.room_id === 'R3') {
        // R3: 3-Sided Private Carrel Booth (Thick side & top partition walls)
        roomShapeGeometry = 'rounded-t-sm rounded-b-xl border-x-4 border-t-4';
      }
    }

    // 2) Status-Specific Color, Border, and Elevation
    let stateClasses =
      'bg-white border-2 border-emerald-600/85 hover:border-emerald-700 hover:shadow-xs text-zinc-900 cursor-pointer';
    let statusText = '○ 이용 가능';
    let statusTextColor = 'text-emerald-700 font-semibold';
    let metaTextColor = 'text-zinc-500';
    let seatNumberClass = 'text-zinc-900';

    if (isSelected) {
      // Selected: Jet-Black Monotone Elevated Card + Offset Ring + Diamond Check
      stateClasses =
        'bg-zinc-950 border-2 border-zinc-950 ring-2 ring-offset-2 ring-zinc-900 text-white shadow-md -translate-y-0.5 cursor-pointer';
      statusText = '◆ 선택됨 (예약 대기)';
      statusTextColor = 'text-emerald-300 font-semibold';
      metaTextColor = 'text-zinc-300';
      seatNumberClass = 'text-white';
    } else if (isMyReservation && overlappingRes) {
      // My Reservation: Solid Royal Blue Card + Bookmark Shield
      stateClasses =
        'bg-blue-600 border-2 border-blue-800 text-white shadow-xs cursor-default';
      statusText = `★ 내 예약 (${overlappingRes.start_time}-${overlappingRes.end_time})`;
      statusTextColor = 'text-blue-100 font-semibold';
      metaTextColor = 'text-blue-100/90';
      seatNumberClass = 'text-white';
    } else if (isOccupied && overlappingRes) {
      // Occupied: Diagonal Hatch + Dashed Border + Strikethrough
      stateClasses =
        'occupied-pattern border border-dashed border-zinc-300 text-zinc-400 opacity-70 cursor-not-allowed';
      statusText = `— 사용 중 (${overlappingRes.start_time}-${overlappingRes.end_time})`;
      statusTextColor = 'text-zinc-500';
      metaTextColor = 'text-zinc-400';
      seatNumberClass = 'text-zinc-400 line-through decoration-zinc-400';
    }

    return (
      <div
        key={seat.seat_id}
        role="button"
        tabIndex={isOccupied ? -1 : 0}
        aria-disabled={isOccupied}
        onClick={() => {
          if (isOccupied) return;
          setSelectedSeatId(prev => (prev === seat.seat_id ? null : seat.seat_id));
        }}
        onKeyDown={(e) => {
          if (isOccupied) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedSeatId(prev => (prev === seat.seat_id ? null : seat.seat_id));
          }
        }}
        className={`p-3.5 text-left transition-all flex flex-col justify-between min-h-[114px] select-none relative ${roomShapeGeometry} ${stateClasses}`}
      >
        {/* Top Row: Star Toggle + Seat Number + Distinct Status Shape Badge */}
        <div className="flex items-center justify-between gap-1 w-full">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => handleToggleFavorite(seat.seat_id, e)}
              title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 등록'}
              aria-label={`${seat.seat_id} 즐겨찾기 ${isFavorite ? '해제' : '등록'}`}
              className="p-0.5 -ml-0.5 rounded transition-transform hover:scale-125 focus:outline-none cursor-pointer"
            >
              <Star
                className={`w-4 h-4 transition-colors ${
                  isFavorite
                    ? 'fill-amber-400 text-amber-400'
                    : isSelected || isMyReservation
                    ? 'text-white/40 hover:text-amber-300'
                    : 'text-zinc-300 hover:text-amber-400'
                }`}
              />
            </button>
            <span className={`font-mono text-sm font-bold tabular-nums ${seatNumberClass}`}>
              {seat.seat_number}
            </span>
          </div>

          {/* Distinct Geometric Shape Badge for each state */}
          {isSelected ? (
            <span className="w-5 h-5 rotate-45 rounded-2xs bg-emerald-400 text-zinc-950 inline-flex items-center justify-center shadow-2xs">
              <Check className="w-3 h-3 -rotate-45 stroke-[3]" />
            </span>
          ) : isMyReservation ? (
            <span className="w-5 h-5 rounded-md bg-white text-blue-700 inline-flex items-center justify-center">
              <BookmarkCheck className="w-3.5 h-3.5" />
            </span>
          ) : isOccupied ? (
            <span className="w-5 h-5 rounded-none border border-zinc-300 bg-zinc-200/80 text-zinc-500 inline-flex items-center justify-center">
              <Minus className="w-3.5 h-3.5" />
            </span>
          ) : (
            <span className="w-5 h-5 rounded-full border-2 border-emerald-600 bg-emerald-50 text-emerald-700 inline-flex items-center justify-center text-[10px] font-mono font-bold">
              ○
            </span>
          )}
        </div>

        {/* Middle Row: Sub-Zone & Power Metadata */}
        <div className={`my-2 text-[11px] leading-snug ${metaTextColor}`}>
          <span>{seat.zone}</span>
          <span aria-hidden="true"> · </span>
          <span>{seat.has_power ? '콘센트' : '일반'}</span>
        </div>

        {/* Bottom Row: Concise Status Text */}
        <div className={`text-[11px] font-mono tabular-nums ${statusTextColor}`}>
          {statusText}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col text-zinc-900">
      {/* Sleek Monotone Outer Top Bar (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-30 bg-zinc-950 text-zinc-100 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Title */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('workspace');
            }}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            중앙도서관 좌석 예약 시스템
          </a>

          {/* Zone 2: 4–5 Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <button
              type="button"
              onClick={() => setActiveView('workspace')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
                activeView === 'workspace' ? 'border-white text-white font-semibold' : 'border-transparent'
              }`}
            >
              좌석 배치도 및 예약
            </button>
            <a
              href="#my-reservations-panel"
              onClick={() => setActiveView('workspace')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent"
            >
              내 예약 확인
            </a>
            <a
              href="#daily-schedule-section"
              onClick={() => setActiveView('workspace')}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent"
            >
              전체 예약 현황
            </a>
            <button
              type="button"
              onClick={() => setActiveView('code')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
                activeView === 'code' ? 'border-white text-white font-semibold' : 'border-transparent'
              }`}
            >
              단일 HTML 코드 내보내기
            </button>
            <button
              type="button"
              onClick={() => {
                setTempEndpointInput(endpointUrl);
                setShowConfigModal(true);
              }}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent cursor-pointer"
            >
              GAS 연동 설정
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => fetchSeatsAndReservations(selectedDate)}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-white rounded-lg hover:bg-zinc-200 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>현황 새로고침</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Monotone Outer Shell */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8 space-y-8">
        {activeView === 'code' ? (
          /* Standalone HTML & GAS Code Viewer Section */
          <section className="bg-white border border-zinc-200/90 rounded-2xl p-6 space-y-6 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
              <div>
                <p className="text-xs font-medium text-zinc-500">Google Sheets &amp; Apps Script 통합 배포 패키지</p>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950 mt-1">
                  단일 HTML 파일 (index.html) 및 GAS 백엔드 코드
                </h1>
                <p className="text-xs text-zinc-600 mt-1.5">
                  모노톤 아웃레이어, 구역별 고유 데스크 모양/색상, 4단계 상태 도형 및 QR·카운트다운·재예약 기능이 모두 포함되어 있습니다.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveView('workspace')}
                  className="px-3.5 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  실시간 프리뷰로 돌아가기
                </button>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? '복사 완료' : '코드 전체 복사'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="px-4 py-2 text-xs font-semibold text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>index.html 다운로드</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCodeTab('html')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    codeTab === 'html' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  index.html (프론트엔드 단일 통합본)
                </button>
                <button
                  type="button"
                  onClick={() => setCodeTab('gas')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    codeTab === 'gas' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  Code.gs (구글 시트 Apps Script 백엔드)
                </button>
              </div>

              <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                Endpoint: {endpointUrl}
              </span>
            </div>

            <div className="relative">
              <pre className="p-5 bg-zinc-950 text-zinc-100 rounded-xl overflow-x-auto text-xs font-mono leading-relaxed max-h-[640px]">
                <code>{codeTab === 'html' ? customizedStandaloneHtml : GAS_BACKEND_CODE}</code>
              </pre>
            </div>
          </section>
        ) : (
          <>
            {/* Top Overview & Filter Controls Section (Clean Monotone Outer Frame) */}
            <section className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-zinc-200">
                <div>
                  <p className="text-xs font-medium text-zinc-500 mb-1">
                    구글 시트(Google Apps Script) 백엔드 연동 아키텍처
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
                    도서관 열람실 좌석 현황 및 공간 예약
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 tabular-nums">
                    <span className="font-medium text-zinc-800">
                      {isRealGasConnected ? '실시간 GAS 웹앱 연동 활성' : '내장 시뮬레이션 모드 동작 중'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      접속 이용자: <strong className="font-mono text-zinc-950">{userId}</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      즐겨찾기 좌석: <strong className="font-mono text-zinc-950">{favoriteSeatIds.length}석</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() => setActiveView('code')}
                      className="text-zinc-950 underline hover:text-zinc-600 font-medium cursor-pointer"
                    >
                      단일 index.html 코드 보기
                    </button>
                  </div>
                </div>

                {/* Date & Time Window Filter Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                  <div>
                    <label htmlFor="date-picker" className="block text-xs font-medium text-zinc-600 mb-1">
                      예약 및 조회 날짜
                    </label>
                    <input
                      id="date-picker"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="start-time-select" className="block text-xs font-medium text-zinc-600 mb-1">
                      이용 시작 시간
                    </label>
                    <select
                      id="start-time-select"
                      value={startTime}
                      onChange={(e) => {
                        const nextStart = e.target.value;
                        setStartTime(nextStart);
                        if (nextStart >= endTime) {
                          const nextHour = Math.min(23, parseInt(nextStart.slice(0, 2), 10) + 1);
                          setEndTime(`${String(nextHour).padStart(2, '0')}:00`);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
                    >
                      {START_HOURS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="end-time-select" className="block text-xs font-medium text-zinc-600 mb-1">
                      이용 종료 시간
                    </label>
                    <select
                      id="end-time-select"
                      value={endTime}
                      onChange={(e) => {
                        const nextEnd = e.target.value;
                        if (nextEnd <= startTime) {
                          addToast('종료 시간은 시작 시간보다 늦어야 합니다.', 'error');
                          return;
                        }
                        setEndTime(nextEnd);
                      }}
                      className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
                    >
                      {END_HOURS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 4-Column Full-Width KPI Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
                <div>
                  <p className="text-xs font-medium text-zinc-500">전체 열람실 좌석</p>
                  <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-zinc-950">
                    {stats.total}석
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">제1·2·3열람실 통합 정원</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-zinc-500">선택 시간대 이용 가능</p>
                  <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700">
                    {stats.available}석
                  </p>
                  <p className="mt-1 text-xs font-mono tabular-nums text-zinc-500">
                    {startTime} - {endTime} 기준
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-zinc-500">선택 시간대 사용 중</p>
                  <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-zinc-800">
                    {stats.occupied}석
                  </p>
                  <p className="mt-1 text-xs font-mono tabular-nums text-zinc-500">
                    실시간 좌석 점유율 {stats.occupancyRate}%
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-zinc-500">내 활성 예약 / 즐겨찾기</p>
                  <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-zinc-950">
                    {stats.myReservationsCount}건
                  </p>
                  <p className="mt-1 text-xs font-mono tabular-nums text-zinc-600 font-medium">
                    ★ 즐겨찾기 {favoriteSeatIds.length}석 등록됨
                  </p>
                </div>
              </div>

              {/* Recharts Reading Room Occupancy Pie Charts */}
              <OccupancyPieCharts
                seats={seats}
                selectedRoom={selectedRoom}
                onSelectRoom={setSelectedRoom}
                getOverlappingReservation={getOverlappingReservation}
                userId={userId}
                startTime={startTime}
                endTime={endTime}
              />
            </section>

            {/* Primary 2-Column Workspace: Left Seat Map Grid (8 cols) + Right Booking & My Reservations (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Multi-Shape & Multi-Zone Interactive Seat Map */}
              <section className="lg:col-span-8 bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs">
                {/* Control Header: Layout Mode + Find Best Seat + Favorites Filter */}
                <div className="space-y-4 pb-6 border-b border-zinc-200">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-zinc-950">
                        1. 열람실 구역 및 좌석 배치 모드 선택
                      </h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        각 열람실 구역과 좌석 상태는 고유한 색상·도형·테두리 모양으로 구분되며 직접 클릭하여 필터링할 수 있습니다.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Layout View Switcher (Architectural Floorplan vs Compact Grid) */}
                      <div className="flex items-center p-0.5 bg-zinc-100 border border-zinc-200 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setLayoutMode('ARCHITECTURAL')}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                            layoutMode === 'ARCHITECTURAL'
                              ? 'bg-zinc-900 text-white shadow-2xs'
                              : 'text-zinc-600 hover:text-zinc-900'
                          }`}
                        >
                          <Map className="w-3.5 h-3.5" />
                          <span>건축 평면도형</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLayoutMode('COMPACT')}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                            layoutMode === 'COMPACT'
                              ? 'bg-zinc-900 text-white shadow-2xs'
                              : 'text-zinc-600 hover:text-zinc-900'
                          }`}
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>컴팩트 격자형</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleFindBestSeat}
                        className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-950 text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5 text-emerald-400" />
                        <span>맞춤 좌석 추천</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOnlyFavoritesFilter(prev => !prev)}
                        className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                          onlyFavoritesFilter
                            ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                            : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                        }`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            onlyFavoritesFilter ? 'fill-white text-white' : 'fill-amber-400 text-amber-500'
                          }`}
                        />
                        <span>즐겨찾기 ({favoriteSeatIds.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Distinct Room Cards with Different Shapes & Colors */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(['ALL', 'R1', 'R2', 'R3'] as RoomFilterKey[]).map(roomKey => {
                      const theme = ROOM_THEMES[roomKey];
                      const isActive = selectedRoom === roomKey;
                      const roomSeats =
                        roomKey === 'ALL' ? seats : seats.filter(s => s.room_id === roomKey);
                      const availInRoom = roomSeats.filter(
                        s => !getOverlappingReservation(s.seat_id)
                      ).length;

                      return (
                        <button
                          key={roomKey}
                          type="button"
                          onClick={() => setSelectedRoom(roomKey)}
                          className={`p-3 text-left transition-all cursor-pointer ${
                            isActive ? theme.activeTabClass : theme.inactiveTabClass
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-xs font-bold whitespace-nowrap flex items-center gap-1">
                              <span>{theme.shapeSymbol}</span>
                              <span>{theme.name}</span>
                            </span>
                            <span
                              className={`text-[11px] font-mono tabular-nums ${
                                isActive ? 'text-white/90 font-semibold' : 'opacity-80'
                              }`}
                            >
                              {availInRoom}/{roomSeats.length}석
                            </span>
                          </div>
                          <p
                            className={`text-[11px] mt-1 truncate ${
                              isActive ? 'text-white/80' : 'opacity-75'
                            }`}
                          >
                            {theme.shapeName}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Interactive Sub-Zone Selector + Interactive Status Shape Filter Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    {/* Sub-Zone Filter Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-zinc-500 font-medium mr-1">세부 구역:</span>
                      <button
                        type="button"
                        onClick={() => setSelectedZoneFilter('ALL_ZONES')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          selectedZoneFilter === 'ALL_ZONES'
                            ? 'bg-zinc-900 text-white'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                      >
                        전체 구역
                      </button>
                      {availableSubZones.map(z => (
                        <button
                          key={z}
                          type="button"
                          onClick={() =>
                            setSelectedZoneFilter(prev => (prev === z ? 'ALL_ZONES' : z))
                          }
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                            selectedZoneFilter === z
                              ? 'bg-zinc-900 text-white'
                              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          {z}
                        </button>
                      ))}
                    </div>

                    {/* Interactive Status Shape Filter Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-zinc-500 font-medium mr-1">상태별 선택:</span>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('ALL_STATUS')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                          statusFilter === 'ALL_STATUS'
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                        }`}
                      >
                        전체
                      </button>

                      {/* ○ 이용 가능 */}
                      <button
                        type="button"
                        onClick={() =>
                          setStatusFilter(prev =>
                            prev === 'AVAILABLE' ? 'ALL_STATUS' : 'AVAILABLE'
                          )
                        }
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-colors flex items-center gap-1 cursor-pointer ${
                          statusFilter === 'AVAILABLE'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-emerald-700 border-emerald-500/80 hover:bg-emerald-50'
                        }`}
                      >
                        <span>○</span>
                        <span>이용 가능</span>
                      </button>

                      {/* ★ 내 예약 */}
                      <button
                        type="button"
                        onClick={() =>
                          setStatusFilter(prev => (prev === 'MY_RES' ? 'ALL_STATUS' : 'MY_RES'))
                        }
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold border-2 transition-colors flex items-center gap-1 cursor-pointer ${
                          statusFilter === 'MY_RES'
                            ? 'bg-blue-600 text-white border-blue-700'
                            : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                        }`}
                      >
                        <span>★</span>
                        <span>내 예약</span>
                      </button>

                      {/* — 사용 중 */}
                      <button
                        type="button"
                        onClick={() =>
                          setStatusFilter(prev =>
                            prev === 'OCCUPIED' ? 'ALL_STATUS' : 'OCCUPIED'
                          )
                        }
                        className={`px-2.5 py-1 rounded-none text-xs font-medium border border-dashed transition-colors flex items-center gap-1 cursor-pointer ${
                          statusFilter === 'OCCUPIED'
                            ? 'bg-zinc-700 text-white border-zinc-700'
                            : 'occupied-pattern text-zinc-500 border-zinc-300 hover:bg-zinc-200/60'
                        }`}
                      >
                        <span>—</span>
                        <span>사용 중</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Loading Spinner or Room-Grouped Seat Tile Grid */}
                {isLoading ? (
                  <div className="py-24 flex flex-col items-center justify-center text-center">
                    <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-3" />
                    <p className="text-sm font-semibold text-zinc-800">
                      좌석 배치 및 예약 현황을 불러오는 중입니다...
                    </p>
                    <p className="text-xs font-mono text-zinc-500 mt-1">
                      GET ?action=getSeats &amp; ?action=getReservations&amp;date={selectedDate}
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    {(() => {
                      const renderedRoomBlocks = visibleRoomKeys
                        .map(roomKey => {
                          const roomTheme = ROOM_THEMES[roomKey];
                          let roomSeats = seats.filter(s => s.room_id === roomKey);

                          if (onlyFavoritesFilter) {
                            roomSeats = roomSeats.filter(s => favoriteSeatIds.includes(s.seat_id));
                          }
                          if (selectedZoneFilter !== 'ALL_ZONES') {
                            roomSeats = roomSeats.filter(s => s.zone === selectedZoneFilter);
                          }
                          if (statusFilter !== 'ALL_STATUS') {
                            roomSeats = roomSeats.filter(s => {
                              const res = getOverlappingReservation(s.seat_id);
                              if (statusFilter === 'AVAILABLE') return !res;
                              if (statusFilter === 'MY_RES') return Boolean(res && res.user_id === userId);
                              if (statusFilter === 'OCCUPIED') return Boolean(res && res.user_id !== userId);
                              return true;
                            });
                          }

                          if (roomSeats.length === 0) return null;

                          const availableCount = roomSeats.filter(
                            s => !getOverlappingReservation(s.seat_id)
                          ).length;

                          // Room-specific spatial layout when in ARCHITECTURAL floorplan mode
                          const renderRoomInterior = () => {
                            if (layoutMode === 'COMPACT') {
                              return (
                                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                  {roomSeats.map(seat => renderSeatTile(seat))}
                                </div>
                              );
                            }

                            if (roomKey === 'R1') {
                              // R1 Architectural Layout: Row A (Window Side) + Central Corridor + Row B (Inner/Wall Side)
                              const explicitRowA = roomSeats.filter(s => s.seat_number.toUpperCase().startsWith('A'));
                              const explicitRowB = roomSeats.filter(s => s.seat_number.toUpperCase().startsWith('B'));
                              const useExplicitAB =
                                explicitRowA.length + explicitRowB.length === roomSeats.length &&
                                (explicitRowA.length > 0 || explicitRowB.length > 0);
                              const halfIdx = Math.ceil(roomSeats.length / 2);
                              const rowASeats = useExplicitAB ? explicitRowA : roomSeats.slice(0, halfIdx);
                              const rowBSeats = useExplicitAB ? explicitRowB : roomSeats.slice(halfIdx);
                              return (
                                <div className="p-4 space-y-3">
                                  {rowASeats.length > 0 && (
                                    <div>
                                      <div className="mb-2 flex items-center justify-between text-[11px] text-teal-800 font-medium px-1">
                                        <span>▲ 북측 전면 채광창 구역 (A열 · 라운딩 아치형 데스크)</span>
                                        <span className="font-mono tabular-nums">{rowASeats.length}석</span>
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                        {rowASeats.map(seat => renderSeatTile(seat))}
                                      </div>
                                    </div>
                                  )}

                                  {rowASeats.length > 0 && rowBSeats.length > 0 && (
                                    <div className="py-1.5 px-3 bg-zinc-100/90 border border-dashed border-zinc-300 rounded-md flex items-center justify-between text-[10px] font-mono text-zinc-500">
                                      <span>← 제1열람실 중앙 이동 통로 (MAIN AISLE) →</span>
                                      <span>정숙 유지 구역</span>
                                    </div>
                                  )}

                                  {rowBSeats.length > 0 && (
                                    <div>
                                      <div className="mb-2 flex items-center justify-between text-[11px] text-teal-800 font-medium px-1">
                                        <span>▼ 내측 집중 및 벽면 열람 구역 (B열 · 라운딩 아치형 데스크)</span>
                                        <span className="font-mono tabular-nums">{rowBSeats.length}석</span>
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                        {rowBSeats.map(seat => renderSeatTile(seat))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            if (roomKey === 'R2') {
                              // R2 Architectural Layout: Media Workstation Pods (Row C & Row D with Power Busway)
                              const explicitRowC = roomSeats.filter(s => s.seat_number.toUpperCase().startsWith('C'));
                              const explicitRowD = roomSeats.filter(s => s.seat_number.toUpperCase().startsWith('D'));
                              const useExplicitCD =
                                explicitRowC.length + explicitRowD.length === roomSeats.length &&
                                (explicitRowC.length > 0 || explicitRowD.length > 0);
                              const halfIdx = Math.ceil(roomSeats.length / 2);
                              const rowCSeats = useExplicitCD ? explicitRowC : roomSeats.slice(0, halfIdx);
                              const rowDSeats = useExplicitCD ? explicitRowD : roomSeats.slice(halfIdx);
                              return (
                                <div className="p-4 space-y-3">
                                  {rowCSeats.length > 0 && (
                                    <div className="p-3 bg-white/70 border border-indigo-100 rounded-xl">
                                      <div className="mb-2 flex items-center justify-between text-[11px] text-indigo-900 font-medium">
                                        <span>◆ C존 · 듀얼모니터 및 노트북 데스크 구역 (상단 모니터 베젤형)</span>
                                        <span className="font-mono tabular-nums">전 좌석 고속충전 콘센트</span>
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                        {rowCSeats.map(seat => renderSeatTile(seat))}
                                      </div>
                                    </div>
                                  )}

                                  {rowDSeats.length > 0 && (
                                    <div className="p-3 bg-white/70 border border-indigo-100 rounded-xl">
                                      <div className="mb-2 flex items-center justify-between text-[11px] text-indigo-900 font-medium">
                                        <span>◆ D존 · 와이드 미디어 테이블 구역 (키보드·마우스 허용)</span>
                                        <span className="font-mono tabular-nums">기가비트 Wi-Fi 6E</span>
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                        {rowDSeats.map(seat => renderSeatTile(seat))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            // R3 Architectural Layout: Isolated U-Partition Private Carrel Booths
                            return (
                              <div className="p-4">
                                <div className="mb-2.5 flex items-center justify-between text-[11px] text-violet-900 font-medium px-1">
                                  <span>▲ E존 · 3면 방음 파티션 1인 독립 부스 (U-파티션 캐럴형)</span>
                                  <span className="font-mono tabular-nums">개별 조명 · 독립 콘센트</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                  {roomSeats.map(seat => renderSeatTile(seat))}
                                </div>
                              </div>
                            );
                          };

                          return (
                            <div
                              key={roomKey}
                              className={`rounded-xl border overflow-hidden ${roomTheme.sectionBorderClass} ${roomTheme.sectionBgClass}`}
                            >
                              {/* Distinct Color-Coded & Shape-Marked Room Zone Header Bar */}
                              <div
                                className={`px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${roomTheme.sectionHeaderClass}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2.5 h-2.5 shrink-0 ${roomTheme.indicatorClass}`}
                                  />
                                  <h3 className="text-sm font-bold">{roomTheme.name}</h3>
                                  <span aria-hidden="true" className="opacity-40">
                                    ·
                                  </span>
                                  <span className="text-xs opacity-80">{roomTheme.subtitle}</span>
                                </div>

                                <div className="text-xs font-mono tabular-nums font-semibold shrink-0">
                                  이용 가능 {availableCount}석 / 표시 {roomSeats.length}석
                                </div>
                              </div>

                              {renderRoomInterior()}
                            </div>
                          );
                        })
                        .filter(Boolean);

                      if (renderedRoomBlocks.length === 0) {
                        return (
                          <div className="py-16 px-4 text-center bg-zinc-50 border border-zinc-200 rounded-xl">
                            <p className="text-sm font-semibold text-zinc-800">
                              선택한 필터 조건에 해당하는 좌석이 없습니다.
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">
                              세부 구역, 상태 필터 또는 즐겨찾기 필터를 초기화하여 전체 좌석을 확인해 보세요.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRoom('ALL');
                                setOnlyFavoritesFilter(false);
                                setSelectedZoneFilter('ALL_ZONES');
                                setStatusFilter('ALL_STATUS');
                              }}
                              className="mt-4 px-3.5 py-2 text-xs font-semibold text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 cursor-pointer"
                            >
                              필터 전체 초기화
                            </button>
                          </div>
                        );
                      }

                      return renderedRoomBlocks;
                    })()}
                  </div>
                )}
              </section>

              {/* Right Column: Monotone Outer Control Panels (Favorites, Booking Form, My Reservations) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Favorite Seats Quick-Access Panel */}
                <section className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs">
                  <div className="pb-3.5 border-b border-zinc-200 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-500 shrink-0" />
                      <h2 className="text-base font-bold text-zinc-950">내 즐겨찾기 좌석</h2>
                    </div>
                    <span className="text-xs font-mono tabular-nums font-semibold text-zinc-700">
                      {favoriteSeatsList.length}석
                    </span>
                  </div>

                  {favoriteSeatsList.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs font-medium text-zinc-600">
                        즐겨찾기에 등록된 좌석이 없습니다.
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        좌석 배치도 타일의 별(☆) 아이콘을 눌러 자주 쓰는 좌석을 등록해 두세요.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3.5 space-y-2">
                      {favoriteSeatsList.map(favSeat => {
                        const overlappingRes = getOverlappingReservation(favSeat.seat_id);
                        const isOccupied = Boolean(overlappingRes);
                        const isMyRes = overlappingRes?.user_id === userId;
                        const isSelected = selectedSeatId === favSeat.seat_id;

                        return (
                          <div
                            key={favSeat.seat_id}
                            className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-zinc-950 text-white border-zinc-950'
                                : 'bg-zinc-50 text-zinc-900 border-zinc-200'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums">
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleFavorite(favSeat.seat_id, e)}
                                  title="즐겨찾기 해제"
                                  className="hover:scale-110 transition-transform cursor-pointer"
                                >
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                </button>
                                <span className="font-bold">{favSeat.seat_id}</span>
                                <span aria-hidden="true" className="opacity-40">·</span>
                                <span className={isSelected ? 'text-zinc-300 font-sans' : 'text-zinc-600 font-sans'}>
                                  {favSeat.zone}
                                </span>
                              </div>
                              <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                {favSeat.room_name} · {favSeat.has_power ? '콘센트' : '일반'}
                              </p>
                            </div>

                            <div className="shrink-0">
                              {isMyRes ? (
                                <span className="text-[11px] font-mono font-semibold text-blue-600">
                                  내 예약 중
                                </span>
                              ) : isOccupied ? (
                                <span className="text-[11px] font-mono text-zinc-400">
                                  사용 중
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedSeatId(prev =>
                                      prev === favSeat.seat_id ? null : favSeat.seat_id
                                    )
                                  }
                                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-400 text-zinc-950'
                                      : 'bg-zinc-900 text-white hover:bg-zinc-800'
                                  }`}
                                >
                                  {isSelected ? '◆ 선택됨' : '바로 선택'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* Create Reservation Panel */}
                <section className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs">
                  <div className="pb-4 border-b border-zinc-200 flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-bold text-zinc-950">좌석 예약 신청</h2>
                      <p className="text-xs text-zinc-500 mt-1">
                        날짜와 시간을 지정하고 빈 좌석을 선택하거나 맞춤 추천을 받아보세요.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleFindBestSeat}
                      className="px-2.5 py-1.5 text-xs font-semibold text-zinc-900 bg-zinc-100 border border-zinc-300 rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-zinc-800" />
                      <span>맞춤 추천</span>
                    </button>
                  </div>

                  {/* Recommendation Breakdown Box */}
                  {recommendation && selectedSeatId === recommendation.seat.seat_id && (
                    <div className="mt-4 p-3.5 rounded-xl bg-zinc-100 border border-zinc-300 text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-zinc-950 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                          <span>맞춤 좌석 추천 완료 ({recommendation.seat.seat_id})</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleFindBestSeat}
                          className="text-[11px] font-semibold text-zinc-800 underline hover:text-zinc-950 cursor-pointer"
                        >
                          다음 추천 보기
                        </button>
                      </div>
                      <p className="text-[11px] text-zinc-700">
                        추천 사유: {recommendation.reasons.join(' · ')}
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {recommendation.preferenceSummary}
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleCreateReservation} className="mt-5 space-y-4">
                    <div>
                      <label htmlFor="user-id-input" className="block text-xs font-medium text-zinc-700 mb-1">
                        이용자 ID (user_id)
                      </label>
                      <input
                        id="user-id-input"
                        type="text"
                        required
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="user_001"
                        className="w-full px-3 py-2 text-sm font-mono bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
                      />
                    </div>

                    {/* Selected Seat Details */}
                    <div
                      className={`p-4 rounded-xl border transition-colors ${
                        selectedSeatObj
                          ? 'bg-zinc-950 text-white border-zinc-950'
                          : 'bg-zinc-50 text-zinc-900 border-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className={selectedSeatObj ? 'text-zinc-300' : 'text-zinc-500'}>
                          선택 좌석 ID
                        </span>
                        {selectedSeatObj ? (
                          <button
                            type="button"
                            onClick={() => handleToggleFavorite(selectedSeatObj.seat_id)}
                            className="flex items-center gap-1 text-xs font-medium text-amber-300 hover:underline cursor-pointer"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                favoriteSeatIds.includes(selectedSeatObj.seat_id)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-amber-300'
                              }`}
                            />
                            <span>
                              {favoriteSeatIds.includes(selectedSeatObj.seat_id)
                                ? '즐겨찾기 등록됨'
                                : '즐겨찾기 추가'}
                            </span>
                          </button>
                        ) : (
                          <span className="font-medium text-zinc-400">미선택</span>
                        )}
                      </div>

                      <p className="mt-1.5 text-lg font-bold font-mono tabular-nums">
                        {selectedSeatObj
                          ? `◆ ${selectedSeatObj.seat_id} (${selectedSeatObj.seat_number})`
                          : '좌석을 선택해 주세요'}
                      </p>

                      <p
                        className={`mt-1 text-xs ${
                          selectedSeatObj ? 'text-zinc-300' : 'text-zinc-500'
                        }`}
                      >
                        {selectedSeatObj
                          ? `${selectedSeatObj.room_name} · ${selectedSeatObj.zone} · ${
                              selectedSeatObj.has_power ? '개별 콘센트 완비' : '일반 열람석'
                            }`
                          : '좌측 배치도에서 ○(이용 가능) 좌석 타일을 클릭하세요.'}
                      </p>
                    </div>

                    {/* Booking Payload Preview */}
                    <div className="pt-2 border-t border-zinc-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-zinc-500">예약 날짜 (date)</span>
                        <span className="font-mono font-medium tabular-nums text-zinc-950">
                          {selectedDate}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-0.5">
                        <span className="text-zinc-500">이용 시간 (start_time - end_time)</span>
                        <span className="font-mono font-medium tabular-nums text-zinc-950">
                          {startTime} - {endTime}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedSeatObj || isSubmitting}
                      className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {isSubmitting ? '구글 시트에 예약 등록 중...' : '선택 좌석 예약하기'}
                    </button>
                  </form>
                </section>

                {/* My Reservations & Cancellation Panel */}
                <section id="my-reservations-panel" className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs">
                  <div className="pb-4 border-b border-zinc-200 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-zinc-950">내 예약 확인 및 취소</h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        이용자 <span className="font-mono text-zinc-800">{userId}</span>의 당일 예약 내역
                      </p>
                    </div>
                    <span className="text-xs font-mono tabular-nums font-semibold text-zinc-900">
                      {myReservations.length}건
                    </span>
                  </div>

                  {/* Visual Countdown Timer Widget */}
                  {primaryCountdownTarget && (
                    <div className="mt-4 p-3.5 rounded-xl bg-zinc-950 text-white border border-zinc-800">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                          <Timer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{primaryCountdownTarget.countdown.label}</span>
                        </div>
                        <span className="text-[11px] font-mono tabular-nums text-emerald-300 font-semibold">
                          {primaryCountdownTarget.reservation.seat_id}
                        </span>
                      </div>

                      <div className="mt-2 flex items-baseline justify-between gap-2">
                        <span className="text-2xl font-bold font-mono tabular-nums tracking-tight text-white">
                          {primaryCountdownTarget.countdown.formattedTime}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-zinc-400">
                          {primaryCountdownTarget.countdown.subLabel}
                        </span>
                      </div>

                      <div className="mt-2.5 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            primaryCountdownTarget.countdown.mode === 'ACTIVE'
                              ? 'bg-blue-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{ width: `${primaryCountdownTarget.countdown.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {myReservations.length === 0 ? (
                    <div className="py-10 text-center">
                      <p className="text-xs font-medium text-zinc-600">
                        선택한 날짜에 등록된 내 예약이 없습니다.
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        좌석을 선택한 후 예약을 신청하면 예약 번호(RES-xxx)와 실시간 입실 카운트다운이 표시됩니다.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 divide-y divide-zinc-200">
                      {myReservations.map(res => {
                        const seatInfo = seats.find(s => s.seat_id === res.seat_id);
                        const isCancelling = cancellingId === res.reservation_id;
                        const isFav = favoriteSeatIds.includes(res.seat_id);
                        const itemCountdown = computeReservationCountdown(res, currentTime);
                        return (
                          <div
                            key={res.reservation_id}
                            className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums">
                                <button
                                  type="button"
                                  onClick={() => handleToggleFavorite(res.seat_id)}
                                  title={isFav ? '즐겨찾기 해제' : '즐겨찾기 등록'}
                                  className="cursor-pointer"
                                >
                                  <Star
                                    className={`w-3.5 h-3.5 ${
                                      isFav ? 'fill-amber-400 text-amber-400' : 'text-zinc-300 hover:text-amber-400'
                                    }`}
                                  />
                                </button>
                                <span className="font-bold text-blue-700">{res.seat_id}</span>
                                <span aria-hidden="true" className="text-zinc-300">·</span>
                                <span className="text-zinc-600">{res.reservation_id}</span>
                              </div>
                              <p className="text-xs text-zinc-600 mt-0.5 truncate">
                                {seatInfo ? `${seatInfo.room_name} · ${seatInfo.zone}` : '열람실 좌석'}
                              </p>
                              <p className="text-[11px] font-mono tabular-nums text-zinc-500 mt-0.5">
                                {res.date} · {res.start_time} - {res.end_time}
                                <span aria-hidden="true" className="mx-1 text-zinc-300">·</span>
                                <span className="text-zinc-900 font-semibold">
                                  남은 시간 {itemCountdown.formattedTime}
                                </span>
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setQrReservation(res)}
                                className="px-2.5 py-1.5 text-xs font-semibold text-zinc-800 bg-zinc-100 border border-zinc-300 rounded-lg hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer"
                              >
                                <QrCode className="w-3.5 h-3.5 text-zinc-700" />
                                <span>QR 코드 생성</span>
                              </button>
                              <button
                                type="button"
                                disabled={isCancelling}
                                onClick={() => handleCancelReservation(res.reservation_id)}
                                className="px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                {isCancelling ? '취소 중...' : '예약 취소'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Recent Reservations Subsection */}
                  <div className="mt-6 pt-5 border-t border-zinc-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
                      <div className="flex items-center gap-1.5">
                        <History className="w-4 h-4 text-zinc-700 shrink-0" />
                        <h3 className="text-sm font-bold text-zinc-950">최근 이용 내역 (빠른 재예약)</h3>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <label htmlFor="rebook-date-input" className="text-[11px] font-medium text-zinc-500 whitespace-nowrap">
                          재예약 희망일:
                        </label>
                        <input
                          id="rebook-date-input"
                          type="date"
                          min={getTodayDateString()}
                          value={rebookTargetDate}
                          onChange={(e) => e.target.value && setRebookTargetDate(e.target.value)}
                          className="px-2 py-1 text-[11px] font-mono tabular-nums bg-zinc-50 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>
                    </div>

                    {userRecentHistory.length === 0 ? (
                      <p className="text-xs text-zinc-400 py-4 text-center">
                        이전 완료된 예약 이력이 없습니다.
                      </p>
                    ) : (
                      <div className="divide-y divide-zinc-100">
                        {userRecentHistory.map(past => {
                          const seatInfo = seats.find(s => s.seat_id === past.seat_id);
                          const isSelectedForRebook =
                            selectedSeatId === past.seat_id &&
                            selectedDate === rebookTargetDate &&
                            startTime === past.start_time &&
                            endTime === past.end_time;

                          return (
                            <div
                              key={`${past.reservation_id}-${past.date}`}
                              className="py-2.5 flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums">
                                  <span className="font-bold text-zinc-950">{past.seat_id}</span>
                                  <span aria-hidden="true" className="text-zinc-300">·</span>
                                  <span className="font-sans text-zinc-600 truncate">
                                    {seatInfo ? `${seatInfo.room_name} (${seatInfo.zone})` : '열람실 좌석'}
                                  </span>
                                </div>
                                <p className="text-[11px] font-mono tabular-nums text-zinc-400 mt-0.5">
                                  이전 이용: {past.date} · {past.start_time} - {past.end_time}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleQuickRebookSelect(past)}
                                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer ${
                                  isSelectedForRebook
                                    ? 'bg-zinc-950 text-white border-zinc-950'
                                    : 'bg-zinc-50 text-zinc-800 border-zinc-300 hover:bg-zinc-100'
                                }`}
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>{isSelectedForRebook ? '재예약 선택됨' : '빠른 재예약'}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>

            {/* Full-Width Daily Reservations Schedule & Live Fetch API Log (Monotone Outer Shell) */}
            <div id="daily-schedule-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Daily Reservations Table */}
              <section className="lg:col-span-8 bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
                  <div>
                    <h2 className="text-base font-bold text-zinc-950">일자별 전체 예약 현황</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      <span className="font-mono tabular-nums text-zinc-800">{selectedDate}</span> 기준 구글 시트에 등록된 전체 예약 목록입니다.
                    </p>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="예약번호, 좌석ID, 이용자 검색..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 text-xs font-semibold text-zinc-500">
                        <th className="py-3 px-3">예약 번호</th>
                        <th className="py-3 px-3">좌석 정보</th>
                        <th className="py-3 px-3">이용자 ID</th>
                        <th className="py-3 px-3">예약 일자</th>
                        <th className="py-3 px-3 text-right">이용 시간</th>
                        <th className="py-3 px-3 text-right">구분 / 관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-xs">
                      {filteredTableReservations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-zinc-500">
                            해당 날짜에 조회된 예약 데이터가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredTableReservations.map(res => {
                          const seatInfo = seats.find(s => s.seat_id === res.seat_id);
                          const isMine = res.user_id === userId;
                          const isFav = favoriteSeatIds.includes(res.seat_id);
                          return (
                            <tr key={res.reservation_id} className="hover:bg-zinc-50 transition-colors">
                              <td className="py-3 px-3 font-mono tabular-nums font-semibold text-zinc-950">
                                {res.reservation_id}
                              </td>
                              <td className="py-3 px-3">
                                <span className="inline-flex items-center gap-1">
                                  {isFav && <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />}
                                  <span className={`font-mono font-semibold ${isMine ? 'text-blue-700' : 'text-zinc-950'}`}>
                                    {res.seat_id}
                                  </span>
                                </span>
                                <span className="text-zinc-300 mx-1.5" aria-hidden="true">·</span>
                                <span className="text-zinc-600">{seatInfo ? seatInfo.room_name : '열람실'}</span>
                              </td>
                              <td className="py-3 px-3 font-mono text-zinc-700">
                                {res.user_id}
                                {isMine && <span className="ml-1.5 text-blue-700 font-sans font-semibold">(내 예약)</span>}
                              </td>
                              <td className="py-3 px-3 font-mono tabular-nums text-zinc-600">{res.date}</td>
                              <td className="py-3 px-3 font-mono tabular-nums text-right text-zinc-950">
                                {res.start_time} - {res.end_time}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="inline-flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setQrReservation(res)}
                                    className="px-2 py-1 text-[11px] font-semibold text-zinc-700 bg-zinc-100 border border-zinc-300 rounded-md hover:bg-zinc-200 inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                  >
                                    <QrCode className="w-3 h-3" />
                                    <span>QR 코드 생성</span>
                                  </button>
                                  {isMine ? (
                                    <button
                                      type="button"
                                      disabled={cancellingId === res.reservation_id}
                                      onClick={() => handleCancelReservation(res.reservation_id)}
                                      className="text-red-600 hover:underline font-medium whitespace-nowrap cursor-pointer"
                                    >
                                      예약 취소
                                    </button>
                                  ) : (
                                    <span className="text-zinc-400 whitespace-nowrap">사용 중</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Fetch API Communication Inspector */}
              <section className="lg:col-span-4 bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs">
                <div className="pb-4 border-b border-zinc-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-zinc-950">Fetch API 통신 내역</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      GET / POST (JSON.stringify) 요청 기록
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTempEndpointInput(endpointUrl);
                      setShowConfigModal(true);
                    }}
                    className="text-xs font-medium text-zinc-700 hover:text-zinc-950 underline cursor-pointer"
                  >
                    URL 설정
                  </button>
                </div>

                <div className="mt-4 space-y-3 max-h-[320px] overflow-y-auto">
                  {apiLogs.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-6 text-center">
                      아직 기록된 API 호출이 없습니다.
                    </p>
                  ) : (
                    apiLogs.map(log => (
                      <div key={log.id} className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={log.method === 'POST' ? 'font-bold text-zinc-950' : 'font-bold text-emerald-700'}>
                            {log.method}
                          </span>
                          <span className="text-zinc-400 tabular-nums">{log.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-zinc-700 break-all">{log.url}</p>
                        {log.payload && (
                          <pre className="mt-1 p-2 bg-zinc-950 text-zinc-100 rounded text-[10px] overflow-x-auto">
                            {log.payload}
                          </pre>
                        )}
                        <p className="text-[11px] text-zinc-500 pt-1">{log.responsePreview}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {/* Endpoint Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <h3 className="text-base font-bold text-zinc-950">
                Google Apps Script 백엔드 Endpoint 설정
              </h3>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEndpoint} className="mt-4 space-y-4">
              <div>
                <label htmlFor="gas-endpoint-url" className="block text-xs font-medium text-zinc-700 mb-1">
                  GAS Web App URL
                </label>
                <input
                  id="gas-endpoint-url"
                  type="text"
                  value={tempEndpointInput}
                  onChange={(e) => setTempEndpointInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 text-xs font-mono bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white"
                />
                <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                  실제 배포된 Google Apps Script 웹앱 URL을 입력하면 즉시 해당 엔드포인트로 <code className="font-mono">GET</code> 및 <code className="font-mono">POST (JSON.stringify)</code> 요청을 전송합니다. 기본값(<code className="font-mono">[YOUR_GAS_WEB_APP_URL]</code>)일 때는 브라우저 시뮬레이션 스토어로 동작합니다.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => {
                    setTempEndpointInput(DEFAULT_GAS_URL);
                    setEndpointUrl(DEFAULT_GAS_URL);
                    localStorage.removeItem('LIB_GAS_ENDPOINT_URL');
                    setShowConfigModal(false);
                    addToast('시뮬레이션 모드로 초기화되었습니다.', 'info');
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 cursor-pointer"
                >
                  기본 시뮬레이션으로 초기화
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 cursor-pointer"
                >
                  저장 및 연동 적용
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reservation Confirmation Modal */}
      {completedReservation && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-zinc-950">좌석 예약이 완료되었습니다</h3>
            </div>
            <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
              구글 시트 백엔드에 아래 예약 정보가 정상적으로 기록되었습니다. 발급된 예약 번호로 내 예약 내역에서 언제든 확인하거나 취소할 수 있습니다.
            </p>

            <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-xs space-y-2 tabular-nums">
              <div className="flex justify-between">
                <span className="text-zinc-500">예약 번호</span>
                <strong className="text-zinc-950">{completedReservation.reservation_id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">예약 좌석</span>
                <strong className="text-blue-700">{completedReservation.seat_id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">이용자 ID</span>
                <strong className="text-zinc-950">{completedReservation.user_id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">예약 일시</span>
                <strong className="text-zinc-950">
                  {completedReservation.date} ({completedReservation.start_time} - {completedReservation.end_time})
                </strong>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = completedReservation;
                  setCompletedReservation(null);
                  setQrReservation(target);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-800 bg-zinc-100 border border-zinc-300 rounded-lg hover:bg-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR 코드 생성</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedReservation(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Check-In Modal for Confirmed Reservations */}
      {qrReservation && (
        <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-zinc-950" />
                <h3 className="text-base font-bold text-zinc-950">도서관 출입구 체크인 QR 코드</h3>
              </div>
              <button
                type="button"
                onClick={() => setQrReservation(null)}
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 flex flex-col items-center">
              <div className="p-4 bg-white border-2 border-zinc-950 rounded-xl shadow-2xs">
                <QRCodeSVG
                  value={qrReservation.reservation_id}
                  size={184}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <p className="mt-3 text-sm font-bold font-mono tabular-nums text-zinc-950">
                {qrReservation.reservation_id}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 text-center">
                도서관 출입 게이트 리더기에 위 QR 코드를 스캔하여 입실 체크인을 진행해 주세요.
              </p>
            </div>

            <div className="mt-4 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-xs space-y-1.5 tabular-nums">
              <div className="flex justify-between">
                <span className="text-zinc-500">좌석 번호</span>
                <strong className="text-blue-700">{qrReservation.seat_id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">이용자 ID</span>
                <strong className="text-zinc-950">{qrReservation.user_id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">이용 일시</span>
                <strong className="text-zinc-950">
                  {qrReservation.date} · {qrReservation.start_time}-{qrReservation.end_time}
                </strong>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(qrReservation.reservation_id);
                  addToast(`예약 번호(${qrReservation.reservation_id})가 복사되었습니다.`, 'success');
                }}
                className="px-3 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>예약 번호 복사</span>
              </button>
              <button
                type="button"
                onClick={() => setQrReservation(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-zinc-950 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg border shadow-lg text-xs font-medium flex items-center gap-2.5 transition-all ${
              t.type === 'success'
                ? 'bg-zinc-950 text-white border-zinc-800'
                : t.type === 'error'
                ? 'bg-red-700 text-white border-red-800'
                : 'bg-white text-zinc-950 border-zinc-200'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-white shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Monotone Quiet Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 px-6 mt-12">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <span>중앙도서관 좌석 및 열람실 예약 시스템</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveView('code')}
              className="hover:text-zinc-950 underline cursor-pointer"
            >
              단일 index.html 및 GAS 코드 보기
            </button>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Fetch API (CORS JSON.stringify)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
