import type { Post } from "@/lib/types";
import { PostCard } from "./PostCard";

export function PostList({
  posts,
  empty,
}: {
  posts: Post[];
  empty: string;
}) {
  if (posts.length === 0) {
    return (
      <p className="py-8 text-sm text-neutral-500">{empty}</p>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard
          key={
            post.kind === "tech"
              ? `${post.category}/${post.slug}`
              : post.slug
          }
          post={post}
        />
      ))}
    </div>
  );
}
