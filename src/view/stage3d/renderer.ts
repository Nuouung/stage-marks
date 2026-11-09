import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DEFAULT_AVATAR } from "../../model";
import { planChanges } from "./changes";
import { buildFigure } from "./figure";
import { buildChair, buildTable, tipOver } from "./furniture";
import type { Shape } from "./shapes";

/**
 * 데이터 좌표 → three.js 좌표.
 * 객석에서 무대를 보는 카메라(+z 방향)를 기준으로, 데이터의 +x(상수 쪽)가 화면 오른쪽에 오도록 x를 뒤집는다.
 */
const toThree = (x: number, y: number, z: number) => new THREE.Vector3(-x, y, z);

export type ViewName = "audience" | "top" | "side";

const VIEWS: Record<ViewName, { eye: [number, number, number]; target: [number, number, number] }> = {
  audience: { eye: [0, 3.2, -6.5], target: [0, 1.5, 4.5] },
  // 객석이 화면 아래에 오도록 아주 살짝 객석 쪽에서 내려다본다
  top: { eye: [0, 22, 4.6], target: [0, 0, 4.7] },
  side: { eye: [16, 5, 2], target: [0, 1.5, 4.5] },
};

/** 그릴 것 목록(Shape[])을 받아 화면에 그리기만 한다. 무엇을 그릴지는 정하지 않는다. */
export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#050608");

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;

  // 화면이 멈춰 있으면 그리지 않는다. 무언가 바뀌면 이 표시를 켠다
  let needsRender = true;
  const invalidate = () => {
    needsRender = true;
  };
  // 카메라가 움직이는 동안(손을 뗀 뒤 멈출 때까지 포함) 계속 발생한다
  controls.addEventListener("change", invalidate);
  // 다른 탭에 다녀오면 화면 내용이 지워질 수 있다
  document.addEventListener("visibilitychange", invalidate);

  // 무대 전체를 고르게 밝히는 빛. 무대 조명은 다루지 않는다
  const hemi = new THREE.HemisphereLight("#ffffff", "#202020", 0.9);
  scene.add(hemi);
  const work = new THREE.DirectionalLight("#ffffff", 0.6);
  work.position.copy(toThree(2, 10, -6));
  scene.add(work);

  // 객석 바닥 (무대 앞 공간)
  const house = new THREE.Mesh(new THREE.PlaneGeometry(14, 16), new THREE.MeshStandardMaterial({ color: "#0a0a0a" }));
  house.rotation.x = -Math.PI / 2;
  house.position.copy(toThree(0, -0.03, -8));
  scene.add(house);

  // 바닥 1m 격자: 거리 감 잡기용
  const grid = new THREE.GridHelper(20, 20, "#3a3a3a", "#202020");
  grid.position.copy(toThree(0, 0.001, 5));
  scene.add(grid);

  const layer = new THREE.Group();
  scene.add(layer);

  function placeFigure(fig: THREE.Object3D, s: Shape) {
    fig.position.copy(toThree(s.position.x, s.position.y, s.position.z));
    fig.rotation.y = (-(s.rotationY ?? 0) * Math.PI) / 180;
  }

  function meshOf(s: Shape): THREE.Object3D {
    if (s.kind === "figure") {
      const fig = buildFigure(s.size.y, s.pose ?? "stand", s.avatar ?? DEFAULT_AVATAR, invalidate);
      placeFigure(fig, s);
      fig.name = s.id;
      return fig;
    }
    if (s.kind === "table" || s.kind === "chair") {
      let model = s.kind === "table" ? buildTable(s.size.x, s.size.y, s.size.z, s.color) : buildChair(s.size.x, s.size.y, s.size.z, s.color);
      if (s.tipped) model = tipOver(model);
      model.position.copy(toThree(s.position.x, s.position.y, s.position.z));
      if (s.rotationY) model.rotation.y = (-s.rotationY * Math.PI) / 180;
      model.name = s.id;
      return model;
    }
    // 반사가 없는 재질. 보는 각도와 상관없이 밝기가 고르다
    const mat = new THREE.MeshLambertMaterial({ color: s.color });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(s.size.x, s.size.y, s.size.z), mat);
    mesh.position.copy(toThree(s.position.x, s.position.y + s.size.y / 2, s.position.z));
    if (s.rotationY) mesh.rotation.y = (-s.rotationY * Math.PI) / 180;
    if (s.outline) {
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color: "#4a4a50" }));
      mesh.add(edges);
    }
    mesh.name = s.id;
    return mesh;
  }

  function removeObject(object: THREE.Object3D) {
    layer.remove(object);
    // 아직 불러오는 중인 인물이면 다 불러와도 붙이지 않는다
    object.userData.removed = true;
    object.traverse((o) => {
      // 뼈대는 인물마다 따로 만들므로 메시를 나눠 써도 함께 해제한다
      if (o instanceof THREE.SkinnedMesh) o.skeleton.dispose();
      // 인물 모형의 메시·재질은 같은 모형끼리 나눠 쓰고 다음 그리기에도 다시 쓴다
      if ((o instanceof THREE.Mesh || o instanceof THREE.LineSegments) && !o.userData.shared) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
  }

  /** 지금 무대에 있는 물체. 다음 목록과 비교해 바뀐 것만 고친다 */
  const liveShapes = new Map<string, Shape>();
  const liveObjects = new Map<string, THREE.Object3D>();

  function addShape(s: Shape) {
    const object = meshOf(s);
    layer.add(object);
    liveShapes.set(s.id, s);
    liveObjects.set(s.id, object);
  }

  function dropShape(id: string) {
    removeObject(liveObjects.get(id)!);
    liveShapes.delete(id);
    liveObjects.delete(id);
  }

  function draw(shapes: Shape[]) {
    const { add, remove, replace, move } = planChanges(liveShapes, shapes);
    for (const id of remove) dropShape(id);
    for (const s of replace) {
      dropShape(s.id);
      addShape(s);
    }
    for (const s of add) addShape(s);
    for (const s of move) {
      placeFigure(liveObjects.get(s.id)!, s);
      liveShapes.set(s.id, s);
    }
    invalidate();
  }

  function setView(name: ViewName) {
    const v = VIEWS[name];
    camera.position.copy(toThree(...v.eye));
    controls.target.copy(toThree(...v.target));
    controls.update();
    invalidate();
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // 세로 화면에서도 무대 폭이 다 들어오도록 가로 시야각(70도)을 기준으로 세로 시야각을 정한다
    const hfov = (70 * Math.PI) / 180;
    camera.fov = Math.max(45, (2 * Math.atan(Math.tan(hfov / 2) / camera.aspect) * 180) / Math.PI);
    camera.updateProjectionMatrix();
    invalidate();
  }

  window.addEventListener("resize", resize);
  resize();
  setView("audience");
  renderer.setAnimationLoop(() => {
    controls.update();
    if (!needsRender) return;
    needsRender = false;
    renderer.render(scene, camera);
  });

  return { draw, setView };
}
