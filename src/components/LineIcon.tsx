/** The same one-pixel marks used by the site's action controls. */
export default function LineIcon({ name }: { name: "back" | "plus" | "close" }) {
  const path = {
    back: "M15 9H3m5-5L3 9l5 5",
    plus: "M9 3v12M3 9h12",
    close: "m4 4 10 10M14 4 4 14",
  }[name];
  return <svg className="line-button__icon" data-icon={name} viewBox="0 0 18 18" fill="none"
    stroke="currentColor" strokeWidth="1" aria-hidden="true"><path d={path} /></svg>;
}
