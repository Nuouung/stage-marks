import { describe, expect, it } from "vitest";
import { nextCueId, prevCueId, resolveCue } from "../src/player";
import { tinyProject, tinyStaging } from "./fixtures";

describe("트래킹", () => {
  it("인물 자세만 바꾸면 위치는 이전 큐 그대로 남는다", () => {
    const p = resolveCue(tinyProject(), tinyStaging(), "q3").characters.p;
    expect(p).toMatchObject({ x: 0, z: 2, posture: "stand", onStage: true });
  });

  it("물체의 넘어짐만 바꾸면 위치는 이전 큐에서 옮긴 그대로 남는다", () => {
    const box = resolveCue(tinyProject(), tinyStaging(), "q3").objects.box;
    expect(box).toEqual({ position: { x: 1, y: 0, z: 2 }, tipped: false });
  });

  it("없는 큐를 부르면 에러가 난다", () => {
    expect(() => resolveCue(tinyProject(), tinyStaging(), "nope")).toThrow();
  });
});

describe("작품과 배치 나누기", () => {
  it("배치에 값이 없는 큐는 직전 큐 상태를 그대로 유지한다", () => {
    const staging = { ...tinyStaging(), cues: tinyStaging().cues.filter((c) => c.cueId !== "q2") };
    expect(resolveCue(tinyProject(), staging, "q2")).toEqual(resolveCue(tinyProject(), staging, "q1"));
  });
});

describe("큐 넘기기", () => {
  it("다음 큐와 이전 큐를 찾고, 끝에서는 null을 준다", () => {
    const p = tinyProject();
    expect(nextCueId(p, "q1")).toBe("q2");
    expect(nextCueId(p, "q3")).toBeNull();
    expect(prevCueId(p, "q1")).toBeNull();
    expect(prevCueId(p, "q3")).toBe("q2");
  });
});
