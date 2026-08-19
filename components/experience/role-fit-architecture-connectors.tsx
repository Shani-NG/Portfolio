"use client";

import { useLayoutEffect, useRef, useState } from "react";

type NodeKey =
  | "visitor"
  | "ui"
  | "agent"
  | "session"
  | "role"
  | "fit"
  | "follow"
  | "report"
  | "orchestrator"
  | "knowledge"
  | "retrieval"
  | "storage"
  | "logging";

type Tone = "agent" | "evidence" | "app";

type Box = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
};

type Connector = {
  id: string;
  d: string;
  tone: Tone;
};

type Layout = {
  width: number;
  height: number;
  connectors: Connector[];
};

const edgeDefinitions: ReadonlyArray<readonly [NodeKey, NodeKey, Tone]> = [
  ["visitor", "agent", "agent"],
  ["ui", "agent", "app"],
  ["agent", "session", "app"],
  ["agent", "role", "agent"],
  ["agent", "fit", "evidence"],
  ["agent", "follow", "agent"],
  ["report", "orchestrator", "app"],
  ["role", "orchestrator", "agent"],
  ["fit", "orchestrator", "evidence"],
  ["follow", "orchestrator", "agent"],
  ["orchestrator", "knowledge", "agent"],
  ["orchestrator", "retrieval", "evidence"],
  ["orchestrator", "storage", "app"],
  ["orchestrator", "logging", "app"],
];

function toBox(element: HTMLElement, root: DOMRect): Box {
  const rect = element.getBoundingClientRect();
  const left = rect.left - root.left;
  const top = rect.top - root.top;
  const right = rect.right - root.left;
  const bottom = rect.bottom - root.top;

  return {
    left,
    top,
    right,
    bottom,
    centerX: left + rect.width / 2,
    centerY: top + rect.height / 2,
  };
}

function connectorPath(from: Box, to: Box): string {
  const horizontalDistance = Math.abs(from.centerY - to.centerY);
  const directHorizontal = horizontalDistance < 16 && (from.right <= to.left || to.right <= from.left);

  if (directHorizontal) {
    const startsLeft = from.centerX < to.centerX;
    const startX = startsLeft ? from.right : from.left;
    const endX = startsLeft ? to.left : to.right;
    return `M ${startX} ${from.centerY} L ${endX} ${to.centerY}`;
  }

  const flowsDown = from.centerY < to.centerY;
  const startX = from.centerX;
  const startY = flowsDown ? from.bottom : from.top;
  const endX = Math.min(Math.max(from.centerX, to.left + 28), to.right - 28);
  const endY = flowsDown ? to.top : to.bottom;
  const elbowY = startY + (endY - startY) / 2;

  return `M ${startX} ${startY} L ${startX} ${elbowY} L ${endX} ${elbowY} L ${endX} ${endY}`;
}

export function RoleFitArchitectureConnectors({
  className,
  agentClassName,
  evidenceClassName,
  appClassName,
}: {
  className: string;
  agentClassName: string;
  evidenceClassName: string;
  appClassName: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const root = svg?.parentElement;

    if (!svg || !root) return;

    const update = () => {
      const rootRect = root.getBoundingClientRect();
      const boxes = new Map<NodeKey, Box>();

      root.querySelectorAll<HTMLElement>("[data-architecture-node]").forEach((element) => {
        const key = element.dataset.architectureNode as NodeKey | undefined;
        if (key) boxes.set(key, toBox(element, rootRect));
      });

      const connectors = edgeDefinitions.flatMap(([fromKey, toKey, tone]) => {
        const from = boxes.get(fromKey);
        const to = boxes.get(toKey);
        if (!from || !to) return [];

        return [{
          id: `${fromKey}-${toKey}`,
          d: connectorPath(from, to),
          tone,
        }];
      });

      setLayout({
        width: rootRect.width,
        height: rootRect.height,
        connectors,
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    root.querySelectorAll<HTMLElement>("[data-architecture-node]").forEach((node) => observer.observe(node));
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={layout ? `0 0 ${layout.width} ${layout.height}` : "0 0 1 1"}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {layout?.connectors.map((connector) => (
        <path
          key={connector.id}
          className={connector.tone === "agent" ? agentClassName : connector.tone === "evidence" ? evidenceClassName : appClassName}
          d={connector.d}
        />
      ))}
    </svg>
  );
}
