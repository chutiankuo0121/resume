export type Soundtrack = {
  src: string;
  title: string;
  credit?: { name: string; href: string; license: string; licenseHref: string };
};

/** 选定配乐后只需填写这一处；未选曲时不请求音频、不显示空开关。 */
export const soundtrack: Soundtrack | null = null;
