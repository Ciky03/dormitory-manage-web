<script setup>
import CancelButton from '../button/CancelButton.vue'
import ConfirmButton from '../button/ConfirmButton.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '提示' },
  width: { type: String, default: '360px' },
  message: { type: String, default: '' },
  alignCenter: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const handleClose = () => {
  emit('update:modelValue', false)
  emit('cancel')
}

const handleConfirm = () => {
  emit('confirm')
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    :width="width"
    :align-center="alignCenter"
    @close="handleClose"
  >
    <p class="action-dialog__text">{{ message }}</p>
    <template #footer>
      <div class="action-dialog__footer">
        <CancelButton @click="handleClose" />
        <ConfirmButton @click="handleConfirm" />
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.action-dialog__text {
  margin: 0;
  color: #303133;
}

.action-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
