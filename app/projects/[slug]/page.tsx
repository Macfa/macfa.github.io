import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { PostBody } from "@/components/content/PostBody";
import { TagList } from "@/components/content/TagList";
import { getProjectPost, getProjectPosts } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjectPosts().map((post) => ({ slug: post.slug }));
}

type ProjectPostParams = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProjectPostParams): Promise<Metadata> {
  const { slug } = await params;
  const post = getProjectPost(slug);
  if (!post) {
    return { title: "Not found" };
  }
  return { title: post.title, description: post.summary };
}

export default async function ProjectPostPage({
  params,
}: ProjectPostParams) {
  const { slug } = await params;
  const post = getProjectPost(slug);
  if (!post) {
    notFound();
  }

  return (
    <Container width="doc">
      <p className="font-mono text-xs text-neutral-500">
        <time dateTime={post.date}>{post.date}</time> · Project
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
