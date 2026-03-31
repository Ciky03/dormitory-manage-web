<script setup>
import searchIcon from '../../../../assets/button/search.svg'
import PaginationBar from '../../../../components/list/PaginationBar.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  loading: { type: Boolean, default: false },
  filtersVisible: { type: Boolean, default: false }
})

const emit = defineEmits(['select', 'toggle-filters', 'update:currentPage', 'update:pageSize'])
const SUMMARY_LIMIT = 40

const resolveTagType = (value) => {
  if (/高/.test(String(value || ''))) return 'danger'
  if (/中/.test(String(value || ''))) return 'warning'
  if (/低/.test(String(value || ''))) return 'info'
  if (/完成/.test(String(value || ''))) return 'success'
  if (/取消/.test(String(value || ''))) return 'info'
  return 'primary'
}

const formatSummary = (value) => {
  const text = String(value || '-')
  if (text.length >= SUMMARY_LIMIT) {
    return `${text.slice(0, SUMMARY_LIMIT)}...`
  }
  return text
}
</script>

<template>
  <el-card class="todo-card-list" shadow="never">
    <template #header>
      <div class="list-header">
        <div class="list-title-group">
          <span>宿舍待办列表</span>
          <button
            type="button"
            class="search-toggle"
            :class="{ 'is-active': filtersVisible }"
            @click="emit('toggle-filters')"
          >
            <img :src="searchIcon" alt="筛选开关" />
          </button>
        </div>
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
              <div class="card-headline">
                <div class="card-tags">
                  <el-tag size="small" :type="resolveTagType(item.priorityLabel)">{{ item.priorityLabel || '-' }}</el-tag>
                  <el-tag size="small" effect="plain" :type="resolveTagType(item.statusLabel)">{{ item.statusLabel || '-' }}</el-tag>
                  <el-tag v-if="item.overdue" size="small" type="danger" effect="plain">已逾期</el-tag>
                </div>
                <h3 class="card-title">{{ item.title || '-' }}</h3>
              </div>
              <p class="card-summary">{{ formatSummary(item.summary) }}</p>
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
  display: flex;
  flex-direction: column;
  border: 1px solid #dde6f2;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.todo-card-list :deep(.el-card__body) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.list-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.list-total {
  color: #64748b;
  font-size: 13px;
}

.search-toggle {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #d8e2f0;
  border-radius: var(--el-border-radius-base);
  background: #ffffff;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.search-toggle:hover {
  border-color: #b8c9e6;
  background: #f8fbff;
}

.search-toggle.is-active {
  border-color: #2338a6;
  background: #eef2ff;
  box-shadow: 0 8px 18px rgba(35, 56, 166, 0.12);
}

.search-toggle img {
  width: 16px;
  height: 16px;
  display: block;
}

.list-body {
  flex: 1 1 auto;
  min-height: 240px;
  overflow: auto;
  padding: 2px 4px 0 0;
  box-sizing: border-box;
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
  display: block;
}

.card-headline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.card-title {
  margin: 0;
  color: #122033;
  font-size: 18px;
  line-height: 1.3;
}

.card-summary {
  margin: 8px 0 0;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
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
  flex: 0 0 auto;
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .card-meta {
    grid-template-columns: 1fr;
  }
}
</style>
