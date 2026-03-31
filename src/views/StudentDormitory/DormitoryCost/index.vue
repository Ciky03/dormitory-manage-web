<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createDormitoryCostPageModel } from './useDormitoryCostPage'
import DormitoryCostDetailDrawer from './components/DormitoryCostDetailDrawer.vue'
import DormitoryCostFilters from './components/DormitoryCostFilters.vue'
import DormitoryCostFormDialog from './components/DormitoryCostFormDialog.vue'
import DormitoryCostOverview from './components/DormitoryCostOverview.vue'
import DormitoryCostPayDialog from './components/DormitoryCostPayDialog.vue'
import DormitoryCostTable from './components/DormitoryCostTable.vue'
import { getCurrentUser } from '../../../util/user'

const model = createDormitoryCostPageModel()
const currentUser = ref(getCurrentUser())
const isStudentUser = computed(() => String(currentUser.value?.userType ?? '') === '1')

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
  <section class="dormitory-cost-page" v-loading="isStudentUser && model.state.ui.pageLoading">
    <el-card v-if="!isStudentUser" shadow="never">
      <el-empty description="褰撳墠鐢ㄦ埛涓嶆槸瀛︾敓" />
    </el-card>

    <el-card v-else-if="model.state.ui.noRoomBinding" shadow="never">
      <el-empty description="褰撳墠瀛︾敓鏆傛湭缁戝畾瀹胯垗" />
    </el-card>

    <el-card v-else-if="model.state.ui.bootstrapError" shadow="never">
      <el-result icon="error" :title="model.state.ui.bootstrapError" sub-title="请稍后重试">
        <template #extra>
          <el-button type="primary" @click="model.loadBootstrap">閲嶈瘯</el-button>
        </template>
      </el-result>
    </el-card>

    <template v-else>
      <DormitoryCostOverview
        :stat="model.state.stat.data"
        :create-disabled="false"
        create-disabled-text="瀹胯垗鎴愬憳鏁版嵁鏆備笉鍙敤锛屾殏鏃舵棤娉曟柊寤哄叕鎽婂崟"
        @create="model.openCreate"
      />

      <div class="page-layout">
        <DormitoryCostFilters
          :model-value="model.state.filters"
          @query="model.loadList"
          @reset="model.handleReset"
          @update:model-value="model.updateFilters"
        />

        <DormitoryCostTable
          :items="model.state.list.items"
          :total="model.state.list.total"
          :current-page="model.state.filters.pageNum"
          :page-size="model.state.filters.pageSize"
          :loading="model.state.list.loading"
          @select="model.handleSelectCost"
          @update:current-page="model.handlePageChange"
          @update:page-size="model.handlePageSizeChange"
        />
      </div>

      <DormitoryCostDetailDrawer
        :visible="model.state.detail.visible"
        :loading="model.state.detail.loading"
        :detail="model.state.detail.data"
        :publish-loading="model.state.ui.publishLoading"
        :pay-loading="model.state.ui.payLoading"
        :cancel-loading="model.state.ui.cancelLoading"
        :delete-loading="model.state.ui.deleteLoading"
        @close="model.handleCloseDetail"
        @publish="model.handlePublish"
        @pay="model.openPayDialog"
        @cancel="model.handleCancel"
        @delete-draft="model.handleDeleteDraft"
      />

      <DormitoryCostFormDialog
        :visible="model.state.ui.formVisible"
        :mode="model.state.ui.formMode"
        :form="model.state.form"
        :disabled-create="model.state.ui.memberSourceUnavailable"
        @close="model.closeForm"
      />

      <DormitoryCostPayDialog
        :visible="model.state.pay.visible"
        :pay="model.state.pay"
        :uploading="model.state.ui.uploadingPayVoucher"
        :submitting="model.state.ui.payLoading"
        @close="model.closePayDialog"
        @voucher-change="model.handlePayVoucherChange"
        @submit="model.submitPay"
      />
    </template>
  </section>
</template>

<style scoped>
.dormitory-cost-page {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 16px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.page-layout {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}
</style>

