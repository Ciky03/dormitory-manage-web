<script setup>
import { computed } from 'vue'

const props = defineProps({
  enabled: {
    type: [Boolean, Number, String],
    default: false
  },
  enableText: {
    type: String,
    default: '启用'
  },
  disableText: {
    type: String,
    default: '禁用'
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

const isEnabled = computed(
  () =>
    props.enabled === true ||
    props.enabled === 1 ||
    props.enabled === '1' ||
    props.enabled === 'true'
)

const buttonText = computed(() =>
  isEnabled.value ? props.disableText : props.enableText
)
</script>

<template>
  <el-button
    link
    type="warning"
    :loading="loading"
    :disabled="disabled"
  >
    {{ buttonText }}
  </el-button>
</template>
