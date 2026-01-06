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
  <el-button link type="danger" :loading="loading" :disabled="disabled">
    <slot>删除</slot>
  </el-button>
</template>
