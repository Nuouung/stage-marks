import { describe, expect, it } from "vitest";
import { nextMarkId, prevMarkId, resolveMark } from "../src/player";
import { tinyProject, tinyStaging } from "./fixtures";

describe("지정 인물", () => {
  it("지정 포인트에 적힌 인물만 나온다", () => {
    expect(resolveMark(tinyProject(), tinyStaging(), "m1").characters.p).toMatchObject({ x: 0, z: 2, posture: "sit" });
  });

  it("다음 포인트에 적히지 않은 인물은 이어받지 않는다(배우 재량)", () => {
    expect(resolveMark(tinyProject(), tinyStaging(), "m2").characters).toEqual({});
  });

  it("배치에 값이 없는 포인트에는 지정된 인물이 없다", () => {
    const staging = { ...tinyStaging(), marks: tinyStaging().marks.filter((m) => m.markId !== "m1") };
    expect(resolveMark(tinyProject(), staging, "m1").characters).toEqual({});
  });

  it("없는 포인트를 부르면 에러가 난다", () => {
    expect(() => resolveMark(tinyProject(), tinyStaging(), "nope")).toThrow();
  });
});

describe("물체 트래킹", () => {
  it("옮긴 물체는 다음 포인트에서도 그 자리에 있다", () => {
    expect(resolveMark(tinyProject(), tinyStaging(), "m2").objects.box).toEqual({ position: { x: 1, y: 0, z: 2 }, tipped: true });
  });

  it("물체의 넘어짐만 바꾸면 위치는 이전 포인트에서 옮긴 그대로 남는다", () => {
    expect(resolveMark(tinyProject(), tinyStaging(), "m3").objects.box).toEqual({ position: { x: 1, y: 0, z: 2 }, tipped: false });
  });

  it("아직 옮기기 전 포인트에서는 처음 자리에 있다", () => {
    expect(resolveMark(tinyProject(), tinyStaging(), "m1").objects.box).toBeUndefined();
  });
});

describe("포인트 넘기기", () => {
  it("다음 포인트와 이전 포인트를 찾고, 끝에서는 null을 준다. 장이 바뀌어도 이어진다", () => {
    const p = tinyProject();
    expect(nextMarkId(p, "m2")).toBe("m3");
    expect(nextMarkId(p, "m3")).toBeNull();
    expect(prevMarkId(p, "m1")).toBeNull();
    expect(prevMarkId(p, "m3")).toBe("m2");
  });
});

describe("자유동선 인물", () => {
  it("자유동선으로 적은 인물은 무대에 있되 free가 켜져 있다", () => {
    const staging = tinyStaging();
    staging.marks[1]!.blocking.push({ characterId: "p", x: 0, z: 1, facing: 0, posture: "stand", free: true });
    expect(resolveMark(tinyProject(), staging, "m2").characters.p).toMatchObject({ free: true });
  });
});
