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
    default: true
  }
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="search-input" :style="{ width }">
    <span v-if="label" class="search-input__label">{{ label }}</span>
    <el-input
      :model-value="modelValue"
      :placeholder="placeholder"
      :clearable="clearable"
      class="search-input__control"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<style scoped>
.search-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input__label {
  color: #1f2a44;
  font-weight: 600;
  white-space: nowrap;
}

.search-input__control {
  flex: 1;
}

.search-input__control :deep(.el-input__wrapper) {
  border-radius: 6px;
}
</style>
