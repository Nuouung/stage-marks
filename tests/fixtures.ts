import type { Project, Staging } from "../src/model";

/** 테스트용 작은 작품. 인물 p 하나, 장 2개, 지정 포인트 3개. */
export function tinyProject(): Project {
  return {
    id: "tiny",
    title: "테스트",
    objects: [{ id: "box", name: "상자", kind: "platform", size: { x: 1, y: 0.4, z: 1 } }],
    characters: [{ id: "p", role: "판사", label: "판사" }],
    scenes: [
      { id: "a", name: "1장" },
      { id: "b", name: "2장" },
    ],
    dataVersion: "test",
    marks: [
      { id: "m1", sceneId: "a", title: "1" },
      { id: "m2", sceneId: "a", title: "2" },
      { id: "m3", sceneId: "b", title: "3" },
    ],
  };
}

/** tinyProject를 공연장 s에 놓은 배치. */
export function tinyStaging(): Staging {
  return {
    id: "tiny-s",
    projectId: "tiny",
    stageId: "s",
    curtainOverrides: {},
    hiddenCurtains: [],
    actingArea: { width: 8, depth: 5 },
    notes: [],
    placements: [{ objectId: "box", position: { x: 0, y: 0, z: 3 }, rotation: 0, tipped: false }],
    dataVersion: "test",
    marks: [
      { markId: "m1", blocking: [{ characterId: "p", x: 0, z: 2, facing: 0, posture: "sit", free: false }], objects: [] },
      { markId: "m2", blocking: [], objects: [{ objectId: "box", position: { x: 1, y: 0, z: 2 }, tipped: true }] },
      { markId: "m3", blocking: [{ characterId: "p", x: 1, z: 1, facing: 0, posture: "stand", free: false }], objects: [{ objectId: "box", tipped: false }] },
    ],
  };
}
