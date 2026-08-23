<script setup>
import { ref, computed, onMounted } from 'vue'
import AqiMap from './components/AqiMap.vue'
import CityRanking from './components/CityRanking.vue'
import CityInfo from './components/CityInfo.vue'
import StationTable from './components/StationTable.vue'
import ProvinceSelect from './components/ProvinceSelect.vue'
import { fetchAqiData, computeDashboard, PROVINCE_FULL } from './utils/api'
import { AQI_LEVELS } from './utils/aqi'

const loading = ref(true)
const error = ref('')
const cities = ref([])
const provinces = ref([])
const timePoint = ref('')
const lastFetch = ref('')

function applyData(records, fetchedAt = '') {
  const d = computeDashboard(records)
  cities.value = d.cities
  provinces.value = d.provinces
  timePoint.value = d.timePoint || ''
  lastFetch.value = fetchedAt
  // 默认选中 AQI 最高的城市（列表第一位）
  if (cities.value.length && !selectedCityName.value) {
    selectedCityName.value = cities.value[0].name
  }
}

const selectedProvince = ref('') // 省短名，''=全部
const selectedCityName = ref('')

const filteredCities = computed(() =>
  selectedProvince.value
    ? cities.value.filter((c) => c.province === selectedProvince.value)
    : cities.value,
)

const selectedCity = computed(
  () => cities.value.find((c) => c.name === selectedCityName.value) || null,
)

const provinceTitle = computed(() =>
  selectedProvince.value ? PROVINCE_FULL[selectedProvince.value] || selectedProvince.value : '全国',
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { records, fetchedAt } = await fetchAqiData()
    applyData(records, fetchedAt)
  } catch (e) {
    console.error(e)
    error.value = e.message || '数据加载失败'
  } finally {
    loading.value = false
  }
}

function onProvinceSelect(name) {
  if (selectedProvince.value === name) {
    selectedProvince.value = ''
  } else {
    selectedProvince.value = name
    // 若当前城市不在该省，清掉城市选择
    const p = provinces.value.find((x) => x.name === name)
    if (p && !p.cities.some((c) => c.name === selectedCityName.value)) {
      selectedCityName.value = p.cities[0]?.name || ''
    }
  }
}

function onCitySelect(name) {
  selectedCityName.value = name
}

function reset() {
  selectedProvince.value = ''
  selectedCityName.value = ''
  if (cities.value.length) selectedCityName.value = cities.value[0].name
}

function refresh() {
  load()
}

onMounted(load)
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="header-left">
        <h1>全国城市空气质量实时发布</h1>
        <span v-if="timePoint" class="time">数据时间：{{ timePoint }}</span>
        <span v-if="lastFetch" class="time muted">更新于 {{ lastFetch }}</span>
      </div>
      <div class="header-right">
        <div class="legend">
          <span v-for="l in AQI_LEVELS" :key="l.key" class="legend-item">
            <i :style="{ background: l.color }"></i>{{ l.key }}
          </span>
        </div>
        <button class="refresh-btn" @click="refresh" :disabled="loading">
          {{ loading ? '加载中…' : '刷新数据' }}
        </button>
      </div>
    </header>

    <div v-if="error" class="error-banner">⚠ {{ error }}（请检查网络或接口是否可用）</div>

    <main v-if="!loading" class="dashboard">
      <!-- 左上：全国地图 -->
      <section class="panel map-panel">
        <div class="panel-title">
          全国 AQI 分布
          <button
            v-if="selectedProvince"
            class="back-btn"
            @click="reset"
          >
            返回全国
          </button>
        </div>
        <AqiMap :provinces="provinces" :selected="selectedProvince" @select="onProvinceSelect" />
      </section>

      <!-- 右上：省份筛选 + 城市 AQI 排名 -->
      <section class="panel ranking-panel">
        <ProvinceSelect
          :provinces="provinces"
          :selected="selectedProvince"
          @select="onProvinceSelect"
        />
        <CityRanking
          :cities="filteredCities"
          :selected-name="selectedCityName"
          :province-title="provinceTitle"
          @select="onCitySelect"
        />
      </section>

      <!-- 左下：城市空气质量 -->
      <section class="panel info-panel">
        <div class="panel-title">城市空气质量</div>
        <CityInfo :city="selectedCity" @close="selectedCityName = ''" />
      </section>

      <!-- 右下：实时监测数据 -->
      <section class="panel monitor-panel">
        <div class="panel-title">实时监测数据</div>
        <StationTable :stations="selectedCity ? selectedCity.stations : []" />
      </section>
    </main>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>正在加载实时空气质量数据…</p>
    </div>

    <footer class="footer">
      <span>数据来源：空气质量实时接口 · 站点映射自中国环境监测总站</span>
    </footer>
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f6f8;
}
.header,
.footer {
  flex-shrink: 0;
}
.header {
  background: linear-gradient(135deg, #1f3a5f 0%, #2a5298 100%);
  color: #fff;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.header-left {
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
}
h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 1px;
}
.time {
  font-size: 12.5px;
  color: #cfe0ff;
}
.time.muted {
  color: #93a9d8;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}
.legend {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #dce6ff;
}
.legend-item i {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  display: inline-block;
}
.refresh-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.28);
}
.refresh-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.error-banner {
  background: #fff3f3;
  color: #c0392b;
  border: 1px solid #f5c6c6;
  border-radius: 8px;
  margin: 16px 24px 0;
  padding: 12px 16px;
  font-size: 13px;
}
/* 田字形四宫格：左列宽（55%）、右列窄（45%），上下各半，整页占满 */
.dashboard {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 1.55fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 14px;
  padding: 14px 20px;
}
.panel {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.panel-title {
  flex-shrink: 0;
  padding: 9px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #333;
  background: #fafafa;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.back-btn {
  border: 1px solid #4a7dff;
  color: #4a7dff;
  background: #fff;
  border-radius: 6px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
}
.back-btn:hover {
  background: #f0f5ff;
}

/* 各面板内容填满剩余高度，内部滚动 */
.map-panel .aqi-map {
  flex: 1;
  min-height: 0;
}
.ranking-panel .ranking {
  flex: 1;
  min-height: 0;
  height: auto;
}
.info-panel .city-info {
  flex: 1;
  min-height: 0;
  height: auto;
}
.monitor-panel .station-table {
  flex: 1;
  min-height: 0;
  height: auto;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 0;
  color: #666;
}
.spinner {
  width: 36px;
  height: 36px;
  border: 4px solid #dfe6ef;
  border-top-color: #2a5298;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.footer {
  padding: 18px 24px;
  text-align: center;
  color: #999;
  font-size: 12px;
}

@media (max-width: 900px) {
  .app {
    height: auto;
    min-height: 100vh;
    overflow: auto;
  }
  .dashboard {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    overflow-y: visible;
  }
  .panel {
    min-height: 420px;
  }
}
</style>
