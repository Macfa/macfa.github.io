---
title: C 구조체와 메모리 배치
aliases:
  - C 구조체
  - 구조체 메모리 배치
date: "2026-09-08"
summary: 구조체의 멤버 정렬, 패딩, sizeof를 코드와 함께 살펴보는 샘플 글입니다.
tags:
  - c
  - memory
  - embedded
sample: true
---

> 이 글은 Tech 메뉴의 구성을 보여 주기 위한 **샘플 기술 글**입니다.

## 구조체의 역할

C 구조체는 관련된 여러 값을 하나의 타입으로 묶습니다. 임베디드 코드에서는 센서 값, 통신 패킷, 설정 값처럼 함께 다루는 데이터를 표현할 때 자주 사용합니다.

```c
#include <stdint.h>

typedef struct {
    uint8_t status;
    uint32_t timestamp;
    int16_t temperature;
} SensorSample;
```

## 패딩이 생기는 이유

컴파일러는 CPU가 데이터를 효율적으로 읽도록 멤버를 특정 주소 경계에 배치할 수 있습니다. 위 구조체에서는 `status` 다음에 `timestamp`를 정렬하기 위한 빈 공간이 들어갈 수 있습니다.

```c
printf("size=%zu\n", sizeof(SensorSample));
```

구조체 크기를 멤버 크기의 단순 합으로 가정하면 파일 형식이나 통신 패킷을 해석할 때 문제가 생깁니다.

## 실무에서 주의할 점

- 바이너리 프로토콜은 구조체를 그대로 전송하지 말고 직렬화한다.
- `sizeof`와 `offsetof`로 실제 배치를 확인한다.
- 강제 패킹은 성능 저하나 비정렬 접근 오류를 만들 수 있다.
- 멀티바이트 값은 엔디언을 명시한다.

메모리 배치는 컴파일러와 ABI의 영향을 받으므로 대상 플랫폼의 규칙을 함께 확인해야 합니다.
