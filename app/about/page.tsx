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
          블로그입니다. Tech에는 다시 찾아볼 개념을, Projects에는 직접 만든
          결과와 문제 해결 과정을 기록합니다.
        </p>
        <p>
          공개할 수 있는 이메일과 개발자 채널은 준비되는 대로 이 페이지에
          추가할 예정입니다.
        </p>
      </div>
    </Container>
  );
}
