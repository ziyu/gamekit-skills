import * as THREE from "three";
import type { RendererBootContext } from "@gamekit/renderer-core";
import type { GroundPoint } from "../types";

// Private runtime owner for the app-local Three Driver.

export type ThreeRuntime = {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  webgl: THREE.WebGLRenderer;
  view: HTMLCanvasElement;
  resize(width: number, height: number): void;
  start(): void;
  stop(): void;
  destroy(): void;
  screenToGround(clientX: number, clientY: number): GroundPoint | undefined;
  addAnimatedObject(object: THREE.Object3D): void;
  removeAnimatedObject(object: THREE.Object3D): void;
};

export function createThreeRuntime(ctx: RendererBootContext): ThreeRuntime {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04050a);
  scene.fog = new THREE.FogExp2(0x060814, 0.027);

  const camera = new THREE.OrthographicCamera();
  const webgl = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  webgl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  webgl.outputColorSpace = THREE.SRGBColorSpace;
  webgl.toneMapping = THREE.ACESFilmicToneMapping;
  webgl.toneMappingExposure = 1.25;
  webgl.shadowMap.enabled = true;
  webgl.shadowMap.type = THREE.PCFSoftShadowMap;
  webgl.domElement.className = "neon-canvas";
  webgl.domElement.setAttribute("aria-label", "Neon Rupture 3D arena");
  ctx.container.append(webgl.domElement);

  const ambient = new THREE.HemisphereLight(0x5d86ff, 0x120519, 1.8);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xa9c5ff, 3.1);
  key.position.set(-8, 16, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -24;
  key.shadow.camera.right = 24;
  key.shadow.camera.top = 24;
  key.shadow.camera.bottom = -24;
  scene.add(key);
  const rim = new THREE.PointLight(0xff1f6d, 42, 32, 2);
  rim.position.set(10, 7, -9);
  scene.add(rim);

  const animated = new Set<THREE.Object3D>();
  const cameraFocus = new THREE.Vector3();
  const desiredFocus = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const intersection = new THREE.Vector3();
  let animationFrame: number | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let running = false;
  let lastWidth = ctx.width;
  let lastHeight = ctx.height;

  const resize = (width: number, height: number) => {
    lastWidth = Math.max(1, width);
    lastHeight = Math.max(1, height);
    const aspect = lastWidth / lastHeight;
    const verticalSpan = 24;
    camera.left = (-verticalSpan * aspect) / 2;
    camera.right = (verticalSpan * aspect) / 2;
    camera.top = verticalSpan / 2;
    camera.bottom = -verticalSpan / 2;
    camera.near = 0.1;
    camera.far = 120;
    camera.updateProjectionMatrix();
    webgl.setSize(lastWidth, lastHeight, false);
  };
  resize(ctx.width, ctx.height);

  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) {
        resize(entry.contentRect.width, entry.contentRect.height);
      }
    });
    resizeObserver.observe(ctx.container);
  }

  const frame = (now: number) => {
    if (!running) {
      return;
    }
    const seconds = now / 1000;
    let player: THREE.Object3D | undefined;
    for (const object of animated) {
      animateObject(object, seconds);
      if (object.userData.renderType === "neon.player") {
        player = object;
      }
    }

    if (player) {
      desiredFocus.set(player.position.x, 0, player.position.z);
      cameraFocus.lerp(desiredFocus, 0.085);
    }
    const shake = Number(player?.userData.shake ?? 0);
    const jitterX = Math.sin(now * 0.083) * shake * 0.16;
    const jitterZ = Math.cos(now * 0.097) * shake * 0.12;
    camera.position.set(cameraFocus.x + jitterX, 20.5, cameraFocus.z + 14.5 + jitterZ);
    camera.lookAt(cameraFocus.x, 0, cameraFocus.z - 1.8);
    camera.updateMatrixWorld();
    webgl.render(scene, camera);
    animationFrame = requestAnimationFrame(frame);
  };

  return {
    scene,
    camera,
    webgl,
    view: webgl.domElement,
    resize,
    start() {
      if (running) {
        return;
      }
      running = true;
      animationFrame = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (animationFrame !== undefined) {
        cancelAnimationFrame(animationFrame);
        animationFrame = undefined;
      }
    },
    destroy() {
      this.stop();
      resizeObserver?.disconnect();
      scene.traverse(disposeObject);
      webgl.dispose();
      webgl.domElement.remove();
      animated.clear();
    },
    screenToGround(clientX, clientY) {
      const rect = webgl.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return undefined;
      }
      const pointer = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, camera);
      if (!raycaster.ray.intersectPlane(ground, intersection)) {
        return undefined;
      }
      return { x: intersection.x, z: intersection.z };
    },
    addAnimatedObject(object) {
      animated.add(object);
    },
    removeAnimatedObject(object) {
      animated.delete(object);
    }
  };
}

function animateObject(object: THREE.Object3D, seconds: number): void {
  const core = object.getObjectByName("core");
  if (object.userData.renderType === "neon.enemy" && core) {
    core.rotation.y = seconds * Number(object.userData.spin ?? 1.2);
    core.position.y = Number(object.userData.baseY ?? 0.7) + Math.sin(seconds * 4 + object.id) * 0.06;
  } else if (object.userData.renderType === "neon.xp") {
    object.rotation.y = seconds * 2.4;
  } else if (object.userData.renderType === "neon.projectile" && core) {
    const pulse = 1 + Math.sin(seconds * 24 + object.id) * 0.15;
    core.scale.setScalar(pulse);
  } else if (object.userData.renderType === "neon.player" && core) {
    core.rotation.y = seconds * 1.8;
  }
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
