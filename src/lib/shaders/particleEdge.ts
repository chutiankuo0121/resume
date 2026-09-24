/** 低对比晶尘：随机错位、慢漂浮、零星柔光；不绘制任何连续轮廓。 */
export const particleEdgeGLSL = /* glsl */ `
float edgeHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec4 particleEdge(vec2 pixel,float distanceToEdge,float time,float strength){
  float d=abs(distanceToEdge);
  if(d>110. || strength<=0.)return vec4(0.);
  vec2 field=pixel+vec2(time*1.6,-time*.9);
  vec2 grid=floor(field/23.);
  vec3 color=vec3(0.);
  float alpha=0.;
  // 邻格采样允许粒子自由漂移，位置和明暗都独立，避免整齐点阵。
  for(int y=-1;y<=1;y++){
    for(int x=-1;x<=1;x++){
      vec2 cell=grid+vec2(float(x),float(y));
      float seed=edgeHash(cell);
      vec2 center=(cell+vec2(edgeHash(cell+8.1),edgeHash(cell-3.7)))*23.;
      center+=vec2(sin(time*.32+seed*31.),cos(time*.27+seed*43.))*3.;
      float radius=mix(.65,1.65,seed);
      float r=length(field-center);
      float pulse=pow(.5+.5*sin(time*(.85+seed*.6)+seed*71.),4.);
      float glint=step(.94,seed)*pulse;
      float core=1.-smoothstep(radius*.15,radius+1.,r);
      float glow=exp(-r*r/13.)*glint*.25;
      float weight=(core*(.16+pulse*.3+glint*.2)+glow)*step(.56,seed);
      weight*=exp(-d*d/(1700.+seed*2200.))*strength;
      color+=mix(vec3(.58,.62,.63),vec3(.96,.98,1.),pulse)*weight;
      alpha+=weight;
    }
  }
  return vec4(color/max(alpha,.0001),min(alpha,.68));
}
`;
