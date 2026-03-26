<script setup>
import PaginationBar from '../../../../components/list/PaginationBar.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['select', 'update:currentPage', 'update:pageSize'])

const resolveTagType = (value) => {
  if (/高/.test(String(value || ''))) return 'danger'
  if (/中/.test(String(value || ''))) return 'warning'
  if (/低/.test(String(value || ''))) return 'info'
  if (/完成/.test(String(value || ''))) return 'success'
  if (/取消/.test(String(value || ''))) return 'info'
  return 'primary'
}
</script>

<template>
  <el-card class="todo-card-list" shadow="never">
    <template #header>
      <div class="list-header">
        <span>宿舍待办列表</span>
        <span class="list-total">共 {{ total }} 条</span>
      </div>
    </template>

    <div v-loading="loading" class="list-body">
      <el-empty v-if="!items.length" description="当前宿舍暂无待办" />
      <div v-else class="todo-cards">
        <article
          v-for="item in items"
          :key="item.id"
          class="todo-card"
          @click="emit('select', item)"
        >
          <div class="card-top">
            <div>
              <h3 class="card-title">{{ item.title || '-' }}</h3>
              <p class="card-summary">{{ item.summary || '-' }}</p>
            </div>
            <div class="card-tags">
              <el-tag size="small" :type="resolveTagType(item.priorityLabel)">{{ item.priorityLabel || '-' }}</el-tag>
              <el-tag size="small" effect="plain" :type="resolveTagType(item.statusLabel)">{{ item.statusLabel || '-' }}</el-tag>
              <el-tag v-if="item.overdue" size="small" type="danger" effect="plain">已逾期</el-tag>
            </div>
          </div>

          <dl class="card-meta">
            <div>
              <dt>负责人</dt>
              <dd>{{ item.assigneeName || '未指派' }}</dd>
            </div>
            <div>
              <dt>创建人</dt>
              <dd>{{ item.creatorName || '-' }}</dd>
            </div>
            <div>
              <dt>截止时间</dt>
              <dd>{{ item.dueTime || '-' }}</dd>
            </div>
          </dl>
        </article>
      </div>
    </div>

    <div class="list-pagination">
      <PaginationBar
        :total="total"
        :current-page="currentPage"
        :page-size="pageSize"
        @update:current-page="emit('update:currentPage', $event)"
        @update:page-size="emit('update:pageSize', $event)"
      />
    </div>
  </el-card>
</template>

<style scoped>
.todo-card-list {
  border: 1px solid #dde6f2;
  min-height: 0;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.list-total {
  color: #64748b;
  font-size: 13px;
}

.list-body {
  min-height: 240px;
}

.todo-cards {
  display: grid;
  gap: 12px;
}

.todo-card {
  padding: 18px;
  border: 1px solid #e1e8f2;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.todo-card:hover {
  border-color: #b7c8e8;
  transform: translateY(-1px);
  box-shadow: 0 12px 30px rgba(18, 32, 51, 0.08);
}

.card-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.card-title {
  margin: 0;
  color: #122033;
  font-size: 18px;
}

.card-summary {
  margin: 8px 0 0;
  color: #64748b;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.card-meta {
  margin: 16px 0 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.card-meta div {
  padding: 10px 12px;
  border-radius: 10px;
  background: #f7f9fc;
}

.card-meta dt {
  color: #64748b;
  font-size: 12px;
}

.card-meta dd {
  margin: 6px 0 0;
  color: #1f2a44;
  font-weight: 600;
}

.list-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .card-top {
    flex-direction: column;
  }

  .card-tags {
    justify-content: flex-start;
  }

  .card-meta {
    grid-template-columns: 1fr;
  }
}
</style>