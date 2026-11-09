// 연결 코드만 둔다: 데이터 읽기(공연장·작품·배치) → store → (store 구독) → 도형 목록 → 렌더러·조작부
import "./style.css";
import { DEFAULT_AVATAR, Project, Stage, Staging } from "./model";
import { resolveMark } from "./player";
import { composeStage, moveObjects } from "./stage/compose";
import { createStore } from "./store/store";
import { loadAvatar } from "./view/stage3d/avatar";
import { createRenderer, type ViewName } from "./view/stage3d/renderer";
import { describeActingArea, describeCharacters, describeHouse, describeStage } from "./view/stage3d/shapes";
import { renderControls } from "./view/ui/controls";
import projectJson from "../data/projects/bodojichim.json";
import stageJson from "../data/stages/bonomaru.json";
import stagingJson from "../data/stagings/bodojichim-bonomaru.json";

type AppState = { project: Project; stage: Stage; staging: Staging; markId: string; view: ViewName; showActingArea: boolean };

const project = Project.parse(projectJson);
const stage = Stage.parse(stageJson);
const staging = Staging.parse(stagingJson);

// 인물이 등장하는 순간 기다리지 않도록 미리 받아 둔다
project.characters.forEach((c) => void loadAvatar(c.avatar ?? DEFAULT_AVATAR).catch(() => {}));

const store = createStore<AppState>({ project, stage, staging, markId: project.marks[0]?.id ?? "", view: "audience", showActingArea: true });

const renderer = createRenderer(document.getElementById("stage") as HTMLCanvasElement);
const controlsRoot = document.getElementById("controls")!;

function render(s: AppState) {
  const look = s.markId ? resolveMark(s.project, s.staging, s.markId) : { characters: {}, objects: {} };
  const composed = moveObjects(composeStage(s.stage, s.project, s.staging), look.objects);
  const house = s.stage.house ? describeHouse(s.stage.house) : [];
  const guides = s.showActingArea ? describeActingArea(s.staging.actingArea) : [];
  renderer.draw([...describeStage(composed), ...house, ...guides, ...describeCharacters(composed, s.project, look.characters)]);
  renderControls(
    controlsRoot,
    { title: `${s.project.title} · ${s.stage.venue}`, dataVersion: s.staging.dataVersion, scenes: s.project.scenes, marks: s.project.marks, currentMarkId: s.markId, designated: s.project.characters.filter((c) => look.characters[c.id]), curtains: composed.curtains, view: s.view, showActingArea: s.showActingArea },
    {
      onMark: (id) => store.setState({ markId: id }),
      onView: (view) => {
        renderer.setView(view);
        store.setState({ view });
      },
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
