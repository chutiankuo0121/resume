/** CPU form of the opening portal's field. DOM clipping and rim lighting share
 * these samples, so the frame, labels and live canvases reveal as one picture. */
const fract = (value: number) => value - Math.floor(value);
// Nearby rays revisit the same integer lattice. A bounded direct-mapped cache
// preserves the exact noise values without repeating four sine calls per sample.
const cacheSize = 16384;
const latticeX = new Int32Array(cacheSize), latticeY = new Int32Array(cacheSize);
const latticeValue = new Float64Array(cacheSize), latticeValid = new Uint8Array(cacheSize);
function hash(x: number, y: number) {
  const slot = (Math.imul(x, 73856093) ^ Math.imul(y, 19349663)) & (cacheSize - 1);
  if (latticeValid[slot] && latticeX[slot] === x && latticeY[slot] === y) return latticeValue[slot];
  latticeValid[slot] = 1; latticeX[slot] = x; latticeY[slot] = y;
  return latticeValue[slot] = fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
}
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = fract(x), fy = fract(y);
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}
function field(x: number, y: number) {
  let value = 0, amplitude = .5;
  for (let i = 0; i < 4; i++) {
    value += amplitude * noise(x, y);
    const nextX = (x * .8 + y * .6) * 2.03 + 7.1;
    y = (-x * .6 + y * .8) * 2.03 + 7.1;
    x = nextX;
    amplitude *= .5;
  }
  return value;
}

export function createPortalContour(count: number) {
  const points = Array.from({ length: count }, () => ({ x: 0, y: 0 }));
  const directions = points.map((_, i) => {
    const angle = i / (count - 1) * Math.PI * 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  });
  let lastProgress = NaN, lastWidth = 0, lastHeight = 0;
  return {
    update(progress: number, width: number, height: number) {
      // Original portal radius, broad/fine noise and drift. Progress owns the
      // drift here too: reverse scrolling retraces the exact same torn edge.
      const p = Math.max(0, Math.min(1, progress));
      if (p === lastProgress && width === lastWidth && height === lastHeight) return points;
      lastProgress = p; lastWidth = width; lastHeight = height;
      const radius = -.11 + (Math.hypot(width / height * .5, .5) + .27) * p;
      const time = p * 4, dx = time * .065, dy = -time * .047;
      for (let i = 0; i < count - 1; i++) {
        const direction = directions[i];
        let low = Math.max(0, radius - .09), high = Math.max(0, radius + .09);
        for (let j = 0; j < 9; j++) {
          const r = (low + high) * .5;
          const x = direction.x * r, y = -direction.y * r;
          const distance = r - radius + (field(x * 7 + dx, y * 7 + dy) - .47) * .105
            + (field(x * 42 - dx * 2.1, y * 42 - dy * 2.1) - .47) * .025;
          if (distance > 0) high = r;
          else low = r;
        }
        const r = (low + high) * .5 * height;
        points[i].x = width * .5 + direction.x * r;
        points[i].y = height * .5 + direction.y * r;
      }
      Object.assign(points[count - 1], points[0]);
      return points;
    },
  };
}
