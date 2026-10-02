import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { CategoryNav } from "@/components/content/CategoryNav";
import { PostList } from "@/components/content/PostList";
import { getTechCategories, getTechPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Tech",
};

export default function TechPage() {
  const categories = getTechCategories();
  const posts = getTechPosts();

  return (
    <Container>
      <p className="font-mono text-xs text-neutral-500">Tech</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Tech</h1>
      <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-400">
        통신, C, 임베디드 시스템을 공부하고 검증한 내용을 주제별로 정리합니다.
        현재 등록된 글은 화면 구성을 보여 주기 위한 샘플입니다.
      </p>
      <div className="mt-6">
        <CategoryNav categories={categories} />
      </div>
      <PostList posts={posts} empty="아직 기술 글이 없습니다." />
    </Container>
  );
}
