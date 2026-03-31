<script setup>
import { ElMessageBox } from 'element-plus'
import DormTodoCommentTimeline from './DormTodoCommentTimeline.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  todo: { type: Object, default: null },
  comments: { type: Array, default: () => [] },
  commentLoading: { type: Boolean, default: false },
  showActions: { type: Boolean, default: false },
  showCommentComposer: { type: Boolean, default: false },
  startLoading: { type: Boolean, default: false },
  completeLoading: { type: Boolean, default: false },
  cancelLoading: { type: Boolean, default: false },
  commentDraft: { type: String, default: '' },
  commentSubmitting: { type: Boolean, default: false }
})

const emit = defineEmits([
  'close',
  'refresh-comments',
  'edit',
  'start',
  'complete',
  'cancel',
  'update:commentDraft',
  'submit-comment'
])

const displayText = (value, fallback = '-') => {
  if (value === undefined || value === null || value === '') return fallback
  return value
}

const handleCancelClick = async () => {
  try {
    const { value } = await ElMessageBox.prompt('', '取消任务', {
      customClass: 'todo-cancel-prompt',
      confirmButtonText: '确认',
      cancelButtonText: '关闭',
      inputPlaceholder: '请输入取消原因',
      inputValidator: (inputValue) => {
        if (!String(inputValue || '').trim()) {
          return '取消原因不能为空'
        }
        return true
      }
    })
    emit('cancel', String(value || '').trim())
  } catch (error) {
    // User cancelled the prompt.
  }
}
</script>

<template>
  <el-drawer
    class="todo-detail-drawer"
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

        <div v-if="showActions" class="detail-actions">
          <el-button
            v-if="todo.canEdit"
            class="action-button action-button-edit"
            @click="emit('edit')"
          >
            编辑
          </el-button>
          <el-button
            v-if="todo.canStart"
            class="action-button action-button-start"
            :loading="startLoading"
            @click="emit('start')"
          >
            开始处理
          </el-button>
          <el-button
            v-if="todo.canComplete"
            class="action-button action-button-complete"
            :loading="completeLoading"
            @click="emit('complete')"
          >
            完成
          </el-button>
          <el-button
            v-if="todo.canCancel"
            class="action-button action-button-cancel"
            :loading="cancelLoading"
            @click="handleCancelClick"
          >
            取消
          </el-button>
        </div>

        <el-card class="detail-card" shadow="never">
          <template #header>
            <div class="comment-header">
              <span>评论时间线</span>
              <el-button link type="primary" @click="emit('refresh-comments')">刷新评论</el-button>
            </div>
          </template>
          <DormTodoCommentTimeline :comments="comments" :loading="commentLoading" />
          <div v-if="showCommentComposer" class="comment-composer">
            <el-input
              :model-value="commentDraft"
              type="textarea"
              :rows="3"
              placeholder="请输入评论"
              @update:model-value="emit('update:commentDraft', $event)"
            />
            <div class="comment-submit-row">
              <el-button type="primary" :loading="commentSubmitting" @click="emit('submit-comment')">发表评论</el-button>
            </div>
          </div>
        </el-card>
      </template>
      <el-empty v-else description="请选择待办查看详情" />
    </div>
  </el-drawer>
</template>

<style>
.todo-detail-drawer .el-drawer__header {
  align-items: center;
  min-height: 0 !important;
  margin-bottom: 0 !important;
  padding: 12px 18px 6px !important;
}

.todo-detail-drawer .el-drawer__title {
  font-size: 18px;
  line-height: 1.35;
}

.todo-detail-drawer .el-drawer__body {
  padding: 10px 18px 10px !important;
}

.todo-cancel-prompt .el-message-box__message {
  display: none;
}

.todo-cancel-prompt .el-message-box__btns .el-button {
  border-radius: var(--el-border-radius-base);
}
</style>

<style scoped>

.drawer-body {
  display: grid;
  gap: 10px;
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
  margin-top: 4px;
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

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.detail-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.action-button {
  min-width: 88px;
  padding: 8px 14px;
  border-radius: var(--el-border-radius-base);
}

.action-button-edit {
  border-color: #d8e2f0;
  background: #ffffff;
  color: #31435e;
}

.action-button-edit:hover,
.action-button-edit:focus {
  border-color: #b9c8dd;
  background: #f7faff;
  color: #22324b;
}

.action-button-start {
  border-color: #c7d3ee;
  background: #edf3ff;
  color: #294b8f;
}

.action-button-start:hover,
.action-button-start:focus {
  border-color: #b1c3ea;
  background: #e4edff;
  color: #203d77;
}

.action-button-complete {
  border-color: #c6dbc9;
  background: #eef8ef;
  color: #2f6b44;
}

.action-button-complete:hover,
.action-button-complete:focus {
  border-color: #b0cfb4;
  background: #e4f3e6;
  color: #27593a;
}

.action-button-cancel {
  border-color: #e2c9c4;
  background: #fcf2f0;
  color: #8b4a42;
}

.action-button-cancel:hover,
.action-button-cancel:focus {
  border-color: #d9b6af;
  background: #f9e7e3;
  color: #743c35;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.comment-composer {
  margin-top: 16px;
  display: grid;
  gap: 12px;
}

.comment-submit-row {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .comment-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .comment-submit-row {
    justify-content: stretch;
  }

  .comment-submit-row :deep(.el-button) {
    width: 100%;
  }
}
</style>
