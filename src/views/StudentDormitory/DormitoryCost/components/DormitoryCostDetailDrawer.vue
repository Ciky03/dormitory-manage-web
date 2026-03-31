<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  detail: {
    type: Object,
    default: null
  },
  publishLoading: {
    type: Boolean,
    default: false
  },
  payLoading: {
    type: Boolean,
    default: false
  },
  cancelLoading: {
    type: Boolean,
    default: false
  },
  deleteLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'edit', 'publish', 'pay', 'cancel', 'delete-draft'])
const previewDialog = ref({
  visible: false,
  title: '费用凭证',
  url: ''
})

const formatAmount = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? `${amount.toFixed(2)} 元` : '-'
}

const resolveStatusTagType = (label, status) => {
  const text = String(label || '')
  if (/完成/.test(text) || Number(status) === 2) return 'success'
  if (/取消/.test(text) || Number(status) === 3) return 'info'
  if (/草稿/.test(text) || Number(status) === 0) return 'warning'
  return 'primary'
}

const getPayStatusClass = (payStatus) => {
  switch (Number(payStatus)) {
    case 1:
      return 'pay-status-text pay-status-paid'
    case 0:
      return 'pay-status-text pay-status-unpaid'
    default:
      return 'pay-status-text'
  }
}

const displayText = (value, fallback = '-') => {
  if (value === undefined || value === null || value === '') return fallback
  return value
}

const isImageUrl = (value) => {
  const url = String(value || '').toLowerCase()
  return ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'].some((ext) => url.includes(ext))
}

const openPreviewDialog = (url, title = '费用凭证') => {
  if (!url) return
  if (isImageUrl(url)) {
    previewDialog.value = {
      visible: true,
      title,
      url
    }
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

const handlePreviewSourceVoucher = () => {
  openPreviewDialog(props.detail?.sourceVoucherUrl, '费用凭证')
}

const hasMemberVoucher = (member) => Boolean(member?.sourceVoucherAttachId || member?.voucherAttachId)

const getMemberVoucherName = (member) =>
  displayText(member?.sourceVoucherName || member?.voucherName, '查看凭证')

const getMemberVoucherUrl = (member) => member?.sourceVoucherUrl || member?.voucherUrl || ''

const handlePreviewMemberVoucher = (member) => {
  openPreviewDialog(getMemberVoucherUrl(member), getMemberVoucherName(member))
}

const memberList = computed(() => (Array.isArray(props.detail?.memberList) ? props.detail.memberList : []))
</script>

<template>
  <el-drawer
    :model-value="visible"
    title="公摊详情"
    class="cost-detail-drawer"
    size="560px"
    destroy-on-close
    @close="emit('close')"
  >
    <div v-loading="loading" class="detail-drawer-body">
      <el-empty v-if="!detail && !loading" description="暂无公摊详情" />

      <template v-else-if="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="标题">{{ displayText(detail.title) }}</el-descriptions-item>
          <el-descriptions-item label="总金额">{{ formatAmount(detail.totalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="发起人">{{ displayText(detail.initiatorName) }}</el-descriptions-item>
          <el-descriptions-item label="发生日期">{{ displayText(detail.occurredDate) }}</el-descriptions-item>
          <el-descriptions-item label="截止时间">{{ displayText(detail.dueTime) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              size="small"
              effect="plain"
              :type="resolveStatusTagType(detail.statusLabel, detail.status)"
            >
              {{ displayText(detail.statusLabel) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="费用凭证">
            <el-link
              v-if="detail.sourceVoucherUrl"
              type="primary"
              :underline="false"
              @click="handlePreviewSourceVoucher"
            >
              {{ displayText(detail.sourceVoucherName, '查看费用凭证') }}
            </el-link>
            <span v-else>{{ displayText(detail.sourceVoucherName) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ displayText(detail.remark) }}</el-descriptions-item>
        </el-descriptions>

        <el-card class="detail-card" shadow="never">
          <template #header>分摊明细</template>
          <el-empty v-if="memberList.length === 0" description="暂无分摊明细" />
          <div v-else class="member-list">
            <div
              v-for="member in memberList"
              :key="member.detailId || member.studentId || member.studentName"
              class="member-item"
            >
              <div>
                <div class="member-name">
                  {{ displayText(member.studentName) }}
                  <el-tag v-if="member.isCurrentUser" size="small" type="primary">我</el-tag>
                </div>
                <div :class="getPayStatusClass(member.payStatus)">{{ displayText(member.payStatusLabel) }}</div>
                <el-link
                  v-if="hasMemberVoucher(member)"
                  class="member-voucher-link"
                  type="primary"
                  :underline="false"
                  @click="handlePreviewMemberVoucher(member)"
                >
                  {{ getMemberVoucherName(member) }}
                </el-link>
              </div>
              <strong>{{ formatAmount(member.amountDue) }}</strong>
            </div>
          </div>
        </el-card>

        <div class="detail-actions">
          <el-button
            v-if="detail.canEdit"
            class="detail-action-button"
            @click="emit('edit')"
          >
            编辑
          </el-button>
          <el-button
            v-if="detail.canPublish"
            class="detail-action-button"
            type="primary"
            plain
            :loading="publishLoading"
            @click="emit('publish')"
          >
            发布
          </el-button>
          <el-button
            v-if="detail.canPay"
            class="detail-action-button"
            type="primary"
            :loading="payLoading"
            @click="emit('pay')"
          >
            上传凭证并缴费
          </el-button>
          <el-button
            v-if="detail.canCancel"
            class="detail-action-button"
            :loading="cancelLoading"
            @click="emit('cancel')"
          >
            取消
          </el-button>
          <el-button
            v-if="Number(detail.status) === 0"
            class="detail-action-button"
            type="danger"
            plain
            :loading="deleteLoading"
            @click="emit('delete-draft')"
          >
            删除草稿
          </el-button>
        </div>
      </template>
    </div>
  </el-drawer>

  <el-dialog
    v-model="previewDialog.visible"
    :title="previewDialog.title"
    width="720px"
    append-to-body
    destroy-on-close
  >
    <img
      v-if="previewDialog.url"
      :src="previewDialog.url"
      :alt="previewDialog.title"
      class="source-voucher-preview-image"
    />
  </el-dialog>
</template>

<style scoped>
.detail-drawer-body {
  display: grid;
  gap: 16px;
  min-height: 240px;
}

.detail-card {
  border: 1px solid #dde6f2;
}

.member-list {
  display: grid;
  gap: 12px;
}

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
}

.member-name {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #122033;
  font-weight: 600;
}

.pay-status-text {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
}

.pay-status-unpaid {
  color: #d03050;
}

.pay-status-paid {
  color: #237b4b;
}

.member-voucher-link {
  margin-top: 6px;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.detail-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.detail-action-button {
  min-width: 112px;
}

.cost-detail-drawer :deep(.el-button) {
  border-radius: var(--el-border-radius-base);
}

.source-voucher-preview-image {
  display: block;
  width: 100%;
  max-height: 70vh;
  object-fit: contain;
}
</style>
