import { Suspense } from "react";
import { notFound } from "next/navigation";
import { QAUIPreview } from "@/app/_components/qa-ui-preview";

function QAUILoadingFallback() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#03110d,#071d16)] px-4 py-6 text-[#f6efe0]">
      <div className="mx-auto w-full max-w-[520px] rounded-[28px] border border-[#8ecdf7]/18 bg-[#081b22]/88 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.32)]">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#8ecdf7]">UI QA Preview</p>
        <p className="mt-2 text-sm text-[#d9ecfa]/78">시나리오를 준비하는 중입니다.</p>
      </div>
    </div>
  );
}

export default function Page() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <Suspense fallback={<QAUILoadingFallback />}>
      <QAUIPreview />
    </Suspense>
  );
}
