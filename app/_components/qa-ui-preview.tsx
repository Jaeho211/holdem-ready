"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HoldemQuizAppView } from "@/app/_components/holdem-quiz-view";
import { HOLDEM_QUIZ_NOOP_ACTIONS } from "@/app/_components/holdem-quiz-model";
import {
  DEFAULT_HOLDEM_QUIZ_QA_SCENARIO_ID,
  buildQuestionQAScenario,
  getHoldemQuizQAScenario,
  holdemQuizQAScenarios,
} from "@/app/_components/qa-ui-scenarios";

export function QAUIPreview() {
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get("scenario") ?? DEFAULT_HOLDEM_QUIZ_QA_SCENARIO_ID;
  const questionId = searchParams.get("question");
  const questionMode = searchParams.get("mode") === "feedback" ? "feedback" : "quiz";
  const showChrome = searchParams.get("chrome") !== "0";
  const scenario = questionId
    ? buildQuestionQAScenario(questionId, questionMode)
    : getHoldemQuizQAScenario(scenarioId)
      ?? getHoldemQuizQAScenario(DEFAULT_HOLDEM_QUIZ_QA_SCENARIO_ID);

  if (!scenario) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#03110d,#071d16)] text-[#f6efe0]">
      {showChrome && (
        <div data-qa-ignore="qa-toolbar" className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6">
          <div className="rounded-[28px] border border-[#8ecdf7]/18 bg-[#081b22]/88 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#8ecdf7]">UI QA Preview</p>
            <h1 className="mt-2 font-serif text-3xl text-[#e7f6ff]">{scenario.label}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#d9ecfa]/78">{scenario.description}</p>
            {!questionId && (
              <div className="mt-4 flex flex-wrap gap-2">
                {holdemQuizQAScenarios.map((item) => (
                  <Link
                    key={item.id}
                    href={`/qa/ui?scenario=${item.id}`}
                    data-qa-scenario-link={item.id}
                    className={[
                      "rounded-full border px-3 py-2 text-xs uppercase tracking-[0.16em] transition",
                      item.id === scenario.id
                        ? "border-[#8ecdf7]/40 bg-[#123140] text-[#e7f6ff]"
                        : "border-white/10 bg-white/6 text-[#d9ecfa]/72 hover:bg-white/10",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={showChrome ? "px-0 pb-10" : ""}>
        <HoldemQuizAppView state={scenario.state} actions={HOLDEM_QUIZ_NOOP_ACTIONS} />
      </div>
    </div>
  );
}
