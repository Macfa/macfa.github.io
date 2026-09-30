import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <Container width="doc">
      <p className="font-mono text-xs text-neutral-500">About</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">About</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-neutral-700 dark:text-neutral-300">
        <p>
          임베디드 소프트웨어와 시스템 프로그래밍을 공부하며 남기는 기술
          노트다. Study는 주제별 메모, Projects는 보드와 펌웨어 작업 기록이다.
        </p>
        <p>
          글은 Markdown/MDX로 작성하고 Next.js가 정적 HTML로 렌더한다. 배포
          대상은 GitHub Pages다.
        </p>
      </div>
    </Container>
  );
}
