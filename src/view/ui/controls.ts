import type { Character, Curtain, Mark, Scene } from "../../model";
import type { ViewName } from "../stage3d/renderer";

/** 화면 아래 조작부. 버튼이 눌리면 콜백만 부른다. 상태는 직접 바꾸지 않는다. */
export type ControlsProps = {
  title: string;
  dataVersion: string;
  scenes: Scene[];
  marks: Mark[];
  currentMarkId: string;
  /** 지금 포인트에서 위치가 정해진 인물 (공연 인물 순서) */
  fixed: Character[];
  /** 지금 포인트에서 무대에 있지만 자유동선인 인물 */
  free: Character[];
  curtains: Curtain[];
  view: ViewName;
  showActingArea: boolean;
};

export type ControlsHandlers = {
  onMark(id: string): void;
  onToggleCurtain(id: string): void;
  onView(view: ViewName): void;
  onToggleActingArea(): void;
};

const VIEW_LABEL: Record<ViewName, string> = { audience: "객석", top: "위", side: "옆" };

/** 대본·메모에 들어 있는 글자가 화면 구조를 깨지 않도록 */
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderControls(root: HTMLElement, p: ControlsProps, h: ControlsHandlers) {
  const index = p.marks.findIndex((m) => m.id === p.currentMarkId);
  const mark = p.marks[index];
  const inScene = mark ? p.marks.filter((m) => m.sceneId === mark.sceneId) : [];
  const nth = mark ? inScene.findIndex((m) => m.id === mark.id) + 1 : 0;
  const scene = p.scenes.find((s) => s.id === mark?.sceneId);
  const draws = p.curtains.filter((c) => c.kind === "draw");
  const chips = (cs: Character[], cls = "") => cs.map((c) => `<span class="who ${cls}" style="--c:${c.color ?? "#d9c2a8"}">${esc(c.label)}</span>`).join("");

  root.innerHTML = `
    <header><strong>${esc(p.title)}</strong><span class="ver">데이터 ${esc(p.dataVersion)}</span></header>
    <section class="row scenes">${p.scenes
      .map((s) => {
        const has = p.marks.some((m) => m.sceneId === s.id);
        return `<button data-scene="${s.id}" class="${s.id === scene?.id ? "on" : ""}" ${has ? "" : "disabled"}>${esc(s.name)}</button>`;
      })
      .join("")}</section>
    <section class="mark">
      <button data-mark="prev" ${index <= 0 ? "disabled" : ""} aria-label="이전 지정 포인트">◀</button>
      <div class="mark-body">
        ${
          mark
            ? `<div class="mark-title"><span class="pos">${esc(scene?.name ?? "")} · ${nth}/${inScene.length}</span>${esc(mark.title)}</div>
               ${mark.when ? `<div class="when">${esc(mark.when)}</div>` : ""}
               ${mark.note ? `<p class="note">${esc(mark.note)}</p>` : ""}`
            : `<div class="mark-title">지정 포인트 없음</div>`
        }
      </div>
      <button data-mark="next" ${index < 0 || index >= p.marks.length - 1 ? "disabled" : ""} aria-label="다음 지정 포인트">▶</button>
    </section>
    ${
      mark
        ? `<p class="designated"><span class="tag">지정</span>${p.fixed.length ? chips(p.fixed) : "<em>없음</em>"}</p>
           ${p.free.length ? `<p class="designated"><span class="tag">자유</span>${chips(p.free, "free")}</p>` : ""}
           <p class="legend">흐린 인물은 자유동선이에요. 위치는 참고용이에요. 무대에 없는 인물은 퇴장 상태예요.</p>`
        : ""
    }
    <section class="row"><span>보기</span>${(Object.keys(VIEW_LABEL) as ViewName[])
      .map((v) => `<button data-view="${v}" class="${v === p.view ? "on" : ""}">${VIEW_LABEL[v]}</button>`)
      .join("")}</section>
    <section class="row"><span>막</span>${draws
      .map((c) => `<button data-curtain="${c.id}" class="${c.closed ? "on" : ""}">${esc(c.name.split(" (")[0] ?? c.name)} ${c.closed ? "닫힘" : "열림"}</button>`)
      .join("")}</section>
    <section class="row"><span>표시</span><button data-guide="acting" class="${p.showActingArea ? "on" : ""}">연기 공간 ${p.showActingArea ? "켬" : "끔"}</button></section>
  `;

  // 장 버튼이 한 줄로 길어지므로 지금 장이 보이게 가로로 옮긴다
  root.querySelector<HTMLButtonElement>(".scenes .on")?.scrollIntoView({ block: "nearest", inline: "center" });
  root.querySelectorAll<HTMLButtonElement>("[data-mark]").forEach((b) =>
    b.addEventListener("click", () => {
      const next = p.marks[index + (b.dataset.mark === "next" ? 1 : -1)];
      if (next) h.onMark(next.id);
    }),
  );
  root.querySelectorAll<HTMLButtonElement>("[data-scene]").forEach((b) =>
    b.addEventListener("click", () => {
      const first = p.marks.find((m) => m.sceneId === b.dataset.scene);
      if (first) h.onMark(first.id);
    }),
  );
  root.querySelectorAll<HTMLButtonElement>("[data-view]").forEach((b) => b.addEventListener("click", () => h.onView(b.dataset.view as ViewName)));
  root.querySelector<HTMLButtonElement>("[data-guide=acting]")?.addEventListener("click", () => h.onToggleActingArea());
  root.querySelectorAll<HTMLButtonElement>("[data-curtain]").forEach((b) => b.addEventListener("click", () => h.onToggleCurtain(b.dataset.curtain!)));
}
