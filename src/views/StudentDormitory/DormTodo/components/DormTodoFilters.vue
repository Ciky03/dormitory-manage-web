<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  assigneeOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'query', 'reset'])

const createFilterDraft = () => ({
  keywords: '',
  status: '',
  priority: '',
  assigneeStudentId: '',
  dueType: '',
  onlyMine: false,
  pageNum: 1,
  pageSize: 10
})

const statusOptions = [
  { label: '待处理', value: '0' },
  { label: '进行中', value: '1' },
  { label: '已完成', value: '2' },
  { label: '已取消', value: '3' }
]

const priorityOptions = [
  { label: '低', value: '1' },
  { label: '中', value: '2' },
  { label: '高', value: '3' }
]

const dueTypeOptions = [
  { label: '今日到期', value: '1' },
  { label: '3天内到期', value: '2' },
  { label: '已逾期', value: '3' }
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
  <el-card class="todo-filters" shadow="never">
    <el-form class="filter-form" label-position="top" @submit.prevent>
      <el-form-item class="keywords-item" label="关键词">
        <el-input
          v-model="filters.keywords"
          clearable
          placeholder="搜索标题或摘要"
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
      <el-form-item class="priority-item" label="优先级">
        <el-select v-model="filters.priority" clearable placeholder="全部优先级">
          <el-option
            v-for="option in priorityOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item class="assignee-item" label="负责人">
        <el-select v-model="filters.assigneeStudentId" clearable placeholder="全部负责人">
          <el-option
            v-for="option in assigneeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item class="due-type-item" label="截止范围">
        <el-select v-model="filters.dueType" clearable placeholder="全部范围">
          <el-option
            v-for="option in dueTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item class="mine-item" label="快捷筛选">
        <el-checkbox v-model="filters.onlyMine">只看我负责</el-checkbox>
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
.todo-filters {
  border: 1px solid #dde6f2;
}

.filter-form {
  display: grid;
  grid-template-columns:
    minmax(220px, 1.8fr)
    minmax(92px, 0.55fr)
    minmax(92px, 0.55fr)
    minmax(170px, 1fr)
    minmax(170px, 1fr)
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
.filter-form :deep(.el-select) {
  width: 100%;
}

.mine-item {
  min-width: 0;
}

.mine-item :deep(.el-form-item__content) {
  min-height: 40px;
  align-items: center;
}

.action-item {
  align-self: end;
  margin-left: 12px;
}

.action-item :deep(.el-form-item__content) {
  justify-content: flex-end;
}

.filter-actions-inline {
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
  padding-left: 6px;
}

.filter-actions-inline :deep(.el-button) {
  border-radius: var(--el-border-radius-base);
}

@media (max-width: 1480px) {
  .filter-form {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .action-item {
    grid-column: span 2;
    justify-self: end;
    margin-left: 0;
  }
}

@media (max-width: 980px) {
  .filter-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mine-item,
  .action-item {
    grid-column: 1 / -1;
    margin-left: 0;
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
