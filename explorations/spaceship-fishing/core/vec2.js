// 2D vector helpers. All functions are pure — they return new objects and never mutate inputs.
// Convention: a Vec2 is a plain { x, y } object.

export const vec2 = {
  zero: () => ({ x: 0, y: 0 }),
  of: (x, y) => ({ x, y }),

  add:  (a, b) => ({ x: a.x + b.x, y: a.y + b.y }),
  sub:  (a, b) => ({ x: a.x - b.x, y: a.y - b.y }),
  scale: (v, s) => ({ x: v.x * s, y: v.y * s }),
  neg:  (v)    => ({ x: -v.x, y: -v.y }),

  dot: (a, b) => a.x * b.x + a.y * b.y,
  cross: (a, b) => a.x * b.y - a.y * b.x,

  magnitudeSq: (v) => v.x * v.x + v.y * v.y,
  magnitude:   (v) => Math.sqrt(v.x * v.x + v.y * v.y),

  normalize: (v) => {
    const m = Math.sqrt(v.x * v.x + v.y * v.y);
    return m === 0 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m };
  },

  // Rotate v by angle (radians), counter-clockwise in standard math coords.
  // In SVG (+y down), this rotates clockwise visually.
  rotate: (v, angle) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
  },

  lerp: (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }),

  distanceSq: (a, b) => {
    const dx = a.x - b.x, dy = a.y - b.y;
    return dx * dx + dy * dy;
  },
  distance: (a, b) => {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  clone: (v) => ({ x: v.x, y: v.y }),
};
