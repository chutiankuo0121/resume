import { useCallback, useEffect, useRef, useState } from "react";

async function load() {
  const [content, view] = await Promise.all([import("@/content/works"), import("./WorkDetail")]);
  return { works: new Map(content.works.map(work => [work.id, work])), Component: view.default };
}
let modules: ReturnType<typeof load> | undefined;
function prepare() {
  return modules ??= load().catch(error => { modules = undefined; throw error; });
}

/** 推进镜头期间预取详情；点击失败仍可重试，不让过期请求重新打开已关闭的弹窗。 */
export function preloadWorkDetail() { void prepare().catch(() => {}); }

export function useWorkDetail() {
  type Modules = Awaited<ReturnType<typeof load>>;
  type Detail = { Component: Modules["Component"]; work: NonNullable<ReturnType<Modules["works"]["get"]>> };
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);
  const clear = useCallback(() => { request.current++; setDetail(null); setError(""); }, []);
  const open = useCallback(async (id: string) => {
    const current = ++request.current;
    setError("");
    try {
      const { works, Component } = await prepare();
      const work = works.get(id);
      if (!work) throw new Error(`Unknown work: ${id}`);
      if (request.current === current) setDetail({ Component, work });
    } catch {
      if (request.current === current) setError("The work could not load. Please try again.");
    }
  }, []);
  return { detail, error, open, clear };
}
