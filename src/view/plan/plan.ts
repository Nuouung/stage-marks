import type { House, Project } from "../../model";
import type { CharacterLook } from "../../player";
import type { ComposedStage } from "../../stage/compose";

/**
 * 위에서 본 무대(평면도)를 SVG 문자열로 만든다. 순수 함수.
 * 좌표: SVG 단위 = 1m. 화면 x = 데이터 x(오른쪽 = 상수), 화면 y = -데이터 z(위 = 업스테이지, 아래 = 객석).
 */
export type PlanInput = {
  composed: ComposedStage;
  project: Project;
  characters: Record<string, CharacterLook>;
  house?: House;
  /** 켜져 있으면 연기 공간 테두리를 그린다 */
  actingArea?: { width: number; depth: number };
};

const MARGIN = 0.6;
const R = 0.25; // 인물 원 반지름(어깨폭 약 0.5m)
const f = (n: number) => +n.toFixed(3);
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** 원 안에 들어갈 짧은 이름. 두 글자까지는 그대로, 길면 첫 글자 + 끝 글자 (목소리1 → 목1) */
export function shortLabel(label: string): string {
  const chars = [...label];
  return chars.length <= 2 ? label : chars[0]! + chars[chars.length - 1]!;
}

/** 배경색 위 글자색: 밝은 색이면 검정, 어두우면 흰색 */
export function textOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 150 ? "#111" : "#fff";
}

/** 바라보는 방향(도, 0 = 객석) → 화면 방향 단위 벡터 */
export function facingVector(deg: number): { x: number; y: number } {
  const r = (deg * Math.PI) / 180;
  return { x: f(-Math.sin(r)), y: f(Math.cos(r)) };
}

/** 무대와의 거리감만 보여 주려고 객석은 앞쪽 몇 열만 그린다. 무대를 화면에 크게 담기 위해서다 */
const HOUSE_ROWS_SHOWN = 1;

/** 객석 좌석 사각형들. 열마다 좌석 덩어리를 통로 폭만큼 띄워 가운데 정렬한다(왼쪽 = 하수) */
function houseSvg(h: House): { svg: string; back: number; halfWidth: number } {
  const parts: string[] = [];
  let halfWidth = 0;
  const rows = h.rows.slice(0, HOUSE_ROWS_SHOWN);
  rows.forEach((row, i) => {
    const seats = row.blocks.reduce((a, b) => a + b, 0);
    const width = seats * h.seatWidth + (row.blocks.length - 1) * h.aisleWidth;
    halfWidth = Math.max(halfWidth, width / 2);
    const y = -(h.frontZ - h.rowPitch * (i + 0.5));
    let x = -width / 2;
    row.blocks.forEach((n, b) => {
      if (b > 0) x += h.aisleWidth;
      for (let s = 0; s < n; s++, x += h.seatWidth) {
        parts.push(`<rect x="${f(x + 0.04)}" y="${f(y - 0.2)}" width="${f(h.seatWidth - 0.08)}" height="0.4" rx="0.06" class="seat"/>`);
      }
    });
  });
  parts.push(`<text x="0" y="${f(-(h.frontZ - h.rowPitch * rows.length) + 0.25)}" class="side" text-anchor="middle">객석</text>`);
  return { svg: parts.join(""), back: -(h.frontZ - h.rowPitch * rows.length) + 0.3, halfWidth };
}

export function planSvg({ composed, project, characters, house, actingArea }: PlanInput): string {
  const { stage, curtains, objects } = composed;
  const W = stage.width;
  const D = stage.depth;
  const out: string[] = [];

  out.push(`<rect x="${f(-W / 2)}" y="${f(-D)}" width="${f(W)}" height="${f(D)}" class="floor"/>`);
  for (let x = Math.ceil(-W / 2); x <= Math.floor(W / 2); x++) out.push(`<line x1="${x}" y1="${f(-D)}" x2="${x}" y2="0" class="grid"/>`);
  for (let z = 1; z < D; z++) out.push(`<line x1="${f(-W / 2)}" y1="${-z}" x2="${f(W / 2)}" y2="${-z}" class="grid"/>`);
  out.push(`<line x1="${f(-W / 2)}" y1="0" x2="${f(W / 2)}" y2="0" class="edge"/>`);

  for (const c of curtains) {
    if (c.kind !== "draw") continue;
    if (c.closed) out.push(`<line x1="${f(-W / 2)}" y1="${f(-c.z)}" x2="${f(W / 2)}" y2="${f(-c.z)}" class="curtain"/>`);
    else for (const s of [-1, 1]) out.push(`<line x1="${f((s * W) / 2)}" y1="${f(-c.z)}" x2="${f(s * (W / 2 - 1))}" y2="${f(-c.z)}" class="curtain"/>`);
  }

  if (actingArea) {
    out.push(`<rect x="${f(-actingArea.width / 2)}" y="${f(-actingArea.depth)}" width="${f(actingArea.width)}" height="${f(actingArea.depth)}" class="acting"/>`);
  }

  // 낮은 것부터 그려 단 위의 물체가 위에 보이게 한다
  const sorted = [...objects].sort((a, b) => a.position.y - b.position.y);
  for (const o of sorted) {
    const w = o.size.x;
    const d = o.tipped ? o.size.y : o.size.z;
    const cx = o.position.x;
    const cy = -o.position.z;
    const cls = o.kind === "platform" ? "platform" : o.kind === "desk" ? "desk" : o.kind === "chair" ? (o.tipped ? "chair tipped" : "chair") : "prop";
    const shade = o.kind === "platform" ? ` style="fill-opacity:${f(0.55 + o.position.y)}"` : "";
    out.push(
      `<rect x="${f(cx - w / 2)}" y="${f(cy - d / 2)}" width="${f(w)}" height="${f(d)}" transform="rotate(${o.rotation} ${f(cx)} ${f(cy)})" class="${cls}"${shade}><title>${esc(o.name)}</title></rect>`,
    );
  }

  let bottom = 0.5;
  let half = W / 2;
  if (house) {
    const h = houseSvg(house);
    out.push(h.svg);
    bottom = h.back + 0.2;
    half = Math.max(half, h.halfWidth);
  }
  out.push(`<text x="${f(-W / 2 + 0.05)}" y="0.35" class="side">하수</text>`);
  out.push(`<text x="${f(W / 2 - 0.05)}" y="0.35" class="side" text-anchor="end">상수</text>`);

  for (const c of project.characters) {
    const look = characters[c.id];
    if (!look) continue;
    const color = c.color ?? "#d9c2a8";
    const v = facingVector(look.facing);
    const x = f(look.x);
    const y = f(-look.z);
    out.push(
      `<g class="who${look.free ? " free" : ""}"><title>${esc(c.label)}</title>` +
        `<circle cx="${f(x + v.x * (R + 0.08))}" cy="${f(y + v.y * (R + 0.08))}" r="0.06" fill="${color}"/>` +
        `<circle cx="${x}" cy="${y}" r="${R}" fill="${color}"/>` +
        `<text x="${x}" y="${y}" fill="${textOn(color)}">${esc(shortLabel(c.label))}</text></g>`,
    );
  }

  const left = f(-half - MARGIN);
  const top = f(-D - MARGIN);
  return `<svg viewBox="${left} ${top} ${f(2 * (half + MARGIN))} ${f(D + MARGIN + bottom)}" role="img" aria-label="위에서 본 무대">${out.join("")}</svg>`;
}
