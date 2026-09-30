import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { CategoryNav } from "@/components/content/CategoryNav";
import { PostList } from "@/components/content/PostList";
import {
  getStudyCategories,
  getStudyPostsByCategory,
} from "@/lib/content";
import { formatCategory } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getStudyCategories().map((category) => ({ category }));
}

type StudyCategoryParams = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({
  params,
}: StudyCategoryParams): Promise<Metadata> {
  const { category } = await params;
  return { title: formatCategory(category) };
}

export default async function StudyCategoryPage({
  params,
}: StudyCategoryParams) {
  const { category } = await params;
  const categories = getStudyCategories();
  if (!categories.includes(category)) {
    notFound();
  }

  const posts = getStudyPostsByCategory(category);

  return (
    <Container>
      <p className="font-mono text-xs text-neutral-500">Study</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {formatCategory(category)}
      </h1>
      <div className="mt-6">
        <CategoryNav categories={categories} active={category} />
      </div>
      <PostList
        posts={posts}
        empty="이 카테고리에 글이 없다. MDX 파일을 추가하면 빌드 때 생긴다."
      />
    </Container>
  );
}
