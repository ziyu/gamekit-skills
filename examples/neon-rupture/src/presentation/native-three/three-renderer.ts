import * as THREE from "three";
import type {
  RenderObjectDefinition,
  RenderObjectHandle,
  RenderObjectId,
  RenderObjectPatch,
  RendererAdapter,
  RendererBootContext
} from "@gamekit/renderer-core";
import type { ThreeRuntime } from "./driver/three-runtime";

type NativeEntry = {
  root: THREE.Object3D;
  healthFill?: THREE.Sprite | undefined;
  glowMaterials: Array<THREE.MeshStandardMaterial | THREE.MeshBasicMaterial>;
};

export function createNeonThreeRenderer(runtime: () => ThreeRuntime | undefined): RendererAdapter {
  const objects = new Map<RenderObjectId, NativeEntry>();
  let sequence = 0;

  return {
    id: "neon.three.renderer",
    async boot(_ctx: RendererBootContext) {
      requireRuntime(runtime);
    },
    destroy() {
      for (const id of [...objects.keys()]) {
        destroy(id);
      }
    },
    getView() {
      return requireRuntime(runtime).view;
    },
    capabilities() {
      return {
        objectTypes: [
          "neon.arena",
          "neon.player",
          "neon.enemy",
          "neon.projectile",
          "neon.xp",
          "neon.fx"
        ],
        supportsObjectTree: true,
        supportsNodeUpdates: false,
        supportsNativeHandles: true
      };
    },
    resize(width, height) {
      requireRuntime(runtime).resize(width, height);
    },
    createObject(definition) {
      const id = definition.id ?? `neon.render.${++sequence}`;
      if (objects.has(id)) {
        throw new Error(`Duplicate render object: ${id}`);
      }
      const entry = createNativeObject(definition);
      entry.root.userData.renderType = definition.type;
      applyTransform(entry.root, definition.transform);
      applyProps(entry, definition.props ?? {});
      entry.root.visible = definition.visible ?? true;
      requireRuntime(runtime).scene.add(entry.root);
      requireRuntime(runtime).addAnimatedObject(entry.root);
      objects.set(id, entry);
      return id;
    },
    updateObject(id, patch) {
      const entry = requireEntry(objects, id);
      applyTransform(entry.root, patch.transform);
      applyProps(entry, patch.props ?? {});
      if (patch.visible !== undefined) {
        entry.root.visible = patch.visible;
      }
      if (patch.alpha !== undefined) {
        setOpacity(entry.root, patch.alpha);
      }
    },
    destroyObject(id) {
      destroy(id);
    },
    getObjectHandle(id): RenderObjectHandle<THREE.Object3D> {
      return {
        id,
        type: requireEntry(objects, id).root.userData.renderType as string,
        native: requireEntry(objects, id).root,
        escaped: true
      };
    }
  };

  function destroy(id: RenderObjectId): void {
    const entry = objects.get(id);
    if (!entry) {
      return;
    }
    const three = requireRuntime(runtime);
    three.removeAnimatedObject(entry.root);
    three.scene.remove(entry.root);
    entry.root.traverse(disposeObject);
    objects.delete(id);
  }
}

function createNativeObject(definition: RenderObjectDefinition): NativeEntry {
  if (definition.type === "neon.arena") {
    return createArena(Number(definition.props?.radius ?? 18));
  }
  if (definition.type === "neon.player") {
    return createPlayer();
  }
  if (definition.type === "neon.enemy") {
    return createEnemy(String(definition.props?.variant ?? "drone"));
  }
  if (definition.type === "neon.projectile") {
    return createProjectile();
  }
  if (definition.type === "neon.xp") {
    return createXp();
  }
  return createEffect(String(definition.props?.variant ?? "impact"));
}

function createArena(radius: number): NativeEntry {
  const root = new THREE.Group();
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x080b14,
    roughness: 0.84,
    metalness: 0.34
  });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(radius, 96), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  const grid = new THREE.GridHelper(radius * 2, 36, 0x264d69, 0x17213a);
  grid.position.y = 0.015;
  const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
  for (const material of gridMaterials) {
    material.transparent = true;
    material.opacity = 0.27;
  }
  root.add(grid);

  for (const offset of [0, 0.34, 0.7]) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius - offset - 0.05, radius - offset + 0.05, 128),
      new THREE.MeshBasicMaterial({
        color: offset === 0 ? 0x2feeff : 0xff2c75,
        transparent: true,
        opacity: offset === 0 ? 0.8 : 0.24,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.035 + offset * 0.02;
    root.add(ring);
  }

  const positions: number[] = [];
  let seed = 173;
  for (let index = 0; index < 210; index += 1) {
    seed = (seed * 16807) % 2147483647;
    const angle = (seed / 2147483647) * Math.PI * 2;
    seed = (seed * 16807) % 2147483647;
    const distance = 4 + (seed / 2147483647) * (radius - 4);
    positions.push(Math.sin(angle) * distance, 0.06, Math.cos(angle) * distance);
  }
  const sparkGeometry = new THREE.BufferGeometry();
  sparkGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const sparks = new THREE.Points(
    sparkGeometry,
    new THREE.PointsMaterial({ color: 0x43dbff, size: 0.035, transparent: true, opacity: 0.4 })
  );
  root.add(sparks);
  return { root, glowMaterials: [] };
}

function createPlayer(): NativeEntry {
  const root = new THREE.Group();
  const bodyMaterial = standardMaterial(0x0c3144, 0x20e6ff, 2.8);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.62, 0.55, 6), bodyMaterial);
  body.position.y = 0.42;
  body.castShadow = true;
  root.add(body);

  const coreMaterial = standardMaterial(0xd8fbff, 0x33ddff, 5.2);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 0), coreMaterial);
  core.name = "core";
  core.position.y = 0.75;
  root.add(core);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.9), coreMaterial.clone());
  barrel.position.set(0, 0.58, 0.7);
  root.add(barrel);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.035, 8, 32),
    basicGlow(0x30eaff, 0.65)
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  root.add(ring);
  root.userData.shake = 0;
  return { root, glowMaterials: [bodyMaterial, coreMaterial] };
}

function createEnemy(variant: string): NativeEntry {
  const root = new THREE.Group();
  const isBrute = variant === "brute";
  const isRunner = variant === "runner";
  const color = isBrute ? 0xff8a2b : isRunner ? 0xff2f9a : 0xff315b;
  const material = standardMaterial(isBrute ? 0x57200f : 0x3a0b20, color, isBrute ? 2.1 : 3.7);
  const geometry = isBrute
    ? new THREE.DodecahedronGeometry(0.82, 0)
    : isRunner
      ? new THREE.ConeGeometry(0.48, 1.2, 5)
      : new THREE.OctahedronGeometry(0.58, 0);
  const core = new THREE.Mesh(geometry, material);
  core.name = "core";
  core.position.y = isBrute ? 0.9 : 0.7;
  core.castShadow = true;
  root.add(core);
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(isBrute ? 0.18 : 0.13, 8, 8),
    basicGlow(0xffe8ef, 1)
  );
  eye.position.set(0, isBrute ? 0.9 : 0.74, isBrute ? 0.75 : 0.5);
  root.add(eye);

  const barBack = new THREE.Sprite(new THREE.SpriteMaterial({ color: 0x0a0710, opacity: 0.78 }));
  barBack.scale.set(isBrute ? 1.55 : 1.05, 0.1, 1);
  barBack.position.y = isBrute ? 1.9 : 1.48;
  root.add(barBack);
  const healthFill = new THREE.Sprite(new THREE.SpriteMaterial({ color }));
  healthFill.center.set(0, 0.5);
  healthFill.scale.set(isBrute ? 1.5 : 1, 0.065, 1);
  healthFill.position.set(isBrute ? -0.75 : -0.5, isBrute ? 1.9 : 1.48, 0.01);
  root.add(healthFill);
  root.userData.baseHealthWidth = isBrute ? 1.5 : 1;
  root.userData.baseY = isBrute ? 0.9 : 0.7;
  root.userData.spin = isRunner ? 3 : isBrute ? 0.6 : 1.5;
  return { root, healthFill, glowMaterials: [material] };
}

function createProjectile(): NativeEntry {
  const root = new THREE.Group();
  const material = basicGlow(0x74f8ff, 1);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), material);
  core.name = "core";
  root.add(core);
  const trail = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.7, 6), material.clone());
  trail.rotation.x = Math.PI / 2;
  trail.position.z = -0.35;
  root.add(trail);
  return { root, glowMaterials: [material] };
}

function createXp(): NativeEntry {
  const root = new THREE.Group();
  const material = standardMaterial(0x082d2f, 0x54ffd2, 4.5);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), material);
  core.name = "core";
  core.position.y = 0.42;
  root.add(core);
  return { root, glowMaterials: [material] };
}

function createEffect(variant: string): NativeEntry {
  const root = new THREE.Group();
  const color = variant === "death" ? 0xff315f : variant === "dash" ? 0x58e7ff : 0x9cfaff;
  const material = basicGlow(color, 0.9);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(variant === "level-up" ? 0.9 : 0.45, 0.055, 8, 32),
    material
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.08;
  root.add(ring);
  if (variant === "death" || variant === "level-up") {
    const flare = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), material.clone());
    flare.position.y = 0.45;
    root.add(flare);
  }
  return { root, glowMaterials: [material] };
}

function applyTransform(root: THREE.Object3D, transform: RenderObjectPatch["transform"]): void {
  if (!transform) {
    return;
  }
  if (transform.position) {
    root.position.set(
      transform.position.x ?? root.position.x,
      transform.position.y ?? root.position.y,
      transform.position.z ?? root.position.z
    );
  }
  if (transform.rotation) {
    root.rotation.set(
      transform.rotation.x ?? root.rotation.x,
      transform.rotation.y ?? root.rotation.y,
      transform.rotation.z ?? root.rotation.z
    );
  }
  if (transform.scale) {
    root.scale.set(
      transform.scale.x ?? root.scale.x,
      transform.scale.y ?? root.scale.y,
      transform.scale.z ?? root.scale.z
    );
  }
}

function applyProps(entry: NativeEntry, props: Record<string, unknown>): void {
  const healthRatio = typeof props.healthRatio === "number" ? props.healthRatio : undefined;
  if (healthRatio !== undefined && entry.healthFill) {
    const width = Number(entry.root.userData.baseHealthWidth ?? 1);
    entry.healthFill.scale.x = Math.max(0.001, width * Math.max(0, Math.min(1, healthRatio)));
  }
  const flash = props.flash === true;
  for (const material of entry.glowMaterials) {
    material.color.setHex(flash ? 0xffffff : Number(material.userData.baseColor ?? 0xffffff));
  }
  if (typeof props.progress === "number") {
    setOpacity(entry.root, Math.max(0, 1 - props.progress));
  }
  if (typeof props.shake === "number") {
    entry.root.userData.shake = props.shake;
  }
  if (props.dash === true) {
    entry.root.scale.y = 0.68;
  }
}

function setOpacity(root: THREE.Object3D, opacity: number): void {
  root.traverse((object: THREE.Object3D) => {
    if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.Sprite)) {
      return;
    }
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      material.transparent = true;
      material.opacity = opacity;
    }
  });
}

function standardMaterial(color: number, emissive: number, intensity: number) {
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: intensity,
    roughness: 0.28,
    metalness: 0.72
  });
  material.userData.baseColor = color;
  return material;
}

function basicGlow(color: number, opacity: number) {
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  material.userData.baseColor = color;
  return material;
}

function requireRuntime(runtime: () => ThreeRuntime | undefined): ThreeRuntime {
  const value = runtime();
  if (!value) {
    throw new Error("Neon Three runtime is not booted");
  }
  return value;
}

function requireEntry(
  objects: Map<RenderObjectId, NativeEntry>,
  id: RenderObjectId
): NativeEntry {
  const entry = objects.get(id);
  if (!entry) {
    throw new Error(`Missing render object: ${id}`);
  }
  return entry;
}

function disposeObject(object: THREE.Object3D): void {
  if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
    object.geometry?.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      material?.dispose();
    }
  }
  if (object instanceof THREE.Sprite) {
    object.material.dispose();
  }
}
