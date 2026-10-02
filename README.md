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

### 프로젝트와 Tech 연결

태그는 검색과 분류에 사용하고, 프로젝트를 이해하는 데 필요한 개념 연결은
`project_tech_links` 테이블에 별도로 저장합니다. 프로젝트 상세 하단에는 연결된
Tech 글이 카드로 표시됩니다.

본문의 특정 문장이나 단어에서 바로 연결하려면 Markdown 링크를 사용합니다.

```md
[UART 프레임과 보레이트](/tech/communication/uart-frame-and-baud-rate)
```

### 프로젝트 외부 링크

실제 결과물은 `project_links` 테이블에 연결합니다. 지원하는 종류는 다음과
같습니다.

- `demo`: 실행 가능한 웹페이지
- `repository`: GitHub 등의 소스 저장소
- `documentation`: 별도 문서
- `download`: 설치 파일 또는 결과물

등록된 링크는 프로젝트 상세 페이지 상단에 버튼으로 표시됩니다. 실제 프로젝트는
데모나 저장소 중 하나 이상을 등록하는 것을 권장합니다.

### 이미지와 짧은 영상

이미지/GIF 바이너리는 SQLite에 넣지 않습니다. 본문에는 URL만 기록하고,
파일 정보는 `media_assets`와 `post_media` 테이블로 연결할 수 있습니다.

- 초기의 작은 파일: `public/media/<글-slug>/` 아래에 저장
- 용량이 커지면: S3, R2 같은 Object Storage와 CDN으로 이전
- DB의 `public_url`만 변경하면 본문과 데이터 구조는 그대로 유지
- 큰 GIF는 용량과 재생 성능을 위해 WebM/MP4 변환 권장

Markdown 이미지는 아래처럼 작성하며 화면 폭에 맞게 렌더링되고 지연 로딩됩니다.

```md
![로직 애널라이저에서 확인한 UART 파형](/media/uart/frame.webp)
```

## 정적 빌드

```bash
npm run build
```

빌드 결과는 `out/`에 생성됩니다.
