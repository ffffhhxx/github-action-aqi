/**
 * 抓取 AQI 接口数据并保存为 JSON
 * 输出：public/data/aqi.json（网页通过 /data/aqi.json 读取，token 不进入前端）
 *
 * 用途：GitHub Actions 定时运行（token 从 secret 注入），或本地手动 `npm run fetch`
 * 密钥来源：环境变量 AQI_TOKEN（GitHub Actions 用 secret；本地可建 .env.local）
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'data', 'aqi.json')

/** 读取 token：环境变量优先，其次本地 .env.local */
function loadToken() {
  if (process.env.AQI_TOKEN) return process.env.AQI_TOKEN
  const envPath = join(__dirname, '..', '.env.local')
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*AQI_TOKEN\s*=\s*(.*?)\s*$/)
      if (m) return m[1].trim()
    }
  }
  return ''
}

async function main() {
  const token = loadToken()
  if (!token) {
    console.error('❌ 缺少 AQI_TOKEN（GitHub Actions secret 或本地 .env.local）')
    process.exitCode = 1
    return
  }
  const API_URL = `http://123.57.246.62:36213/getPmNow?token=${encodeURIComponent(token)}`

  let res
  try {
    res = await fetch(API_URL, { signal: AbortSignal.timeout(15000) })
  } catch (e) {
    console.error('❌ 网络请求失败:', String(e.message || e).replace(token, '***'))
    process.exitCode = 1
    return
  }
  if (!res.ok) {
    console.error(`❌ 接口请求失败：HTTP ${res.status}`)
    process.exitCode = 1
    return
  }

  const data = await res.json()
  if (!Array.isArray(data)) {
    console.error('❌ 接口返回格式异常')
    process.exitCode = 1
    return
  }

  const payload = {
    fetchedAt: new Date().toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' }),
    records: data,
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(payload))
  console.log(`✅ 已保存 ${data.length} 条站点数据 → ${OUT}`)
  console.log(`   数据时间: ${data[0]?.Year}-${data[0]?.mon}-${data[0]?.day} ${data[0]?.Hour}:00`)
}

await main()
