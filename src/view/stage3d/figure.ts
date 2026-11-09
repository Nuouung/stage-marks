import * as THREE from "three";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import type { Avatar } from "../../model";
import { loadAvatar } from "./avatar";
import { applyPose, POSES, type PoseName } from "./pose";

/**
 * 모형별 폭 배율(좌우·앞뒤). 키는 그대로 두고 몸만 좁힌다.
 * 원본이 만화풍이라 굵어서 사람 체형에 가깝게 맞춘 값이다. 1이면 원본 그대로.
 */
const AVATAR_WIDTH: Record<Avatar, number> = {
  cappy: 0.82,
  retroman: 0.95,
  kyle: 0.84,
  bizdude: 0.95,
  kate: 0.9,
  erika: 0.94,
  shiro: 0.86,
};

/** 파일을 못 받았을 때 대신 세우는 단순한 모양. 키가 1인 기둥. */
function placeholder(): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.8, 4, 12), new THREE.MeshStandardMaterial({ color: "#8a8a8a" }));
  mesh.position.y = 0.5;
  return mesh;
}

/** 흐린 인물의 투명도 */
const GHOST_OPACITY = 0.3;

/** 재질을 이 인물만 쓰는 흐린 복사본으로 바꾼다. 원본 재질은 다른 인물과 나눠 쓰므로 건드리지 않는다. */
function fade(mesh: THREE.Mesh) {
  const own = (m: THREE.Material) => {
    const c = m.clone();
    c.transparent = true;
    c.opacity = GHOST_OPACITY;
    c.depthWrite = false;
    return c;
  };
  mesh.material = Array.isArray(mesh.material) ? mesh.material.map(own) : own(mesh.material);
  mesh.userData.ownMaterial = true;
}

/** 자유동선 인물 발밑의 고리: "이쯤에서 자유롭게"라는 표시 */
function freeRing(): THREE.Mesh {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.47, 40),
    new THREE.MeshBasicMaterial({ color: "#e0b84a", transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  return ring;
}

/**
 * 무대 위 사람 한 명. 발바닥 중심이 원점이고 얼굴은 -Z(객석) 방향.
 * 모형 파일을 받는 동안은 비어 있고, 다 받으면 채운 뒤 onReady를 부른다.
 * 메시와 재질은 같은 모형끼리 나눠 쓰므로 렌더러가 지우면 안 된다(userData.shared). 뼈대는 인물마다 따로다.
 */
export function buildFigure(height: number, pose: PoseName, avatar: Avatar, onReady: () => void, ghost = false): THREE.Group {
  const group = new THREE.Group();
  if (ghost) group.add(freeRing());
  loadAvatar(avatar)
    .then((asset) => {
      if (group.userData.removed) return;
      const model = cloneSkinned(asset.scene);
      model.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.userData.shared = true;
          if (ghost) fade(o);
          // 뼈 자세로 몸이 움직여 원래 범위를 벗어나므로 잘라내기 판정을 쓰지 않는다
          o.frustumCulled = false;
        }
      });
      applyPose(model, POSES[pose]);
      const scale = height / asset.height;
      const width = scale * AVATAR_WIDTH[avatar];
      model.scale.set(width, scale, width);
      model.position.y *= scale;
      group.add(model);
      onReady();
    })
    .catch((e: unknown) => {
      console.error(`인물 모형 '${avatar}'을 불러오지 못함`, e);
      if (group.userData.removed) return;
      const mesh = placeholder();
      mesh.scale.setScalar(height);
      mesh.position.y *= height;
      group.add(mesh);
      onReady();
    });
  return group;
}
