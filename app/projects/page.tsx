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
        임베디드 프로젝트 기록. 태그를 누르면 관련 Study 글로 이동한다.
      </p>
      <PostList posts={posts} empty="아직 프로젝트 글이 없다." />
    </Container>
  );
}
