import { CANVAS_SIZE, GROUND_SIZE, SCALE } from "./constants.js";
import Vector2d from "./Vector2d.js";

export function sign(p1, p2, p3) {
  return (p1.x - p3.x) * (p2.z - p3.z) - (p2.x - p3.x) * (p1.z - p3.z);
}

export function pointInTriangle(point, a, b, c) {
  // Быстрая проверка точки в треугольнике методом ориентированных площадей
  const d1 = sign(point, a, b);
  const d2 = sign(point, b, c);
  const d3 = sign(point, c, a);

  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;

  return !(hasNeg && hasPos);
}

export function findPointsInAABB(
  targetPoint,
  trajectory,
  radius,
  shiftIndices = 0
) {
  const indices = [];
  const minX = targetPoint.x - radius;
  const maxX = targetPoint.x + radius;
  const minZ = targetPoint.z - radius;
  const maxZ = targetPoint.z + radius;

  for (let i = 2; i < trajectory.length - shiftIndices - 1; i++) {
    const point = trajectory[i];
    if (point.x > minX && point.x < maxX && point.z > minZ && point.z < maxZ) {
      indices.push(i + 1);
    }
  }

  return indices;
}

export function allSegments(point, points, leftPoints, rightPoints) {
  if (points.length === 0) {
    return [];
  }
  const indeces = [];
  for (const i of points) {
    if (segment(point, i, leftPoints, rightPoints)) {
      indeces.push(i);
    }
  }

  return indeces;
}

export function segment(point, i, leftPoints, rightPoints) {
  const BL = leftPoints[i];
  const BR = rightPoints[i];
  const AL = leftPoints[i - 1];
  const AR = rightPoints[i - 1];
  console.log(i, " ");

  if (
    pointInTriangle(point, AL, BL, BR) ||
    pointInTriangle(point, BR, AR, AL)
  ) {
    return true;
  }

  return false;
}

export function fillGround(ctx, color = "#00ff00") {
  const canvas = ctx.canvas;
  ctx.fillStyle = color;
  console.log(canvas.width, canvas.height);

  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function worldToScreen(val) {
  return (val / GROUND_SIZE.w) * CANVAS_SIZE.w;
}

export function worldToScreenVec2d(point) {
  const y = CANVAS_SIZE.h - (point.y + GROUND_SIZE.h / 2) * SCALE;
  const x = (point.x + GROUND_SIZE.w / 2) * SCALE;
  return new Vector2d(x, y);
}

export function drawCircle(ctx, point, radius, color = "#ff0000") {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
  ctx.fill();
}
