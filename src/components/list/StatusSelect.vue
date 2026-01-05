<script setup>
defineProps({
  label: {
    type: String,
    default: ''
  },
  modelValue: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: ''
  },
  width: {
    type: String,
    default: '100%'
  },
  clearable: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="status-select" :style="{ width }">
    <span v-if="label" class="status-select__label">{{ label }}</span>
    <el-select
      :model-value="modelValue"
      :placeholder="placeholder"
      :clearable="clearable"
      class="status-select__control"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <el-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
  </div>
</template>

<style scoped>
.status-select {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-select__label {
  color: #1f2a44;
  font-weight: 600;
  white-space: nowrap;
}

.status-select__control {
  flex: 1;
}

.status-select__control :deep(.el-select__wrapper) {
  border-radius: 6px;
}
</style>
