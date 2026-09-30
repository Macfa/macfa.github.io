import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { PostBody } from "@/components/content/PostBody";
import { TagList } from "@/components/content/TagList";
import { getStudyPost, getStudyPosts } from "@/lib/content";
import { formatCategory } from "@/lib/site";
import Link from "next/link";

export const dynamicParams = false;

export function generateStaticParams() {
  return getStudyPosts().map((post) => ({
    category: post.category,
    slug: post.slug,
  }));
}

type StudyPostParams = {
  params: Promise<{ category: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: StudyPostParams): Promise<Metadata> {
  const { category, slug } = await params;
  const post = getStudyPost(category, slug);
  if (!post) {
    return { title: "Not found" };
  }
  return { title: post.title, description: post.summary };
}

export default async function StudyPostPage({
  params,
}: StudyPostParams) {
  const { category, slug } = await params;
  const post = getStudyPost(category, slug);
  if (!post) {
    notFound();
  }

  return (
    <Container width="doc">
      <p className="font-mono text-xs text-neutral-500">
        <time dateTime={post.date}>{post.date}</time>
        {" · "}
        <Link href={`/study/${post.category}`} className="hover:text-foreground">
          {formatCategory(post.category)}
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {post.title}
      </h1>
      <div className="mt-4">
        <TagList tags={post.tags} />
      </div>
      <div className="mt-8">
        <PostBody source={post.source} />
      </div>
    </Container>
  );
}
