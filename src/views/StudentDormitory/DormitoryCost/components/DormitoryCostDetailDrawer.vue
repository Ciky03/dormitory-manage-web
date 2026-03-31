<script setup>
import { computed } from 'vue'

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

const emit = defineEmits(['close', 'publish', 'pay', 'cancel', 'delete-draft'])

const formatAmount = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? `CNY ${amount.toFixed(2)}` : '-'
}

const displayText = (value, fallback = '-') => {
  if (value === undefined || value === null || value === '') return fallback
  return value
}

const memberList = computed(() => (Array.isArray(props.detail?.memberList) ? props.detail.memberList : []))
</script>

<template>
  <el-drawer
    :model-value="visible"
    title="公摊详情"
    size="420px"
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
          <el-descriptions-item label="状态">{{ displayText(detail.statusLabel) }}</el-descriptions-item>
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
                <div class="member-status">{{ displayText(member.payStatusLabel) }}</div>
              </div>
              <strong>{{ formatAmount(member.amountDue) }}</strong>
            </div>
          </div>
        </el-card>

        <div class="detail-actions">
          <el-button
            v-if="detail.canPublish"
            class="detail-action-button"
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

.member-status {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
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
</style>
