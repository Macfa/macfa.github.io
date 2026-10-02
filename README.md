# Macfa Blog

임베디드와 시스템 프로그래밍 프로젝트 및 기술 기록을 위한 Next.js 블로그입니다.

Markdown 파일이 콘텐츠의 원본이며, 개발·빌드할 때 SQLite 데이터베이스를 자동으로
생성합니다. 같은 글을 Markdown과 DB에 각각 수정할 필요가 없습니다.

## 실행

Node.js 22.13 이상이 필요합니다.

```bash
npm install
npm run dev
```

`npm run dev`와 `npm run build`는 먼저 콘텐츠를 검사하고 `data/blog.db`를
최신 Markdown 내용으로 다시 만듭니다.

## 글 작성

### 로컬 작성 화면

```bash
npm run editor
```

브라우저에서 `http://127.0.0.1:4310`을 열면 별도의 작성 화면을 사용할 수
있습니다. 이 화면은 로컬 컴퓨터에서만 열리며 공개 사이트에는 배포되지 않습니다.

- Tech 또는 Project 글 생성 및 기존 글 수정
- 기존 태그 검색과 선택
- Markdown 미리보기
- 이미지, GIF, WebM, MP4 업로드
- 프로젝트의 데모, 저장소, 문서, 다운로드 링크 등록
- 저장 시 Markdown 파일 작성과 SQLite 동기화

본문에서 Tech 개념을 연결하는 순서는 다음과 같습니다.

1. `#` 뒤에 태그 이름의 일부를 입력합니다. 최대 5개의 기존 태그가 표시됩니다.
2. 원하는 태그에서 `Tab` 또는 `Enter`를 누릅니다.
3. 해당 태그를 가진 Tech 글 제목을 검색합니다.
4. 원하는 글에서 다시 `Tab` 또는 `Enter`를 누르면 내부 링크가 삽입됩니다.

예를 들어 `#c` → `Tab` → `구조체` → `Tab` 순서로 입력하면 아래 참조가
본문에 들어갑니다.

```md
[[tech:c/c-struct-layout|C 구조체와 메모리 배치]]
```

빌드 과정에서 이 참조를 실제 사이트 경로로 변환하고, 대상 글이 없으면 오류를
발생시킵니다. URL을 직접 기억하거나 붙여 넣을 필요가 없습니다.

### Markdown 파일 직접 작성

작성 화면을 사용하지 않고 Markdown 파일을 직접 추가해도 됩니다.

```text
content/
├── projects/<slug>.md
└── tech/<category>/<slug>.md
```

프로젝트 글의 예시는 다음과 같습니다.

```md
---
title: 프로젝트 제목
date: "2026-10-03"
summary: 목록에 표시할 설명
tags:
  - c
  - uart
sample: false
links:
  - kind: repository
    label: GitHub
    url: https://github.com/example/project
relatedTech:
  - ref: communication/uart-frame-and-baud-rate
    context: 프로젝트에서 사용한 통신 개념
---

## 개요

[[tech:communication/uart-frame-and-baud-rate|UART 프레임]]을 사용했습니다.
```

실제 프로젝트(`sample: false`)는 접근 가능한 공개 링크를 하나 이상 등록해야
합니다. `links.kind`는 `demo`, `repository`, `documentation`, `download`를
지원합니다.

직접 작성한 파일은 아래 명령으로 검사하고 DB에 반영할 수 있습니다.

```bash
npm run content:sync
```

## 이미지와 짧은 영상

작성 화면에서 추가한 파일은 `public/media/<글-slug>/`에 저장되고 본문에는 경로가
삽입됩니다. Markdown에서 직접 이미지를 참조할 수도 있습니다.

```md
![로직 애널라이저에서 확인한 UART 파형](/media/uart/frame.webp)
```

이미지와 GIF 바이너리는 SQLite에 넣지 않고 파일 정보와 공개 경로만 기록합니다.
파일이 많아지면 `public/media`의 원본을 S3나 R2 같은 Object Storage와 CDN으로
옮기고 URL만 교체할 수 있습니다. 큰 GIF는 재생 성능을 위해 WebM 또는 MP4로
변환하는 것을 권장합니다. 작성 화면의 파일당 업로드 제한은 10MB입니다.

## 데이터베이스

- `data/schema.sql`: 테이블과 인덱스 정의
- `data/blog.db`: 빌드가 읽는 생성 결과물
- `scripts/sync-content.mjs`: Markdown 검사, 내부 참조 변환, DB 생성

Next.js 서버 컴포넌트가 빌드 시 SQLite를 조회해 정적 페이지를 생성하므로 DB와
쿼리 코드는 브라우저로 전달되지 않습니다. 태그는 넓은 주제 탐색에 사용하고,
본문의 Tech 참조는 특정 개념 글로 바로 연결합니다. 프로젝트의 `relatedTech`는
상세 페이지 하단의 관련 Tech 카드로 표시됩니다.

## 빌드와 배포

```bash
npm run build
```

빌드 결과는 `out/`에 생성됩니다. `main` 브랜치에 push하면 GitHub Actions의
`.github/workflows/deploy-pages.yml`이 `npm run build`를 실행하고
`https://macfa.github.io`에 자동 배포합니다.
