import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PostList } from "@/components/content/PostList";
import { getProjectPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
};

export default function ProjectsPage() {
  const posts = getProjectPosts();

  return (
    <Container>
      <p className="font-mono text-xs text-neutral-500">Projects</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Projects</h1>
      <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-400">
        직접 만들며 해결한 문제와 선택의 과정을 기록합니다. 현재 등록된 글은
        화면 구성을 보여 주기 위한 샘플입니다.
      </p>
      <PostList posts={posts} empty="아직 프로젝트 글이 없다." />
    </Container>
  );
}
