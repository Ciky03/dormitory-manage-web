<script setup>
defineProps({
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
  }
})

defineEmits(['close'])

const formatAmount = (value) => {
  const amount = Number(value)
  return Number.isFinite(amount) ? `CNY ${amount.toFixed(2)}` : '-'
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    title="公摊详情"
    size="420px"
    destroy-on-close
    @close="$emit('close')"
  >
    <div v-loading="loading" class="detail-drawer-body">
      <el-empty v-if="!detail && !loading" description="暂无公摊详情" />

      <template v-else-if="detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="标题">{{ detail.title || '-' }}</el-descriptions-item>
          <el-descriptions-item label="总金额">
            {{ formatAmount(detail.totalAmount) }}
          </el-descriptions-item>
          <el-descriptions-item label="发起人">{{ detail.initiatorName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="发生日期">{{ detail.occurredDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="截止时间">{{ detail.dueTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ detail.statusLabel || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ detail.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </div>
  </el-drawer>
</template>

<style scoped>
.detail-drawer-body {
  min-height: 240px;
}
</style>
