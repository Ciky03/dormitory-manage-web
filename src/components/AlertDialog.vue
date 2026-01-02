<script setup>
import { h, watch } from 'vue'
import { ElNotification } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '提示'
  },
  type: {
    type: String,
    default: 'warning'
  },
  message: {
    type: [String, Array],
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const toLines = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  }
  return []
}

const openNotification = () => {
  const lines = toLines(props.message)
  const content = lines.length
    ? h(
        'div',
        {},
        lines.map((line, index) => h('p', { key: index, style: 'margin:0 0 6px;' }, line))
      )
    : props.message

  ElNotification({
    title: props.title,
    type: props.type,
    message: content,
    duration: 4000,
    position: 'top-right',
    customClass: 'app-alert-notification',
    offset: 16,
    onClose: () => emit('update:modelValue', false)
  })
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      openNotification()
    }
  }
)
</script>

<template>
  <span />
</template>
