export type Vec2 = { x: number; z: number };

export function length(x: number, z: number): number {
  return Math.hypot(x, z);
}

export function normalize(x: number, z: number): Vec2 {
  const magnitude = length(x, z);
  if (magnitude <= 0.0001) {
    return { x: 0, z: 0 };
  }
  return { x: x / magnitude, z: z / magnitude };
}

export function clampToCircle(point: Vec2, radius: number): Vec2 {
  const magnitude = length(point.x, point.z);
  if (magnitude <= radius) {
    return point;
  }
  const ratio = radius / magnitude;
  return { x: point.x * ratio, z: point.z * ratio };
}

export function distanceSquared(a: Vec2, b: Vec2): number {
  const x = a.x - b.x;
  const z = a.z - b.z;
  return x * x + z * z;
}
