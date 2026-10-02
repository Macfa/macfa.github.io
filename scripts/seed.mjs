import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const databasePath = join(root, "data", "blog.db");
const schemaPath = join(root, "data", "schema.sql");

const posts = [
  {
    kind: "project",
    slug: "smart-greenhouse-controller",
    category: null,
    title: "스마트 온실 환경 제어기",
    summary:
      "센서 데이터를 읽고 팬과 급수 장치를 제어하는 MCU 기반 환경 제어기 예시입니다.",
    publishedAt: "2026-09-22",
    isSample: true,
    sortOrder: 20,
    tags: ["c", "mcu", "sensor", "uart"],
    links: [],
    relatedTech: [
      {
        category: "communication",
        slug: "uart-frame-and-baud-rate",
        context: "보드의 상태와 센서 값을 호스트로 전달하는 통신 기반",
      },
      {
        category: "c",
        slug: "c-struct-layout",
        context: "센서 샘플과 제어 상태를 안전하게 표현하는 데이터 구조",
      },
    ],
    body: `> 이 글은 블로그 구성을 보여 주기 위한 **샘플 프로젝트**입니다. 실제 수행 이력이 아닙니다.

## 프로젝트 개요

온도와 토양 수분을 주기적으로 측정하고, 설정한 임계값에 따라 환기 팬과 급수 펌프를 제어하는 장치를 가정했습니다. 제어 상태와 센서 값은 [UART](/tech/communication/uart-frame-and-baud-rate)를 통해 호스트로 전달합니다.

## 맡은 역할

- 센서 읽기와 액추에이터 제어 흐름 설계
- 타이머 기반 주기 작업 구성
- UART 디버그 로그 포맷 정의
- 비정상 센서 값에 대한 안전 모드 설계

## 사용 기술

\`C\`, \`Cortex-M\`, \`GPIO\`, \`ADC\`, \`UART\`

## 문제 해결 예시

센서 값을 한 번만 읽어 즉시 장치를 켜면 노이즈 때문에 출력이 짧게 반복되는 문제가 생길 수 있습니다. 이동 평균과 히스테리시스를 적용해 임계값 주변에서 출력이 흔들리지 않도록 설계합니다.

## 기대 결과

센서 수집, 판단, 출력 제어를 서로 분리하여 이후 센서나 통신 방식을 바꾸더라도 핵심 제어 로직을 재사용할 수 있습니다. 센서 데이터 묶음의 메모리 배치는 [C 구조체와 메모리 배치](/tech/c/c-struct-layout)에서 더 자세히 다룹니다.`,
  },
  {
    kind: "project",
    slug: "uart-log-monitor",
    category: null,
    title: "UART 로그 모니터",
    summary:
      "보드의 시리얼 로그를 수집하고 장애 시점의 메시지를 빠르게 찾는 도구 예시입니다.",
    publishedAt: "2026-09-12",
    isSample: true,
    sortOrder: 10,
    tags: ["python", "uart", "linux", "debugging"],
    links: [],
    relatedTech: [
      {
        category: "communication",
        slug: "uart-frame-and-baud-rate",
        context: "로그가 깨질 때 프레임과 보레이트를 점검하기 위한 배경 지식",
      },
    ],
    body: `> 이 글은 블로그 구성을 보여 주기 위한 **샘플 프로젝트**입니다. 실제 수행 이력이 아닙니다.

## 프로젝트 개요

개발 보드가 출력하는 UART 메시지를 호스트에서 읽어 날짜별 파일로 저장하고, 오류 수준의 로그를 별도로 표시하는 작은 진단 도구를 가정했습니다. 통신 설정은 [UART 프레임과 보레이트](/tech/communication/uart-frame-and-baud-rate) 글과 연결됩니다.

## 핵심 기능

- 시리얼 포트와 보레이트 선택
- 수신 시각을 포함한 로그 저장
- \`ERROR\`, \`WARN\` 메시지 강조
- 연결 종료 후 자동 재시도

## 데이터 흐름

\`\`\`text
MCU -> USB-UART -> serial reader -> log file
                              -> terminal view
\`\`\`

## 문제 해결 예시

장치가 재부팅될 때 포트가 잠시 사라지는 상황을 고려해 읽기 루프와 연결 관리를 분리합니다. 연결 오류가 발생하면 파일을 안전하게 닫고 일정 시간 후 다시 포트를 탐색합니다.

## 다음 단계

실제 프로젝트로 발전시킬 때는 로그 필터, CSV 내보내기, 여러 장치 동시 수집 기능을 추가할 수 있습니다.`,
  },
  {
    kind: "tech",
    slug: "uart-frame-and-baud-rate",
    category: "communication",
    title: "UART 프레임과 보레이트 이해하기",
    summary:
      "UART 통신의 프레임 구조와 보레이트 불일치가 만드는 증상을 정리한 샘플 글입니다.",
    publishedAt: "2026-09-18",
    isSample: true,
    sortOrder: 20,
    tags: ["uart", "communication", "mcu"],
    links: [],
    relatedTech: [],
    body: `> 이 글은 Tech 메뉴의 구성을 보여 주기 위한 **샘플 기술 글**입니다.

## UART란?

UART는 별도의 클록 선 없이 TX와 RX 선으로 데이터를 주고받는 비동기 직렬 통신 방식입니다. 송신기와 수신기는 미리 약속한 속도와 프레임 형식을 사용해야 합니다.

## 기본 프레임

흔히 사용하는 \`115200 8N1\`은 다음을 의미합니다.

- 초당 115200 심볼 전송
- 데이터 비트 8개
- 패리티 없음(None)
- 스톱 비트 1개

하나의 바이트는 보통 스타트 비트, 데이터 비트, 선택적인 패리티, 스톱 비트 순서로 전달됩니다.

## 글자가 깨질 때 확인할 것

1. 양쪽의 보레이트가 같은가?
2. 데이터·패리티·스톱 비트 설정이 같은가?
3. TX와 RX가 교차 연결되었는가?
4. 두 장치가 GND를 공유하는가?
5. 전압 레벨이 서로 호환되는가?

MCU의 시스템 클록이 바뀌었는데 UART 분주 값을 그대로 사용하면 실제 보레이트가 달라질 수 있습니다. 설정 값뿐 아니라 클록 트리도 함께 확인해야 합니다.`,
  },
  {
    kind: "tech",
    slug: "c-struct-layout",
    category: "c",
    title: "C 구조체와 메모리 배치",
    summary:
      "구조체의 멤버 정렬, 패딩, sizeof를 코드와 함께 살펴보는 샘플 글입니다.",
    publishedAt: "2026-09-08",
    isSample: true,
    sortOrder: 10,
    tags: ["c", "memory", "embedded"],
    links: [],
    relatedTech: [],
    body: `> 이 글은 Tech 메뉴의 구성을 보여 주기 위한 **샘플 기술 글**입니다.

## 구조체의 역할

C 구조체는 관련된 여러 값을 하나의 타입으로 묶습니다. 임베디드 코드에서는 센서 값, 통신 패킷, 설정 값처럼 함께 다루는 데이터를 표현할 때 자주 사용합니다.

\`\`\`c
#include <stdint.h>

typedef struct {
    uint8_t status;
    uint32_t timestamp;
    int16_t temperature;
} SensorSample;
\`\`\`

## 패딩이 생기는 이유

컴파일러는 CPU가 데이터를 효율적으로 읽도록 멤버를 특정 주소 경계에 배치할 수 있습니다. 위 구조체에서는 \`status\` 다음에 \`timestamp\`를 정렬하기 위한 빈 공간이 들어갈 수 있습니다.

\`\`\`c
printf("size=%zu\\n", sizeof(SensorSample));
\`\`\`

구조체 크기를 멤버 크기의 단순 합으로 가정하면 파일 형식이나 통신 패킷을 해석할 때 문제가 생깁니다.

## 실무에서 주의할 점

- 바이너리 프로토콜은 구조체를 그대로 전송하지 말고 직렬화한다.
- \`sizeof\`와 \`offsetof\`로 실제 배치를 확인한다.
- 강제 패킹은 성능 저하나 비정렬 접근 오류를 만들 수 있다.
- 멀티바이트 값은 엔디언을 명시한다.

메모리 배치는 컴파일러와 ABI의 영향을 받으므로 대상 플랫폼의 규칙을 함께 확인해야 합니다.`,
  },
];

for (const post of posts) {
  if (post.kind === "project" && !post.isSample && post.links.length === 0) {
    throw new Error(
      `Published project requires at least one public link: ${post.slug}`,
    );
  }
}

mkdirSync(dirname(databasePath), { recursive: true });
rmSync(databasePath, { force: true });

const db = new DatabaseSync(databasePath);
db.exec(readFileSync(schemaPath, "utf8"));

const insertPost = db.prepare(`
  INSERT INTO posts (
    kind, slug, category, title, summary, body, published_at, is_sample, sort_order
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertTag = db.prepare("INSERT OR IGNORE INTO tags (name) VALUES (?)");
const findTag = db.prepare("SELECT id FROM tags WHERE name = ?");
const insertPostTag = db.prepare(
  "INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)",
);
const insertProjectLink = db.prepare(`
  INSERT INTO project_links (project_id, kind, label, url, sort_order)
  VALUES (?, ?, ?, ?, ?)
`);
const insertProjectTech = db.prepare(`
  INSERT INTO project_tech_links (
    project_id, tech_post_id, context, sort_order
  ) VALUES (?, ?, ?, ?)
`);

const postIds = new Map();

db.exec("BEGIN");
try {
  for (const post of posts) {
    const result = insertPost.run(
      post.kind,
      post.slug,
      post.category,
      post.title,
      post.summary,
      post.body,
      post.publishedAt,
      post.isSample ? 1 : 0,
      post.sortOrder,
    );
    const postId = result.lastInsertRowid;
    const routeKey = `${post.kind}:${post.category ?? ""}:${post.slug}`;
    postIds.set(routeKey, postId);

    for (const tag of post.tags) {
      insertTag.run(tag);
      const tagRow = findTag.get(tag);
      insertPostTag.run(postId, tagRow.id);
    }

    for (const [index, link] of post.links.entries()) {
      insertProjectLink.run(
        postId,
        link.kind,
        link.label,
        link.url,
        index,
      );
    }
  }

  for (const post of posts.filter((item) => item.kind === "project")) {
    const projectId = postIds.get(`project::${post.slug}`);
    for (const [index, relation] of post.relatedTech.entries()) {
      const techId = postIds.get(
        `tech:${relation.category}:${relation.slug}`,
      );
      if (!techId) {
        throw new Error(
          `Related Tech post not found: ${relation.category}/${relation.slug}`,
        );
      }
      insertProjectTech.run(projectId, techId, relation.context, index);
    }
  }
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
} finally {
  db.close();
}

console.log(`Seeded ${posts.length} sample posts into ${databasePath}`);
