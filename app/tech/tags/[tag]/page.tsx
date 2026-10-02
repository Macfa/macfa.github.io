import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PostList } from "@/components/content/PostList";
import { getAllTags, getTechPostsByTag } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
}

type TechTagParams = {
  params: Promise<{ tag: string }>;
};

export async function generateMetadata({
  params,
}: TechTagParams): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${tag}` };
}

export default async function TechTagPage({ params }: TechTagParams) {
  const { tag } = await params;
  const posts = getTechPostsByTag(tag);

  return (
    <Container>
      <p className="font-mono text-xs text-neutral-500">Tech · tag</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">#{tag}</h1>
      <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-400">
        이 태그와 관련된 기술 글을 모아 봅니다.
      </p>
      <PostList posts={posts} empty="이 태그와 연결된 기술 글이 없습니다." />
    </Container>
  );
}
