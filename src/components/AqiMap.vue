<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts'
import chinaMap from '../data/china.json' with { type: 'json' }

const props = defineProps({
  provinces: { type: Array, default: () => [] }, // [{ name, fullName, aqi, level }]
  selected: { type: String, default: '' }, // 选中的省全名
})
const emit = defineEmits(['select'])

const el = ref(null)
let chart = null

echarts.registerMap('china', chinaMap)

// AQI 渐变锚点：与 HJ 633 级别色对齐（优→良→轻度→中度→重度→严重）
const AQI_STOPS = [
  [0, [0x00, 0xe4, 0x00]],
  [50, [0xff, 0xff, 0x00]],
  [100, [0xff, 0x7e, 0x00]],
  [150, [0xff, 0x00, 0x00]],
  [200, [0x99, 0x00, 0x4c]],
  [300, [0x7e, 0x00, 0x23]],
]
const toHex = (n) =>
  Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')

/** AQI → 渐变颜色（线性插值，无数据返回灰色） */
function aqiColor(aqi) {
  if (aqi === null || aqi === undefined || isNaN(aqi)) return '#e5e5e5'
  const last = AQI_STOPS[AQI_STOPS.length - 1]
  if (aqi <= AQI_STOPS[0][0]) return '#' + AQI_STOPS[0][1].map(toHex).join('')
  for (let i = 0; i < AQI_STOPS.length - 1; i++) {
    const [lo, loRgb] = AQI_STOPS[i]
    const [hi, hiRgb] = AQI_STOPS[i + 1]
    if (aqi <= hi) {
      const t = (aqi - lo) / (hi - lo)
      const rgb = loRgb.map((c, k) => c + (hiRgb[k] - c) * t)
      return '#' + rgb.map(toHex).join('')
    }
  }
  return '#' + last[1].map(toHex).join('')
}

// 地图宽高比（由 GeoJSON 经纬度范围算出，equirectangular）
let MAP_ASPECT = 1.6
{
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  const walk = (coord) => {
    if (typeof coord[0] === 'number') {
      if (coord[0] < minX) minX = coord[0]
      if (coord[0] > maxX) maxX = coord[0]
      if (coord[1] < minY) minY = coord[1]
      if (coord[1] > maxY) maxY = coord[1]
    } else {
      coord.forEach(walk)
    }
  }
  chinaMap.features.forEach((f) => walk(f.geometry.coordinates))
  if (maxX > minX && maxY > minY) MAP_ASPECT = (maxX - minX) / (maxY - minY)
}

function buildOption(layoutSize) {
  // 注意：不能在这里给数据项设 itemStyle.color —— ECharts 6.1 地图会把数据项颜色画成黑色。
  // 改用 visualMap 按 value 连续着色；无数据区域（无 value）走 series.areaColor 灰色兜底。
  // 悬浮/选中（emphasis）时 ECharts 默认主题会用统一高亮色覆盖填充，这里逐省指定与正常态
  // 一致的污染色，悬浮只靠 series 级 emphasis 的描边 + 发光来表示。
  const data = props.provinces.map((p) => ({
    name: p.fullName,
    value: p.aqi,
    levelLabel: p.level?.label ?? '无数据',
    emphasis: { itemStyle: { areaColor: aqiColor(p.aqi) } },
  }))

  return {
    // 显式白底，避免画布透明区域在不同浏览器渲染不一致
    backgroundColor: '#ffffff',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#ddd',
      textStyle: { color: '#333', fontSize: 13 },
      formatter: (p) => {
        if (!p.data) return p.name
        const d = p.data
        return `<b>${p.name}</b><br/>AQI：${d.value ?? '—'}<br/>级别：${d.levelLabel}`
      },
    },
    // 连续色带：用 301 个逐点色（每个 AQI 整数一个），保证颜色精确锚定在级别边界
    // （visualMap 默认只把少量色标等间距插值，会与级别边界错位）
    visualMap: {
      type: 'continuous',
      min: 0,
      max: 300,
      show: true,
      calculable: false,
      left: 8,
      bottom: 10,
      itemWidth: 10,
      itemHeight: 90,
      text: ['严重', '优'],
      textGap: 5,
      textStyle: { color: '#777', fontSize: 10 },
      inRange: { color: Array.from({ length: 301 }, (_, i) => aqiColor(i)) },
      seriesIndex: 0,
    },
    series: [
      {
        type: 'map',
        map: 'china',
        roam: true,
        zoom: 1,
        scaleLimit: { min: 0.9, max: 8 },
        // 垂直偏下（63%），让陆地重心更接近卡片视觉中心；layoutSize 由 render() 计算填满约束方向
        layoutCenter: ['50%', '63%'],
        layoutSize,
        selectedMode: false,
        label: {
          show: true,
          fontSize: 10,
          color: '#ffffff',
          formatter: (p) => (p.name === '南海诸岛' ? '' : p.name),
          // 深色光晕让白字在浅色省份（优/良）上也清晰
          textShadowColor: 'rgba(0,0,0,0.5)',
          textShadowBlur: 3,
        },
        // 自动隐藏互相重叠的省名标签
        labelLayout: { hideOverlap: true },
        emphasis: {
          label: {
            show: true,
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: 12,
            textShadowColor: 'rgba(0,0,0,0.5)',
            textShadowBlur: 3,
          },
          // 各省数据项已自带 emphasis.areaColor（= 该省污染色）；此处 series 级只补描边 + 发光。
          // areaColor 给灰色，供无数据区域（台湾/港澳）悬浮时保持灰色
          itemStyle: {
            areaColor: '#e5e5e5',
            borderColor: '#1f3a5f',
            borderWidth: 2,
            shadowBlur: 14,
            shadowColor: 'rgba(31, 58, 95, 0.45)',
          },
        },
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 1,
          areaColor: '#e5e5e5',
        },
        data,
      },
    ],
  }
}

function render() {
  if (!chart) return
  const w = el.value.clientWidth
  const h = el.value.clientHeight
  if (!w || !h) return
  // 卡片比地图更宽 → 让地图高度=卡片高度（填满上下）；否则宽度填满
  const layoutSize = w / h >= MAP_ASPECT ? MAP_ASPECT * h : w
  chart.setOption(buildOption(layoutSize))
}

function onClick(params) {
  if (!params || !params.name) return
  const full = params.name
  const p = props.provinces.find((x) => x.fullName === full)
  emit('select', p ? p.name : full)
}

onMounted(() => {
  chart = echarts.init(el.value)
  chart.on('click', onClick)
  render()
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})

function resize() {
  if (!chart) return
  chart.resize()
  render() // 尺寸变了，重新计算 layoutSize 让地图重新填满
}

watch(() => props.provinces, render, { deep: true })
watch(
  () => props.selected,
  (name) => {
    render()
    // 高亮选中省
    chart && chart.dispatchAction({ type: 'downplay', seriesIndex: 0 })
    if (name) {
      const full = PROVINCE_NAME[name] || name
      chart && chart.dispatchAction({ type: 'highlight', seriesIndex: 0, name: full })
    }
  },
)

// 短名 → 全名
const PROVINCE_NAME = {
  北京: '北京市',
  天津: '天津市',
  上海: '上海市',
  重庆: '重庆市',
  河北: '河北省',
  山西: '山西省',
  内蒙古: '内蒙古自治区',
  辽宁: '辽宁省',
  吉林: '吉林省',
  黑龙江: '黑龙江省',
  江苏: '江苏省',
  浙江: '浙江省',
  安徽: '安徽省',
  福建: '福建省',
  江西: '江西省',
  山东: '山东省',
  河南: '河南省',
  湖北: '湖北省',
  湖南: '湖南省',
  广东: '广东省',
  广西: '广西壮族自治区',
  海南: '海南省',
  四川: '四川省',
  贵州: '贵州省',
  云南: '云南省',
  西藏: '西藏自治区',
  陕西: '陕西省',
  甘肃: '甘肃省',
  青海: '青海省',
  宁夏: '宁夏回族自治区',
  新疆: '新疆维吾尔自治区',
}
</script>

<template>
  <div ref="el" class="aqi-map"></div>
</template>

<style scoped>
.aqi-map {
  width: 100%;
  height: 100%;
}
</style>
