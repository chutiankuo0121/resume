import { crystalTransform } from "./crystal";
import { particleKernel } from "./particleKernel";
export { particleFragment } from "./particleKernel";

// 水晶只提供刚体变换；运动、圆核与遮挡由共用内核实现。
export const particleVertex = /* glsl */ `
${particleKernel}
${crystalTransform}
void main(){
  drawParticle(position,aAmbient>.5?position:rotateCrystal(position));
}
`;
