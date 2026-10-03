# Macfa Blog

임베디드와 시스템 프로그래밍 프로젝트 및 기술 기록을 위한 Next.js 블로그입니다.

`content/`는 Obsidian Vault이자 콘텐츠 원본입니다. Obsidian에서 작성한 Markdown을
빌드할 때 검사하고 SQLite 데이터베이스와 정적 페이지를 자동 생성합니다.

## 준비

1. [Obsidian](https://obsidian.md)을 설치합니다.
2. `Open folder as vault`를 선택합니다.
3. 이 저장소의 `content` 폴더를 엽니다.

Vault 설정은 `content/.obsidian/app.json`에 포함되어 있습니다. 내부 링크 변경을
추적하고, 드래그한 첨부파일은 `content/attachments`에 저장하도록 설정했습니다.

## 글 작성

글은 아래 위치에 만듭니다. 파일 이름은 영문 소문자, 숫자, 하이픈을 사용합니다.

```text
content/
├── projects/<slug>.md
├── tech/<category>/<slug>.md
└── attachments/
```

Tech 글의 Properties 예시는 다음과 같습니다.

```yaml
---
title: C 구조체와 메모리 배치
aliases:
  - C 구조체
  - 구조체 메모리 배치
date: "2026-10-03"
summary: 구조체의 정렬과 패딩을 설명합니다.
tags:
  - c
  - memory
sample: false
---
```

Properties는 Obsidian 상단 입력 영역에서 수정할 수 있습니다. `aliases`를 등록하면
파일 이름이 영문 Slug여도 한글 제목으로 내부 글을 검색할 수 있습니다.

### 프로젝트 공개 링크

프로젝트는 다음 Properties에 공개 주소를 입력합니다.

```yaml
demo: https://example.com
repository: https://github.com/example/project
documentation: ""
download: ""
```

실제 프로젝트(`sample: false`)는 네 항목 중 하나 이상이 필요합니다. 샘플 글은
주소가 없어도 됩니다.

## Tech 글 연결

Project 글을 작성하다 `[[`를 입력하면 같은 Vault의 Project와 Tech 글을 검색할 수
있습니다. Tech 폴더로 좁히려면 `[[tech/`를 입력합니다.

```md
센서 상태는 [[tech/c/c-struct-layout|C 구조체]]로 표현했습니다.
```

URL을 직접 입력할 필요가 없습니다. 빌드 과정이 대상 Markdown의 실제 종류와
경로를 확인하여 다음 공개 링크로 변환합니다.

```text
/tech/c/c-struct-layout/
```

Project 본문에서 연결한 Tech 글은 Project 상세 하단의 관련 Tech 카드에도 자동으로
추가됩니다. 존재하지 않거나 여러 글과 모호하게 일치하는 링크는 빌드를 중단시킵니다.

## 태그

태그는 정적 사이트에서도 사용할 수 있습니다. 빌드 시 등록된 모든 태그에 대해
`/tech/tags/<tag>/` 정적 페이지를 미리 생성합니다.

- Project와 Tech 상세의 태그를 누르면 해당 태그 페이지로 이동
- 태그 페이지에는 같은 태그를 가진 Tech 글을 표시
- 서버나 실시간 데이터베이스 없이 GitHub Pages에서 동작
- 새 태그를 추가하고 push하면 다음 배포에서 태그 페이지 자동 생성

## 이미지와 짧은 영상

Obsidian에 이미지, GIF, WebM, MP4 파일을 드래그하면 `content/attachments`에
저장되고 아래 형식으로 삽입됩니다.

```md
![[uart-waveform.gif]]
```

빌드 과정은 사용된 첨부파일을 `public/media/attachments`로 복사하고 공개 URL로
변환합니다. 같은 이름의 첨부파일이 여러 폴더에 있으면 Vault 기준 경로를 적어야
합니다.

## 로컬 검사와 실행

Node.js 22.13 이상이 필요합니다.

```bash
npm install
npm run content:sync
npm run dev
```

`npm run dev`와 `npm run build`는 실행 전에 자동으로 콘텐츠를 검사하고
`data/blog.db`를 다시 생성합니다. Markdown과 데이터베이스를 따로 수정하지
않습니다.

## 배포

작성한 파일을 GitHub의 `main` 브랜치에 push하면 GitHub Actions가 자동으로:

1. Obsidian Markdown과 내부 링크를 검사합니다.
2. SQLite 데이터베이스를 생성합니다.
3. 태그 페이지를 포함한 Next.js 정적 사이트를 빌드합니다.
4. [macfa.github.io](https://macfa.github.io)에 배포합니다.

빌드 결과는 로컬에서는 `out/`에 생성됩니다.
