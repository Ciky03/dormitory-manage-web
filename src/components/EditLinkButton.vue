<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <el-button link type="primary" :loading="loading" :disabled="disabled">
    <slot>编辑</slot>
  </el-button>
</template>
