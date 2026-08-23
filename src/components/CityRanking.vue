<script setup>
import { computed } from 'vue'
import { POLLUTANTS } from '../utils/aqi'

const props = defineProps({
  cities: { type: Array, default: () => [] },
  selectedName: { type: String, default: '' },
  provinceTitle: { type: String, default: '全部城市' },
})
const emit = defineEmits(['select'])

// 显示排名序号：按 AQI 从高到低顺序编号，无数据的城市不占名次
const rows = computed(() => {
  let rank = 0
  return props.cities.map((c) => {
    if (c.aqi !== null) rank++
    return { ...c, rank: c.aqi === null ? null : rank }
  })
})

const pm25Col = POLLUTANTS.find((p) => p.field === 'PM2_5')
const pm10Col = POLLUTANTS.find((p) => p.field === 'PM10')
</script>

<template>
  <div class="ranking">
    <div class="ranking-head">
      <span class="title">城市 AQI 排名</span>
      <span class="subtitle">{{ provinceTitle }} · {{ cities.length }} 城</span>
    </div>
    <div class="ranking-body">
      <table>
        <thead>
          <tr>
            <th class="c-rank">排名</th>
            <th class="c-city">城市</th>
            <th class="c-aqi">AQI</th>
            <th class="c-level">级别</th>
            <th class="c-primary">首要污染物</th>
            <th class="c-num">{{ pm25Col.label }}</th>
            <th class="c-num">{{ pm10Col.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in rows"
            :key="c.name"
            :class="{ active: c.name === selectedName }"
            @click="emit('select', c.name)"
          >
            <td class="c-rank">{{ c.rank ?? '—' }}</td>
            <td class="c-city">{{ c.name }}</td>
            <td class="c-aqi">
              <span
                class="aqi-badge"
                :style="{ background: c.level.color, color: c.level.dark ? '#333' : '#fff' }"
              >
                {{ c.aqi ?? '—' }}
              </span>
            </td>
            <td class="c-level">{{ c.level.label }}</td>
            <td class="c-primary">{{ c.primary ?? '—' }}</td>
            <td class="c-num">{{ c.pollutants.PM2_5 ?? '—' }}</td>
            <td class="c-num">{{ c.pollutants.PM10 ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="!rows.length" class="empty">当前省份暂无城市数据</div>
    </div>
  </div>
</template>

<style scoped>
.ranking {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.ranking-head {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
  background: #fafafa;
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-shrink: 0;
}
.title {
  font-size: 15px;
  font-weight: 700;
  color: #222;
}
.subtitle {
  font-size: 12px;
  color: #888;
}
.ranking-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
thead th {
  position: sticky;
  top: 0;
  background: #f2f2f2;
  z-index: 1;
  padding: 8px 6px;
  font-weight: 600;
  color: #555;
  text-align: center;
  white-space: nowrap;
}
tbody td {
  padding: 7px 6px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
  white-space: nowrap;
}
tbody tr {
  cursor: pointer;
  transition: background 0.15s;
}
tbody tr:hover {
  background: #f5f7ff;
}
tbody tr.active {
  background: #e8eeff;
  box-shadow: inset 3px 0 0 #4a7dff;
}
.c-rank {
  color: #999;
  width: 42px;
}
.c-city {
  text-align: left !important;
  font-weight: 500;
  color: #222;
}
.aqi-badge {
  display: inline-block;
  min-width: 38px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 13px;
}
.c-level {
  color: #555;
  font-size: 12px;
}
.c-primary {
  color: #666;
  font-size: 12px;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.c-num {
  color: #444;
  font-variant-numeric: tabular-nums;
}
.empty {
  padding: 30px;
  text-align: center;
  color: #999;
}
</style>
