import { type PointerEvent, useEffect, useRef } from "react";
import type { CanvasPoint, CanvasStroke } from "../shared/protocol";

interface CollaborativeCanvasProps {
  onStroke?: (stroke: CanvasStroke) => void;
  strokes: CanvasStroke[];
}

function drawStroke(context: CanvasRenderingContext2D, stroke: CanvasStroke, width: number, height: number) {
  const [first, ...rest] = stroke.points;
  if (!first) return;
  context.beginPath();
  context.moveTo(first.x * width, first.y * height);
  rest.forEach((point) => context.lineTo(point.x * width, point.y * height));
  context.stroke();
}

export function CollaborativeCanvas({ onStroke, strokes }: CollaborativeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePoints = useRef<CanvasPoint[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#17132b";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 8;
    strokes.forEach((stroke) => drawStroke(context, stroke, canvas.width, canvas.height));
  }, [strokes]);

  function point(event: PointerEvent<HTMLCanvasElement>): CanvasPoint {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    };
  }

  function start(event: PointerEvent<HTMLCanvasElement>) {
    if (!onStroke) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    activePoints.current = [point(event)];
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!onStroke || activePoints.current.length === 0) return;
    const next = point(event);
    const previous = activePoints.current.at(-1);
    activePoints.current.push(next);
    const context = event.currentTarget.getContext("2d");
    if (context && previous) {
      drawStroke(context, { id: "active", points: [previous, next] }, event.currentTarget.width, event.currentTarget.height);
    }
  }

  function finish() {
    if (!onStroke || activePoints.current.length < 2) {
      activePoints.current = [];
      return;
    }
    const id = typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    onStroke({ id, points: activePoints.current.slice(0, 500) });
    activePoints.current = [];
  }

  return (
    <canvas
      aria-label={onStroke ? "Shared drawing canvas" : "Shared artwork"}
      className="drawing-canvas"
      height={640}
      onPointerCancel={finish}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={finish}
      ref={canvasRef}
      width={640}
    />
  );
}
