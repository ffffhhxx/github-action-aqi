/**
 * 数据获取与聚合
 * 站点级数据来自实时空气质量接口，站点→城市映射来自 station2city.json（从中国环境监测总站提取）
 */
import station2city from '../data/station2city.json' with { type: 'json' }
import { aqiLevel, primaryPollutant, POLLUTANTS } from './aqi.js'

// 数据流（token 不进入前端）：
// 接口 token 只放在 GitHub Actions 的 secret 里，由 scripts/fetch-aqi.mjs 定时抓取并
// 提交 public/data/aqi.json；前端只读这个 json 文件，不直连接口。
// 用 BASE_URL 拼相对路径，跟随 vite 的 base 配置（部署在子路径下也能找到数据文件）
const DATA_URL = `${import.meta.env.BASE_URL}data/aqi.json`

/** 获取 AQI 数据：读取 json 数据文件（由 GitHub Actions 定时更新） */
export async function fetchAqiData() {
  // 加时间戳参数避免浏览器缓存旧文件
  const res = await fetch(`${DATA_URL}?t=${Date.now()}`)
  if (!res.ok) {
    throw new Error(`数据文件读取失败：HTTP ${res.status}`)
  }
  let data
  try {
    data = await res.json()
  } catch (e) {
    throw new Error('数据文件不是有效 JSON')
  }
  if (!data || !Array.isArray(data.records)) {
    throw new Error('数据文件格式异常')
  }
  return { records: data.records, fetchedAt: data.fetchedAt || '', fromApi: false }
}

/** 短省名 → 地图 GeoJSON 全名（china.json 用「北京市/内蒙古自治区」等全名） */
export const PROVINCE_FULL = {
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

/** 把接口记录 + 映射表整理成「城市 / 省份」两级聚合结果 */
export function computeDashboard(records) {
  if (!Array.isArray(records)) {
    throw new Error('数据格式错误：未收到有效的站点数组')
  }
  // 站点加入城市分组
  const cityMap = new Map()
  let timePoint = null
  let matched = 0
  let unmatched = 0

  for (const rec of records) {
    const loc = station2city[rec.Station_ID_C]
    if (!loc) {
      unmatched++
      continue
    }
    matched++
    const cityName = loc.city
    const province = loc.province
    if (!cityMap.has(cityName)) {
      cityMap.set(cityName, { name: cityName, province, stations: [] })
    }
    cityMap.get(cityName).stations.push({ ...rec, cityName, province, stationName: loc.name })
    if (!timePoint) timePoint = `${rec.Year}-${String(rec.mon).padStart(2, '0')}-${String(rec.day).padStart(2, '0')} ${String(rec.Hour).padStart(2, '0')}:00`
  }

  const cities = []
  for (const c of cityMap.values()) {
    const stations = c.stations
    // 城市 AQI = 各点位 AQI 最大值（国标口径）
    const withAqi = stations.filter((s) => s.aqi !== null && !isNaN(s.aqi))
    const aqi = withAqi.length ? Math.max(...withAqi.map((s) => s.aqi)) : null
    const level = aqiLevel(aqi)

    // 城市首要污染物：取 AQI 最大点位的首要污染物
    let primary = null
    if (withAqi.length) {
      const worst = withAqi.reduce((a, b) => (b.aqi > a.aqi ? b : a))
      primary = primaryPollutant(worst)
    }

    // 城市污染物浓度 = 各点位均值
    const pollutants = {}
    for (const p of POLLUTANTS) {
      const vals = stations.map((s) => Number(s[p.field])).filter((v) => !isNaN(v) && v !== null)
      pollutants[p.field] = vals.length
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10
        : null
    }

    cities.push({
      name: c.name,
      province: c.province,
      aqi,
      level,
      primary,
      pollutants,
      stations,
      stationCount: stations.length,
      dataCount: withAqi.length,
    })
  }

  // 按 AQI 从高到低排序（无数据排最后）
  cities.sort((a, b) => {
    if (a.aqi === null && b.aqi === null) return 0
    if (a.aqi === null) return 1
    if (b.aqi === null) return -1
    return b.aqi - a.aqi
  })

  // 省份聚合：省内城市 AQI 最大值
  const provMap = new Map()
  for (const c of cities) {
    if (!provMap.has(c.province)) {
      provMap.set(c.province, { name: c.province, fullName: PROVINCE_FULL[c.province] || c.province, cityCount: 0, cities: [] })
    }
    const p = provMap.get(c.province)
    p.cityCount++
    p.cities.push(c)
  }
  for (const p of provMap.values()) {
    const withAqi = p.cities.filter((c) => c.aqi !== null)
    p.aqi = withAqi.length ? Math.max(...withAqi.map((c) => c.aqi)) : null
    p.level = aqiLevel(p.aqi)
  }
  const provinces = [...provMap.values()]

  return { cities, provinces, timePoint, matched, unmatched, total: records.length }
}
