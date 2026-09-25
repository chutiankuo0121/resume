/** These polygons separate already-transparent objects; they do not cut scenery
 * into arbitrary bands. All assets share the original 16:9 image coordinates. */
const polygon = (points: number[][]) => `M${points.map(p => p.map(n => n / 100).join(",")).join(" L")} Z`;
const regions = [
  [ // Campus: teaching wings, tower, then bridge and reeds.
    [[28,32],[69,32],[69,63],[28,63]],
    [[72,20],[90,20],[90,63],[72,63]],
  ],
  [ // Study: globe, lamp, then notebook and books.
    [[81,30],[100,30],[100,83],[81,83]],
    [[59,21],[72,21],[82,39],[80,64],[81,77],[70,77],[70,70],[75,66],[76,59],[70,46],[59,44]],
  ],
  [ // Harbor: lighthouse, telescope, then rocks and rope.
    [[76,5],[100,5],[100,73.5],[83,74.5],[74,75],[74,57],[76,55]],
    [[53,35],[76,35],[76,56],[70,57],[73,88],[64,90],[57,97],[53,96],[59,57],[54,46]],
  ],
  [ // Workshop: typewriter, spool machine, then paper ribbon.
    [[44,46],[77,46],[77,79],[44,79]],
    [[77,29],[100,29],[100,80],[90,80],[86,72],[78,76]],
  ],
  [ // Studio: cinema camera, light, then photographic prints and film.
    [[53,12],[79,12],[79,47],[72,49],[73,77],[53,77]],
    [[78,7],[100,7],[100,68],[88,68],[92,50],[94,36],[78,29]],
  ],
  [ // Audio: microphone, tape recorder, then mixing console.
    [[58,20],[74,20],[74,79],[58,79]],
    [[79,28],[100,28],[100,76],[79,76]],
  ],
  [ // Observatory: pavilion, telescope, then garden and parapet.
    [[73,8],[100,8],[100,70],[73,70]],
    [[56,39],[74,39],[74,61],[70,62],[74,90],[59,88],[63,60],[56,50]],
  ],
] as const;

export const careerArtNames = ["university", "research", "markets", "automation", "creative", "product", "venture"] as const;
export function careerArtwork(index: number) {
  const name = careerArtNames[index];
  const [middle, subject] = regions[index].map(points => polygon(points.map(p => [...p])));
  return {
    sketch: `/career-panorama/${name}-sketch.webp`,
    objects: `/career-panorama/${name}-objects.webp`,
    paths: [middle, subject, `M0,0 H1 V1 H0 Z ${middle} ${subject}`],
  };
}
