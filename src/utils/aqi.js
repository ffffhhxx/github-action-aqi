/**
 * AQI 相关工具函数
 * 依据 HJ 633-2012《环境空气质量指数（AQI）技术规定》
 */

const IAQI = [0, 50, 100, 150, 200, 300, 400, 500]

// 各污染物浓度限值（单位：PM2.5/PM10/SO2/NO2/O3 为 μg/m³，CO 为 mg/m³）
// 小时数据按 HJ 633 相应口径换算
const BREAKPOINTS = {
  PM2_5: [0, 35, 75, 115, 150, 250, 350, 500],
  PM10: [0, 50, 150, 250, 350, 420, 500, 600],
  SO2: [0, 50, 150, 475, 800, 1600, 2100, 2620],
  NO2: [0, 40, 80, 180, 280, 565, 750, 940],
  CO: [0, 2, 4, 14, 24, 36, 48, 60],
  // O3 小时浓度限值，最高 IAQI 到 300
  O3: [0, 160, 200, 300, 400, 800],
}
const IAQI_O3 = [0, 50, 100, 150, 200, 300]

export const POLLUTANTS = [
  { field: 'PM2_5', label: 'PM2.5', name: '细颗粒物(PM2.5)', unit: 'μg/m³' },
  { field: 'PM10', label: 'PM10', name: '颗粒物(PM10)', unit: 'μg/m³' },
  { field: 'SO2', label: 'SO₂', name: '二氧化硫', unit: 'μg/m³' },
  { field: 'NO2', label: 'NO₂', name: '二氧化氮', unit: 'μg/m³' },
  { field: 'CO', label: 'CO', name: '一氧化碳', unit: 'mg/m³' },
  { field: 'O3', label: 'O₃', name: '臭氧', unit: 'μg/m³' },
]

/** 计算单个污染物的分指数 IAQI */
export function iaqiFor(field, value) {
  if (value === null || value === undefined || isNaN(value) || value < 0) return null
  const bp = BREAKPOINTS[field]
  const iaqiArr = field === 'O3' ? IAQI_O3 : IAQI
  let i = 0
  while (i < bp.length - 2 && value > bp[i + 1]) i++
  const bpLo = bp[i]
  const bpHi = bp[i + 1]
  const iLo = iaqiArr[i]
  const iHi = iaqiArr[i + 1]
  if (bpHi === bpLo) return iHi
  return Math.round(((iHi - iLo) / (bpHi - bpLo)) * (value - bpLo) + iLo)
}

/** 求首要污染物（IAQI 最高者；AQI ≤ 50 时无首要污染物） */
export function primaryPollutant(station) {
  let max = null
  let name = null
  for (const p of POLLUTANTS) {
    const idx = iaqiFor(p.field, station[p.field])
    if (idx !== null && (max === null || idx > max)) {
      max = idx
      name = p.name
    }
  }
  return max !== null && max > 50 ? name : null
}

/** AQI 级别（含颜色、健康影响文案） */
export function aqiLevel(aqi) {
  if (aqi === null || aqi === undefined || isNaN(aqi)) {
    return { key: '无数据', label: '无数据', color: '#9aa0a6', dark: false, text: '暂无监测数据' }
  }
  if (aqi <= 50) {
    return { key: '优', label: '优', color: '#00e400', dark: false, text: '空气质量令人满意，基本无空气污染，各类人群可正常活动' }
  }
  if (aqi <= 100) {
    return { key: '良', label: '良', color: '#ffff00', dark: true, text: '空气质量可接受，但某些污染物可能对极少数异常敏感人群健康有较弱影响' }
  }
  if (aqi <= 150) {
    return { key: '轻度污染', label: '轻度污染', color: '#ff7e00', dark: false, text: '易感人群症状有轻度加剧，健康人群出现刺激症状' }
  }
  if (aqi <= 200) {
    return { key: '中度污染', label: '中度污染', color: '#ff0000', dark: false, text: '进一步加剧易感人群症状，可能对健康人群心脏、呼吸系统有影响' }
  }
  if (aqi <= 300) {
    return { key: '重度污染', label: '重度污染', color: '#99004c', dark: false, text: '心脏病和肺病患者症状显著加剧，运动耐受力降低，健康人群普遍出现症状' }
  }
  return { key: '严重污染', label: '严重污染', color: '#7e0023', dark: false, text: '健康人群运动耐受力降低，有明显强烈症状，提前出现某些疾病' }
}

/** 图例项 */
export const AQI_LEVELS = [
  { key: '优', color: '#00e400', dark: false },
  { key: '良', color: '#ffff00', dark: true },
  { key: '轻度污染', color: '#ff7e00', dark: false },
  { key: '中度污染', color: '#ff0000', dark: false },
  { key: '重度污染', color: '#99004c', dark: false },
  { key: '严重污染', color: '#7e0023', dark: false },
  { key: '无数据', color: '#9aa0a6', dark: false },
]
