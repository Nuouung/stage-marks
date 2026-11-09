import { z } from "zod";
import { Id, Vec3 } from "./common";

/**
 * 배치(Staging): "이 작품을 이 공연장에서" 할 때만 의미 있는 것.
 * 현장 셋업 노트에 해당한다. 공연장이 바뀌면 Staging만 새로 만든다.
 */

/** 세트 물체를 어디에 놓을지. 좌표는 이 공연장 기준. */
export const Placement = z.object({
  objectId: Id,
  /** 바닥 중심 위치 */
  position: Vec3,
  /** 위에서 볼 때 y축 회전(도). 0 = 긴 변이 객석과 나란함 */
  rotation: z.number().default(0),
  /** 넘어뜨려 놓은 상태(엎어진 의자 등) */
  tipped: z.boolean().default(false),
});
export type Placement = z.infer<typeof Placement>;

/** 지정 포인트에서 인물 한 명의 위치·자세. 여기 적힌 인물만 화면에 나온다. 적지 않은 인물은 무대 밖이다. */
export const Blocking = z.strictObject({
  characterId: Id,
  /** 바닥 위치 (x, z). 단상 위면 높이는 물체에서 계산 */
  x: z.number(),
  z: z.number(),
  /** 바라보는 방향(도). 0 = 객석 정면 */
  facing: z.number().default(0),
  /** stand 서기, sit 의자에 앉기, floor 바닥에 앉기, crouch 쪼그려 앉기·웅크리기 */
  posture: z.enum(["stand", "sit", "floor", "crouch"]).default("stand"),
  /** 무대에는 있지만 자유동선. 위치는 대략 이쯤이라는 참고값이고, 화면에 흐리게 나온다 */
  free: z.boolean().default(false),
});
export type Blocking = z.infer<typeof Blocking>;

/** 지정 포인트에서 세트 물체를 옮긴 것. 적지 않은 항목은 이전 값을 따른다(트래킹) — 옮긴 물체는 다시 옮길 때까지 그 자리에 있다. */
export const ObjectMove = z.strictObject({
  objectId: Id,
  position: Vec3.optional(),
  rotation: z.number().optional(),
  tipped: z.boolean().optional(),
});
export type ObjectMove = z.infer<typeof ObjectMove>;

/** 작품의 지정 포인트 하나에 대해, 이 공연장에서의 인물 위치와 옮긴 물체. */
export const MarkValues = z.strictObject({
  markId: Id,
  blocking: z.array(Blocking).default([]),
  objects: z.array(ObjectMove).default([]),
});
export type MarkValues = z.infer<typeof MarkValues>;

export const Staging = z.object({
  id: Id,
  projectId: Id,
  stageId: Id,
  /** 이 배치에서만 바꾸는 막 상태. 예: { "draw-2": true } = 2번 막 닫음 */
  curtainOverrides: z.record(z.string(), z.boolean()).default({}),
  /** 이 배치에서 쓰지 않는 막. 화면과 조작부에 나오지 않는다 */
  hiddenCurtains: z.array(Id).default([]),
  /** 연기 공간. 무대 중앙 기준 폭, 무대 앞끝부터의 깊이(m). 바닥에 테이프로 표시한다 */
  actingArea: z.object({ width: z.number().positive(), depth: z.number().positive() }),
  /** 놓지 않은 물체는 무대에 나오지 않는다 */
  placements: z.array(Placement),
  /** 지정 포인트마다의 값 */
  marks: z.array(MarkValues).default([]),
  /** 아직 현장에서 확인 안 된 값에 대한 메모 */
  notes: z.array(z.string()).default([]),
  dataVersion: z.string(),
});
export type Staging = z.infer<typeof Staging>;
