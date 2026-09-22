/** 字符串种子生成稳定随机数：刷新、返回详情、窗口缩放都不会重新洗牌。 */
export function mediaSeed(key: string) {
  let seed = 2166136261;
  for (let i = 0; i < key.length; i++)
    seed = Math.imul(seed ^ key.charCodeAt(i), 16777619);
  // 再混合一次高低位，避免相似 ID 的随机值过于接近。
  seed = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b);
  return ((seed ^ (seed >>> 16)) >>> 0) / 4294967296;
}

/** 跨类型统一洗牌，不按类别、文件名或导入批次分组；ID 种子让返回时位置稳定。 */
export function shuffleMedia<T extends { key: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => mediaSeed(a.key) - mediaSeed(b.key) || a.key.localeCompare(b.key),
  );
}
