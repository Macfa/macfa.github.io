# Macfa Blog

임베디드와 시스템 프로그래밍 프로젝트 및 기술 기록을 위한 Next.js 블로그입니다.

## 실행

Node.js 22.13 이상이 필요합니다. 별도 패키지 없이 Node.js 내장 SQLite 모듈을
사용합니다.

```bash
npm install
npm run dev
```

## 콘텐츠 데이터베이스

프로젝트와 기술 글은 `data/blog.db`의 SQLite 테이블에 저장됩니다. Next.js 서버
컴포넌트가 빌드 시 데이터베이스를 조회해 정적 페이지를 생성하므로 DB 파일과
쿼리 코드는 브라우저로 전달되지 않습니다.

- `data/schema.sql`: 테이블과 인덱스 정의
- `data/blog.db`: 사이트가 읽는 SQLite 데이터베이스
- `scripts/seed.mjs`: 샘플 콘텐츠를 DB에 다시 넣는 초기화 스크립트

샘플 데이터를 다시 만들려면 아래 명령을 실행합니다. 이 명령은 기존
`data/blog.db`를 샘플 데이터로 초기화합니다.

```bash
npm run db:seed
```

새 콘텐츠는 `posts` 테이블에 추가하고, 태그는 `tags`와 `post_tags` 테이블로
연결합니다. `is_sample`이 `1`인 글에는 목록과 상세 페이지에 샘플 배지가
표시됩니다.

## 정적 빌드

```bash
npm run build
```

빌드 결과는 `out/`에 생성됩니다.
