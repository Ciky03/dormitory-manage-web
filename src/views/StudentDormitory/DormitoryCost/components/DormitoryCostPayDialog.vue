<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  pay: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['close'])
</script>

<template>
  <el-dialog :model-value="visible" title="缴费凭证" width="480px" @close="$emit('close')">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="学生">{{ pay.studentName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="应缴金额">{{ pay.amountDue || '-' }}</el-descriptions-item>
      <el-descriptions-item label="凭证">{{ pay.voucherUrl || '暂无凭证' }}</el-descriptions-item>
    </el-descriptions>
    <el-alert
      class="pay-placeholder"
      type="info"
      :closable="false"
      title="当前任务仅提供只读占位弹窗，缴费动作将在后续任务实现。"
    />
    <template #footer>
      <el-button @click="$emit('close')">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.pay-placeholder {
  margin-top: 16px;
}
</style>
