export type AmbientParticle = {
  x: number; y: number;
  offsetX: number; offsetY: number;
  radius: number; alpha: number; targetAlpha: number;
  dx: number; dy: number; magnetism: number;
};

/** Shared Portfolio-style dust; positions and pointer offsets use CSS pixels. */
export function createAmbientParticleField() {
  let width = 1, height = 1;
  const particles: AmbientParticle[] = [];

  function spawn(): AmbientParticle {
    return {
      x: Math.random() * width, y: Math.random() * height,
      offsetX: 0, offsetY: 0,
      radius: Math.random() < .5 ? .35 : 1.1,
      alpha: 0, targetAlpha: Math.random() * .6 + .1,
      dx: (Math.random() - .5) * .2, dy: (Math.random() - .5) * .2,
      magnetism: .1 + Math.random() * 4,
    };
  }

  return {
    particles,
    resize(nextWidth: number, nextHeight: number) {
      for (const particle of particles) {
        particle.x *= nextWidth / width;
        particle.y *= nextHeight / height;
      }
      width = nextWidth; height = nextHeight;
      const count = width < 800 ? 55 : 100;
      particles.length = Math.min(count, particles.length);
      while (particles.length < count) particles.push(spawn());
    },
    update(dt: number, pointerX: number, pointerY: number, mode: "animate" | "static" | "freeze" = "animate") {
      const frames = Math.max(0, Math.min(dt, .05)) * 60;
      const follow = 1 - Math.pow(1 - 1 / 50, frames);
      for (let index = 0; index < particles.length; index++) {
        let particle = particles[index];
        if (mode === "animate") {
          particle.x += particle.dx * frames;
          particle.y += particle.dy * frames;
          particle.offsetX += (pointerX * particle.magnetism / 50 - particle.offsetX) * follow;
          particle.offsetY += (pointerY * particle.magnetism / 50 - particle.offsetY) * follow;
          if (particle.x < -particle.radius || particle.x > width + particle.radius || particle.y < -particle.radius || particle.y > height + particle.radius) {
            particle = particles[index] = spawn();
          }
        } else if (mode === "static") {
          particle.offsetX = 0; particle.offsetY = 0;
        }
        const x = particle.x + particle.offsetX, y = particle.y + particle.offsetY;
        const edge = Math.min(x, width - x, y, height - y) - particle.radius;
        const edgeAlpha = Math.max(0, Math.min(1, edge / 20)) * particle.targetAlpha;
        particle.alpha = mode === "static" ? edgeAlpha : Math.min(edgeAlpha, particle.alpha + (mode === "freeze" ? 0 : .02 * frames));
      }
    },
  };
}
