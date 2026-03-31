<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
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
const voucherPreviewVisible = ref(false)

const voucherFileName = computed(() => {
  const uploadedName = String(props.pay?.voucherName || '').trim()
  if (uploadedName) return uploadedName
  const url = String(props.pay?.voucherUrl || '')
  if (!url) return ''
  const cleanUrl = url.split('?')[0]
  const segments = cleanUrl.split('/')
  const lastSegment = segments[segments.length - 1] || ''
  if (!lastSegment) return '已上传缴费凭证'
  try {
    return decodeURIComponent(lastSegment)
  } catch {
    return lastSegment
  }
})

const handleUploadChange = (file) => {
  emit('voucher-change', file?.raw ?? file)
}

const isImageUrl = (value) => {
  const url = String(value || '').toLowerCase()
  return ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'].some((ext) => url.includes(ext))
}

const handlePreviewVoucher = () => {
  const url = props.pay?.voucherUrl
  if (!url) return
  if (isImageUrl(url)) {
    voucherPreviewVisible.value = true
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    title="缴费凭证"
    class="cost-pay-dialog"
    width="480px"
    @close="emit('close')"
  >
    <el-descriptions :column="1" border>
      <el-descriptions-item label="学生">{{ pay.studentName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="应缴金额">{{ pay.amountDue || '-' }}</el-descriptions-item>
      <el-descriptions-item label="已上传凭证">
        <el-link
          v-if="pay.voucherUrl"
          class="voucher-link"
          type="primary"
          :underline="false"
          @click="handlePreviewVoucher"
        >
          {{ voucherFileName }}
        </el-link>
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

  <el-dialog
    v-model="voucherPreviewVisible"
    title="缴费凭证"
    width="720px"
    append-to-body
    destroy-on-close
  >
    <img
      v-if="pay.voucherUrl"
      :src="pay.voucherUrl"
      alt="缴费凭证"
      class="voucher-preview-image"
    />
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

.voucher-link {
  color: #0958d9;
  text-decoration: none;
}

.voucher-link:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.voucher-preview-image {
  display: block;
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.cost-pay-dialog :deep(.el-button) {
  border-radius: var(--el-border-radius-base);
}
</style>
