<script setup>
defineProps({
  type: {
    type: String,
    default: 'primary'
  },
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
  <el-button :type="type" :loading="loading" :disabled="disabled" class="app-button">
    <slot>确认</slot>
  </el-button>
</template>

<style scoped>
.app-button {
  min-width: 60px;
  border-radius: 6px;
}
</style>
