import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { CategoryNav } from "@/components/content/CategoryNav";
import { PostList } from "@/components/content/PostList";
import { getStudyCategories, getStudyPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Study",
};

export default function StudyPage() {
  const categories = getStudyCategories();
  const posts = getStudyPosts();

  return (
    <Container>
      <p className="font-mono text-xs text-neutral-500">Study</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Study</h1>
      <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-400">
        C, MCU, Communication, Linux 등 1차 카테고리로 나눈 학습 메모.
      </p>
      <div className="mt-6">
        <CategoryNav categories={categories} />
      </div>
      <PostList posts={posts} empty="아직 학습 글이 없다." />
    </Container>
  );
}
