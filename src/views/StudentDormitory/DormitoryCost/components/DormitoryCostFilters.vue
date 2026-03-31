<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'query', 'reset'])

const createFilterDraft = () => ({
  keywords: '',
  status: '',
  month: '',
  onlyMine: false,
  pageNum: 1,
  pageSize: 10
})

const statusOptions = [
  { label: '待发布', value: '0' },
  { label: '已发布', value: '1' },
  { label: '已完成', value: '2' }
]

const filters = reactive(createFilterDraft())

watch(
  () => props.modelValue,
  (value) => {
    Object.assign(filters, createFilterDraft(), value || {})
  },
  { deep: true, immediate: true }
)

const syncFilters = (nextFilters = {}) => {
  emit('update:modelValue', {
    ...filters,
    ...nextFilters
  })
}

const handleQuery = () => {
  syncFilters({ pageNum: 1 })
  emit('query')
}

const handleReset = () => {
  Object.assign(filters, createFilterDraft())
  emit('update:modelValue', { ...filters })
  emit('reset')
}
</script>

<template>
  <el-card class="cost-filters" shadow="never">
    <el-form class="filter-form" label-position="top" @submit.prevent>
      <el-form-item class="keywords-item" label="关键词">
        <el-input
          v-model="filters.keywords"
          clearable
          placeholder="搜索标题或备注"
          @keyup.enter="handleQuery"
        />
      </el-form-item>

      <el-form-item class="status-item" label="状态">
        <el-select v-model="filters.status" clearable placeholder="全部状态">
          <el-option
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item class="month-item" label="月份">
        <el-date-picker
          v-model="filters.month"
          type="month"
          clearable
          value-format="YYYY-MM"
          placeholder="选择月份"
        />
      </el-form-item>

      <el-form-item class="mine-item" label="快捷筛选">
        <el-checkbox v-model="filters.onlyMine">只看我的待缴项</el-checkbox>
      </el-form-item>

      <el-form-item class="action-item">
        <div class="filter-actions-inline">
          <el-button @click="handleReset">重置</el-button>
          <el-button type="primary" @click="handleQuery">查询</el-button>
        </div>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<style scoped>
.cost-filters {
  border: 1px solid #dde6f2;
}

.filter-form {
  display: grid;
  grid-template-columns:
    minmax(220px, 1.6fr)
    minmax(140px, 0.8fr)
    minmax(180px, 1fr)
    max-content
    max-content;
  gap: 12px 20px;
  align-items: start;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
  min-width: 0;
}

.filter-form :deep(.el-input),
.filter-form :deep(.el-select),
.filter-form :deep(.el-date-editor) {
  width: 100%;
}

.mine-item :deep(.el-form-item__content) {
  min-height: 40px;
  align-items: center;
}

.action-item {
  align-self: end;
}

.action-item :deep(.el-form-item__content) {
  justify-content: flex-end;
}

.filter-actions-inline {
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
}

@media (max-width: 1200px) {
  .filter-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mine-item,
  .action-item {
    grid-column: 1 / -1;
  }

  .action-item :deep(.el-form-item__content) {
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .filter-form {
    grid-template-columns: 1fr;
  }

  .filter-actions-inline {
    width: 100%;
  }

  .filter-actions-inline :deep(.el-button) {
    flex: 1;
  }
}
</style>
