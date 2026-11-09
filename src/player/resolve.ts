import type { Blocking, ObjectMove, Project, Staging } from "../model";

/** 화면에 그릴 인물 한 명의 값 (characterId 제외) */
export type CharacterLook = Omit<Blocking, "characterId">;
/** 옮긴 물체 하나의 최종 값 (objectId 제외). 옮긴 적 없는 물체는 없다 */
export type ObjectLook = Omit<ObjectMove, "objectId">;

/** 어느 지정 포인트 시점의 무대 상태 */
export type Look = {
  /** 이 포인트에 무대에 있는 인물. 자유동선 인물은 free가 켜져 있다. 없는 인물은 무대 밖 */
  characters: Record<string, CharacterLook>;
  objects: Record<string, ObjectLook>;
};

/** 적힌 값만 덮어쓴다. undefined는 "안 적음"이라 이전 값을 유지한다. */
function merge<T extends object>(prev: T | undefined, next: T): T {
  const out = { ...(prev ?? {}) } as Record<string, unknown>;
  for (const [k, v] of Object.entries(next)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

/**
 * 지정 포인트 시점의 무대 상태를 계산한다.
 * - 인물: 이 포인트에 적힌 인물만. 이전 포인트에서 이어받지 않는다
 * - 물체: 처음부터 이 포인트까지 옮긴 것을 차례로 쌓는다(트래킹)
 */
export function resolveMark(project: Project, staging: Staging, markId: string): Look {
  const index = project.marks.findIndex((m) => m.id === markId);
  if (index < 0) throw new Error(`지정 포인트 '${markId}'가 없음`);

  const valuesByMark = new Map(staging.marks.map((v) => [v.markId, v]));
  const look: Look = { characters: {}, objects: {} };
  for (const mark of project.marks.slice(0, index + 1)) {
    for (const { objectId, ...rest } of valuesByMark.get(mark.id)?.objects ?? []) {
      look.objects[objectId] = merge(look.objects[objectId], rest);
    }
  }
  for (const { characterId, ...rest } of valuesByMark.get(markId)?.blocking ?? []) {
    look.characters[characterId] = rest;
  }
  return look;
}

/** 다음 지정 포인트 id. 마지막이면 null. */
export function nextMarkId(project: Project, markId: string): string | null {
  const i = project.marks.findIndex((m) => m.id === markId);
  return project.marks[i + 1]?.id ?? null;
}

/** 이전 지정 포인트 id. 처음이면 null. */
export function prevMarkId(project: Project, markId: string): string | null {
  const i = project.marks.findIndex((m) => m.id === markId);
  return i > 0 ? (project.marks[i - 1]?.id ?? null) : null;
}
