# Android 출시 가이드

이 프로젝트는 Netlify에 배포된 정적 Next.js/PWA를 유지한 채 Android 앱으로 패키징하는 것을 기준으로 합니다.

## 기본 원칙

- 웹앱 배포는 계속 Netlify가 담당합니다.
- Android 앱은 Netlify URL을 감싸는 TWA(Trusted Web Activity)로 배포합니다.
- 첫 릴리스는 웹 기능과 동일하게 유지합니다.
- 새 개인 개발자 계정은 production 공개 전에 닫힌 테스트 12명, 14일 요건을 먼저 충족해야 합니다.

## 환경 변수

루트의 `.env.example`를 복사해 최소 아래 값을 채웁니다.

```bash
NEXT_PUBLIC_APP_SITE_URL=https://your-site.netlify.app
NEXT_PUBLIC_SUPPORT_EMAIL=your-support@example.com
ANDROID_PACKAGE_NAME=com.jaeho211.holdemquiz
ANDROID_SHA256_CERT_FINGERPRINTS=AA:BB:CC:...
```

설명:

- `NEXT_PUBLIC_APP_SITE_URL`: Netlify의 고정 HTTPS 도메인
- `NEXT_PUBLIC_SUPPORT_EMAIL`: 앱 내부 지원 페이지와 스토어 listing에 쓸 지원 이메일
- `ANDROID_PACKAGE_NAME`: Play Console에 등록할 패키지명
- `ANDROID_SHA256_CERT_FINGERPRINTS`: 업로드 키 또는 앱 서명 키의 SHA-256 지문 목록

## 웹 릴리스 산출물

```bash
npm run build
```

이 빌드는 다음을 함께 처리합니다.

- 정적 `out/` 생성
- `out/.well-known/assetlinks.json` 생성
- Netlify용 `out/_redirects` 생성
- 개발 전용 `out/qa/` 산출물 제거

`ANDROID_SHA256_CERT_FINGERPRINTS`가 비어 있으면 `assetlinks.json`은 빈 배열로 생성됩니다. TWA 검증 전에는 실제 지문으로 다시 빌드해야 합니다.

## 스토어 자산 생성

```bash
npm run release:assets
```

생성 위치:

- 앱 아이콘 PNG: `public/icons/`
- Play 스토어용 그래픽: `.release-artifacts/play-store/`

포함 항목:

- `icon-192.png`
- `icon-512.png`
- `icon-maskable-192.png`
- `icon-maskable-512.png`
- `feature-graphic-1024x500.png`
- 폰 스크린샷 5장

## Bubblewrap / TWA 패키징

Netlify에 배포한 뒤 아래 순서로 진행합니다.

1. PWA manifest가 배포 URL에서 열리는지 확인합니다.

```bash
https://your-site.netlify.app/manifest.webmanifest
```

2. Bubblewrap 초기화:

```bash
npx @bubblewrap/cli@latest init --manifest https://your-site.netlify.app/manifest.webmanifest
```

3. Android 프로젝트 생성 후 서명 설정, `bundletool` 또는 Android Studio로 AAB를 만듭니다.

4. 생성된 SHA-256 지문을 `.env`에 넣고 다시 `npm run build`를 실행해 `assetlinks.json`을 최신 값으로 갱신합니다.

5. 배포된 `https://your-site.netlify.app/.well-known/assetlinks.json`이 올바른지 확인합니다.

## 출시 전 확인

- `npm run lint`
- `npx tsc --noEmit`
- `npm test`
- `npm run build`
- `npm run qa:ui`
- 변경 문제 검수 시 `npm run qa:questions -- --base origin/main`

수동 확인:

- Android 첫 실행
- 백그라운드 복귀
- 오프라인 재실행
- 백업 내보내기 / 불러오기
- 데이터 초기화
- 사운드 / 진동 토글
- 업데이트 후 로컬 데이터 유지
