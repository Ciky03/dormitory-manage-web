<script setup>
import DormTodoCommentTimeline from './DormTodoCommentTimeline.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  todo: { type: Object, default: null },
  comments: { type: Array, default: () => [] },
  commentLoading: { type: Boolean, default: false },
  showActions: { type: Boolean, default: false },
  showCommentComposer: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'refresh-comments'])

const displayText = (value, fallback = '-') => {
  if (value === undefined || value === null || value === '') return fallback
  return value
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    title="待办详情"
    direction="rtl"
    size="560px"
    :destroy-on-close="false"
    @close="emit('close')"
  >
    <div class="drawer-body" v-loading="loading">
      <template v-if="todo">
        <div class="drawer-heading">
          <div>
            <h3 class="todo-title">{{ todo.title || '-' }}</h3>
            <div class="todo-tags">
              <el-tag size="small">{{ displayText(todo.priorityLabel) }}</el-tag>
              <el-tag size="small" effect="plain">{{ displayText(todo.statusLabel) }}</el-tag>
            </div>
          </div>
        </div>

        <el-card class="detail-card" shadow="never">
          <template #header>任务信息</template>
          <p class="todo-content">{{ displayText(todo.content, '暂无正文') }}</p>
          <dl class="detail-grid">
            <div>
              <dt>负责人</dt>
              <dd>{{ displayText(todo.assigneeName, '未指派') }}</dd>
            </div>
            <div>
              <dt>创建人</dt>
              <dd>{{ displayText(todo.creatorName) }}</dd>
            </div>
            <div>
              <dt>截止时间</dt>
              <dd>{{ displayText(todo.dueTime) }}</dd>
            </div>
            <div>
              <dt>开始时间</dt>
              <dd>{{ displayText(todo.startTime) }}</dd>
            </div>
            <div>
              <dt>完成时间</dt>
              <dd>{{ displayText(todo.completedTime) }}</dd>
            </div>
            <div>
              <dt>完成人</dt>
              <dd>{{ displayText(todo.completedByName) }}</dd>
            </div>
            <div class="detail-span-full">
              <dt>取消原因</dt>
              <dd>{{ displayText(todo.cancelReason) }}</dd>
            </div>
          </dl>
        </el-card>

        <div v-if="showActions" class="detail-actions"></div>

        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="comment-header">
              <span>评论时间线</span>
              <el-button link type="primary" @click="emit('refresh-comments')">刷新评论</el-button>
            </div>
          </template>
          <DormTodoCommentTimeline :comments="comments" :loading="commentLoading" />
          <div v-if="showCommentComposer" class="comment-composer"></div>
        </el-card>
      </template>
      <el-empty v-else description="请选择待办查看详情" />
    </div>
  </el-drawer>
</template>

<style scoped>
.drawer-body {
  display: grid;
  gap: 16px;
}

.drawer-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.todo-title {
  margin: 0;
  color: #122033;
  font-size: 22px;
}

.todo-tags {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-card {
  border: 1px solid #dde6f2;
}

.todo-content {
  margin: 0 0 16px;
  color: #334155;
  line-height: 1.7;
  white-space: pre-wrap;
}

.detail-grid {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-grid div {
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
}

.detail-grid dt {
  color: #64748b;
  font-size: 12px;
}

.detail-grid dd {
  margin: 8px 0 0;
  color: #122033;
  font-weight: 600;
}

.detail-span-full {
  grid-column: 1 / -1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

@media (max-width: 640px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .comment-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>