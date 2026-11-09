import type { Project, Staging } from "../src/model";

/** 테스트용 작은 작품. 인물 p 하나, 큐 3개. */
export function tinyProject(): Project {
  return {
    id: "tiny",
    title: "테스트",
    objects: [{ id: "box", name: "상자", kind: "platform", size: { x: 1, y: 0.4, z: 1 } }],
    characters: [{ id: "p", role: "판사", label: "판사" }],
    scenes: [],
    dataVersion: "test",
    cues: [
      { id: "q1", number: 1, label: "1", fadeIn: 3 },
      { id: "q2", number: 2, label: "2", fadeIn: 3 },
      { id: "q3", number: 3, label: "3", fadeIn: 3 },
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
    cues: [
      {
        cueId: "q1",
        blocking: [{ characterId: "p", x: 0, z: 2, posture: "sit", onStage: true }],
        objects: [],
      },
      { cueId: "q2", blocking: [], objects: [{ objectId: "box", position: { x: 1, y: 0, z: 2 }, tipped: true }] },
      { cueId: "q3", blocking: [{ characterId: "p", posture: "stand" }], objects: [{ objectId: "box", tipped: false }] },
    ],
  };
}
