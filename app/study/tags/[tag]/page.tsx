import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PostList } from "@/components/content/PostList";
import { getAllTags, getStudyPostsByTag } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
}

type StudyTagParams = {
  params: Promise<{ tag: string }>;
};

export async function generateMetadata({
  params,
}: StudyTagParams): Promise<Metadata> {
  const { tag } = await params;
  return { title: `#${tag}` };
}

export default async function StudyTagPage({
  params,
}: StudyTagParams) {
  const { tag } = await params;
  const posts = getStudyPostsByTag(tag);

  return (
    <Container>
      <p className="font-mono text-xs text-neutral-500">Study · tag</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">#{tag}</h1>
      <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-400">
        이 태그가 붙은 Study 글만 보여 준다. 프로젝트 글의 태그를 눌러 들어올 수
        있다.
      </p>
      <PostList
        posts={posts}
        empty="이 태그가 붙은 Study 글이 아직 없다. 프로젝트에서 넘어왔다면 관련 학습 노트를 추가하면 된다."
      />
    </Container>
  );
}
