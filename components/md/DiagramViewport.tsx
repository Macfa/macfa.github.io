"use client";

import { useState, type ReactNode } from "react";
import styles from "./DiagramViewport.module.css";

type DiagramViewportProps = {
  children: ReactNode;
  label: string;
  loading?: boolean;
  defaultScale?: number;
  minScale?: number;
  maxScale?: number;
  scaleStep?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function DiagramViewport({
  children,
  label,
  loading = false,
  defaultScale = 1.25,
  minScale = 0.75,
  maxScale = 2,
  scaleStep = 0.25,
}: DiagramViewportProps) {
  const initialScale = clamp(defaultScale, minScale, maxScale);
  const [scale, setScale] = useState(initialScale);

  const resize = (amount: number) => {
    setScale((current) => clamp(Number((current + amount).toFixed(2)), minScale, maxScale));
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.toolbar} role="group" aria-label="다이어그램 크기 조절">
        <button
          type="button"
          onClick={() => resize(-scaleStep)}
          disabled={scale <= minScale}
          aria-label="다이어그램 축소"
        >
          −
        </button>
        <output aria-live="polite">{Math.round(scale * 100)}%</output>
        <button
          type="button"
          onClick={() => setScale(initialScale)}
          disabled={scale === initialScale}
        >
          기본
        </button>
        <button
          type="button"
          onClick={() => resize(scaleStep)}
          disabled={scale >= maxScale}
          aria-label="다이어그램 확대"
        >
          +
        </button>
      </div>
      <div className={styles.stage} role="img" aria-label={label} aria-busy={loading}>
        <div className={styles.content} style={{ width: `${scale * 100}%` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
