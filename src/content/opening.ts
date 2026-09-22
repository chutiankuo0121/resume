import { profile } from "./profile";

/** 序章只留下身份和三句态度，具体经历在后续章节展开。 */
export const opening = {
  name: profile.name,
  englishName: profile.englishName,
  focus: profile.focus,
  statements: [
    { text: "保持好奇", english: "Stay curious.", motion: "resolve" },
    { text: "连接可能", english: "Connect the possibilities.", motion: "connect" },
    { text: "让想法发生", english: "Bring ideas to life.", motion: "become" },
  ],
} as const;
