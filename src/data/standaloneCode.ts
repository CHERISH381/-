export const STANDALONE_HTML_CODE = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>도서관 좌석 및 열람실 예약 시스템</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Noto+Sans+KR:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet" />
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Plus Jakarta Sans', 'Noto Sans KR', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          }
        }
      }
    };
  </script>
  <style>
    body {
      font-family: 'Plus Jakarta Sans', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #F4F4F5;
      background-image: radial-gradient(#D4D4D8 0.75px, transparent 0.75px);
      background-size: 20px 20px;
      color: #18181B;
    }
    .tabular-nums {
      font-variant-numeric: tabular-nums;
    }
    .occupied-pattern {
      background-image: repeating-linear-gradient(
        -45deg,
        rgba(244, 244, 245, 0.85),
        rgba(244, 244, 245, 0.85) 6px,
        rgba(228, 228, 231, 0.65) 6px,
        rgba(228, 228, 231, 0.65) 12px
      );
    }
  </style>
</head>
<body class="min-h-screen flex flex-col antialiased selection:bg-zinc-900 selection:text-white">

  <!-- Sleek Monotone Top Bar (Strict 3-Zone Contract) -->
  <header class="sticky top-0 z-30 bg-zinc-950 text-zinc-100 border-b border-zinc-800 px-6 py-4">
    <div class="max-w-[1360px] mx-auto flex items-center justify-between gap-8">
      <!-- Zone 1: Brand Title -->
      <a href="#" class="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
        중앙도서관 좌석 예약 시스템
      </a>

      <!-- Zone 2: Navigation Links -->
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
        <a href="#dashboard-section" class="hover:text-white transition-colors whitespace-nowrap shrink-0">좌석 배치도</a>
        <a href="#booking-section" class="hover:text-white transition-colors whitespace-nowrap shrink-0">예약 신청</a>
        <a href="#my-reservations-section" class="hover:text-white transition-colors whitespace-nowrap shrink-0">내 예약 내역</a>
        <button type="button" onclick="toggleConfigModal(true)" class="hover:text-white transition-colors whitespace-nowrap shrink-0">API 연동 설정</button>
      </nav>

      <!-- Zone 3: Primary Action -->
      <div class="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onclick="refreshAllData()"
          class="px-4 py-2 text-xs font-semibold text-zinc-950 bg-white rounded-lg hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <svg id="refresh-icon" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>현황 새로고침</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Workspace Container -->
  <main class="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8 space-y-8">

    <!-- Top Summary & Filter Control Strip -->
    <section class="bg-white border border-slate-200 rounded-xl p-6">
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <p class="text-xs font-medium text-slate-500 mb-1">실시간 열람실 좌석 및 예약 통합 관리</p>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">열람실 좌석 현황 및 예약</h1>
          <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
            <span id="connection-mode-label">연동 상태 확인 중</span>
            <span aria-hidden="true">·</span>
            <span>이용자 ID: <strong id="display-user-id" class="font-mono text-slate-800">user_001</strong></span>
            <span aria-hidden="true">·</span>
            <span>운영 시간: <strong class="font-mono text-slate-800">06:00 - 23:00</strong></span>
          </div>
        </div>

        <!-- Date & Time Window Filter Controls -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          <div>
            <label for="filter-date" class="block text-xs font-medium text-slate-600 mb-1">조회 및 예약 날짜</label>
            <input
              type="date"
              id="filter-date"
              onchange="handleDateChange(this.value)"
              class="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>
          <div>
            <label for="filter-start-time" class="block text-xs font-medium text-slate-600 mb-1">입실 시간</label>
            <select
              id="filter-start-time"
              onchange="handleTimeChange()"
              class="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            ></select>
          </div>
          <div>
            <label for="filter-end-time" class="block text-xs font-medium text-slate-600 mb-1">퇴실 시간</label>
            <select
              id="filter-end-time"
              onchange="handleTimeChange()"
              class="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            ></select>
          </div>
        </div>
      </div>

      <!-- KPI Metrics Bar (Full-Width 4-Column Row) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
        <div>
          <p class="text-xs font-medium text-slate-500">전체 등록 좌석</p>
          <p id="stat-total-seats" class="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">0석</p>
          <p class="mt-1 text-xs text-slate-500">제1·2·3열람실 통합</p>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500">선택 시간대 이용 가능</p>
          <p id="stat-available-seats" class="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700">0석</p>
          <p id="stat-time-window-caption" class="mt-1 text-xs text-slate-500 font-mono tabular-nums">09:00 - 13:00 기준</p>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500">선택 시간대 사용 중</p>
          <p id="stat-occupied-seats" class="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-700">0석</p>
          <p id="stat-occupancy-rate" class="mt-1 text-xs text-slate-500 font-mono tabular-nums">점유율 0%</p>
        </div>
        <div>
          <p class="text-xs font-medium text-slate-500">내 활성 예약 / 즐겨찾기</p>
          <p id="stat-my-reservations" class="mt-1 text-2xl font-bold font-mono tabular-nums text-blue-700">0건</p>
          <p id="stat-my-favorites" class="mt-1 text-xs text-amber-600 font-medium font-mono tabular-nums">★ 즐겨찾기 0석</p>
        </div>
      </div>
    </section>

    <!-- Main 2-Column Split: Left Seat Map Grid (8 cols) + Right Booking & My Reservations Panel (4 cols) -->
    <div id="dashboard-section" class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      <!-- Left Column: Reading Room Tabs & Seat Grid -->
      <div class="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6">
        <!-- 4 Distinct Room Filter Buttons -->
        <div class="flex flex-col gap-4 pb-6 border-b border-slate-200">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-sm font-bold text-slate-900">열람실 구역 선택</h2>
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onclick="findBestSeat()"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span class="text-emerald-400">◎</span>
                <span>맞춤 좌석 추천 (Find Best Seat)</span>
              </button>
              <button
                type="button"
                id="fav-filter-btn"
                onclick="toggleFavoriteFilter()"
                class="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300"
              >
                <span class="text-amber-500">★</span>
                <span id="fav-filter-btn-text">즐겨찾기만 보기 (0)</span>
              </button>
            </div>
          </div>

          <div id="room-tabs-container" class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <!-- Dynamically rendered distinct color room buttons -->
          </div>

          <!-- Interactive Status Filter Buttons -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
            <span class="text-slate-500 font-medium">상태별 선택 필터 (클릭하여 상태별 좌석 필터링)</span>
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" onclick="selectStatusFilter('ALL_STATUS')" class="px-2.5 py-1 rounded-md border border-zinc-300 bg-zinc-900 text-white font-semibold">전체 상태</button>
              <button type="button" onclick="selectStatusFilter('AVAILABLE')" class="px-2.5 py-1 rounded-full border-2 border-emerald-500 bg-white text-emerald-700 font-semibold">○ 이용 가능</button>
              <button type="button" onclick="selectStatusFilter('MY_RES')" class="px-2.5 py-1 rounded-md border-2 border-blue-600 bg-blue-50 text-blue-700 font-semibold">★ 내 예약</button>
              <button type="button" onclick="selectStatusFilter('OCCUPIED')" class="px-2.5 py-1 rounded-none border border-dashed border-zinc-300 occupied-pattern text-zinc-500 font-medium">— 사용 중</button>
            </div>
          </div>
        </div>

        <!-- Loading Spinner State -->
        <div id="seat-loading-state" class="hidden py-20 flex flex-col items-center justify-center text-center">
          <div class="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-3"></div>
          <p class="text-sm font-medium text-slate-700">구글 시트에서 좌석 및 예약 데이터를 불러오는 중입니다...</p>
          <p class="text-xs text-slate-500 mt-1 font-mono">GET ?action=getSeats &amp; getReservations</p>
        </div>

        <!-- Seat Sections Container -->
        <div id="seat-grid-container" class="mt-6 space-y-6">
          <!-- Room sections and seat tiles injected via JS -->
        </div>
      </div>

      <!-- Right Column: Favorite Quick-Bar, Reservation Form & My Reservations -->
      <div class="lg:col-span-4 space-y-6">

        <!-- Favorite Seats Quick-Select Panel -->
        <section class="bg-white border border-slate-200 rounded-xl p-6">
          <div class="pb-3 border-b border-slate-200 flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="text-amber-400 text-base leading-none">★</span>
              <h2 class="text-base font-bold text-slate-900">내 즐겨찾기 좌석</h2>
            </div>
            <span id="fav-panel-count" class="text-xs font-mono tabular-nums font-semibold text-amber-600">0석</span>
          </div>
          <div id="favorite-seats-quicklist" class="mt-3">
            <!-- Dynamically rendered favorite seats -->
          </div>
        </section>

        <!-- Reservation Form Card -->
        <section id="booking-section" class="bg-white border border-slate-200 rounded-xl p-6">
          <div class="pb-4 border-b border-slate-200">
            <h2 class="text-base font-bold text-slate-900">좌석 예약 신청</h2>
            <p class="text-xs text-slate-500 mt-1">배치도에서 이용 가능한 좌석을 클릭한 후 예약을 확정하세요.</p>
          </div>

          <form id="reservation-form" onsubmit="submitReservation(event)" class="mt-5 space-y-4">
            <div>
              <label for="input-user-id" class="block text-xs font-medium text-slate-700 mb-1">이용자 ID (학번/사번)</label>
              <input
                type="text"
                id="input-user-id"
                value="user_001"
                required
                oninput="updateUserId(this.value)"
                class="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                placeholder="예: user_001"
              />
            </div>

            <!-- Selected Seat Summary Box -->
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-slate-500">선택된 좌석</span>
                <span id="selected-seat-status-text" class="text-xs font-medium text-slate-500">미선택</span>
              </div>
              <p id="selected-seat-title" class="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900">
                좌석을 선택해 주세요
              </p>
              <p id="selected-seat-meta" class="mt-1 text-xs text-slate-500">
                좌측 배치도에서 초록 테두리(이용 가능) 좌석을 클릭하세요.
              </p>
            </div>

            <div class="space-y-2 pt-2 border-t border-slate-200 text-xs">
              <div class="flex justify-between py-1">
                <span class="text-slate-500">예약 일자</span>
                <span id="summary-date" class="font-mono font-medium text-slate-900 tabular-nums">-</span>
              </div>
              <div class="flex justify-between py-1">
                <span class="text-slate-500">이용 시간</span>
                <span id="summary-time" class="font-mono font-medium text-slate-900 tabular-nums">-</span>
              </div>
            </div>

            <button
              type="submit"
              id="submit-reservation-btn"
              disabled
              class="w-full py-2.5 px-4 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <span>선택 좌석 예약하기</span>
            </button>
          </form>
        </section>

        <!-- My Reservations List Card -->
        <section id="my-reservations-section" class="bg-white border border-slate-200 rounded-xl p-6">
          <div class="pb-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-slate-900">내 예약 확인 및 취소</h2>
              <p class="text-xs text-slate-500 mt-0.5">예약 번호 확인 및 실시간 입실 카운트다운</p>
            </div>
            <span id="my-res-count" class="text-xs font-mono tabular-nums text-blue-700 font-semibold">0건</span>
          </div>

          <div id="my-reservation-countdown-box" class="hidden mt-4 p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800">
            <div class="flex items-center justify-between gap-2 text-xs">
              <span id="countdown-label" class="text-slate-300 font-medium">입실 시작까지 남은 시간</span>
              <span id="countdown-seat" class="font-mono text-emerald-300 font-semibold tabular-nums"></span>
            </div>
            <div class="mt-1.5 flex items-baseline justify-between gap-2">
              <span id="countdown-time" class="text-2xl font-bold font-mono tabular-nums text-white">00:00:00</span>
              <span id="countdown-sub" class="text-[11px] font-mono tabular-nums text-slate-400"></span>
            </div>
            <div class="mt-2 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div id="countdown-bar" class="h-full bg-emerald-400 rounded-full transition-all duration-300" style="width: 50%"></div>
            </div>
          </div>

          <div id="my-reservations-list" class="mt-4 divide-y divide-slate-200">
            <!-- Dynamically populated -->
          </div>

          <div class="mt-6 pt-5 border-t border-slate-200">
            <div class="flex items-center justify-between gap-2 pb-2">
              <h3 class="text-sm font-bold text-slate-900">최근 이용 내역 (빠른 재예약)</h3>
              <span class="text-[11px] text-slate-400">익일 기준</span>
            </div>
            <div id="recent-history-list" class="divide-y divide-slate-100">
              <!-- Populated by JS -->
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- All Reservations Schedule Table for Selected Date -->
    <section class="bg-white border border-slate-200 rounded-xl p-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 class="text-base font-bold text-slate-900">일자별 전체 예약 타임라인</h2>
          <p class="text-xs text-slate-500 mt-0.5">선택한 날짜(<span id="table-date-label" class="font-mono tabular-nums"></span>)의 전체 좌석 예약 현황입니다.</p>
        </div>
        <div class="w-full sm:w-64">
          <input
            type="search"
            id="reservation-search"
            oninput="renderReservationsTable()"
            placeholder="좌석번호, 예약번호, 이용자 검색..."
            class="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
          />
        </div>
      </div>

      <div class="overflow-x-auto mt-4">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 text-xs font-semibold text-slate-500">
              <th class="py-3 px-3">예약 번호</th>
              <th class="py-3 px-3">좌석 정보</th>
              <th class="py-3 px-3">이용자 ID</th>
              <th class="py-3 px-3">예약 일자</th>
              <th class="py-3 px-3 text-right">이용 시간</th>
              <th class="py-3 px-3 text-right">상태 / 관리</th>
            </tr>
          </thead>
          <tbody id="all-reservations-tbody" class="divide-y divide-slate-100 text-xs">
            <!-- Populated by JS -->
          </tbody>
        </table>
      </div>
    </section>
  </main>

  <!-- API Endpoint Configuration Modal -->
  <div id="config-modal" class="fixed inset-0 z-50 hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl">
      <div class="flex items-center justify-between pb-4 border-b border-slate-200">
        <h3 class="text-base font-bold text-slate-900">Google Apps Script 웹앱 Endpoint 설정</h3>
        <button type="button" onclick="toggleConfigModal(false)" class="text-slate-400 hover:text-slate-700 text-sm font-medium">닫기</button>
      </div>
      <div class="mt-4 space-y-4">
        <div>
          <label for="gas-url-input" class="block text-xs font-medium text-slate-700 mb-1">Endpoint URL</label>
          <input
            type="url"
            id="gas-url-input"
            placeholder="https://script.google.com/macros/s/.../exec"
            class="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <p class="mt-1.5 text-xs text-slate-500 leading-relaxed">
            배포된 Google Apps Script 웹앱 URL을 입력하면 실제 구글 시트와 통신합니다. 기본값(<code class="font-mono">[YOUR_GAS_WEB_APP_URL]</code>) 상태에서는 브라우저 내장 시뮬레이션 스토어로 즉시 동작을 테스트할 수 있습니다.
          </p>
        </div>
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onclick="resetToDemoEndpoint()"
            class="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
          >
            데모 모드로 초기화
          </button>
          <button
            type="button"
            onclick="saveEndpointConfig()"
            class="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
          >
            저장 및 다시 불러오기
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Confirmation / Result Modal -->
  <div id="feedback-modal" class="fixed inset-0 z-50 hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl">
      <h3 id="feedback-modal-title" class="text-base font-bold text-slate-900">예약이 완료되었습니다</h3>
      <p id="feedback-modal-desc" class="mt-2 text-xs text-slate-600 leading-relaxed"></p>
      <div id="feedback-modal-detail" class="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs space-y-1.5 tabular-nums"></div>
      <div class="mt-5 flex justify-end">
        <button
          type="button"
          onclick="closeFeedbackModal()"
          class="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
        >
          확인
        </button>
      </div>
    </div>
  </div>

  <!-- QR Code Check-In Modal -->
  <div id="qr-modal" class="fixed inset-0 z-50 hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 shadow-xl">
      <div class="flex items-center justify-between pb-4 border-b border-slate-200">
        <h3 class="text-base font-bold text-slate-900">도서관 출입구 체크인 QR 코드</h3>
        <button type="button" onclick="closeQrModal()" class="text-slate-400 hover:text-slate-700 text-sm font-medium">닫기</button>
      </div>
      <div class="mt-5 flex flex-col items-center">
        <div class="p-4 bg-white border-2 border-slate-900 rounded-xl">
          <img id="qr-modal-img" src="" alt="Reservation QR Code" width="180" height="180" referrerpolicy="no-referrer" class="block w-[180px] h-[180px]" />
        </div>
        <p id="qr-modal-res-id" class="mt-3 text-sm font-bold font-mono tabular-nums text-slate-900"></p>
        <p class="mt-0.5 text-xs text-slate-500 text-center">도서관 출입 게이트 리더기에 스캔하여 체크인하세요.</p>
      </div>
      <div class="mt-5 flex justify-end">
        <button
          type="button"
          onclick="closeQrModal()"
          class="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
        >
          닫기
        </button>
      </div>
    </div>
  </div>

  <!-- Toast Notification Container -->
  <div id="toast-container" class="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"></div>

  <footer class="border-t border-slate-200 bg-white py-6 px-6 mt-12">
    <div class="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
      <span>중앙도서관 좌석 및 열람실 예약 시스템</span>
      <span class="font-mono tabular-nums">Google Sheets &amp; Apps Script REST API Integration</span>
    </div>
  </footer>

  <!-- Application JavaScript -->
  <script>
    const DEFAULT_PLACEHOLDER_URL = '[YOUR_GAS_WEB_APP_URL]';
    let ENDPOINT_URL = localStorage.getItem('LIB_GAS_ENDPOINT_URL') || DEFAULT_PLACEHOLDER_URL;

    function loadInitialFavorites() {
      const saved = localStorage.getItem('LIB_FAVORITE_SEATS_V1');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { return ['R1-A02', 'R2-C02']; }
      }
      const defaults = ['R1-A02', 'R2-C02'];
      localStorage.setItem('LIB_FAVORITE_SEATS_V1', JSON.stringify(defaults));
      return defaults;
    }

    let state = {
      userId: 'user_001',
      selectedDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '13:00',
      selectedRoom: 'ALL',
      statusFilter: 'ALL_STATUS',
      selectedSeatId: null,
      favoriteSeatIds: loadInitialFavorites(),
      onlyFavorites: false,
      seats: [],
      reservations: [],
      isLoading: false
    };

    const ROOM_THEMES = {
      ALL: {
        id: 'ALL',
        name: '전체 열람실',
        sub: '제1·2·3열람실 통합 보기',
        activeBtn: 'bg-slate-900 text-white border-slate-900 shadow-sm',
        inactiveBtn: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
        dot: 'bg-slate-900'
      },
      R1: {
        id: 'R1',
        name: '제1열람실 (일반)',
        sub: '자연채광 및 개방형 열람석',
        activeBtn: 'bg-teal-700 text-white border-teal-700 shadow-sm',
        inactiveBtn: 'bg-teal-50/60 text-teal-900 border-teal-200 hover:bg-teal-100/70',
        headerBg: 'bg-teal-50/70 border-teal-200 text-teal-950',
        accentText: 'text-teal-700',
        dot: 'bg-teal-600'
      },
      R2: {
        id: 'R2',
        name: '제2열람실 (노트북)',
        sub: '노트북·듀얼모니터 미디어석',
        activeBtn: 'bg-indigo-700 text-white border-indigo-700 shadow-sm',
        inactiveBtn: 'bg-indigo-50/60 text-indigo-900 border-indigo-200 hover:bg-indigo-100/70',
        headerBg: 'bg-indigo-50/70 border-indigo-200 text-indigo-950',
        accentText: 'text-indigo-700',
        dot: 'bg-indigo-600'
      },
      R3: {
        id: 'R3',
        name: '제3열람실 (집중 캐럴)',
        sub: '1인 독립형 몰입 공간',
        activeBtn: 'bg-violet-700 text-white border-violet-700 shadow-sm',
        inactiveBtn: 'bg-violet-50/60 text-violet-900 border-violet-200 hover:bg-violet-100/70',
        headerBg: 'bg-violet-50/70 border-violet-200 text-violet-950',
        accentText: 'text-violet-700',
        dot: 'bg-violet-600'
      }
    };

    const INITIAL_DEMO_SEATS = [
      { seat_id: 'R1-A01', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'A-01', zone: '창가석', has_power: true },
      { seat_id: 'R1-A02', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'A-02', zone: '창가석', has_power: true },
      { seat_id: 'R1-A03', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'A-03', zone: '창가석', has_power: false },
      { seat_id: 'R1-A04', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'A-04', zone: '창가석', has_power: false },
      { seat_id: 'R1-A05', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'A-05', zone: '중앙석', has_power: true },
      { seat_id: 'R1-B01', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'B-01', zone: '중앙석', has_power: true },
      { seat_id: 'R1-B02', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'B-02', zone: '중앙석', has_power: false },
      { seat_id: 'R1-B03', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'B-03', zone: '중앙석', has_power: false },
      { seat_id: 'R1-B04', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'B-04', zone: '벽면석', has_power: true },
      { seat_id: 'R1-B05', room_id: 'R1', room_name: '제1열람실 (일반)', seat_number: 'B-05', zone: '벽면석', has_power: true },
      { seat_id: 'R2-C01', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'C-01', zone: '듀얼모니터석', has_power: true },
      { seat_id: 'R2-C02', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'C-02', zone: '듀얼모니터석', has_power: true },
      { seat_id: 'R2-C03', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'C-03', zone: '노트북전용', has_power: true },
      { seat_id: 'R2-C04', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'C-04', zone: '노트북전용', has_power: true },
      { seat_id: 'R2-C05', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'C-05', zone: '노트북전용', has_power: true },
      { seat_id: 'R2-D01', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'D-01', zone: '협업테이블', has_power: true },
      { seat_id: 'R2-D02', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'D-02', zone: '협업테이블', has_power: true },
      { seat_id: 'R2-D03', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'D-03', zone: '노트북전용', has_power: true },
      { seat_id: 'R2-D04', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'D-04', zone: '노트북전용', has_power: true },
      { seat_id: 'R2-D05', room_id: 'R2', room_name: '제2열람실 (노트북)', seat_number: 'D-05', zone: '노트북전용', has_power: true },
      { seat_id: 'R3-E01', room_id: 'R3', room_name: '제3열람실 (집중 캐럴)', seat_number: 'E-01', zone: '1인 독립 캐럴', has_power: true },
      { seat_id: 'R3-E02', room_id: 'R3', room_name: '제3열람실 (집중 캐럴)', seat_number: 'E-02', zone: '1인 독립 캐럴', has_power: true },
      { seat_id: 'R3-E03', room_id: 'R3', room_name: '제3열람실 (집중 캐럴)', seat_number: 'E-03', zone: '1인 독립 캐럴', has_power: true },
      { seat_id: 'R3-E04', room_id: 'R3', room_name: '제3열람실 (집중 캐럴)', seat_number: 'E-04', zone: '1인 독립 캐럴', has_power: true },
      { seat_id: 'R3-E05', room_id: 'R3', room_name: '제3열람실 (집중 캐럴)', seat_number: 'E-05', zone: '1인 독립 캐럴', has_power: true }
    ];

    function getDemoReservations(dateStr) {
      const stored = localStorage.getItem('LIB_DEMO_RESERVATIONS');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.filter(r => r.date === dateStr && r.status !== 'CANCELLED');
      }
      const seed = [
        { reservation_id: 'RES-240901', user_id: 'user_001', seat_id: 'R1-A01', date: dateStr, start_time: '09:00', end_time: '13:00', status: 'CONFIRMED' },
        { reservation_id: 'RES-240902', user_id: 'user_104', seat_id: 'R1-A04', date: dateStr, start_time: '08:00', end_time: '12:00', status: 'CONFIRMED' },
        { reservation_id: 'RES-240903', user_id: 'user_208', seat_id: 'R1-B02', date: dateStr, start_time: '10:00', end_time: '15:00', status: 'CONFIRMED' },
        { reservation_id: 'RES-240904', user_id: 'user_312', seat_id: 'R2-C01', date: dateStr, start_time: '09:00', end_time: '14:00', status: 'CONFIRMED' },
        { reservation_id: 'RES-240905', user_id: 'user_089', seat_id: 'R3-E02', date: dateStr, start_time: '11:00', end_time: '18:00', status: 'CONFIRMED' }
      ];
      localStorage.setItem('LIB_DEMO_RESERVATIONS', JSON.stringify(seed));
      return seed;
    }

    function isRealEndpointConfigured() {
      return ENDPOINT_URL && ENDPOINT_URL !== DEFAULT_PLACEHOLDER_URL && ENDPOINT_URL.startsWith('http');
    }

    function normalizeSeatsList(rawInput) {
      if (!Array.isArray(rawInput) || rawInput.length === 0) return INITIAL_DEMO_SEATS;
      const r1Zones = ['창가석', '중앙석', '벽면석'];
      const r2Zones = ['듀얼모니터석', '노트북전용', '협업테이블'];
      const r3Zones = ['1인 독립 캐럴'];
      const roomCounters = { R1: 0, R2: 0, R3: 0 };
      const detectRoom = (item, sid) => {
        const rawRoom = String(item.room_id || item.room || item.room_name || item['열람실'] || '').trim().toUpperCase();
        const upId = sid.toUpperCase();
        if (rawRoom === 'R1' || rawRoom.includes('제1') || rawRoom.includes('1열람') || rawRoom.includes('일반') || upId.startsWith('R1')) return 'R1';
        if (rawRoom === 'R2' || rawRoom.includes('제2') || rawRoom.includes('2열람') || rawRoom.includes('노트북') || upId.startsWith('R2')) return 'R2';
        if (rawRoom === 'R3' || rawRoom.includes('제3') || rawRoom.includes('3열람') || rawRoom.includes('캐럴') || upId.startsWith('R3')) return 'R3';
        return null;
      };
      const explicitRooms = rawInput.map((item, i) => detectRoom(item || {}, String((item && (item.seat_id || item.id || item.seat_number)) || '')));
      const uniqueExplicit = new Set(explicitRooms.filter(Boolean));
      return rawInput.map((item, idx) => {
        const total = rawInput.length;
        const rawSeatId = String(item.seat_id || item.id || item.seat_number || item['좌석ID'] || \`S-\${String(idx + 1).padStart(2, '0')}\`).trim();
        let roomId = explicitRooms[idx];
        if (!roomId || uniqueExplicit.size < 2) {
          const r1Cut = Math.max(1, Math.ceil(total * 0.42));
          const r2Cut = Math.max(r1Cut + 1, Math.ceil(total * 0.75));
          roomId = idx < r1Cut ? 'R1' : idx < r2Cut ? 'R2' : 'R3';
        }
        const inRoomIdx = roomCounters[roomId]++;
        const roomName = roomId === 'R1' ? '제1열람실 (일반)' : roomId === 'R2' ? '제2열람실 (노트북)' : '제3열람실 (집중 캐럴)';
        const defaultZone = roomId === 'R1' ? r1Zones[inRoomIdx % r1Zones.length] : roomId === 'R2' ? r2Zones[inRoomIdx % r2Zones.length] : r3Zones[0];
        return {
          seat_id: rawSeatId,
          room_id: roomId,
          room_name: roomName,
          seat_number: String(item.seat_number || item.name || rawSeatId),
          zone: String(item.zone || item['세부구역'] || defaultZone),
          has_power: item.has_power !== undefined ? Boolean(item.has_power) : true
        };
      });
    }

    async function apiGetSeats() {
      if (!isRealEndpointConfigured()) {
        await new Promise(r => setTimeout(r, 250));
        return INITIAL_DEMO_SEATS;
      }
      const response = await fetch(\`\${ENDPOINT_URL}?action=getSeats\`, { method: 'GET', redirect: 'follow' });
      if (!response.ok) throw new Error(\`좌석 조회 실패 (HTTP \${response.status})\`);
      const json = await response.json();
      const rawList = Array.isArray(json) ? json : (json.data || json.seats || []);
      return normalizeSeatsList(rawList);
    }

    async function apiGetReservations(dateStr) {
      if (!isRealEndpointConfigured()) {
        await new Promise(r => setTimeout(r, 250));
        return getDemoReservations(dateStr);
      }
      const response = await fetch(\`\${ENDPOINT_URL}?action=getReservations&date=\${encodeURIComponent(dateStr)}\`, { method: 'GET', redirect: 'follow' });
      if (!response.ok) throw new Error(\`예약 조회 실패 (HTTP \${response.status})\`);
      const json = await response.json();
      return Array.isArray(json) ? json : (json.data || json.reservations || []);
    }

    async function apiCreateReservation(payload) {
      const requestBody = {
        action: 'createReservation',
        user_id: payload.user_id,
        seat_id: payload.seat_id,
        date: payload.date,
        start_time: payload.start_time,
        end_time: payload.end_time
      };

      if (!isRealEndpointConfigured()) {
        await new Promise(r => setTimeout(r, 350));
        const allStored = JSON.parse(localStorage.getItem('LIB_DEMO_RESERVATIONS') || '[]');
        const newRes = {
          ...requestBody,
          reservation_id: 'RES-' + Math.floor(100000 + Math.random() * 900000),
          status: 'CONFIRMED'
        };
        allStored.push(newRes);
        localStorage.setItem('LIB_DEMO_RESERVATIONS', JSON.stringify(allStored));
        return { success: true, reservation_id: newRes.reservation_id, data: newRes };
      }

      const response = await fetch(ENDPOINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(requestBody),
        redirect: 'follow'
      });
      if (!response.ok) throw new Error(\`예약 생성 요청 실패 (HTTP \${response.status})\`);
      return await response.json();
    }

    async function apiCancelReservation(reservationId) {
      const requestBody = {
        action: 'cancelReservation',
        reservation_id: reservationId
      };

      if (!isRealEndpointConfigured()) {
        await new Promise(r => setTimeout(r, 300));
        const allStored = JSON.parse(localStorage.getItem('LIB_DEMO_RESERVATIONS') || '[]');
        const updated = allStored.filter(r => r.reservation_id !== reservationId);
        localStorage.setItem('LIB_DEMO_RESERVATIONS', JSON.stringify(updated));
        return { success: true, reservation_id: reservationId };
      }

      const response = await fetch(ENDPOINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(requestBody),
        redirect: 'follow'
      });
      if (!response.ok) throw new Error(\`예약 취소 요청 실패 (HTTP \${response.status})\`);
      return await response.json();
    }

    function isTimeOverlapping(startA, endA, startB, endB) {
      return startA < endB && endA > startB;
    }

    function getActiveReservationForSeat(seatId) {
      return state.reservations.find(res =>
        res.seat_id === seatId &&
        res.status !== 'CANCELLED' &&
        isTimeOverlapping(state.startTime, state.endTime, res.start_time, res.end_time)
      );
    }

    function toggleFavoriteSeat(event, seatId) {
      if (event) event.stopPropagation();
      const idx = state.favoriteSeatIds.indexOf(seatId);
      if (idx >= 0) {
        state.favoriteSeatIds.splice(idx, 1);
        showToast(\`\${seatId} 좌석이 즐겨찾기에서 해제되었습니다.\`, 'info');
      } else {
        state.favoriteSeatIds.push(seatId);
        showToast(\`\${seatId} 좌석이 즐겨찾기에 등록되었습니다.\`, 'success');
      }
      localStorage.setItem('LIB_FAVORITE_SEATS_V1', JSON.stringify(state.favoriteSeatIds));
      renderAll();
    }

    function toggleFavoriteFilter() {
      state.onlyFavorites = !state.onlyFavorites;
      renderAll();
    }

    function selectStatusFilter(nextStatus) {
      state.statusFilter = state.statusFilter === nextStatus ? 'ALL_STATUS' : nextStatus;
      renderAll();
    }

    function findBestSeat() {
      const available = state.seats.filter(s => !getActiveReservationForSeat(s.seat_id));
      if (available.length === 0) {
        showToast('선택하신 시간대에 이용 가능한 빈 좌석이 없습니다.', 'error');
        return;
      }
      const favSeats = state.seats.filter(s => state.favoriteSeatIds.includes(s.seat_id));
      const roomCounts = {};
      let powerCount = 0;
      favSeats.forEach(s => {
        roomCounts[s.room_id] = (roomCounts[s.room_id] || 0) + 1;
        if (s.has_power) powerCount++;
      });
      const prefRoom = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'R1';
      const prefPower = favSeats.length === 0 ? true : (powerCount / favSeats.length >= 0.5);

      const scored = available.map(seat => {
        let score = 0;
        const reasons = [];
        if (state.favoriteSeatIds.includes(seat.seat_id)) {
          score += 50;
          reasons.push('즐겨찾기 좌석');
        }
        if (seat.room_id === prefRoom) {
          score += 25;
          reasons.push(seat.room_name);
        }
        if (seat.has_power === prefPower) {
          score += 15;
          reasons.push(seat.has_power ? '콘센트 완비' : '일반석');
        }
        return { seat, score, reasons };
      }).sort((a, b) => b.score - a.score);

      const best = scored[0];
      state.selectedSeatId = best.seat.seat_id;
      if (state.selectedRoom !== 'ALL' && state.selectedRoom !== best.seat.room_id) {
        state.selectedRoom = 'ALL';
      }
      renderAll();
      showToast(\`맞춤 좌석 추천: \${best.seat.seat_id} (\${best.reasons.join(' · ')})\`, 'success');
    }

    function initTimeSelects() {
      const startSel = document.getElementById('filter-start-time');
      const endSel = document.getElementById('filter-end-time');
      let startHtml = '';
      let endHtml = '';
      for (let h = 6; h <= 22; h++) {
        const t = String(h).padStart(2, '0') + ':00';
        startHtml += \`<option value="\${t}" \${t === state.startTime ? 'selected' : ''}>\${t}</option>\`;
      }
      for (let h = 7; h <= 23; h++) {
        const t = String(h).padStart(2, '0') + ':00';
        endHtml += \`<option value="\${t}" \${t === state.endTime ? 'selected' : ''}>\${t}</option>\`;
      }
      startSel.innerHTML = startHtml;
      endSel.innerHTML = endHtml;
    }

    async function refreshAllData() {
      setLoading(true);
      try {
        const [seatsData, reservationsData] = await Promise.all([
          apiGetSeats(),
          apiGetReservations(state.selectedDate)
        ]);
        state.seats = seatsData;
        state.reservations = reservationsData;
        if (state.selectedSeatId && getActiveReservationForSeat(state.selectedSeatId)) {
          state.selectedSeatId = null;
        }
        renderAll();
      } catch (err) {
        showToast(err.message || '데이터 수신 중 오류가 발생했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    }

    function setLoading(loading) {
      state.isLoading = loading;
      const loader = document.getElementById('seat-loading-state');
      const grid = document.getElementById('seat-grid-container');
      const icon = document.getElementById('refresh-icon');
      if (loading) {
        loader.classList.remove('hidden');
        grid.classList.add('hidden');
        icon.classList.add('animate-spin');
      } else {
        loader.classList.add('hidden');
        grid.classList.remove('hidden');
        icon.classList.remove('animate-spin');
      }
    }

    function renderAll() {
      const connLabel = document.getElementById('connection-mode-label');
      connLabel.textContent = isRealEndpointConfigured()
        ? 'Google Apps Script 실시간 연동 중'
        : '로컬 시뮬레이션 모드 (API 설정 가능)';

      document.getElementById('filter-date').value = state.selectedDate;
      document.getElementById('table-date-label').textContent = state.selectedDate;
      document.getElementById('summary-date').textContent = state.selectedDate;
      document.getElementById('summary-time').textContent = \`\${state.startTime} - \${state.endTime}\`;
      document.getElementById('stat-time-window-caption').textContent = \`\${state.startTime} - \${state.endTime} 기준\`;

      const favBtn = document.getElementById('fav-filter-btn');
      const favBtnText = document.getElementById('fav-filter-btn-text');
      favBtnText.textContent = \`즐겨찾기만 보기 (\${state.favoriteSeatIds.length})\`;
      if (state.onlyFavorites) {
        favBtn.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer bg-amber-500 text-white border-amber-600 shadow-xs';
      } else {
        favBtn.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300';
      }

      renderStats();
      renderRoomTabs();
      renderSeatGrid();
      renderFavoriteQuickList();
      renderSelectedSeatPanel();
      renderMyReservations();
      renderReservationsTable();
    }

    function renderStats() {
      const total = state.seats.length;
      let occupied = 0;
      state.seats.forEach(seat => {
        if (getActiveReservationForSeat(seat.seat_id)) occupied++;
      });
      const available = Math.max(0, total - occupied);
      const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
      const myCount = state.reservations.filter(r => r.user_id === state.userId && r.status !== 'CANCELLED').length;

      document.getElementById('stat-total-seats').textContent = \`\${total}석\`;
      document.getElementById('stat-available-seats').textContent = \`\${available}석\`;
      document.getElementById('stat-occupied-seats').textContent = \`\${occupied}석\`;
      document.getElementById('stat-occupancy-rate').textContent = \`점유율 \${rate}%\`;
      document.getElementById('stat-my-reservations').textContent = \`\${myCount}건\`;
      document.getElementById('stat-my-favorites').textContent = \`★ 즐겨찾기 \${state.favoriteSeatIds.length}석\`;
    }

    function renderRoomTabs() {
      const container = document.getElementById('room-tabs-container');
      container.innerHTML = ['ALL', 'R1', 'R2', 'R3'].map(roomKey => {
        const theme = ROOM_THEMES[roomKey];
        const active = state.selectedRoom === roomKey;
        const count = roomKey === 'ALL'
          ? state.seats.length
          : state.seats.filter(s => s.room_id === roomKey).length;
        return \`
          <button
            type="button"
            onclick="selectRoom('\${roomKey}')"
            class="p-3 rounded-xl border text-left transition-all cursor-pointer \${active ? theme.activeBtn : theme.inactiveBtn}"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-bold whitespace-nowrap">\${theme.name}</span>
              <span class="text-[11px] font-mono tabular-nums opacity-85">\${count}석</span>
            </div>
            <p class="text-[11px] mt-1 truncate \${active ? 'text-white/80' : 'opacity-75'}">\${theme.sub}</p>
          </button>
        \`;
      }).join('');
    }

    function renderSeatTileHtml(seat) {
      const activeRes = getActiveReservationForSeat(seat.seat_id);
      const isOccupied = Boolean(activeRes);
      const isSelected = state.selectedSeatId === seat.seat_id;
      const isMine = activeRes && activeRes.user_id === state.userId;
      const isFav = state.favoriteSeatIds.includes(seat.seat_id);

      let roomShape = 'rounded-xl';
      if (seat.room_id === 'R1') roomShape = 'rounded-t-2xl rounded-b-md border-b-4';
      else if (seat.room_id === 'R2') roomShape = 'rounded-lg border-t-4';
      else if (seat.room_id === 'R3') roomShape = 'rounded-t-sm rounded-b-xl border-x-4 border-t-4';

      let cardClass = 'bg-white border-2 border-emerald-600/85 hover:border-emerald-700 hover:shadow-xs text-zinc-900 cursor-pointer';
      let badgeSymbol = '○';
      let badgeSymbolClass = 'text-emerald-600';
      let statusLabel = '○ 이용 가능';
      let statusColor = 'text-emerald-700 font-semibold';
      let subTextColor = 'text-zinc-500';

      if (isSelected) {
        cardClass = 'bg-zinc-950 border-2 border-zinc-950 ring-2 ring-offset-2 ring-zinc-900 text-white shadow-md -translate-y-0.5 cursor-pointer';
        badgeSymbol = '◆';
        badgeSymbolClass = 'text-emerald-400';
        statusLabel = '◆ 선택됨 (예약 대기)';
        statusColor = 'text-emerald-300 font-semibold';
        subTextColor = 'text-zinc-300';
      } else if (isMine) {
        cardClass = 'bg-blue-600 border-2 border-blue-800 text-white shadow-xs cursor-default';
        badgeSymbol = '★';
        badgeSymbolClass = 'text-white';
        statusLabel = \`★ 내 예약 (\${activeRes.start_time}-\${activeRes.end_time})\`;
        statusColor = 'text-blue-100 font-semibold';
        subTextColor = 'text-blue-100';
      } else if (isOccupied) {
        cardClass = 'occupied-pattern border border-dashed border-zinc-300 text-zinc-400 opacity-75 cursor-not-allowed';
        badgeSymbol = '—';
        badgeSymbolClass = 'text-zinc-400';
        statusLabel = \`— 사용 중 (\${activeRes.start_time}-\${activeRes.end_time})\`;
        statusColor = 'text-zinc-500';
        subTextColor = 'text-zinc-400';
      }

      return \`
        <div
          onclick="\${isOccupied ? '' : \`selectSeat('\${seat.seat_id}')\`}"
          class="p-3.5 text-left transition-all flex flex-col justify-between min-h-[112px] relative \${roomShape} \${cardClass}"
        >
          <div class="flex items-center justify-between gap-1 w-full">
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                onclick="toggleFavoriteSeat(event, '\${seat.seat_id}')"
                title="\${isFav ? '즐겨찾기 해제' : '즐겨찾기 등록'}"
                class="text-base leading-none transition-transform hover:scale-125 focus:outline-none cursor-pointer \${
                  isFav ? 'text-amber-400' : (isSelected || isMine ? 'text-white/40 hover:text-amber-300' : 'text-slate-300 hover:text-amber-400')
                }"
              >
                \${isFav ? '★' : '☆'}
              </button>
              <span class="font-mono text-sm font-bold tabular-nums \${isOccupied && !isMine ? 'line-through decoration-slate-400' : ''}">\${seat.seat_number}</span>
            </div>
            <span class="text-xs font-mono font-bold \${badgeSymbolClass}">\${badgeSymbol}</span>
          </div>
          <div class="my-2 text-[11px] \${subTextColor}">
            <span>\${seat.zone}</span>
            <span aria-hidden="true"> · </span>
            <span>\${seat.has_power ? '콘센트' : '일반'}</span>
          </div>
          <div class="text-[11px] font-mono tabular-nums \${statusColor}">
            \${statusLabel}
          </div>
        </div>
      \`;
    }

    function renderSeatGrid() {
      const container = document.getElementById('seat-grid-container');
      const roomKeys = state.selectedRoom === 'ALL' ? ['R1', 'R2', 'R3'] : [state.selectedRoom];

      const sectionsHtml = roomKeys.map(roomKey => {
        const theme = ROOM_THEMES[roomKey];
        let roomSeats = state.seats.filter(s => s.room_id === roomKey);
        if (state.onlyFavorites) {
          roomSeats = roomSeats.filter(s => state.favoriteSeatIds.includes(s.seat_id));
        }
        if (state.statusFilter && state.statusFilter !== 'ALL_STATUS') {
          roomSeats = roomSeats.filter(s => {
            const res = getActiveReservationForSeat(s.seat_id);
            if (state.statusFilter === 'AVAILABLE') return !res;
            if (state.statusFilter === 'MY_RES') return Boolean(res && res.user_id === state.userId);
            if (state.statusFilter === 'OCCUPIED') return Boolean(res && res.user_id !== state.userId);
            return true;
          });
        }
        if (roomSeats.length === 0) return '';

        const availCount = roomSeats.filter(s => !getActiveReservationForSeat(s.seat_id)).length;

        return \`
          <div class="rounded-xl border border-slate-200 overflow-hidden bg-slate-50/40">
            <div class="px-4 py-3 border-b flex items-center justify-between \${theme.headerBg}">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-xs \${theme.dot}"></span>
                <h3 class="text-sm font-bold">\${theme.name}</h3>
                <span aria-hidden="true" class="opacity-40">·</span>
                <span class="text-xs opacity-80">\${theme.sub}</span>
              </div>
              <span class="text-xs font-mono tabular-nums font-semibold">
                잔여 \${availCount} / \${roomSeats.length}석
              </span>
            </div>
            <div class="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              \${roomSeats.map(seat => renderSeatTileHtml(seat)).join('')}
            </div>
          </div>
        \`;
      }).filter(Boolean).join('');

      if (!sectionsHtml) {
        container.innerHTML = \`
          <div class="py-16 text-center bg-slate-50 border border-slate-200 rounded-xl">
            <p class="text-sm font-semibold text-slate-700">즐겨찾기에 등록된 좌석이 없습니다.</p>
            <p class="text-xs text-slate-500 mt-1">좌석 타일 좌측 상단의 ☆ 아이콘을 눌러 자주 쓰는 좌석을 등록해 보세요.</p>
          </div>
        \`;
      } else {
        container.innerHTML = sectionsHtml;
      }
    }

    function renderFavoriteQuickList() {
      const container = document.getElementById('favorite-seats-quicklist');
      document.getElementById('fav-panel-count').textContent = \`\${state.favoriteSeatIds.length}석\`;

      const favSeats = state.seats.filter(s => state.favoriteSeatIds.includes(s.seat_id));
      if (favSeats.length === 0) {
        container.innerHTML = \`
          <p class="text-xs text-slate-500 py-3">
            배치도 좌석 타일의 <strong class="text-amber-500">☆</strong> 아이콘을 클릭해 자주 이용하는 좌석을 즐겨찾기에 추가하세요.
          </p>
        \`;
        return;
      }

      container.innerHTML = \`
        <div class="space-y-2">
          \${favSeats.map(seat => {
            const activeRes = getActiveReservationForSeat(seat.seat_id);
            const isOccupied = Boolean(activeRes);
            const isSelected = state.selectedSeatId === seat.seat_id;
            return \`
              <div class="p-2.5 rounded-lg border \${isSelected ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50'} flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 text-xs font-mono tabular-nums">
                    <button type="button" onclick="toggleFavoriteSeat(event, '\${seat.seat_id}')" class="text-amber-400 hover:scale-110">★</button>
                    <span class="font-bold">\${seat.seat_id}</span>
                    <span class="\${isSelected ? 'text-slate-300' : 'text-slate-500'}">(\${seat.zone})</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  \${isOccupied
                    ? \`<span class="text-[11px] font-mono text-slate-400">사용 중</span>\`
                    : \`<button type="button" onclick="selectSeat('\${seat.seat_id}')" class="px-2.5 py-1 text-[11px] font-semibold rounded \${isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-600 text-white hover:bg-emerald-700'}">\${isSelected ? '선택됨' : '바로 선택'}</button>\`
                  }
                </div>
              </div>
            \`;
          }).join('')}
        </div>
      \`;
    }

    function renderSelectedSeatPanel() {
      const seat = state.seats.find(s => s.seat_id === state.selectedSeatId);
      const titleEl = document.getElementById('selected-seat-title');
      const metaEl = document.getElementById('selected-seat-meta');
      const statusEl = document.getElementById('selected-seat-status-text');
      const submitBtn = document.getElementById('submit-reservation-btn');

      if (!seat) {
        titleEl.textContent = '좌석을 선택해 주세요';
        metaEl.textContent = '좌측 배치도에서 초록 테두리(이용 가능) 좌석을 클릭하세요.';
        statusEl.textContent = '미선택';
        statusEl.className = 'text-xs font-medium text-slate-500';
        submitBtn.disabled = true;
      } else {
        const isFav = state.favoriteSeatIds.includes(seat.seat_id);
        titleEl.textContent = \`\${isFav ? '★ ' : ''}\${seat.seat_id} (\${seat.seat_number})\`;
        metaEl.textContent = \`\${seat.room_name} · \${seat.zone} · \${seat.has_power ? '콘센트 제공' : '일반석'}\`;
        statusEl.textContent = '선택됨 · 예약 가능';
        statusEl.className = 'text-xs font-semibold text-emerald-700';
        submitBtn.disabled = false;
      }
    }

    function renderMyReservations() {
      const myList = state.reservations.filter(r => r.user_id === state.userId && r.status !== 'CANCELLED');
      document.getElementById('my-res-count').textContent = \`\${myList.length}건\`;
      const container = document.getElementById('my-reservations-list');

      if (myList.length === 0) {
        container.innerHTML = \`
          <div class="py-8 text-center">
            <p class="text-xs font-medium text-slate-600">현재 등록된 내 예약이 없습니다.</p>
            <p class="text-[11px] text-slate-400 mt-1">좌석을 선택하여 새 예약을 신청해 보세요.</p>
          </div>
        \`;
        return;
      }

      container.innerHTML = myList.map(res => {
        const seat = state.seats.find(s => s.seat_id === res.seat_id);
        const roomLabel = seat ? seat.room_name : res.seat_id;
        return \`
          <div class="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2 text-xs font-mono tabular-nums">
                <span class="font-bold text-blue-700">\${res.seat_id}</span>
                <span aria-hidden="true" class="text-slate-300">·</span>
                <span class="text-slate-500">\${res.reservation_id}</span>
              </div>
              <p class="text-xs text-slate-600 mt-0.5 truncate">\${roomLabel}</p>
              <p class="text-[11px] font-mono tabular-nums text-slate-500 mt-0.5">
                \${res.date} · \${res.start_time} - \${res.end_time}
              </p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onclick="openQrModal('\${res.reservation_id}')"
                class="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
              >
                QR 코드 생성
              </button>
              <button
                type="button"
                onclick="handleCancelReservation('\${res.reservation_id}')"
                class="px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap"
              >
                예약 취소
              </button>
            </div>
          </div>
        \`;
      }).join('');

      const recentEl = document.getElementById('recent-history-list');
      if (recentEl) {
        const recentSeed = [
          { seat_id: 'R1-A02', date: '이전 예약', start_time: '09:00', end_time: '13:00' },
          { seat_id: 'R2-C02', date: '이전 예약', start_time: '13:00', end_time: '18:00' },
          { seat_id: 'R3-E01', date: '이전 예약', start_time: '10:00', end_time: '15:00' }
        ];
        recentEl.innerHTML = recentSeed.map(item => {
          const seat = state.seats.find(s => s.seat_id === item.seat_id);
          return \`
            <div class="py-2.5 flex items-center justify-between gap-2">
              <div class="min-w-0">
                <p class="text-xs font-mono font-bold text-slate-900">\${item.seat_id} <span class="font-sans font-normal text-slate-500">· \${seat ? seat.zone : ''}</span></p>
                <p class="text-[11px] font-mono text-slate-400">\${item.start_time} - \${item.end_time}</p>
              </div>
              <button
                type="button"
                onclick="quickRebook('\${item.seat_id}', '\${item.start_time}', '\${item.end_time}')"
                class="px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 whitespace-nowrap"
              >
                빠른 재예약
              </button>
            </div>
          \`;
        }).join('');
      }
    }

    function quickRebook(seatId, startT, endT) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      state.selectedDate = tomorrow.toISOString().split('T')[0];
      state.startTime = startT;
      state.endTime = endT;
      state.selectedSeatId = seatId;
      document.getElementById('filter-start-time').value = startT;
      document.getElementById('filter-end-time').value = endT;
      refreshAllData();
      showToast(\`\${state.selectedDate} (\${startT}-\${endT}) · \${seatId} 좌석이 재예약 설정되었습니다.\`, 'success');
    }

    function renderReservationsTable() {
      const query = (document.getElementById('reservation-search').value || '').trim().toLowerCase();
      const filtered = state.reservations.filter(r => {
        if (r.status === 'CANCELLED') return false;
        if (!query) return true;
        return (
          r.reservation_id.toLowerCase().includes(query) ||
          r.seat_id.toLowerCase().includes(query) ||
          r.user_id.toLowerCase().includes(query)
        );
      });

      const tbody = document.getElementById('all-reservations-tbody');
      if (filtered.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="6" class="py-8 text-center text-slate-500">해당 일자에 조회된 예약 내역이 없습니다.</td>
          </tr>
        \`;
        return;
      }

      tbody.innerHTML = filtered.map(res => {
        const seat = state.seats.find(s => s.seat_id === res.seat_id);
        const isMine = res.user_id === state.userId;
        return \`
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-3 px-3 font-mono tabular-nums font-medium text-slate-900">\${res.reservation_id}</td>
            <td class="py-3 px-3">
              <span class="font-mono font-semibold text-slate-900">\${res.seat_id}</span>
              <span class="text-slate-400 mx-1">·</span>
              <span class="text-slate-600">\${seat ? seat.room_name : '일반열람실'}</span>
            </td>
            <td class="py-3 px-3 font-mono text-slate-700">\${res.user_id}</td>
            <td class="py-3 px-3 font-mono tabular-nums text-slate-600">\${res.date}</td>
            <td class="py-3 px-3 font-mono tabular-nums text-right text-slate-900">\${res.start_time} - \${res.end_time}</td>
            <td class="py-3 px-3 text-right">
              \${isMine
                ? \`<button type="button" onclick="handleCancelReservation('\${res.reservation_id}')" class="text-red-600 hover:underline font-medium">내 예약 취소</button>\`
                : \`<span class="text-slate-400">사용 중</span>\`
              }
            </td>
          </tr>
        \`;
      }).join('');
    }

    function selectRoom(roomId) {
      state.selectedRoom = roomId;
      renderRoomTabs();
      renderSeatGrid();
    }

    function selectSeat(seatId) {
      if (getActiveReservationForSeat(seatId)) {
        showToast('선택하신 시간대에 이미 예약된 좌석입니다.', 'error');
        return;
      }
      state.selectedSeatId = state.selectedSeatId === seatId ? null : seatId;
      renderSeatGrid();
      renderFavoriteQuickList();
      renderSelectedSeatPanel();
    }

    function handleDateChange(newDate) {
      if (!newDate) return;
      state.selectedDate = newDate;
      refreshAllData();
    }

    function handleTimeChange() {
      const start = document.getElementById('filter-start-time').value;
      const end = document.getElementById('filter-end-time').value;
      if (start >= end) {
        showToast('퇴실 시간은 입실 시간보다 늦어야 합니다.', 'error');
        document.getElementById('filter-start-time').value = state.startTime;
        document.getElementById('filter-end-time').value = state.endTime;
        return;
      }
      state.startTime = start;
      state.endTime = end;
      if (state.selectedSeatId && getActiveReservationForSeat(state.selectedSeatId)) {
        state.selectedSeatId = null;
      }
      renderAll();
    }

    function updateUserId(val) {
      state.userId = val.trim() || 'user_001';
      document.getElementById('display-user-id').textContent = state.userId;
      renderStats();
      renderSeatGrid();
      renderMyReservations();
      renderReservationsTable();
    }

    async function submitReservation(e) {
      e.preventDefault();
      if (!state.selectedSeatId) {
        showToast('예약할 좌석을 먼저 선택해 주세요.', 'error');
        return;
      }
      if (state.startTime >= state.endTime) {
        showToast('이용 시작 및 종료 시간을 확인해 주세요.', 'error');
        return;
      }

      const btn = document.getElementById('submit-reservation-btn');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span>예약 처리 중...</span>';

      try {
        const payload = {
          action: 'createReservation',
          user_id: state.userId,
          seat_id: state.selectedSeatId,
          date: state.selectedDate,
          start_time: state.startTime,
          end_time: state.endTime
        };
        const result = await apiCreateReservation(payload);
        const resId = result.reservation_id || (result.data && result.data.reservation_id) || 'RES-NEW';

        showFeedbackModal(
          '좌석 예약이 완료되었습니다',
          '신청하신 열람실 좌석 예약이 정상적으로 등록되었습니다. 입실 시간을 준수해 주세요.',
          \`<div>예약 번호: <strong>\${resId}</strong></div>
           <div>좌석 번호: <strong>\${payload.seat_id}</strong></div>
           <div>이용 일시: <strong>\${payload.date} (\${payload.start_time} - \${payload.end_time})</strong></div>
           <div>이용자 ID: <strong>\${payload.user_id}</strong></div>\`
        );
        showToast(\`예약 완료 (\${resId})\`, 'success');
        state.selectedSeatId = null;
        await refreshAllData();
      } catch (err) {
        showToast(err.message || '예약 요청 중 오류가 발생했습니다.', 'error');
      } finally {
        btn.innerHTML = originalText;
        renderSelectedSeatPanel();
      }
    }

    async function handleCancelReservation(reservationId) {
      try {
        showToast(\`예약(\${reservationId}) 취소 요청 중...\`, 'info');
        await apiCancelReservation(reservationId);
        showToast(\`예약 번호 \${reservationId}이(가) 취소되었습니다.\`, 'success');
        await refreshAllData();
      } catch (err) {
        showToast(err.message || '예약 취소 중 오류가 발생했습니다.', 'error');
      }
    }

    function toggleConfigModal(show) {
      const modal = document.getElementById('config-modal');
      if (show) {
        document.getElementById('gas-url-input').value = ENDPOINT_URL;
        modal.classList.remove('hidden');
      } else {
        modal.classList.add('hidden');
      }
    }

    function saveEndpointConfig() {
      const val = document.getElementById('gas-url-input').value.trim();
      ENDPOINT_URL = val || DEFAULT_PLACEHOLDER_URL;
      localStorage.setItem('LIB_GAS_ENDPOINT_URL', ENDPOINT_URL);
      toggleConfigModal(false);
      showToast('API Endpoint 설정이 저장되었습니다.', 'success');
      refreshAllData();
    }

    function resetToDemoEndpoint() {
      ENDPOINT_URL = DEFAULT_PLACEHOLDER_URL;
      localStorage.removeItem('LIB_GAS_ENDPOINT_URL');
      document.getElementById('gas-url-input').value = ENDPOINT_URL;
      toggleConfigModal(false);
      showToast('시뮬레이션 데모 모드로 전환되었습니다.', 'info');
      refreshAllData();
    }

    function showFeedbackModal(title, desc, detailHtml) {
      document.getElementById('feedback-modal-title').textContent = title;
      document.getElementById('feedback-modal-desc').textContent = desc;
      document.getElementById('feedback-modal-detail').innerHTML = detailHtml;
      document.getElementById('feedback-modal').classList.remove('hidden');
    }

    function closeFeedbackModal() {
      document.getElementById('feedback-modal').classList.add('hidden');
    }

    function openQrModal(reservationId) {
      const qrImg = document.getElementById('qr-modal-img');
      qrImg.src = \`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=\${encodeURIComponent(reservationId)}\`;
      document.getElementById('qr-modal-res-id').textContent = reservationId;
      document.getElementById('qr-modal').classList.remove('hidden');
    }

    function closeQrModal() {
      document.getElementById('qr-modal').classList.add('hidden');
    }

    function showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      const colorMap = {
        success: 'bg-slate-900 text-white border-slate-800',
        error: 'bg-red-700 text-white border-red-800',
        info: 'bg-white text-slate-900 border-slate-200'
      };
      toast.className = \`pointer-events-auto px-4 py-3 rounded-lg border shadow-lg text-xs font-medium flex items-center justify-between gap-3 transition-all \${colorMap[type] || colorMap.info}\`;
      toast.innerHTML = \`<span>\${message}</span>\`;
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 200);
      }, 3200);
    }

    function updateCountdownWidget() {
      const box = document.getElementById('my-reservation-countdown-box');
      const myList = state.reservations.filter(r => r.user_id === state.userId && r.status !== 'CANCELLED');
      if (!box || myList.length === 0) {
        if (box) box.classList.add('hidden');
        return;
      }
      box.classList.remove('hidden');
      const target = myList[0];
      const now = new Date();
      const nowMs = now.getTime();
      const start = new Date(\`\${target.date}T\${target.start_time}:00\`).getTime();
      const end = new Date(\`\${target.date}T\${target.end_time}:00\`).getTime();

      const fmt = (ms) => {
        const sec = Math.max(0, Math.floor(ms / 1000));
        const h = String(Math.floor(sec / 3600)).padStart(2, '0');
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return \`\${h}:\${m}:\${s}\`;
      };

      document.getElementById('countdown-seat').textContent = target.seat_id;
      if (nowMs < start) {
        document.getElementById('countdown-label').textContent = '입실 시작까지 남은 시간';
        document.getElementById('countdown-time').textContent = fmt(start - nowMs);
        document.getElementById('countdown-sub').textContent = \`\${target.date} \${target.start_time} 입실\`;
      } else if (nowMs < end) {
        document.getElementById('countdown-label').textContent = '현재 이용 중 · 퇴실까지 남은 시간';
        document.getElementById('countdown-time').textContent = fmt(end - nowMs);
        document.getElementById('countdown-sub').textContent = \`\${target.start_time}-\${target.end_time} 이용 중\`;
      } else {
        const parts = target.start_time.split(':').map(Number);
        const nextStart = new Date(now);
        nextStart.setHours(parts[0] || 9, parts[1] || 0, 0, 0);
        if (nextStart.getTime() <= nowMs) nextStart.setDate(nextStart.getDate() + 1);
        document.getElementById('countdown-label').textContent = \`다음 \${target.start_time} 입실까지 남은 시간\`;
        document.getElementById('countdown-time').textContent = fmt(nextStart.getTime() - nowMs);
        document.getElementById('countdown-sub').textContent = \`\${target.start_time}-\${target.end_time} 기준\`;
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      initTimeSelects();
      refreshAllData();
      setInterval(updateCountdownWidget, 1000);
    });
  </script>
</body>
</html>`;

export const GAS_BACKEND_CODE = `/**
 * Google Apps Script (Code.gs) - 도서관 좌석 및 열람실 예약 시스템 백엔드
 * 구글 시트 탭 구성:
 * 1. "Seats" 시트 헤더: seat_id | room_id | room_name | seat_number | zone | has_power
 * 2. "Reservations" 시트 헤더: reservation_id | user_id | seat_id | date | start_time | end_time | status | created_at
 */

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === 'getSeats') {
    var seatSheet = ss.getSheetByName('Seats');
    var rows = seatSheet.getDataRange().getValues();
    var headers = rows.shift();
    var seats = rows.map(function(row) {
      var obj = {};
      headers.forEach(function(h, idx) { obj[h] = row[idx]; });
      return obj;
    });
    return jsonResponse({ success: true, data: seats });
  }

  if (action === 'getReservations') {
    var targetDate = e.parameter.date;
    var resSheet = ss.getSheetByName('Reservations');
    var resRows = resSheet.getDataRange().getValues();
    var resHeaders = resRows.shift();
    var list = resRows.map(function(row) {
      var obj = {};
      resHeaders.forEach(function(h, idx) { obj[h] = row[idx]; });
      return obj;
    }).filter(function(item) {
      return (!targetDate || String(item.date) === String(targetDate)) && item.status !== 'CANCELLED';
    });
    return jsonResponse({ success: true, data: list });
  }

  return jsonResponse({ success: false, message: 'Invalid GET action' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var resSheet = ss.getSheetByName('Reservations');

    if (action === 'createReservation') {
      var reservationId = 'RES-' + Utilities.formatDate(new Date(), 'GMT+9', 'yyMMddHHmmss');
      resSheet.appendRow([
        reservationId,
        body.user_id,
        body.seat_id,
        body.date,
        body.start_time,
        body.end_time,
        'CONFIRMED',
        new Date().toISOString()
      ]);
      return jsonResponse({
        success: true,
        reservation_id: reservationId,
        message: '예약이 등록되었습니다.'
      });
    }

    if (action === 'cancelReservation') {
      var targetId = body.reservation_id;
      var data = resSheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(targetId)) {
          resSheet.getRange(i + 1, 7).setValue('CANCELLED');
          return jsonResponse({
            success: true,
            reservation_id: targetId,
            message: '예약이 취소되었습니다.'
          });
        }
      }
      return jsonResponse({ success: false, message: '예약 번호를 찾을 수 없습니다.' });
    }

    return jsonResponse({ success: false, message: 'Unknown POST action' });
  } catch (err) {
    return jsonResponse({ success: false, message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
