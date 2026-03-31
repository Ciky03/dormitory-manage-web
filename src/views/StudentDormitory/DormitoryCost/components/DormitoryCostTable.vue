<script setup>
import PaginationBar from '../../../../components/list/PaginationBar.vue'

defineProps({
  items: {
    type: Array,
    default: () => []
  },
  total: {
    type: Number,
    default: 0
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'update:current-page', 'update:page-size'])

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
</script>

<template>
  <el-card class="cost-table-card" shadow="never">
    <div class="cost-table-layout">
      <el-table :data="items" v-loading="loading" height="100%">
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column label="我的缴费状态" min-width="120">
          <template #default="{ row }">
            <span :class="getPayStatusClass(row.myPayStatus)">{{ row.myPayStatusLabel || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="总金额" min-width="100">
          <template #default="{ row }">
            {{ formatAmount(row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="我应缴" min-width="100">
          <template #default="{ row }">
            {{ formatAmount(row.myAmountDue) }}
          </template>
        </el-table-column>
        <el-table-column prop="initiatorName" label="发起人" min-width="100" />
        <el-table-column label="状态" min-width="110">
          <template #default="{ row }">
            <el-tag
              size="small"
              effect="plain"
              :type="resolveStatusTagType(row.statusLabel, row.status)"
            >
              {{ row.statusLabel || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="occurredDate" label="发生日期" min-width="120" />
        <el-table-column prop="dueTime" label="截止时间" min-width="160" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="emit('select', row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <PaginationBar
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          @update:current-page="emit('update:current-page', $event)"
          @update:page-size="emit('update:page-size', $event)"
        />
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.cost-table-card,
.cost-table-card :deep(.el-card__body),
.cost-table-layout {
  height: 100%;
  min-height: 0;
}

.cost-table-card {
  border: 1px solid #dde6f2;
}

.cost-table-card :deep(.el-card__body) {
  padding: 0;
}

.cost-table-layout {
  display: grid;
  grid-template-rows: 1fr auto;
}

.table-pagination {
  flex: 0 0 auto;
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  padding: 0 18px 18px;
}

.pay-status-text {
  font-weight: 600;
}

.pay-status-unpaid {
  color: #d03050;
}

.pay-status-paid {
  color: #237b4b;
}
</style>
