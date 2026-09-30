import Link from "next/link";
import { Container } from "@/components/layout/Container";

export default function NotFound() {
  return (
    <Container>
      <h1 className="text-2xl font-semibold tracking-tight">페이지 없음</h1>
      <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
        주소를 확인하거나 홈으로 돌아가 주세요.
      </p>
      <Link href="/" className="mt-6 inline-block text-sm underline">
        Home
      </Link>
    </Container>
  );
}
