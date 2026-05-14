import React from "react";
import type { FuseResultMatch } from "fuse.js";

interface HighlightTextProps {
  text: string;
  matches?: readonly FuseResultMatch[];
  fieldKey: string;
}

export function HighlightText({ text, matches, fieldKey }: HighlightTextProps) {
  if (!matches || matches.length === 0) return <>{text}</>;

  const fieldMatch = matches.find((m) => m.key === fieldKey);
  if (!fieldMatch) return <>{text}</>;

  const { indices } = fieldMatch;
  if (!indices || indices.length === 0) return <>{text}</>;

  let lastIndex = 0;
  const chunks: React.ReactNode[] = [];

  indices.forEach(([start, end], i) => {
    if (start > lastIndex) {
      chunks.push(<span key={`text-${i}`}>{text.substring(lastIndex, start)}</span>);
    }
    chunks.push(
      <mark key={`mark-${i}`} className="bg-primary/20 text-primary font-bold rounded px-0.5">
        {text.substring(start, end + 1)}
      </mark>
    );
    lastIndex = end + 1;
  });

  if (lastIndex < text.length) {
    chunks.push(<span key="text-end">{text.substring(lastIndex)}</span>);
  }

  return <>{chunks}</>;
}
