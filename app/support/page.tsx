import type { Metadata } from "next";
import { AppInfoPage } from "@/app/_components/app-info-page";
import {
  APP_FEEDBACK_URL,
  APP_NAME,
  APP_REPOSITORY_URL,
  APP_SUPPORT_EMAIL,
} from "@/lib/app-config";

export const metadata: Metadata = {
  title: `지원 안내 | ${APP_NAME}`,
  description: `${APP_NAME} 지원 및 피드백 안내`,
};

export default function SupportPage() {
  return (
    <AppInfoPage
      eyebrow="Support"
      title="지원 및 피드백"
      description="닫힌 테스트와 초기 공개 배포를 대비해 지원 채널, 피드백 경로, 앱 성격을 한곳에 정리했습니다."
    >
      <section>
        <h2 className="font-serif text-2xl text-[#f8f1de]">1. 앱 성격</h2>
        <p className="mt-3">
          Holdem Ready는 실전 홀덤 의사결정 훈련을 위한 학습 앱입니다. 실제 현금성 베팅, 토너먼트 운영, 칩 구매 기능은 제공하지 않습니다.
        </p>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#f8f1de]">2. 문의 및 오류 제보</h2>
        <div className="mt-3 space-y-3">
          {APP_SUPPORT_EMAIL ? (
            <p>
              지원 이메일:{" "}
              <a
                href={`mailto:${APP_SUPPORT_EMAIL}`}
                className="text-[#f8f1de] underline underline-offset-4"
              >
                {APP_SUPPORT_EMAIL}
              </a>
            </p>
          ) : (
            <p>지원 이메일은 스토어 등록 전에 환경 변수로 연결할 수 있으며, 현재는 GitHub Issues를 기본 피드백 채널로 사용합니다.</p>
          )}
          <p>
            피드백 / 버그 제보:{" "}
            <a
              href={APP_FEEDBACK_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[#f8f1de] underline underline-offset-4"
            >
              GitHub Issues
            </a>
          </p>
          <p>
            프로젝트 저장소:{" "}
            <a
              href={APP_REPOSITORY_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[#f8f1de] underline underline-offset-4"
            >
              {APP_REPOSITORY_URL}
            </a>
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-[#f8f1de]">3. 테스트 중 확인할 항목</h2>
        <ul className="mt-3 space-y-2">
          <li>첫 실행 후 홈, 오답, 기록, 설정 화면이 정상적으로 보이는지</li>
          <li>문제를 푼 뒤 앱을 종료했다가 다시 열어도 세션과 기록이 유지되는지</li>
          <li>오프라인 상태에서도 최근 방문한 화면과 학습 기록이 유지되는지</li>
          <li>사운드/진동 토글, 백업 내보내기/불러오기, 데이터 초기화가 의도대로 동작하는지</li>
        </ul>
      </section>
    </AppInfoPage>
  );
}
