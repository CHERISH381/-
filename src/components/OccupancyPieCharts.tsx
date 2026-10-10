import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { Seat, Reservation } from '../App';

type RoomFilterKey = 'ALL' | 'R1' | 'R2' | 'R3';

interface OccupancyPieChartsProps {
  seats: Seat[];
  selectedRoom: RoomFilterKey;
  onSelectRoom: (room: RoomFilterKey) => void;
  getOverlappingReservation: (seatId: string) => Reservation | undefined;
  userId: string;
  startTime: string;
  endTime: string;
}

interface RoomStatItem {
  roomId: RoomFilterKey;
  name: string;
  shapeSymbol: string;
  total: number;
  occupied: number;
  myCount: number;
  otherOccupied: number;
  available: number;
  occupancyRate: number;
  primaryColor: string;
  emptyColor: string;
  borderAccent: string;
  bgTint: string;
  textAccent: string;
}

export const OccupancyPieCharts: React.FC<OccupancyPieChartsProps> = ({
  seats,
  selectedRoom,
  onSelectRoom,
  getOverlappingReservation,
  userId,
  startTime,
  endTime
}) => {
  const roomConfigs: Array<{
    roomId: RoomFilterKey;
    name: string;
    shapeSymbol: string;
    primaryColor: string;
    emptyColor: string;
    borderAccent: string;
    bgTint: string;
    textAccent: string;
  }> = [
    {
      roomId: 'ALL',
      name: '전체 열람실 통합',
      shapeSymbol: '■',
      primaryColor: '#18181B', // Zinc 900
      emptyColor: '#10B981', // Emerald 500
      borderAccent: 'border-zinc-900',
      bgTint: 'bg-zinc-100/80',
      textAccent: 'text-zinc-900'
    },
    {
      roomId: 'R1',
      name: '제1열람실 (일반·라운딩형)',
      shapeSymbol: '●',
      primaryColor: '#0F766E', // Teal 700
      emptyColor: '#CCFBF1',
      borderAccent: 'border-teal-700',
      bgTint: 'bg-teal-50/40',
      textAccent: 'text-teal-800'
    },
    {
      roomId: 'R2',
      name: '제2열람실 (노트북·와이드형)',
      shapeSymbol: '◆',
      primaryColor: '#4338CA', // Indigo 700
      emptyColor: '#E0E7FF',
      borderAccent: 'border-indigo-700',
      bgTint: 'bg-indigo-50/40',
      textAccent: 'text-indigo-800'
    },
    {
      roomId: 'R3',
      name: '제3열람실 (캐럴·부스형)',
      shapeSymbol: '▲',
      primaryColor: '#6D28D9', // Violet 700
      emptyColor: '#EDE9FE',
      borderAccent: 'border-violet-700',
      bgTint: 'bg-violet-50/40',
      textAccent: 'text-violet-800'
    }
  ];

  const roomStats: RoomStatItem[] = roomConfigs.map(cfg => {
    const targetSeats =
      cfg.roomId === 'ALL' ? seats : seats.filter(s => s.room_id === cfg.roomId);
    const total = targetSeats.length;
    let myCount = 0;
    let otherOccupied = 0;

    targetSeats.forEach(s => {
      const res = getOverlappingReservation(s.seat_id);
      if (res) {
        if (res.user_id === userId) {
          myCount++;
        } else {
          otherOccupied++;
        }
      }
    });

    const occupied = myCount + otherOccupied;
    const available = Math.max(0, total - occupied);
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return {
      ...cfg,
      total,
      occupied,
      myCount,
      otherOccupied,
      available,
      occupancyRate
    };
  });

  return (
    <div className="pt-6 border-t border-zinc-200 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-900">
            열람실 구역별 실시간 점유율 (클릭하여 구역 선택)
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            선택 시간대(<span className="font-mono tabular-nums text-zinc-800">{startTime} - {endTime}</span>) 기준 구역별 도넛 차트입니다.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-600 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block" />
            <span>내 예약</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-zinc-800 inline-block" />
            <span>사용 중 (구역별 테마색)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
            <span>이용 가능</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roomStats.map(stat => {
          const isSelected = selectedRoom === stat.roomId;

          const pieData = [
            ...(stat.myCount > 0
              ? [{ name: '내 예약 좌석', value: stat.myCount, color: '#2563EB' }]
              : []),
            ...(stat.otherOccupied > 0
              ? [{ name: '사용 중 좌석', value: stat.otherOccupied, color: stat.primaryColor }]
              : []),
            {
              name: '이용 가능 좌석',
              value: stat.available,
              color: stat.roomId === 'ALL' ? '#10B981' : stat.emptyColor
            }
          ];

          return (
            <div
              key={stat.roomId}
              role="button"
              tabIndex={0}
              onClick={() => onSelectRoom(stat.roomId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRoom(stat.roomId);
                }
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? `border-2 ${stat.borderAccent} ${stat.bgTint} shadow-xs`
                  : 'border-zinc-200 bg-zinc-50/40 hover:bg-white hover:border-zinc-300'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${stat.textAccent}`}>
                  <span className="text-[11px]">{stat.shapeSymbol}</span>
                  <span>{stat.name}</span>
                </span>
                <span className="text-xs font-mono tabular-nums text-zinc-500">
                  {stat.occupied}/{stat.total}석
                </span>
              </div>

              {/* Pie Chart Area */}
              <div className="relative h-36 w-full my-2 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={56}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                      isAnimationActive={true}
                      animationDuration={200}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={`cell-${stat.roomId}-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value}석`, name]}
                      contentStyle={{
                        backgroundColor: '#18181B',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        color: '#FAFAFA',
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono, Plus Jakarta Sans, sans-serif'
                      }}
                      itemStyle={{ color: '#FAFAFA' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Percentage Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={`text-base font-bold font-mono tabular-nums ${stat.textAccent}`}>
                    {stat.occupancyRate}%
                  </span>
                  <span className="text-[10px] text-zinc-500">점유율</span>
                </div>
              </div>

              {/* Card Bottom Breakdown */}
              <div className="pt-2 border-t border-zinc-200/80 flex items-center justify-between text-[11px] font-mono tabular-nums">
                <span className="text-emerald-700 font-semibold">
                  가능 {stat.available}석
                </span>
                <span className="text-zinc-300" aria-hidden="true">·</span>
                <span className="text-zinc-600">
                  사용 {stat.occupied}석
                  {stat.myCount > 0 ? ` (내 예약 ${stat.myCount})` : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
