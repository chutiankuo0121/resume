/** 公开素材统一从 R2 加载；更换域名时只修改这里。此地址不包含访问凭据。 */
export const ASSET_ORIGIN = "https://pub-fda02b5812174ab0b5ab4a4fe4056904.r2.dev";

export function assetUrl(path: string): string {
  return `${ASSET_ORIGIN}${path}`;
}
