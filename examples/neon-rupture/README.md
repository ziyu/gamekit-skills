# Neon Rupture

GameKit + Three.js 的 3D top-down 肉鸽射击 vertical slice。

## 切片契约

```text
WASD / 鼠标 / 空格输入
→ GameKit Input action
→ GameRuntime systems 改写 World 权威状态
→ 射击、命中、击杀、经验与升级
→ RendererAdapter / DOM HUD 投影
→ 固定 seed 的 headless 测试
```

Three.js 仅出现在 `src/presentation/native-three/`。它作为 app-local Driver 持有 renderer、scene、camera、原生对象和动画循环；玩法模块只依赖 GameKit facade。

当前本地 GameKit checkout 尚未提供计划中的 `@gamekit/driver-three`，因此这个 app-local driver 是刻意限定的 native escape hatch，未来可替换为官方 driver。

## 运行

示例依赖同级的 `../gamekit` checkout：

```bash
pnpm install
pnpm dev
```

操作：WASD 移动，鼠标瞄准，按住左键射击，空格冲刺，1/2/3 选择升级，Esc 暂停，R 重开。

## 验证

```bash
pnpm test
pnpm build
node ../../gamekit-verify-game/scripts/audit-gamekit-boundaries.mjs .
```
