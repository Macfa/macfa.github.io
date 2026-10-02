import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PostList } from "@/components/content/PostList";
import { getRecentProjectPosts, getRecentTechPosts } from "@/lib/content";
import { site } from "@/lib/site";

export default function HomePage() {
  const tech = getRecentTechPosts();
  const projects = getRecentProjectPosts();

  return (
    <Container>
      <p className="font-mono text-xs text-neutral-500">Embedded · Systems</p>
      <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        작은 장치부터 단단한 시스템까지,
        <br />직접 만들고 이해한 것을 기록합니다.
      </h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-600 dark:text-neutral-400">
        {site.description}. 프로젝트에서 마주친 문제와 그 과정에서 익힌 개념을
        다시 꺼내 쓸 수 있는 글로 남깁니다.
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
            Tech
          </h2>
          <Link
            href="/tech"
            className="text-xs text-neutral-500 hover:text-foreground"
          >
            전체 보기
          </Link>
        </div>
        <PostList posts={tech} empty="등록된 기술 글이 없다." />
      </section>
    </Container>
  );
}
