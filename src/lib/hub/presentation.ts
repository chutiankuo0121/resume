import type { BoundaryState } from "./boundaryField";

/** 同一个场景从拼图预览展开到全屏；只改变构图，不重建相机或丢失浏览位置。 */
export type PortalPresentation = {
  expansion: number;
  interactive: boolean;
  visible: boolean;
  suspended: boolean;
  boundary: BoundaryState;
};

export const createPresentation = (
  boundary: BoundaryState,
): PortalPresentation => ({
  expansion: 0,
  interactive: false,
  visible: true,
  suspended: false,
  boundary,
});
