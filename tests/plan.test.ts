import { describe, expect, it } from "vitest";
import { facingVector, planSvg, shortLabel, textOn } from "../src/view/plan/plan";
import { composeStage } from "../src/stage/compose";
import { Stage } from "../src/model";
import mekane from "../data/stages/mekane.json";
import { tinyProject, tinyStaging } from "./fixtures";

const stage = Stage.parse({ ...mekane, id: "s" });
const project = tinyProject();
const staging = tinyStaging();

describe("평면도", () => {
  it("긴 이름은 첫 글자와 끝 글자로 줄인다", () => {
    expect(shortLabel("목소리1")).toBe("목1");
    expect(shortLabel("주혁")).toBe("주혁");
  });

  it("밝은 색 위에는 검은 글자, 어두운 색 위에는 흰 글자를 쓴다", () => {
    expect(textOn("#fdd835")).toBe("#111");
    expect(textOn("#1e88e5")).toBe("#fff");
  });

  it("방향 0은 객석(화면 아래), -90은 상수 쪽(화면 오른쪽)을 가리킨다", () => {
    expect(facingVector(0).x).toBeCloseTo(0);
    expect(facingVector(0).y).toBeCloseTo(1);
    expect(facingVector(-90).x).toBeCloseTo(1);
  });

  it("무대에 있는 인물만 그린다", () => {
    const composed = composeStage(stage, project, staging);
    const first = project.characters[0]!;
    const svg = planSvg({ composed, project, characters: { [first.id]: { x: 0, z: 1, facing: 0, posture: "stand", free: false } } });
    expect(svg.match(/class="who/g)?.length).toBe(1);
  });
});
