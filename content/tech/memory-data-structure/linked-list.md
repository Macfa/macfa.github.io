---
title: C로 구현한 단일 연결 리스트
aliases:
  - 연결 리스트
  - 단일 연결 리스트
  - linked_list
date: "2026-10-03"
summary: 동적 할당한 노드를 포인터로 연결하는 단일 연결 리스트 구현을 정리합니다.
tags:
  - c
  - data-structure
  - linked-list
sample: false
---

## 대응하는 소스

- `data_structure/linked_list/linked_list.h`
- `data_structure/linked_list/linked_list.c`

이 문서는 위 두 파일의 현재 구현과 1:1로 대응한다.


## TL;DR

연결 리스트는 포인터를 이용해 떨어진 메모리의 노드를 하나의 순서로 연결한다.

탐색 시간은 요소에 비례한다 (`O(n)`).

위치를 알면 수정·삭제가 빠르다.

대신 추가 포인터와 메모리 관리가 필요하다.


## 개요

연결 리스트는 각각의 노드가 다음 노드의 주소를 저장하여 연결되는 자료구조다.
이 문서에서는 이해한 범위 내에서 연결 리스트를 설명한다.


## 구조와 동작 원리

```c
typedef struct NODE {
  int number;
  int data;
  struct NODE* next;
} Node;
```

각 노드는 데이터와 다음 노드를 가리키는 `next` 포인터를 가진다.
필요하다면 식별번호를 둘 수 있다.
`head`부터 `next`를 따라 순회하며, 마지막 노드의 `next`는 `NULL`이다.

```mermaid
flowchart LR
    HEAD((head)) --> N1["Node 1<br/>data = 11"]
    N1 -->|next| N2["Node 2<br/>data = 22"]
    N2 -->|next| N3["Node 3<br/>data = 33"]
    N3 -->|next| END[NULL]
```

## 주의사항

힙 메모리 영역에 노드를 생성하는 것이므로, 연결 리스트의 사용이 끝났을 경우 꼭 메모리 해제와 포인터 `NULL` 처리가 필요하다.

중간 노드를 제거할 경우, 이전 노드의 `next`를 갱신하지 않으면 삭제 요소 이후의 노드에 접근할 수 없게 된다.

## 구현
```c
#include <stdio.h>
#include <stdlib.h>

typedef struct NODE {
  int number;
  int data;
  struct NODE* next;
} Node;

/**
 * @brief 연결 리스트를 순회하며 각 노드의 값을 출력하는 함수
 * @param node 출력할 연결 리스트의 첫 번째 노드 포인터
 * @return void 리턴 되는 값 없음
 */
void displayNode(Node* node) {
  while(node != NULL) {
    printf("number : %d,\tdata : %d\n", node->number, node->data);
    node = node->next;
  }
}

/**
 * @brief 주어진 노드부터 연결된 모든 노드의 메모리를 재귀적으로 해제
 * @param node 해제할 연결 리스트의 첫 번째 노드 포인터
 * @return Node* 항상 NULL을 반환하여 호출자가 포인터를 NULL처리할 수 있도록 함
 * @note 재귀 방식으로 동작하며, 후위(post-order) 순회로 자식 노드부터 메모리 해제
 */
Node* clearNode(Node* node) {

  // recursion end condition
  if(node == NULL) {
    return NULL;
  }

  // recursion
  node->next = clearNode(node->next);

  // recursion action
  free(node);

  // recursion return value
  return NULL;
}

/**
 * @brief 연결 리스트를 출력 및 제거하기 위한 함수
 * @param void
 * @return void
 * @note  테스트용도의 함수
 */
void testLinkedList(void) {
  Node* head_node = malloc(sizeof(Node));
  if(head_node == NULL) {
    return;
  }
  head_node->number = 1;
  head_node->data = 11;
  head_node->next = NULL;

  head_node->next = malloc(sizeof(Node));
  if(head_node->next == NULL) {
    head_node = clearNode(head_node);
    return;
  }
  head_node->next->number = 2;
  head_node->next->data = 22;
  head_node->next->next = NULL;

  head_node->next->next = malloc(sizeof(Node));
  if(head_node->next->next == NULL) {
    head_node = clearNode(head_node);
    return;
  }
  head_node->next->next->number = 3;
  head_node->next->next->data = 33;
  head_node->next->next->next = NULL;

  displayNode(head_node);
  head_node = clearNode(head_node);
}

```


{/* ## 비고 */}
