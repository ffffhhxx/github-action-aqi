<script setup>
import { computed } from 'vue'
import { POLLUTANTS, iaqiFor, aqiLevel } from '../utils/aqi'

const props = defineProps({
  city: { type: Object, default: null },
})
const emit = defineEmits(['close'])

const pollutantCards = computed(() => {
  if (!props.city) return []
  return POLLUTANTS.map((p) => {
    const v = props.city.pollutants?.[p.field]
    const iaqi = iaqiFor(p.field, v)
    return {
      ...p,
      value: v,
      iaqi,
      level: iaqi !== null ? aqiLevel(iaqi) : aqiLevel(null),
    }
  })
})
</script>

<template>
  <div v-if="city" class="city-info">
    <div class="head">
      <h2 class="city-name">{{ city.name }}</h2>
      <span class="prov">{{ city.province }}</span>
      <button class="close" title="取消选中" @click="emit('close')">✕</button>
    </div>

    <div class="main">
      <!-- AQI 大数字 -->
      <div class="aqi-card">
        <div class="aqi-num" :style="{ color: city.level.color }">{{ city.aqi ?? '—' }}</div>
        <div class="aqi-label">
          <span class="badge" :style="{ background: city.level.color, color: city.level.dark ? '#333' : '#fff' }">
            {{ city.level.label }}
          </span>
        </div>
        <div class="health">{{ city.level.text }}</div>
        <div class="primary">首要污染物：<b>{{ city.primary ?? '—' }}</b></div>
        <div class="meta">{{ city.stationCount }} 个点位 / {{ city.dataCount }} 个有数据</div>
      </div>

      <!-- 六项污染物 -->
      <div class="pollutants">
        <div v-for="p in pollutantCards" :key="p.field" class="p-card">
          <div class="p-label">{{ p.label }}</div>
          <div class="p-value" :style="{ color: p.level.key === '无数据' ? '#999' : p.level.color }">
            {{ p.value ?? '—' }}
          </div>
          <div class="p-unit">{{ p.unit }}</div>
          <div class="p-iaqi">IAQI {{ p.iaqi ?? '—' }}</div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty">点击右上角城市排名，查看该城市空气质量</div>
</template>

<style scoped>
.city-info {
  height: 100%;
  overflow-y: auto;
  padding: 14px;
  box-sizing: border-box;
}
.head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}
.city-name {
  margin: 0;
  font-size: 18px;
  color: #222;
}
.prov {
  font-size: 12px;
  color: #888;
}
.close {
  margin-left: auto;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  width: 26px;
  height: 26px;
  cursor: pointer;
  color: #666;
  line-height: 1;
}
.close:hover {
  background: #f5f5f5;
}

.main {
  display: grid;
  grid-template-columns: 230px 1fr;
  gap: 14px;
}
.aqi-card {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 16px 14px;
  text-align: center;
}
.aqi-num {
  font-size: 52px;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.aqi-label {
  margin-top: 8px;
}
.badge {
  display: inline-block;
  padding: 3px 14px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 700;
}
.health {
  margin-top: 12px;
  font-size: 12px;
  color: #666;
  line-height: 1.6;
  text-align: left;
}
.primary {
  margin-top: 10px;
  font-size: 12.5px;
  color: #333;
}
.meta {
  margin-top: 6px;
  font-size: 11.5px;
  color: #999;
}

.pollutants {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.p-card {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 10px 8px;
  text-align: center;
}
.p-label {
  font-size: 12px;
  color: #666;
}
.p-value {
  font-size: 24px;
  font-weight: 700;
  margin: 4px 0 2px;
  font-variant-numeric: tabular-nums;
}
.p-unit {
  font-size: 11px;
  color: #999;
}
.p-iaqi {
  margin-top: 6px;
  font-size: 11px;
  color: #888;
  background: #f7f7f7;
  border-radius: 4px;
  padding: 2px 0;
}
.empty {
  padding: 30px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

@media (max-width: 1100px) {
  .main {
    grid-template-columns: 1fr;
  }
}
</style>
