<script setup>
defineProps({
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
  pageSizes: {
    type: Array,
    default: () => [10, 20, 30, 50]
  },
  disabled: {
    type: Boolean,
    default: false
  },
  background: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:currentPage', 'update:pageSize'])

const handleSizeChange = (value) => {
  emit('update:pageSize', value)
  emit('update:currentPage', 1)
}

const handleCurrentChange = (value) => {
  emit('update:currentPage', value)
}
</script>

<template>
  <div class="pagination-bar">
    <span class="pagination-bar__total">共 {{ total }} 条</span>
    <el-pagination
      :total="total"
      :current-page="currentPage"
      :page-size="pageSize"
      :page-sizes="pageSizes"
      :background="background"
      :disabled="disabled"
      layout="sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<style scoped>
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  color: #5a6a82;
}

.pagination-bar__total {
  white-space: nowrap;
  font-size: 14px;
}
</style>
