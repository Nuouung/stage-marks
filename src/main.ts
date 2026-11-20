// 연결 코드만 둔다: 데이터 읽기(공연장·작품·배치) → store → (store 구독) → 평면도 SVG·조작부
import "./style.css";
import { Project, Stage, Staging } from "./model";
import { resolveMark } from "./player";
import { composeStage, moveObjects } from "./stage/compose";
import { createStore } from "./store/store";
import { planSvg } from "./view/plan/plan";
import { renderControls } from "./view/ui/controls";
import projectJson from "../data/projects/bodojichim.json";
// 보노마루(bonomaru.json, bodojichim-bonomaru.json)는 데이터만 보존하고 화면에는 메카네를 띄운다
import stageJson from "../data/stages/mekane.json";
import stagingJson from "../data/stagings/bodojichim-mekane.json";

type AppState = { project: Project; stage: Stage; staging: Staging; markId: string; showActingArea: boolean };

const project = Project.parse(projectJson);
const stage = Stage.parse(stageJson);
const staging = Staging.parse(stagingJson);

const store = createStore<AppState>({ project, stage, staging, markId: project.marks[0]?.id ?? "", showActingArea: true });

const stageRoot = document.getElementById("stage")!;
const controlsRoot = document.getElementById("controls")!;

function render(s: AppState) {
  const look = s.markId ? resolveMark(s.project, s.staging, s.markId) : { characters: {}, objects: {} };
  const composed = moveObjects(composeStage(s.stage, s.project, s.staging), look.objects);
  stageRoot.innerHTML = planSvg({ composed, project: s.project, characters: look.characters, house: s.stage.house, actingArea: s.showActingArea ? s.staging.actingArea : undefined });
  renderControls(
    controlsRoot,
    { title: `${s.project.title} · ${s.stage.venue}`, dataVersion: s.staging.dataVersion, scenes: s.project.scenes, marks: s.project.marks, currentMarkId: s.markId, fixed: s.project.characters.filter((c) => look.characters[c.id] && !look.characters[c.id]!.free),
        free: s.project.characters.filter((c) => look.characters[c.id]?.free), curtains: composed.curtains, showActingArea: s.showActingArea },
    {
      onMark: (id) => store.setState({ markId: id }),
      onToggleActingArea: () => store.setState({ showActingArea: !store.get().showActingArea }),
      onToggleCurtain: (id) => {
        const st = store.get().staging;
        const current = composed.curtains.find((c) => c.id === id)?.closed ?? false;
        store.setState({ staging: { ...st, curtainOverrides: { ...st.curtainOverrides, [id]: !current } } });
      },
    },
  );
}

store.subscribe(render);
render(store.get());
