import { createContext } from "react";

/** 试玩只通知宿主暂停/恢复，不依赖作品网格、技能场景或主线滚动的实现。 */
export const WorkPlaybackContext = createContext<
  ((playing: boolean) => void) | null
>(null);
