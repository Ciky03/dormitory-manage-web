<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  tabs: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'close'])

const handleTabChange = (name) => {
  emit('update:modelValue', name)
}

const handleTabRemove = (name) => {
  emit('close', name)
}
</script>

<template>
  <div class="tab-switch">
    <el-tabs
      :model-value="props.modelValue"
      type="card"
      class="tabs"
      @update:model-value="handleTabChange"
      @tab-remove="handleTabRemove"
    >
      <el-tab-pane
        v-for="tab in props.tabs"
        :key="tab.name"
        :label="tab.label"
        :name="tab.name"
        :closable="tab.closable"
      />
    </el-tabs>
  </div>
</template>

<style scoped>
.tab-switch {
  background: #ffffff;
  border-bottom: 1px solid #e3e8f3;
}

.tabs {
  padding: 0 8px;
}

.tabs :deep(.el-tabs__header) {
  margin: 0;
}

.tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.tabs :deep(.el-tabs__item) {
  height: 42px;
  line-height: 42px;
  border-radius: 10px 10px 0 0;
  font-weight: 600;
}

.tabs :deep(.el-tabs__item.is-active) {
  color: #2f5bff;
}
</style>
