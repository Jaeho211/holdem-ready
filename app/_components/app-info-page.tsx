import Link from "next/link";
import type { ReactNode } from "react";
import {
  APP_FEEDBACK_URL,
  APP_NAME,
  APP_PRIVACY_PATH,
  APP_SUPPORT_PATH,
} from "@/lib/app-config";

export function AppInfoPage({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#03110d,#071d16)] px-4 py-6 text-[#f6efe0] sm:px-6">
      <div className="mx-auto max-w-[720px]">
        <div className="rounded-[32px] border border-[#d7b977]/18 bg-[#071d16]/95 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.4)]">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#efe2be]/72">
            <Link href="/" className="rounded-full border border-[#d7b977]/18 bg-white/6 px-4 py-2 transition hover:bg-white/10">
              앱으로 돌아가기
            </Link>
            <Link href={APP_PRIVACY_PATH} className="hover:text-[#f6efe0]">
              개인정보처리방침
            </Link>
            <span className="text-[#d7b977]/40">/</span>
            <Link href={APP_SUPPORT_PATH} className="hover:text-[#f6efe0]">
              지원 안내
            </Link>
            <span className="text-[#d7b977]/40">/</span>
            <a href={APP_FEEDBACK_URL} target="_blank" rel="noreferrer" className="hover:text-[#f6efe0]">
              피드백
            </a>
          </div>

          <div className="mt-8">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#d7b977]">{eyebrow}</p>
            <h1 className="mt-3 font-serif text-4xl text-[#f8f1de]">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#efe2be]/80">{description}</p>
          </div>

          <div className="mt-8 space-y-6 text-sm leading-7 text-[#efe2be]/84">{children}</div>

          <div className="mt-10 rounded-[24px] border border-[#d7b977]/16 bg-[#0b241d] p-4 text-sm leading-6 text-[#efe2be]/74">
            <p className="font-medium text-[#f8f1de]">{APP_NAME} 안내</p>
            <p className="mt-2">
              이 앱은 홀덤 학습용 콘텐츠와 개인 학습 기록만 제공합니다. 로그인, 결제, 원격 계정 저장, 광고 SDK는 현재 포함하지 않습니다.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
