# 🧊 Naengo Admin (냉고 어드민)

냉고 서비스의 관리자 및 테스트용 웹 클라이언트입니다. AI 채팅 인터페이스와 레시피 관리 기능을 제공합니다.

## 🛠 기술 스택

- **Framework**: React 19, React Router v7
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **Linting/Formatting**: ESLint, Prettier

## 💻 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. API 프록시 설정

API 요청은 상대 경로 `/api`를 사용합니다. 개발 환경에서는 Vite proxy가 `/api` 요청을 로컬 백엔드로 전달하고, Vercel 배포 환경에서는 `vercel.json`의 rewrite 설정이 백엔드로 전달합니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

## 📜 주요 명령어

```bash
npm run dev       # 개발 서버 실행
npm run build     # 프로덕션 빌드 (tsc + Vite)
npm run lint      # ESLint 실행
npm run format    # Prettier 포맷 적용
```

## ☁️ 배포

[naengo-admin.vercel.app](https://naengo-admin.vercel.app)에 배포 중이며, `main` 브랜치에 push하면 Vercel을 통해 자동 배포됩니다.

## 🐳 Docker로 실행

```bash
docker compose -f docker-compose.dev.yml up
```

`localhost:5173`에서 접근할 수 있습니다.

## 📁 프로젝트 구조

```text
src/
├── api/              # API 호출 함수
│   ├── client.ts     # axios 인스턴스 (baseURL 설정)
│   ├── chat.ts       # 채팅 API (SSE 스트림 파싱 포함)
│   ├── recipes.ts    # 레시피 API
│   └── adminRecipes.ts # 운영 레시피 API
├── components/       # 공통 컴포넌트
│   ├── RecipeCard.tsx
│   └── MarkdownText.tsx
├── routes/           # 페이지 컴포넌트
│   ├── chat.tsx      # 채팅 페이지
│   ├── admin.tsx     # 운영 레시피 관리 페이지
│   └── recipes.tsx   # 레시피 목록 페이지
├── App.tsx           # 레이아웃 (사이드바 + Outlet)
├── main.tsx          # 앱 진입점
└── global.css        # 전역 스타일 (CSS 변수 포함)
```

## 🖥 페이지

- `/` — AI 채팅 페이지. 재료를 입력하면 레시피를 추천받을 수 있습니다.
- `/recipes` — 등록된 레시피 목록을 조회할 수 있습니다.
- `/admin/recipes` — 운영 레시피를 조회하고 원본, 영양, 분류 데이터를 확인할 수 있습니다.
