<script setup>
import { onMounted } from 'vue'
import { createDormTodoPageModel } from './useDormTodoPage'
import DormTodoCardList from './components/DormTodoCardList.vue'
import DormTodoDetailDrawer from './components/DormTodoDetailDrawer.vue'
import DormTodoFilters from './components/DormTodoFilters.vue'
import DormTodoOverview from './components/DormTodoOverview.vue'

const model = createDormTodoPageModel()

onMounted(() => {
  model.loadBootstrap()
})
</script>

<template>
  <section class="dorm-todo-page" v-loading="model.state.ui.pageLoading">
    <DormTodoOverview :stat="model.state.stat.data" :show-create="false" />

    <div class="page-layout">
      <div class="page-main">
        <DormTodoFilters
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
          @select="model.handleSelectTodo"
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
      :show-actions="false"
      :show-comment-composer="false"
      @close="model.handleCloseDetail"
      @refresh-comments="model.loadComments()"
    />
  </section>
</template>

<style scoped>
.dorm-todo-page {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.page-layout {
  min-height: 0;
}

.page-main {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 16px;
  min-height: 0;
}
</style>