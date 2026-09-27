/** 一幕一句；中文与英文始终作为同一组进入和离开。 */
export const opening = {
  scenes: [
    {
      id: "unnamed",
      world: "hole",
      lines: ["有些未来，", "尚未被命名。"],
      translation: ["Some futures", "have yet to be named."],
    },
    {
      id: "waiting",
      world: "hole",
      lines: ["它藏在一个念头里，", "等待被唤醒。"],
      translation: ["They lie within an idea,", "waiting to awaken."],
    },
    {
      id: "threshold",
      world: "hole",
      lines: ["当想象，", "开始触碰现实。"],
      translation: ["When imagination", "begins to touch the real."],
    },
    {
      id: "imagination",
      world: "crystal",
      lines: ["AI，让一个人的想象，", "有了向外生长的力量。"],
      translation: ["With AI, one person's imagination", "finds the power to reach further."],
    },
    {
      id: "time",
      world: "crystal",
      lines: ["让机器接过往复，", "让人继续远行。"],
      translation: ["Let machines take on repetition,", "so we can keep exploring."],
    },
    {
      id: "possibility",
      world: "crystal",
      lines: ["在不确定的世界里，", "寻找值得相信的线索。"],
      translation: ["In a world of uncertainty,", "seek the clues worth trusting."],
    },
  ],
} as const;
