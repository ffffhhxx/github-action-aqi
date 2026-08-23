<script setup>
import { computed } from 'vue'
import { aqiLevel } from '../utils/aqi'

const props = defineProps({
  stations: { type: Array, default: () => [] },
})

// 站点按 AQI 从高到低
const stations = computed(() =>
  [...props.stations].sort((a, b) => {
    if (a.aqi === null && b.aqi === null) return 0
    if (a.aqi === null) return 1
    if (b.aqi === null) return -1
    return b.aqi - a.aqi
  }),
)
</script>

<template>
  <div class="station-table">
    <div v-if="!stations.length" class="empty">暂无站点数据，点击右上角城市后显示</div>
    <table v-else>
      <thead>
        <tr>
          <th class="s-name">点位</th>
          <th>AQI</th>
          <th>级别</th>
          <th>PM2.5</th>
          <th>PM10</th>
          <th>SO₂</th>
          <th>NO₂</th>
          <th>CO</th>
          <th>O₃</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in stations" :key="s.Station_ID_C">
          <td class="s-name">{{ s.stationName }}</td>
          <td>
            <span
              class="badge"
              :style="{ background: aqiLevel(s.aqi).color, color: aqiLevel(s.aqi).dark ? '#333' : '#fff' }"
            >
              {{ s.aqi ?? '—' }}
            </span>
          </td>
          <td class="s-level">{{ aqiLevel(s.aqi).label }}</td>
          <td class="s-num">{{ s.PM2_5 ?? '—' }}</td>
          <td class="s-num">{{ s.PM10 ?? '—' }}</td>
          <td class="s-num">{{ s.SO2 ?? '—' }}</td>
          <td class="s-num">{{ s.NO2 ?? '—' }}</td>
          <td class="s-num">{{ s.CO ?? '—' }}</td>
          <td class="s-num">{{ s.O3 ?? '—' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.station-table {
  height: 100%;
  overflow-y: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
th {
  position: sticky;
  top: 0;
  background: #f7f7f7;
  padding: 7px 8px;
  font-weight: 600;
  color: #555;
  text-align: center;
  white-space: nowrap;
  z-index: 1;
}
td {
  padding: 6px 8px;
  text-align: center;
  border-bottom: 1px solid #f2f2f2;
  white-space: nowrap;
}
.s-name {
  text-align: left !important;
  color: #222;
}
.s-level,
.s-num {
  color: #555;
  font-variant-numeric: tabular-nums;
}
.badge {
  display: inline-block;
  min-width: 32px;
  padding: 1px 7px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}
.empty {
  padding: 30px;
  text-align: center;
  color: #999;
  font-size: 13px;
}
</style>
