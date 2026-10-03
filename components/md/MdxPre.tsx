import { isValidElement, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { MermaidDiagram } from "./MermaidDiagram";

type PrettyCodePreProps = ComponentPropsWithoutRef<"pre"> & {
  "data-language"?: string;
};

function codeBlockText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(codeBlockText).join("");
  }
  if (!isValidElement<{ children?: ReactNode; "data-line"?: boolean }>(node)) {
    return "";
  }

  const text = codeBlockText(node.props.children);
  return node.props["data-line"] !== undefined ? `${text}\n` : text;
}

export function MdxPre({ children, ...props }: PrettyCodePreProps) {
  if (props["data-language"] === "mermaid") {
    return <MermaidDiagram chart={codeBlockText(children).trim()} />;
  }

  return <pre {...props}>{children}</pre>;
}
