import type { Metadata } from "next";
import { AppInfoPage } from "@/app/_components/app-info-page";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/app-config";

export const metadata: Metadata = {
  title: `개인정보처리방침 | ${APP_NAME}`,
  description: `${APP_NAME} 개인정보처리방침`,
};

export default function PrivacyPage() {
  return (
    <AppInfoPage
      eyebrow="Privacy"
      title="개인정보처리방침"
      description={`${APP_NAME}는 ${APP_DESCRIPTION}입니다. 현재 버전은 계정 가입 없이 기기 로컬 저장소만 사용하며, 개인정보 수집 범위를 최소화합니다.`}
    >
      <section>
        <h2 className="font-serif text-2xl text-[#f8f1de]">1. 수집하는 정보</h2>
        <p className="mt-3">
          현재 앱은 회원가입, 로그인, 광고 식별자, 원격 분석 SDK를 사용하지 않습니다. 사용 중 생성되는 학습 기록, 세션 상태, 체크리스트, 설정은 사용자의 기기 브라우저 저장소에만 보관됩니다.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#f8f1de]">2. 저장 위치와 보관 방식</h2>
        <p className="mt-3">
          학습 데이터는 브라우저의 <code className="rounded bg-black/20 px-1.5 py-0.5">localStorage</code>에 저장됩니다. 서버 DB나 개발자 소유의 원격 저장소로 전송하지 않으며, 앱을 삭제하거나 브라우저 데이터를 비우면 함께 사라질 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#f8f1de]">3. 백업과 복구</h2>
        <p className="mt-3">
          설정 화면에서 JSON 백업 파일을 직접 내보내고 다시 불러올 수 있습니다. 데이터 초기화 전에 백업하지 않으면 복구가 불가능합니다.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#f8f1de]">4. 제3자 제공</h2>
        <p className="mt-3">
          현재 버전은 사용자 데이터를 제3자에게 판매하거나 공유하지 않습니다. 다만 Netlify 같은 정적 호스팅 인프라에서 서비스되므로, 일반적인 웹 접속 로그는 호스팅 제공자 정책에 따라 처리될 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#f8f1de]">5. 정책 변경</h2>
        <p className="mt-3">
          로그인, 분석 SDK, 원격 동기화 등 데이터 흐름이 바뀌는 기능을 추가하면 이 문서를 함께 갱신합니다. 마지막 검토일은 2026년 4월 5일입니다.
        </p>
      </section>
    </AppInfoPage>
  );
}
