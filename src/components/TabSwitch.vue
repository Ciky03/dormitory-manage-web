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
}

.tabs {
  padding: 0;
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
  /* border-radius: 4px 4px 0 0; */
  font-weight: 600;
  position: relative;
  border-left: none;
  border-right: none;
  border-radius: 0;
}

.tabs :deep(.el-tabs__item.is-active) {
  color: var(--app-primary);
  background: #f2f5ff;
}

.tabs :deep(.el-tabs__item.is-active)::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 2px;
  border-radius: 3px;
  background: var(--app-primary);
}

.tabs :deep(.el-tabs__nav) {
  border: none;
}

.tabs :deep(.el-tabs__header) {
  border-bottom: none !important;
}

.tabs :deep(.el-tabs__nav) {
  border-bottom: none !important;
}

.tabs :deep(.el-tabs__item) {
  border-bottom: none !important;
}

.tabs :deep(.el-tabs__item),
.tabs :deep(.el-tabs__item.is-active),
.tabs :deep(.el-tabs__nav),
.tabs :deep(.el-tabs__nav-scroll),
.tabs :deep(.el-tabs__nav-wrap) {
  border-radius: 0 !important;
}

.tabs :deep(.el-tabs__item + .el-tabs__item)::before {
  display: none;
}
</style>
