# GameKits Skills

面向 [GameKits](https://github.com/ziyu/gamekits) TypeScript 游戏开发的四个 Agent Skills，覆盖创建游戏、实现玩法、接入框架能力和验证交付。可安装到 Codex、Claude Code、Cursor 等支持 Agent Skills 的编码代理中。

安装后，代理会按任务读取对应的开发流程、架构约束、包目录和验证参考。安装 skills 本身不会安装 `@gamekits/*` 依赖或创建游戏；这些工作由后续开发任务在你的游戏项目中完成。

## 包含哪些 skills

| Skill                                                                 | 用途                 | 常见任务                                                          |
| --------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------- |
| [gamekit-create-game](gamekit-create-game/SKILL.md)                   | 创建新游戏或可玩原型 | 选择包与运行 profile，建立 App Host、首个玩法闭环和无渲染测试路径 |
| [gamekit-build-feature](gamekit-build-feature/SKILL.md)               | 在现有游戏中实现功能 | 打通输入、游戏状态、表现反馈和测试，例如冲刺、敌人 AI、技能或任务 |
| [gamekit-integrate-capability](gamekit-integrate-capability/SKILL.md) | 接入或升级框架能力   | 安装 npm 包，装配 driver、adapter、GameModule、存档或联机能力     |
| [gamekit-verify-game](gamekit-verify-game/SKILL.md)                   | 审查、诊断与验证游戏 | 检查依赖来源、架构边界、生命周期、玩法完整性和回归测试            |

品牌名和 npm scope 使用 **GameKits / `@gamekits/*`**；为保持调用兼容，skill 名称仍使用单数 **`gamekit-*`**。

## 安装

### 方式一：Skills CLI

需要 Node.js、npm（提供 `npx`）和 Git，并能访问 npm 与 GitHub。下面的命令在**你的游戏项目根目录**执行，无需先克隆本仓库。

先查看可安装的四个 skills：

```bash
npx skills add ziyu/gamekit-skills --list
```

安装全部 skills 到当前项目，供 Codex 使用：

```bash
npx skills add ziyu/gamekit-skills --agent codex --skill '*' --yes
```

`'*'` 需要保留引号，避免被 shell 展开。Codex 的项目级 skills 位于 `.agents/skills/`；CLI 生成的 `skills-lock.json` 记录安装来源，团队共享时应一并纳入项目版本管理。

其他安装范围和代理：

```bash
# 个人全局安装，跨项目使用
npx skills add ziyu/gamekit-skills --agent codex --skill '*' --global --yes

# 仅安装验证 skill 到当前项目
npx skills add ziyu/gamekit-skills --agent codex --skill gamekit-verify-game --yes

# 安装到 Claude Code 或 Cursor（二选一，也可按需分别执行）
npx skills add ziyu/gamekit-skills --agent claude-code --skill '*' --yes
npx skills add ziyu/gamekit-skills --agent cursor --skill '*' --yes
```

只选项目级或全局一种范围即可。实际安装位置以 CLI 输出为准；不同代理和 CLI 版本可能采用不同的目录或符号链接布局。

### 方式二：让 Codex 安装

在支持内置 `$skill-installer` 的 Codex 中发送：

```text
$skill-installer 从 https://github.com/ziyu/gamekit-skills 的 main 分支安装以下四个目录：
gamekit-create-game
gamekit-build-feature
gamekit-integrate-capability
gamekit-verify-game
```

这会安装到个人 skills 目录，适合跨项目使用。若已有同名 skill，先确认现有安装来源，再更新它，避免重复安装。

### 方式三：手动放入项目

将本仓库中的四个完整 skill 目录复制到目标项目的 `.agents/skills/` 下，适用于 Codex 的项目级安装：

```text
your-game/
└── .agents/
    └── skills/
        ├── gamekit-create-game/
        ├── gamekit-build-feature/
        ├── gamekit-integrate-capability/
        └── gamekit-verify-game/
```

每个目录必须保留 `SKILL.md`、`references/`、`agents/` 以及存在的 `scripts/`。只复制 `SKILL.md` 会丢失参考文档和验证脚本。手动复制的安装需自行同步更新；其他代理请使用其支持的 skill 目录。

## 开始使用

在 Codex 中打开你的游戏项目，在消息中输入 `$` 选择 skill，或直接发送下面的提示词。Codex 会自动发现新安装的 skills；如果没有显示，重启 Codex 后再检查。其他代理使用各自的 skill 选择或调用方式。

### 创建游戏

```text
$gamekit-create-game 在当前目录创建一个浏览器运行的 2D 俯视角生存游戏。
使用 TypeScript 和 GameKits，先完成移动、敌人追击、受伤、失败和重开这一个可玩闭环。
使用项目现有包管理器，提供确定性的无渲染测试，并检查浏览器运行效果。
```

### 实现玩法

```text
$gamekit-build-feature 给现有游戏增加冲刺：有冷却时间，冲刺期间获得短暂无敌，
UI 显示冷却进度。沿用当前输入和状态管理方式，补充冷却、伤害免疫和重开的测试。
```

### 接入框架能力

```text
$gamekit-integrate-capability 为现有浏览器游戏接入 IndexedDB 存档，
保存进度并支持读档恢复，处理 revision 冲突和失败清理。
沿用当前已安装的 GameKits 精确版本，检查相关包的公开 API，并验证存取和恢复路径。
```

### 验证游戏

```text
$gamekit-verify-game 审查当前游戏的依赖来源、架构边界、输入作用域和
启动、停止、销毁生命周期，运行已有测试与构建。仅输出问题和验证结果，不修改代码。
```

需要修复时，在提示词中明确要求“修复发现的问题并补充回归测试”。通常先用 `create-game` 建立首个闭环，再按任务选择 `build-feature` 或 `integrate-capability`，最后用 `verify-game` 验证。

描述任务时，尽量给出目标平台、2D/3D、现有项目路径、要完成的玩家行为和验收条件。代理会先读取目标项目规则，再检查实际安装的 API 和验证命令。

## GameKits 版本与依赖

当前参考目录已对照 **GameKits `0.1.0-alpha.9`** 校验，覆盖 43 个公开 npm 包。这是已核对的基线，不代表 npm 渠道永远指向该版本。

- 新建项目或明确升级时，先查询所选发布渠道，例如 `@gamekits/core@alpha`，再校验所需包均提供该精确版本。
- GameKits 同步发布各包：所选 `@gamekits/*` 包及其内部依赖应统一到同一个精确版本，使用项目包管理器更新 manifest 和 lockfile。
- 为现有项目添加能力时，默认沿用已安装版本；需要升级时再统一处理。
- `latest` 可能落后于 `alpha`。不要通过裸包名或分别解析多个移动标签来选择版本。
- 安装应用直接导入的每个包及必要 peer dependencies，只使用公开导出；实际安装的声明文件和 `exports` 是 API 依据。

完整包列表、公开子路径、推荐组合和安装示例见 [npm package catalog](gamekit-integrate-capability/references/npm-package-catalog.md)；模块装配见 [capability map](gamekit-integrate-capability/references/capability-map.md)。

## 单独运行边界审计

`gamekit-verify-game` 附带一个无需额外 npm 依赖的 Node.js 静态审计脚本。对于按上文安装到 Codex 当前项目的情况，在游戏项目根目录运行：

```bash
node .agents/skills/gamekit-verify-game/scripts/audit-gamekit-boundaries.mjs .
node .agents/skills/gamekit-verify-game/scripts/audit-gamekit-boundaries.mjs . --json
node .agents/skills/gamekit-verify-game/scripts/audit-gamekit-boundaries.mjs . --strict
```

全局安装或使用其他代理时，将脚本位置替换为实际安装路径；最后的 `.` 是要检查的游戏目录，也可以换成绝对路径。

默认模式打印发现的问题；`--json` 输出机器可读结果；`--strict` 在发现任何问题（包括 warning）时返回退出码 `1`，适合需要严格拦截的检查步骤。

脚本用于初步筛查旧 npm scope、后端耦合、测试专用导入和不安全 HTML 等模式，结果需要结合上下文判断。它不解析 lockfile，不能证明直接依赖声明完整，也不能验证真实生命周期或玩法行为。完整检查维度见 [verification matrix](gamekit-verify-game/references/verification-matrix.md)。

## 更新、卸载与排查

以下命令用于 **Skills CLI 管理的安装**，在目标游戏项目目录执行：

```bash
# 查看当前项目为 Codex 安装的 skills；全局安装额外加 --global
npx skills list --agent codex

# 更新当前项目中的这四个 skills
npx skills update gamekit-create-game gamekit-build-feature gamekit-integrate-capability gamekit-verify-game --project

# 卸载当前项目中的一个 skill
npx skills remove --skill gamekit-verify-game --agent codex
```

全局更新时将 `--project` 换成 `--global`；全局卸载时增加 `--global`。更新 skills 不会自动升级游戏项目的 `@gamekits/*` 依赖。

如果代理找不到 skill，检查当前工作目录、安装范围以及 `<skill>/SKILL.md` 是否存在；若能找到但缺少参考资料或脚本，重新同步完整目录。手动安装和内置安装器创建的副本应按原方式更新，不要假定它们已被 Skills CLI 跟踪。

更多安装选项见 [Skills CLI 文档](https://github.com/vercel-labs/skills#readme)，Codex 的发现机制见 [官方 Agent Skills 文档](https://developers.openai.com/codex/skills/)。
