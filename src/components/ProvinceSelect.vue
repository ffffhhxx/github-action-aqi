<script setup>
// 省份平铺选择卡片：点击效果与点击地图一致（emit 省短名，App 复用 onProvinceSelect）
const props = defineProps({
  provinces: { type: Array, default: () => [] }, // [{ name: 短名, fullName, aqi, level }]
  selected: { type: String, default: '' }, // '' = 全国
})
const emit = defineEmits(['select'])
</script>

<template>
  <div class="province-select">
    <div class="ps-head">
      <span class="ps-title">省份筛选</span>
      <button v-if="selected" class="ps-clear" @click="emit('select', '')">返回全国</button>
    </div>
    <div class="ps-chips">
      <button
        class="chip no-dot"
        :class="{ 'is-on': selected === '' }"
        @click="emit('select', '')"
      >全国</button>
      <button
        v-for="p in provinces"
        :key="p.name"
        class="chip"
        :class="{ 'is-on': selected === p.name }"
        :style="{ '--chip-color': p.level?.color || '#9aa0a6' }"
        @click="emit('select', p.name)"
      >{{ p.name }}</button>
    </div>
  </div>
</template>

<style scoped>
.province-select {
  flex-shrink: 0;
  padding: 8px 12px 6px;
  background: #fbfbfd;
  border-bottom: 1px solid #eee;
}
.ps-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.ps-title {
  font-size: 12px;
  font-weight: 600;
  color: #555;
}
.ps-clear {
  border: none;
  background: none;
  color: #4a7dff;
  font-size: 11px;
  cursor: pointer;
  padding: 0;
}
.ps-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
  font-size: 11px;
  color: #555;
  cursor: pointer;
  line-height: 1.6;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.chip::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--chip-color, #9aa0a6);
  flex-shrink: 0;
}
.chip.no-dot::before {
  display: none;
}
.chip:hover {
  border-color: #4a7dff;
  color: #1f3a5f;
}
.chip.is-on {
  border-color: #4a7dff;
  background: #eef3ff;
  color: #1f3a5f;
  font-weight: 600;
}
</style>
