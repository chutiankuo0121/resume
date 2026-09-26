import type { ReactNode } from "react";

const ink = "var(--diagram-ink, #304f61)";
const blue = "var(--diagram-blue, #598dab)";
const gold = "var(--diagram-gold, #ac8752)";

const descriptions = {
  research: ["投资研究", "净值曲线、持仓结构与风险分析汇入研究视图。所有曲线均为概念示意，不代表实际业绩。"],
  futures: ["期货策略研究", "行情 K 线、策略信号和回测验证分层展开。图形为流程示意，不代表实际行情或收益。"],
  data: ["数据自动化", "多来源销售表格汇入自动清洗、匹配与校验流程，再生成统一报表。"],
  content: ["内容自动化", "工作流编排驱动图文和视频批量生成，经队列调度，定时分发到多个渠道。"],
  product: ["AI 产品与自动化", "从需求与交互原型出发，连接自动化工作流、任务队列和语音服务。"],
  venture: ["AI 金融系统", "多资产组合配置连接策略研究、交易执行和风险监控。图形为系统概念示意，不代表实际配置或投资收益。"],
} as const;

type Kind = keyof typeof descriptions;
type ArtProps = { prefix: string };

function Label({ x, y, children, anchor = "middle" }: { x: number; y: number; children: ReactNode; anchor?: "middle" | "start" | "end" }) {
  return <text x={x} y={y} textAnchor={anchor} className="career-diagram-label" fill={ink}>{children}</text>;
}

function Route({ d }: { d: string }) {
  return <g fill="none" strokeLinecap="round">
    <path d={d} stroke={blue} strokeOpacity=".28" strokeWidth="2" />
    <path d={d} stroke={blue} strokeWidth="3" strokeDasharray="9 600" data-art-flow="" />
  </g>;
}

function Node({ x, y, accent = false }: { x: number; y: number; accent?: boolean }) {
  return <g>
    <circle cx={x} cy={y} r="8" fill="#f6f9f9" stroke={accent ? gold : blue} strokeWidth="1.5" />
    <circle cx={x} cy={y} r="3" fill={accent ? gold : blue} data-art-pulse="" />
  </g>;
}

function BaseGrid() {
  return <g fill="none" stroke={ink} strokeWidth=".8" opacity=".13">
    {[0, 1, 2, 3, 4, 5, 6].map(i => <path key={i} d={`M${50 + i * 48} ${404 - i * 19}l252 100 M${50 + i * 42} ${404 + i * 16.7}l288 -114`} />)}
  </g>;
}

function Tile({ x, y, size, prefix, dark = false }: { x: number; y: number; size: number; prefix: string; dark?: boolean }) {
  const h = size * .44;
  return <g stroke="#8b9fa9" strokeWidth="1">
    <path d={`M${x - size} ${y}l${size} ${h}v14l-${size} -${h}Z`} fill={`url(#${prefix}-edge)`} />
    <path d={`M${x} ${y + h}l${size} -${h}v14l-${size} ${h}Z`} fill="#7c96a4" />
    <path d={`M${x} ${y - h}l${size} ${h}-${size} ${h}-${size}-${h}Z`} fill={`url(#${prefix}-${dark ? "blue" : "silver"})`} />
    <path d={`M${x - size + 9} ${y + 1}l${size - 9} ${h - 4} ${size - 9} -${h - 4}`} fill="none" stroke="#fff" strokeOpacity=".8" />
  </g>;
}

function Research({ prefix }: ArtProps) {
  const curves = [
    "M65 263C98 265 104 190 139 204S174 302 212 251S252 125 299 154S348 226 382 182S432 105 474 136S530 192 578 107",
    "M65 280C103 283 115 246 153 253S210 292 255 229S311 237 351 245S403 179 443 209S515 214 578 161",
    "M65 294C112 285 139 306 182 292S255 259 295 279S347 314 387 276S469 245 509 257S557 261 578 231",
  ];
  return <>
    <g data-art-part="">
      <path d="M56 324V86M56 324H591" fill="none" stroke={ink} strokeOpacity=".35" />
      {[124, 188, 252].map(y => <path key={y} d={`M56 ${y}H591`} stroke={ink} strokeOpacity=".12" strokeDasharray="3 8" />)}
      <path d={`${curves[0]}L578 324H65Z`} fill={`url(#${prefix}-area)`} />
      {curves.map((d, i) => <path key={d} d={d} fill="none" stroke={[ink, blue, "#9bacb4"][i]} strokeWidth={i === 0 ? 3.5 : 2} pathLength="1" data-art-draw="" />)}
      <path d="M299 93V324" stroke={gold} strokeOpacity=".7" strokeDasharray="4 6" />
      <Node x={299} y={154} accent />
      <Node x={474} y={136} />
      <Label x={62} y={64} anchor="start">净值研究</Label>
    </g>
    <g data-art-part="">
      <path d="M70 419H290" stroke={ink} strokeOpacity=".25" />
      {[46, 77, 56, 96, 68, 40, 82, 52].map((h, i) => <g key={i}>
        <path d={`M${78 + i * 26} 418v-${h}l14 -6v${h}Z`} fill={`url(#${prefix}-silver)`} stroke={blue} strokeWidth=".8" />
        <path d={`M${92 + i * 26} ${412 - h}l5 4v${h}l-5 -4Z`} fill={blue} fillOpacity=".65" />
      </g>)}
      <Label x={178} y={472}>持仓结构</Label>
    </g>
    <g data-art-part="" transform="translate(478 401)">
      {[64, 41, 20].map(r => <path key={r} d={`M0 -${r}L${r} 0 0 ${r}-${r} 0Z`} fill="none" stroke={ink} strokeOpacity=".24" />)}
      <path d="M0 -70V70M-70 0H70" stroke={ink} strokeOpacity=".2" />
      <path d="M0 -51L49 0 0 28-34 0Z" fill={`url(#${prefix}-area)`} stroke={blue} strokeWidth="2" pathLength="1" data-art-draw="" />
      <circle cx="0" cy="-51" r="4" fill={gold} data-art-pulse="" />
      <Label x={0} y={100}>风险分析</Label>
    </g>
  </>;
}

function Futures({ prefix }: ArtProps) {
  // Intentionally unitless: these shapes describe strategy work, not a performance claim.
  const candles = [[258,232],[231,211],[210,235],[236,273],[270,255],[253,204],[204,178],[180,202],[201,171],[173,152],[153,178],[179,163],[164,201],[200,212],[211,184],[183,143],[144,125],[126,149],[148,132],[133,106],[107,126],[124,91]];
  return <>
    <g data-art-part="">
      <Label x={60} y={66} anchor="start">行情</Label>
      {[105, 171, 237, 303].map(y => <path key={y} d={`M60 ${y}H584`} stroke={ink} strokeOpacity=".15" />)}
      <path d="M60 285C167 335 192 191 284 225S421 233 583 118L583 67C427 163 366 166 284 160S164 264 60 217Z" fill={`url(#${prefix}-area)`} opacity=".65" />
      {candles.map(([open, close], i) => {
        const x = 70 + i * 23, top = Math.min(open, close), h = Math.abs(open - close), up = close < open;
        return <g key={i} data-art-candle="">
          <path d={`M${x + 5} ${top - 13}v${h + 29}`} stroke={up ? blue : "#76838a"} strokeWidth="1.4" />
          <rect x={x} y={top} width="11" height={h} fill={up ? `url(#${prefix}-blue)` : "#d2dbe0"} stroke={up ? ink : "#7c8f99"} strokeWidth=".8" />
          <path d={`M${x + 11} ${top}l3 -3v${h}l-3 3Z`} fill={up ? ink : "#99aab3"} />
          <rect x={x} y={334 - h * .8} width="13" height={h * .8} fill={up ? blue : "#b1bec5"} opacity=".5" />
        </g>;
      })}
      <path d="M60 270C116 299 154 301 200 238S271 174 331 195S422 225 475 163S541 145 584 108" fill="none" stroke={gold} strokeWidth="2.5" pathLength="1" data-art-draw="" />
    </g>
    <g data-art-part="">
      <path d="M217 173V367M424 132V367" stroke={gold} strokeDasharray="3 6" opacity=".75" />
      <path d="M208 365l9 -10 9 10M415 355l9 10 9 -10" fill="none" stroke={gold} strokeWidth="2.5" />
      <Node x={217} y={193} accent /><Node x={424} y={156} accent />
      <Label x={60} y={382} anchor="start">信号</Label>
    </g>
    <g data-art-part="">
      <path d="M60 466H584" stroke={ink} strokeOpacity=".2" />
      <path d="M155 454L191 454 217 421 252 436 285 411 328 429 362 413 398 421 424 400 460 418 498 406 541 414 584 395" fill="none" stroke={ink} strokeWidth="2.5" pathLength="1" data-art-draw="" />
      <Label x={60} y={451} anchor="start">验证</Label>
      <path d="M155 480H584" stroke={blue} strokeWidth="1.5" strokeDasharray="2 8" />
    </g>
  </>;
}

function DataAutomation({ prefix }: ArtProps) {
  return <>
    <BaseGrid />
    <Route d="M151 215C207 215 194 272 248 272" />
    <Route d="M150 286C188 286 209 272 248 272" />
    <Route d="M375 272C414 272 423 239 454 239" />
    <g data-art-part="">
      {[0, 1, 2].map(i => <g key={i} transform={`translate(${56 + i * 17} ${112 + i * 39})`}>
        <path d="M0 0H78L94 16V113H0Z" fill={`url(#${prefix}-silver)`} stroke="#8ea4b0" />
        <path d="M78 0V16H94" fill="#d7e3e8" stroke="#8ea4b0" />
        <path d="M14 28H68" stroke={ink} strokeWidth="3" />
        {[44, 60, 76, 92].map((y, j) => <g key={y} stroke={blue} strokeOpacity=".65">
          <path d={`M14 ${y}H${j % 2 ? 38 : 46}M55 ${y}H80`} />
          <rect x={14 + j * 12} y={y - 5} width="7" height="4" fill={blue} stroke="none" opacity=".4" />
        </g>)}
      </g>)}
      <Label x={118} y={389}>采集</Label>
    </g>
    <g data-art-part="">
      <Tile x={310} y={299} size={83} prefix={prefix} />
      <Tile x={310} y={265} size={83} prefix={prefix} />
      <Tile x={310} y={231} size={83} prefix={prefix} dark />
      <path d="M275 229l25 12 44 -24" fill="none" stroke="#ecf5f8" strokeWidth="3.5" pathLength="1" data-art-draw="" />
      <path d="M245 280l65 29 65 -29M245 314l65 29 65 -29" fill="none" stroke="#a1c8dc" strokeWidth="2" />
      {[276, 310, 344].map(x => <circle key={x} cx={x} cy={165 + Math.abs(x - 310) * .44} r="4" fill={blue} data-art-pulse="" />)}
      <path d="M276 184V204M310 174V215M344 184V204" stroke={blue} strokeOpacity=".45" strokeDasharray="2 5" />
      <Label x={310} y={419}>清洗 · 校验</Label>
    </g>
    <g data-art-part="">
      <path d="M454 145H574V325H454Z" fill={`url(#${prefix}-silver)`} stroke="#92a8b4" />
      <path d="M466 130H586V310H466Z" fill={`url(#${prefix}-silver)`} stroke="#92a8b4" />
      <path d="M481 153H550M481 169H528" stroke={ink} strokeOpacity=".7" strokeWidth="3" />
      {[37, 62, 48, 77].map((h, i) => <rect key={i} x={481 + i * 23} y={261 - h} width="13" height={h} fill={`url(#${prefix}-blue)`} />)}
      <path d="M479 263H572M481 283H539" stroke={ink} strokeOpacity=".4" />
      <path d="M550 283l5 5 10 -12" fill="none" stroke={blue} strokeWidth="2.5" pathLength="1" data-art-draw="" />
      <Label x={521} y={389}>报表</Label>
    </g>
  </>;
}

function MediaGlyph({ x, y, kind, prefix }: { x: number; y: number; kind: "image" | "video" | "text"; prefix: string }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d="M-42 -32H52V35H-42Z" fill="#d5e1e7" stroke="#98abb6" />
    <rect x="-50" y="-40" width="94" height="67" fill={`url(#${prefix}-silver)`} stroke="#98abb6" />
    {kind === "image" ? <g fill="none" stroke={blue} strokeWidth="2">
      <circle cx="19" cy="-21" r="6" /><path d="M-40 16l22 -27 19 20 12 -13 25 20Z" fill={`url(#${prefix}-area)`} />
    </g> : kind === "video" ? <>
      <path d="M-9 -24l24 16 -24 16Z" fill={blue} />
      <path d="M-37 17H32" stroke={blue} strokeWidth="2" /><circle cx="4" cy="17" r="3" fill={ink} />
    </> : <g stroke={blue} strokeWidth="2"><path d="M-35 -22H28M-35 -9H28M-35 4H7M-35 17H18" /></g>}
  </g>;
}

function ContentAutomation({ prefix }: ArtProps) {
  return <>
    <BaseGrid />
    <Route d="M139 231H221" />
    <Route d="M399 244C437 244 425 122 491 122" />
    <Route d="M399 244H507" />
    <Route d="M399 244C445 244 429 385 491 385" />
    <g data-art-part="">
      <path d="M63 152H138V311H63Z" fill={`url(#${prefix}-silver)`} stroke="#9aafb9" />
      <path d="M79 173H122" stroke={ink} strokeWidth="3" />
      {[199, 229, 259, 289].map((y, i) => <g key={y}>
        <circle cx="81" cy={y} r="3" fill={i === 2 ? gold : blue} />
        <path d={`M95 ${y}H123`} stroke={blue} strokeWidth="2" />
      </g>)}
      <Label x={100} y={370}>编排</Label>
    </g>
    <g data-art-part="">
      <circle cx="311" cy="244" r="99" fill="none" stroke={blue} strokeOpacity=".25" />
      <circle cx="311" cy="244" r="85" fill="none" stroke={blue} strokeOpacity=".5" strokeDasharray="1 10" />
      <Tile x={311} y={274} size={79} prefix={prefix} />
      <Tile x={311} y={244} size={79} prefix={prefix} dark />
      <path d="M311 220l8 16 25 8-25 8-8 16-8-16-25-8 25-8Z" fill="#e7f2f7" />
      <Node x={311} y={145} /><Node x={410} y={244} accent /><Node x={212} y={244} />
      <Label x={311} y={401}>批量生成</Label>
    </g>
    <g data-art-part=""><MediaGlyph x={543} y={122} kind="image" prefix={prefix} /></g>
    <g data-art-part=""><MediaGlyph x={559} y={254} kind="video" prefix={prefix} /></g>
    <g data-art-part=""><MediaGlyph x={541} y={388} kind="text" prefix={prefix} />
      <path d="M466 465h19" stroke={gold} /><circle cx="456" cy="465" r="12" fill="#f3f5ef" stroke={gold} /><path d="M456 458v7l5 3" fill="none" stroke={gold} />
      <Label x={548} y={476}>定时分发</Label>
    </g>
  </>;
}

function Product({ prefix }: ArtProps) {
  return <>
    <BaseGrid />
    <g data-art-part="">
      <Label x={71} y={76} anchor="start">需求与原型</Label>
      <path d="M58 113H369V347H58Z" fill={`url(#${prefix}-silver)`} stroke="#91a8b6" />
      <path d="M58 149H369M111 149V347" fill="none" stroke="#9aafb9" />
      {[76, 87, 98].map(x => <circle key={x} cx={x} cy="131" r="2.5" fill="#849eac" />)}
      <path d="M148 131H332M75 174H94M75 193H94M75 212H94" stroke={blue} strokeWidth="2" strokeOpacity=".65" />
      <path d="M136 173H224M136 188H193" stroke={ink} strokeWidth="3" />
      <rect x="136" y="210" width="92" height="65" fill={`url(#${prefix}-area)`} stroke="#8faab9" />
      <path d="M146 260l24 -29 19 16 28 -22" fill="none" stroke={blue} strokeWidth="2" />
      <path d="M247 216H341M247 234H324M247 252H336M136 294H335M136 311H288" stroke={blue} strokeOpacity=".6" strokeWidth="2" />
      <rect x="130" y="204" width="104" height="77" fill="none" stroke={blue} strokeDasharray="3 5" />
      {[[130,204],[234,204],[130,281],[234,281]].map(([x,y]) => <rect key={`${x}-${y}`} x={x - 3} y={y - 3} width="6" height="6" fill="#f2f7f8" stroke={blue} />)}
      <path d="M233 269l8 24 6-9 12-4Z" fill={ink} stroke="#eff5f7" />
    </g>
    <Route d="M369 222H417Q437 222 437 201V175H493" />
    <Route d="M369 296H411Q437 296 437 319V339H493" />
    <Route d="M535 209V298" />
    <g data-art-part="">
      <Label x={519} y={109}>工作流</Label>
      <Tile x={535} y={175} size={59} prefix={prefix} dark />
      <path d="M508 175l16 -7 15 7 21-9M524 168v17l15 7 21-10" stroke="#e8f3f8" strokeWidth="2" fill="none" />
      {[241, 255, 269].map(y => <rect key={y} x="524" y={y} width="22" height="5" fill={blue} opacity=".7" data-art-pulse="" />)}
      <Tile x={535} y={339} size={59} prefix={prefix} />
      <path d="M510 338l25 -11 25 11-25 12Z" fill={`url(#${prefix}-blue)`} />
    </g>
    <g data-art-part="">
      <Route d="M511 365C511 415 447 434 351 434" />
      <path d="M118 434H347" stroke={blue} strokeOpacity=".3" />
      {[9, 18, 36, 63, 41, 76, 50, 28, 60, 45, 27, 39, 16, 9].map((h,i) => <path key={i} d={`M${139 + i * 14} ${434 - h / 2}v${h}`} stroke={i % 4 === 0 ? ink : blue} strokeWidth="4" strokeLinecap="round" data-art-wave="" />)}
      <Label x={236} y={511}>语音服务</Label>
    </g>
  </>;
}

function Venture({ prefix }: ArtProps) {
  return <>
    <BaseGrid />
    <g data-art-part="">
      <Label x={200} y={76}>多资产配置</Label>
      <g transform="translate(200 219) rotate(-90)">
        <circle r="108" fill="none" stroke="#8da4b2" strokeWidth="1" strokeOpacity=".6" />
        <circle r="98" fill="none" stroke="#cddce4" strokeWidth="25" />
        <circle r="98" fill="none" stroke={ink} strokeWidth="25" strokeDasharray="221.67 394.08" />
        <circle r="98" fill="none" stroke={blue} strokeWidth="25" strokeDasharray="178.57 437.18" strokeDashoffset="-233.99" />
        <circle r="98" fill="none" stroke={gold} strokeWidth="25" strokeDasharray="86.21 529.54" strokeDashoffset="-424.87" />
        <circle r="75" fill="none" stroke={blue} strokeOpacity=".4" strokeDasharray="1 7" />
      </g>
      <Tile x={200} y={225} size={49} prefix={prefix} />
      <path d="M181 224l19 -10 19 10-19 10Z" fill={ink} />
      <path d="M200 110V129M90 219h19M200 311v18M292 219h19" stroke="#fff" strokeWidth="2" />
    </g>
    <Route d="M314 219H356C380 219 380 168 406 168H430" />
    <g data-art-part="">
      <Label x={503} y={76}>策略研究</Label>
      <path d="M424 109V231H594" fill="none" stroke={ink} strokeOpacity=".35" />
      {[137, 176, 215].map(y => <path key={y} d={`M424 ${y}H594`} stroke={ink} strokeOpacity=".15" />)}
      <path d="M437 214l20 -27 19 7 21-40 23 13 18 -22 22 14 27 -35" fill="none" stroke={ink} strokeWidth="2.5" pathLength="1" data-art-draw="" />
      <path d="M437 185l27 -9 18 11 23 -14 28 15 26 -8 28 9" fill="none" stroke={blue} strokeWidth="1.5" pathLength="1" data-art-draw="" />
      <Node x={497} y={154} accent />
    </g>
    <Route d="M506 252V322C506 341 471 341 457 350" />
    <g data-art-part="">
      <Tile x={447} y={375} size={73} prefix={prefix} />
      <Tile x={447} y={345} size={73} prefix={prefix} dark />
      <path d="M418 341l20 10 30-15M451 335h17v9" stroke="#f0f6f8" strokeWidth="2.5" fill="none" />
      <Label x={470} y={453}>交易执行</Label>
    </g>
    <Route d="M372 375H302C278 375 273 415 248 415H191" />
    <g data-art-part="">
      <path d="M143 360l47 16v38c0 29-27 45-47 57-20-12-47-28-47-57v-38Z" fill={`url(#${prefix}-silver)`} stroke={blue} strokeWidth="1.5" />
      <path d="M125 415l13 13 25-31" fill="none" stroke={ink} strokeWidth="3" pathLength="1" data-art-draw="" />
      <Label x={143} y={511}>风险监控</Label>
    </g>
  </>;
}

const diagrams = { research: Research, futures: Futures, data: DataAutomation, content: ContentAutomation, product: Product, venture: Venture };

/** Native vectors: no screenshot text, image fetches, canvas or extra rendering loop. */
export default function CareerDiagram({ kind }: { kind: Kind }) {
  const prefix = `career-art-${kind}`;
  const Diagram = diagrams[kind];
  const [title, description] = descriptions[kind];
  return <svg className="career-diagram" data-career-diagram={kind} viewBox="0 0 640 540"
    role="img" aria-labelledby={`${prefix}-title ${prefix}-description`} focusable="false">
    <title id={`${prefix}-title`}>{title}</title>
    <desc id={`${prefix}-description`}>{description}</desc>
    <defs>
      <linearGradient id={`${prefix}-silver`} x1="0" y1="0" x2=".85" y2="1">
        <stop stopColor="#fff" /><stop offset=".43" stopColor="#e8f0f4" /><stop offset=".72" stopColor="#bdcfd8" /><stop offset="1" stopColor="#eff5f7" />
      </linearGradient>
      <linearGradient id={`${prefix}-edge`} x2="1" y2="1"><stop stopColor="#dce7ec" /><stop offset="1" stopColor="#9eb3bf" /></linearGradient>
      <linearGradient id={`${prefix}-blue`} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#9ebfce" /><stop offset=".55" stopColor="#5d859d" /><stop offset="1" stopColor="#2f4f63" /></linearGradient>
      <linearGradient id={`${prefix}-area`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#78a5bf" stopOpacity=".5" /><stop offset="1" stopColor="#b9d5e4" stopOpacity=".06" /></linearGradient>
      <radialGradient id={`${prefix}-light`}><stop offset=".4" stopColor="var(--diagram-haze, #f0f4f4)" stopOpacity=".98" /><stop offset=".7" stopColor="var(--diagram-haze, #eef3f4)" stopOpacity=".88" /><stop offset="1" stopColor="var(--diagram-haze, #eef3f4)" stopOpacity="0" /></radialGradient>
    </defs>
    <ellipse cx="320" cy="270" rx="320" ry="270" fill={`url(#${prefix}-light)`} aria-hidden="true" />
    <g aria-hidden="true"><Diagram prefix={prefix} /></g>
  </svg>;
}
