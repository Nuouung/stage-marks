import { z } from "zod";
import { Id } from "./common";

/** 막. z = 무대 앞끝에서의 깊이(m). closed = 공연장 기본 상태. */
export const Curtain = z.object({
  id: Id,
  name: z.string(),
  /** draw = 여닫는 막 / border = 위쪽 가림막 / screen = 흰 스크린 */
  kind: z.enum(["draw", "border", "screen"]).default("draw"),
  z: z.number().nonnegative(),
  closed: z.boolean(),
});
export type Curtain = z.infer<typeof Curtain>;

/**
 * 객석. 무대 앞(z < 0)에 계단식으로 놓인 좌석. 거리감을 잡기 위한 대략값이다.
 * 열은 무대에서 가까운 순서(A열부터). 열마다 통로로 나뉜 좌석 덩어리의 좌석 수를 객석에서 볼 때 왼쪽부터 적는다.
 */
export const House = z.strictObject({
  /** 첫 열 앞끝의 z(m). 무대 앞끝보다 객석 쪽이라 음수 */
  frontZ: z.number().max(0),
  /** 열 간격(m) */
  rowPitch: z.number().positive(),
  /** 한 열 올라갈 때마다 높아지는 높이(m). 첫 열 바닥도 이만큼 올라가 있다 */
  rowRise: z.number().nonnegative(),
  /** 좌석 한 칸 폭(m) */
  seatWidth: z.number().positive(),
  /** 통로 폭(m) */
  aisleWidth: z.number().nonnegative(),
  rows: z.array(z.strictObject({ label: z.string(), blocks: z.array(z.number().int().positive()).min(1) })).min(1),
});
export type House = z.infer<typeof House>;

/**
 * 공연장. 어떤 공연(Project)에도 속하지 않는다.
 * 여러 공연이 같은 공연장을 골라 쓸 수 있다. 건물 치수와 막만 적는다.
 */
export const Stage = z.strictObject({
  id: Id,
  venue: z.string(),
  /** 연기 공간 폭(m) */
  width: z.number().positive(),
  /** 연기 공간 깊이(m) */
  depth: z.number().positive(),
  /** 무대 바닥 높이(객석 바닥 기준, m). 블랙박스면 0 */
  deckHeight: z.number().nonnegative(),
  /** 무대 바닥 색 (#rrggbb) */
  floorColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  curtains: z.array(Curtain),
  /** 객석. 없으면 그리지 않는다 */
  house: House.optional(),
  /** 아직 실측·확인 안 된 값에 대한 메모 */
  notes: z.array(z.string()).default([]),
});
export type Stage = z.infer<typeof Stage>;
