# 全国城市空气质量实时发布

基于 Vite + Vue 3 + ECharts 的空气质量实时发布页面，仿中国环境监测总站「城市空气质量」页。

## 功能（田字形四宫格，一页显示）

- **左上 · 全国地图**：ECharts 中国地图，省份按 AQI 级别着色，点击省份可筛选该省城市
- **右上 · 省份筛选 + 城市 AQI 排名**：省份平铺卡片（按 AQI 级别着色，点击与地图一致）；341 个城市按 AQI 从高到低排名（取点位 AQI 最大值，国标口径），显示级别、首要污染物、PM2.5/PM10
- **左下 · 城市空气质量**：点击城市后展示 AQI、级别、健康影响、六项污染物浓度（IAQI）
- **右下 · 实时监测数据**：所选城市的各点位六项污染物浓度明细表

## 数据来源与流程

接口 token 放在 GitHub Actions 的 secret 里，由单个定时工作流完成「抓数据 → 构建 → 部署」，**前端只读数据文件、不直连接口，token 不会进入网页**：

```
每半小时：GitHub Actions（secret 里的 AQI_TOKEN）──▶ 接口 getPmNow ──▶ 更新 aqi.json ──▶ 构建 ──▶ 部署
打开页面 ──▶ 读取 /data/aqi.json ──▶ 前端聚合渲染
```

- 数据文件：`public/data/aqi.json`（1601 个国控站点，接口快照，约每小时更新一次）
- 站点→城市/省份映射：`src/data/station2city.json`（从中国环境监测总站按站点编号提取，100% 覆盖）
- 中国地图 GeoJSON：`src/data/china.json`
- AQI 级别颜色、首要污染物（IAQI 分指数）均按 HJ 633-2012 标准在本地计算

## 开发

```bash
npm install
npm run dev              # 开发服务器，默认 http://localhost:6633
npm run fetch            # 手动抓取一次接口，更新 public/data/aqi.json（需本地 token）
npm run build            # 构建到 dist/
npm run preview          # 预览构建产物（dist/）
```

### 密钥配置（token）

token 不进代码，从环境变量 `AQI_TOKEN` 读取：

- **GitHub 上**：仓库 Settings → Secrets and variables → Actions → New repository secret → Name: `AQI_TOKEN`，Secret: 你的 token。定时任务会读它。
- **本地**：复制 `.env.example` 为 `.env.local` 填入 token（已被 .gitignore 忽略），`npm run fetch` 才会生效。

### 端口配置

- 开发服务器端口默认 **6633**，可用环境变量 `PORT` 覆盖：`PORT=8080 npm run dev`
- 已在 vite.config.js 中开启 `host: '0.0.0.0'`，局域网内其他设备可通过 `http://本机IP:6633` 访问
- 局域网访问不通时，多半是 **Windows 防火墙**拦了 Node.js 的入站连接

## 部署（GitHub Pages）

仓库里已配置 `.github/workflows/deploy.yml`，push 到 `main` 会自动构建并发布页面，网址：

```
https://用户名.github.io/github-action-aqi/
```

只需手动开一次开关：

1. 仓库 → **Settings** → **Pages** → **Source** 选 **GitHub Actions**
2. 之后每半小时的定时任务会自动抓数据 → 构建 → 部署，页面数据保持最新；手动 push 代码到 main 也会触发一次构建部署
3. 相关说明：`vite.config.js` 中 `base: './'` 使用相对路径，页面部署在子路径/自定义域名下都通用

## 说明

- 城市 AQI = 该城市各点位 AQI 的**最大值**（国标口径）
- 页面顶部「数据时间」来自接口快照，「更新于」来自数据文件写入时间
- 数据文件读取失败时页面顶部会显示错误提示条

## 已知约束

- 数据是**定时快照**（Actions 每半小时触发一次，实际数据约每小时更新），不是每次打开都实时拉取
- 页面部署到静态托管即可（`npm run build` 产物），`public/data/aqi.json` 会作为静态资源一起发布
