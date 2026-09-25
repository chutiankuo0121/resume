/** Shared normalized paper contours: DOM cutouts and portal sampling use the
 * same complements. The uncut picture is never painted behind the pieces. */
export function careerCollagePaths(index: number) {
  const seams = [
    [.30, .37, .34, .78, .83, .85],
    [.28, .35, .29, .72, .76, .73],
    [.29, .35, .32, .74, .79, .86],
    [.28, .31, .33, .80, .82, .88],
    [.31, .36, .32, .74, .78, .84],
    [.30, .35, .32, .74, .80, .84],
    [.30, .35, .32, .73, .78, .84],
  ][index % 7];
  function line(a: number, b: number, c: number) {
    return Array.from({ length: 65 }, (_, i) => {
      const x = i / 64;
      const y = x < .5 ? a + (b - a) * x * 2 : b + (c - b) * (x - .5) * 2;
      const fiber = Math.sin(i * 2.39 + index) * .003 + Math.sin(i * 5.71) * .0018;
      return [x, y + fiber].map(v => v.toFixed(5)).join(",");
    });
  }
  const upper = line(seams[0], seams[1], seams[2]);
  const lower = line(seams[3], seams[4], seams[5]);
  return {
    cutout: `M${upper.join(" L")} L1,1 L0,1 Z`,
    middle: `M${upper.join(" L")} L${[...lower].reverse().join(" L")} Z`,
    front: `M${lower.join(" L")} L1,1 L0,1 Z`,
  };
}
