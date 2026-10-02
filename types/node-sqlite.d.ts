declare module "node:sqlite" {
  type SQLInputValue = null | number | bigint | string | Uint8Array;

  export class StatementSync {
    all(...anonymousParameters: SQLInputValue[]): Record<string, unknown>[];
    get(...anonymousParameters: SQLInputValue[]): Record<string, unknown> | undefined;
  }

  export class DatabaseSync {
    constructor(
      location: string,
      options?: { open?: boolean; readOnly?: boolean; enableForeignKeyConstraints?: boolean },
    );
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
