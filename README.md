# Rezy App

식당 예약 서비스 Rezy의 모바일 앱. Expo(React Native) + TypeScript로 만들었고, 백엔드는 별도 저장소(Spring Boot)에 있다.

## 기능

- 이메일 회원가입 / 로그인, 닉네임·역할 설정
- 가게 목록, 가게 상세
- 날짜 → 인원 → 시간 순으로 골라 예약
- 만석이면 줄서기 (지금 서면 몇 번째인지 미리 보여줌)
- 내 대기 현황: 차례가 오면 남은 시간 카운트다운, 5분 안에 확정
- My 탭: 대기 중인 예약, 다가오는 예약(취소 가능), 지난 예약

Trending 탭, 가게 검색, 사장님 가입은 화면만 있고 아직 동작하지 않는다.

## 실행

Node.js와 Expo Go 앱(또는 에뮬레이터)이 필요하다.

```bash
npm install
npx expo start
```

백엔드 주소는 `src/constants/config.ts`의 `BASE_URL`에 적는다. 폰에서 돌릴 때는 `localhost`가 아니라 백엔드가 떠 있는 PC의 IP를 써야 하고, 폰과 PC가 같은 네트워크에 있어야 한다.

예약과 줄서기는 백엔드 쪽 Redis가 떠 있어야 동작한다. 꺼져 있으면 "일시적인 오류입니다" 팝업이 뜬다.

## 구조

```
src/
  app/                 화면 (Expo Router, 파일 = 경로)
    (auth)/            로그인, 회원가입
    profile.tsx        닉네임·역할 설정
    (tabs)/
      trending.tsx
      (rezy)/          가게 목록, 가게 상세(예약·줄서기)
      my/              My, 내 대기 현황
  api/                 백엔드 호출, 응답 타입
  context/session.tsx  로그인 상태, 토큰 저장(expo-secure-store)
  components/          탭 바, 결과 팝업
  constants/           색상, BASE_URL
```

로그인 여부와 프로필 완성 여부에 따라 보여줄 화면은 `src/app/_layout.tsx`에서 가른다.

## 검사

```bash
npx tsc --noEmit
npx expo lint
```

## 알아둘 것

- 서버가 주는 시각에는 시간대 정보가 없어서 기기 현지 시각으로 해석한다. 서버와 폰의 시계가 다르면 대기 카운트다운이 어긋난다.
- 가게 사진은 아직 없어서 회색 박스로 둔다.
