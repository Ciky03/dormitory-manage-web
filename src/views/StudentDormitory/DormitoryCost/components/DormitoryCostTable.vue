<script setup>
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
  return Number.isFinite(amount) ? `CNY ${amount.toFixed(2)}` : '-'
}
</script>

<template>
  <el-card class="cost-table-card" shadow="never">
    <div class="cost-table-layout">
      <el-table :data="items" v-loading="loading" height="100%">
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column label="总金额" min-width="100">
          <template #default="{ row }">
            {{ formatAmount(row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="initiatorName" label="发起人" min-width="100" />
        <el-table-column prop="occurredDate" label="发生日期" min-width="120" />
        <el-table-column prop="dueTime" label="截止时间" min-width="160" />
        <el-table-column prop="statusLabel" label="主单状态" min-width="110" />
        <el-table-column label="我应缴" min-width="100">
          <template #default="{ row }">
            {{ formatAmount(row.myAmountDue) }}
          </template>
        </el-table-column>
        <el-table-column prop="myPayStatusLabel" label="我的缴费状态" min-width="120" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="emit('select', row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          @current-change="emit('update:current-page', $event)"
          @size-change="emit('update:page-size', $event)"
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
  display: flex;
  justify-content: flex-end;
  padding: 16px 18px;
  border-top: 1px solid #edf2f7;
  background: #fff;
}
</style>
