# 江苏省 3D 地图 — 项目架构说明

## 项目概览

基于 **Vue 3 + Vite + TypeScript + Three.js** 的暗色 HUD 风格 3D 江苏省地图。地图组件来自 `three-scope-map` skill 内置的 `smart-mine-vue` 验证模板，支持省份、城市两级下钻，包含挤出地形、飞线、追光、涟漪等全套可视化特效。

---

## 目录结构

```
sk/
├── index.html                          # Vite 入口 HTML
├── package.json                        # 依赖与脚本
├── vite.config.ts                      # Vite 构建配置
├── tsconfig.json                       # TypeScript 配置入口
├── tsconfig.app.json                   # 应用 TS 配置
├── tsconfig.node.json                  # Node 侧 TS 配置
├── architecture.md                     # 本文件
│
└── src/
    ├── main.ts                         # 应用入口：挂载 Vue 到 #app
    ├── App.vue                         # 根组件：全屏容器 + 地图组件
    │
    ├── components/
    │   └── map/
    │       ├── JiangsuThreeMap.vue    # ★ 核心 3D 地图组件 (~2330 行)
    │       ├── mapDataAdapter.ts       # 地图数据加载与缓存
    │       └── mapTerrainMaterial.ts   # 地形 PBR 材质工厂
    │
    ├── types/
    │   └── geo.ts                      # GeoJSON 类型定义
    │
    └── assets/
        ├── figma/
        │   └── map-label-bg.svg        # 城市标签背景 SVG
        ├── maps/
        │   ├── jiangsu.json            # ★ 当前默认：江苏省 GeoJSON
        │   ├── china.json              # 中国国家级 GeoJSON（下钻备用）
        │   └── world.json              # 世界 GeoJSON（下钻备用）
        └── textures/
            └── map/
                ├── terrain-diffuse.jpg     # 地形固有色贴图
                ├── terrain-height.jpg      # 地形高度/置换贴图
                ├── terrain-normal.jpg      # 地形法线贴图
                └── terrain-roughness.jpg   # 地形粗糙度贴图
```

---

## 核心文件说明

### 1. 入口链路

```
index.html  →  src/main.ts  →  src/App.vue  →  JiangsuThreeMap.vue
```

| 文件 | 作用 |
|------|------|
| `index.html` | Vite 入口页面，提供 `<div id="app">` 挂载点 |
| `src/main.ts` | 创建 Vue 应用实例并挂载 |
| `src/App.vue` | 根组件：重置全局样式，提供全屏 `.app-shell` 容器，引入地图组件 |

### 2. 地图组件 — `JiangsuThreeMap.vue`

项目最核心的文件（约 2330 行），实现完整的 3D 地图渲染管线：

| 模块 | 功能 |
|------|------|
| **Three.js 场景** | `WebGLRenderer` + `CSS2DRenderer` 双渲染器，`OrbitControls` 轨道控制 |
| **几何体构建** | 从 GeoJSON 解析 Polygon/MultiPolygon → `THREE.ShapeGeometry` + 挤出侧墙 |
| **地形材质** | PBR `MeshStandardMaterial` + diffuse/height/normal/roughness 四张贴图 |
| **侧边渐变** | `ShaderMaterial`：底部深色 → 中部过渡 → 顶部 `#E8FF4F` 主题色 |
| **外轮廓** | 省份外边界 `LineSegments`，颜色 `#D4F56A`，AdditiveBlending |
| **内部边界** | 各地市之间 `LineLoop`，颜色 `#24351d` |
| **城市标签** | `CSS2DObject` + SVG 背景，带波纹涟漪动画（省会南京） |
| **Hover 高亮** | 鼠标悬停时区域抬升 16 单位 + 侧边渐变激活 + 顶部 glow |
| **点击下钻** | 点击城市 → 加载该市 GeoJSON（datav API）→ 重建地图 |
| **返回上级** | 维护 drillStack 栈，支持逐级返回 |
| **飞线** | 从省会（南京）向各城市发射贝塞尔曲线，带流动光点着色器 |
| **追光** | 外轮廓跑马灯：34 段 AdditiveBlending Line 顺次排列 |
| **HUD 底座环** | 多层 RingGeometry + 弧形装饰线 + 刻度线，带自转动画 |
| **视角持久化** | `localStorage` 存储按 scope 的 camera 视角，支持保存/恢复/重置 |
| **入场动画** | CSS `@keyframes mapStageIn` + `primeGroupOpacity` → `applyGroupTransition` |
| **自适应** | `ResizeObserver` 监听容器尺寸变化，自动更新渲染器和相机比例 |

### 3. 地图数据适配器 — `mapDataAdapter.ts`

| 功能 | 说明 |
|------|------|
| **初始状态** | `scope: 'province'`, `regionName: '江苏省'`, `code: '320000'` |
| **数据缓存** | 预加载 jiangsu.json + china.json，运行时按需 fetch datav API |
| **下钻加载** | `loadMapLevel(scope, code)` 从 `geo.datav.aliyun.com` 获取 GeoJSON |
| **预取** | hover 时 `prefetchDrillTarget()` 提前拉取下级数据 |

### 4. 地形材质 — `mapTerrainMaterial.ts`

创建可参数化的 PBR 地形材质：

```
MeshStandardMaterial {
  color: '#0a1607',          // 深绿黑底色
  emissive: '#101d08',       // 微弱的自发光
  emissiveIntensity: 0.12,
  map: terrain-diffuse,      // 地表固有色
  displacementMap: height,   // 高度置换
  normalMap: normal,         // 法线贴图
  roughnessMap: roughness,   // 粗糙度
  metalness: 0.03,           // 几乎非金属
}
```

支持参数覆盖：`elevationScale`（挤出强度）、`normalStrength`（法线强度）、`roughness`、`textureOpacity`。

### 5. 类型定义 — `geo.ts`

```typescript
type Position = [number, number]

interface GeoFeature {
  type: 'Feature'
  properties: { name?, fullname?, center?, … }
  geometry: { type: 'Polygon' | 'MultiPolygon', coordinates: … }
}

interface GeoFeatureCollection {
  type: 'FeatureCollection'
  features: GeoFeature[]
}
```

---

## NPM 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器（默认 `http://localhost:5173`） |
| `npm run build` | TypeScript 类型检查 + Vite 生产构建 → `dist/` |
| `npm run preview` | 预览生产构建 |

---

## 地图下钻层级

```
江苏省 (province, level 0)
  ├─ 南京市 (city, level 1)
  ├─ 无锡市
  ├─ 徐州市
  ├─ 常州市
  ├─ 苏州市
  ├─ 南通市
  ├─ 连云港市
  ├─ 淮安市
  ├─ 盐城市
  ├─ 扬州市
  ├─ 镇江市
  ├─ 泰州市
  └─ 宿迁市
       └─ 各区县 (district, level 2 — 按需加载)
```

每个非终端层级均支持下钻，区县级为终端（除非提供更低级数据）。

---

## 视觉配置

| 配置项 | 值 |
|--------|-----|
| 主题色 | `#E8FF4F` (黄绿荧光) |
| 外轮廓色 | `#D4F56A` |
| 侧边渐变 | 底 `#101304` → 中 `#a8bc38` → 顶 `#E8FF4F` |
| 地形底色 | `#07100b` (深绿黑) |
| 背景色 | `#020603` (几乎纯黑) |
| 地图旋转 | `-0.09 rad` (约 -5°) |
| 挤出高度 | topZ=44, bottomZ=24, 厚度=20 单位 |
| 飞线海拔 | Z=74 |
| 追光海拔 | Z=44.25 |
| 标签海拔 | Z=58 |

---

## 技术要点

1. **ShapeGeometry 挤出**：每个 polygon 的顶面为 `ShapeGeometry`（Z=44），侧墙为手动构建的三角网格（Z=24→44），使用 province 级外轮廓共享侧墙提升性能。
2. **坐标投影**：经纬度 → 等距矩形投影（`projectCoord`），自动计算 bbox 并映射到 `mapWidth × mapHeight` 画布。
3. **Chase Light**：通过栅格化的 province silhouette 提取外轮廓点，平滑后构建 34 段 AdditiveBlending Line，每帧更新位置实现跑马灯效果。
4. **飞线着色器**：`QuadraticBezierCurve3` 曲线 + `progress` attribute + fragment shader `smoothstep` 实现流动光点。
5. **视角持久化**：`localStorage` 中按 `{ default, byScope: { province, city, … } }` 结构存储 `{ fov, position, target }`。

---

## 许可

```
SPDX-License-Identifier: GPL-3.0-or-later
Copyright (c) 2026 YHY_UNan
Source: https://github.com/YU_UR/3D_Map
```
