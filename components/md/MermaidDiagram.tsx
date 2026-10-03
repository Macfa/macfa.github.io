"use client";

import { useEffect, useId, useState } from "react";
import styles from "./MermaidDiagram.module.css";

export function MermaidDiagram({ chart }: { chart: string }) {
  const reactId = useId();
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const render = async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: media.matches ? "dark" : "default",
        });

        const diagramId = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
        const result = await mermaid.render(diagramId, chart);
        if (active) {
          setSvg(result.svg);
          setError("");
        }
      } catch (reason) {
        if (active) {
          setSvg("");
          setError(reason instanceof Error ? reason.message : "다이어그램을 렌더링하지 못했습니다.");
        }
      }
    };

    void render();
    media.addEventListener("change", render);
    return () => {
      active = false;
      media.removeEventListener("change", render);
    };
  }, [chart, reactId]);

  if (error) {
    return (
      <div className={`${styles.diagram} ${styles.error}`}>
        <p>Mermaid 다이어그램 오류: {error}</p>
        <pre>{chart}</pre>
      </div>
    );
  }

  return (
    <div
      className={styles.diagram}
      role="img"
      aria-label="Mermaid 다이어그램"
      aria-busy={!svg}
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    >
      {svg ? null : "다이어그램을 불러오는 중…"}
    </div>
  );
}
