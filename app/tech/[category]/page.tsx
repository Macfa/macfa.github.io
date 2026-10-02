import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { CategoryNav } from "@/components/content/CategoryNav";
import { PostList } from "@/components/content/PostList";
import { getTechCategories, getTechPostsByCategory } from "@/lib/content";
import { formatCategory } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTechCategories().map((category) => ({ category }));
}

type TechCategoryParams = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({
  params,
}: TechCategoryParams): Promise<Metadata> {
  const { category } = await params;
  return { title: formatCategory(category) };
}

export default async function TechCategoryPage({ params }: TechCategoryParams) {
  const { category } = await params;
  const categories = getTechCategories();
  if (!categories.includes(category)) {
    notFound();
  }

  const posts = getTechPostsByCategory(category);

  return (
    <Container>
      <p className="font-mono text-xs text-neutral-500">Tech</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {formatCategory(category)}
      </h1>
      <div className="mt-6">
        <CategoryNav categories={categories} active={category} />
      </div>
      <PostList posts={posts} empty="이 카테고리에는 아직 글이 없습니다." />
    </Container>
  );
}
