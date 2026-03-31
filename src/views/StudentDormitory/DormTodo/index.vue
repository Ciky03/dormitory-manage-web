<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createDormTodoPageModel } from './useDormTodoPage'
import DormTodoCardList from './components/DormTodoCardList.vue'
import DormTodoDetailDrawer from './components/DormTodoDetailDrawer.vue'
import DormTodoFilters from './components/DormTodoFilters.vue'
import DormTodoFormDialog from './components/DormTodoFormDialog.vue'
import DormTodoOverview from './components/DormTodoOverview.vue'
import { getCurrentUser } from '../../../util/user'

const model = createDormTodoPageModel()
const filtersVisible = ref(false)
const currentUser = ref(getCurrentUser())
const isStudentUser = computed(() => String(currentUser.value?.userType ?? '') === '1')

const toggleFiltersVisible = () => {
  filtersVisible.value = !filtersVisible.value
}

const syncCurrentUser = () => {
  currentUser.value = getCurrentUser()
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('user-updated', syncCurrentUser)
  }
  if (isStudentUser.value) {
    model.loadBootstrap()
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('user-updated', syncCurrentUser)
  }
})

watch(isStudentUser, (isStudent) => {
  if (isStudent) {
    model.loadBootstrap()
  }
})
</script>

<template>
  <section class="dorm-todo-page" v-loading="isStudentUser && model.state.ui.pageLoading">
    <el-card v-if="!isStudentUser" shadow="never">
      <el-empty description="当前用户不是学生" />
    </el-card>

    <el-card v-else-if="model.state.ui.noRoomBinding" shadow="never">
      <el-empty description="当前学生暂未分配宿舍" />
    </el-card>

    <el-card v-else-if="model.state.ui.bootstrapError" shadow="never">
      <el-result icon="error" :title="model.state.ui.bootstrapError" sub-title="请重试或稍后再试">
        <template #extra>
          <el-button type="primary" @click="model.loadBootstrap">重试</el-button>
        </template>
      </el-result>
    </el-card>

    <template v-else>
      <DormTodoOverview :stat="model.state.stat.data" :show-create="true" @create="model.openCreate" />

      <div class="page-layout">
        <div class="page-main" :class="{ 'filters-visible': filtersVisible }">
          <DormTodoFilters
            v-show="filtersVisible"
            :model-value="model.state.filters"
            :assignee-options="model.state.assigneeOptions.data"
            @query="model.loadList"
            @reset="model.handleReset"
            @update:model-value="model.updateFilters"
          />
          <DormTodoCardList
            :items="model.state.list.items"
            :total="model.state.list.total"
            :current-page="model.state.filters.pageNum"
            :page-size="model.state.filters.pageSize"
            :loading="model.state.list.loading"
            :filters-visible="filtersVisible"
            @select="model.handleSelectTodo"
            @toggle-filters="toggleFiltersVisible"
            @update:current-page="model.handlePageChange"
            @update:page-size="model.handlePageSizeChange"
          />
        </div>
      </div>

      <DormTodoDetailDrawer
        :visible="model.state.detail.visible"
        :loading="model.state.detail.loading"
        :todo="model.state.detail.data"
        :comments="model.state.detail.comments"
        :comment-loading="model.state.detail.commentLoading"
        :show-actions="true"
        :show-comment-composer="true"
        :start-loading="model.state.ui.startLoading"
        :complete-loading="model.state.ui.completeLoading"
        :cancel-loading="model.state.ui.cancelLoading"
        :comment-draft="model.state.commentDraft"
        :comment-submitting="model.state.ui.commentSubmitting"
        @close="model.handleCloseDetail"
        @refresh-comments="model.loadComments()"
        @edit="model.openEdit"
        @start="model.handleStart"
        @complete="model.handleComplete"
        @cancel="model.handleCancel"
        @update:comment-draft="model.updateCommentDraft"
        @submit-comment="model.submitComment()"
      />

      <DormTodoFormDialog
        :visible="model.state.ui.formVisible"
        :mode="model.state.ui.formMode"
        :form="model.state.form"
        :assignee-options="model.state.assigneeOptions.data"
        :loading="model.state.ui.submitLoading"
        @close="model.closeForm"
        @submit="model.submitForm"
        @update:form="model.updateForm"
      />
    </template>
  </section>
</template>

<style scoped>
.dorm-todo-page {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 16px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.page-layout {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.page-main {
  display: grid;
  grid-template-rows: 1fr;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.page-main.filters-visible {
  grid-template-rows: auto 1fr;
  gap: 16px;
}
</style>
