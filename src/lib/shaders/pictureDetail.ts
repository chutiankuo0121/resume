/** Shared live image-detail extraction and sparse blinking breakup. */
export const pictureDetailGLSL = /* glsl */ `
float pictureHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float pictureNoise(vec2 p){
  vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(pictureHash(i),pictureHash(i+vec2(1.,0.)),f.x),
    mix(pictureHash(i+vec2(0.,1.)),pictureHash(i+1.),f.x),f.y);
}
// Extract the current frame's real details before any blur or divergent branch.
// This is a live luminance contour, not a previous-frame afterimage.
float pictureDetails(vec3 original){
  float luma=dot(original,vec3(.299,.587,.114));
  return smoothstep(.025,.55,fwidth(luma)*9.);
}
float pictureGhostEmission(float detail,vec2 uv,vec2 size,float time){
  vec2 pixel=uv*size;
  vec2 grid=pixel/2.4, cell=floor(grid);
  float seed=pictureHash(cell);
  float blink=pow(.5+.5*sin(time*2.1+seed*41.),4.);
  float dotShape=1.-smoothstep(.12,.48,length(fract(grid)-.5));
  float sparkle=dotShape*step(.52,seed)*(.25+.75*blink);
  float breakup=smoothstep(.3,.75,pictureNoise(pixel*.085+vec2(time*.12,-time*.09)));
  return detail*(.22+breakup*.58+sparkle*1.6);
}
`;
