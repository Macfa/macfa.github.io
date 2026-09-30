import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PostList } from "@/components/content/PostList";
import { getRecentProjectPosts, getRecentStudyPosts } from "@/lib/content";
import { site } from "@/lib/site";

export default function HomePage() {
  const study = getRecentStudyPosts();
  const projects = getRecentProjectPosts();

  return (
    <Container>
      <p className="font-mono text-xs text-neutral-500">Personal notes</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{site.name}</h1>
      <p className="mt-3 max-w-xl text-sm leading-7 text-neutral-600 dark:text-neutral-400">
        {site.description}. Markdown을 올리면 빌드 때 페이지가 생긴다.
      </p>

      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            Projects
          </h2>
          <Link
            href="/projects"
            className="text-xs text-neutral-500 hover:text-foreground"
          >
            전체 보기
          </Link>
        </div>
        <PostList posts={projects} empty="등록된 프로젝트가 없다." />
      </section>

      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            Study
          </h2>
          <Link
            href="/study"
            className="text-xs text-neutral-500 hover:text-foreground"
          >
            전체 보기
          </Link>
        </div>
        <PostList posts={study} empty="등록된 학습 글이 없다." />
      </section>
    </Container>
  );
}
