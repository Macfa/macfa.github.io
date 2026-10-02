import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { PostBody } from "@/components/content/PostBody";
import { SampleBadge } from "@/components/content/SampleBadge";
import { TagList } from "@/components/content/TagList";
import { getTechPost, getTechPosts } from "@/lib/content";
import { formatCategory } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getTechPosts().map((post) => ({
    category: post.category,
    slug: post.slug,
  }));
}

type TechPostParams = {
  params: Promise<{ category: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: TechPostParams): Promise<Metadata> {
  const { category, slug } = await params;
  const post = getTechPost(category, slug);
  if (!post) {
    return { title: "Not found" };
  }
  return { title: post.title, description: post.summary };
}

export default async function TechPostPage({ params }: TechPostParams) {
  const { category, slug } = await params;
  const post = getTechPost(category, slug);
  if (!post) {
    notFound();
  }

  return (
    <Container width="doc">
      <p className="font-mono text-xs text-neutral-500">
        <time dateTime={post.date}>{post.date}</time>
        {" · "}
        <Link href={`/tech/${post.category}`} className="hover:text-foreground">
          {formatCategory(post.category)}
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        {post.title}
      </h1>
      {post.isSample ? (
        <div className="mt-4">
          <SampleBadge />
        </div>
      ) : null}
      <div className="mt-4">
        <TagList tags={post.tags} />
      </div>
      <div className="mt-8">
        <PostBody source={post.source} />
      </div>
    </Container>
  );
}
