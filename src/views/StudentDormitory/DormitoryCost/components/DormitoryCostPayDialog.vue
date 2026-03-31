<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  pay: {
    type: Object,
    default: () => ({})
  },
  uploading: {
    type: Boolean,
    default: false
  },
  submitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'voucher-change', 'submit'])

const handleUploadChange = (file) => {
  emit('voucher-change', file?.raw ?? file)
}
</script>

<template>
  <el-dialog :model-value="visible" title="缴费凭证" width="480px" @close="emit('close')">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="学生">{{ pay.studentName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="应缴金额">{{ pay.amountDue || '-' }}</el-descriptions-item>
      <el-descriptions-item label="已上传凭证">
        <a v-if="pay.voucherUrl" :href="pay.voucherUrl" target="_blank" rel="noreferrer">{{ pay.voucherUrl }}</a>
        <span v-else>暂无凭证</span>
      </el-descriptions-item>
    </el-descriptions>

    <div class="pay-upload-row">
      <el-upload
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleUploadChange"
        accept=".jpg,.jpeg,.png,.pdf"
      >
        <el-button :loading="uploading">上传缴费凭证</el-button>
      </el-upload>
      <span class="pay-upload-hint">先上传凭证，再提交缴费。</span>
    </div>

    <template #footer>
      <el-button @click="emit('close')">关闭</el-button>
      <el-button type="primary" :loading="submitting" @click="emit('submit')">确认缴费</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.pay-upload-row {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.pay-upload-hint {
  color: #64748b;
  font-size: 12px;
}
</style>
