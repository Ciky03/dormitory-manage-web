<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import AddButton from '../../../components/button/AddButton.vue'
import QueryButton from '../../../components/button/QueryButton.vue'
import ConfirmButton from '../../../components/button/ConfirmButton.vue'
import CancelButton from '../../../components/button/CancelButton.vue'
import ResetButton from '../../../components/button/ResetButton.vue'
import SearchInput from '../../../components/list/SearchInput.vue'
import PageList from '../../../components/list/pageList.vue'
import { addRoom, fetchBuildingList, fetchRoomList } from '../../../api/config/room'
import { showError, showSuccess } from '../../../util/message/message'

const keywords = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedBuildingId = ref('')
const addDialogVisible = ref(false)
const addDialogType = ref('building')
const addFormRef = ref(null)
const submitLoading = ref(false)
const loading = ref(false)
const addFormModel = ref({
  buildingNo: '',
  buildingId: '',
  roomNo: '',
  capacity: ''
})

const buildingList = ref([])
const roomList = ref([])
const total = ref(0)

const addFormRules = computed(() => ({
  buildingNo: [
    {
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (addDialogType.value === 'building' && !String(value || '').trim()) {
          callback(new Error('请输入楼栋号'))
          return
        }
        callback()
      }
    }
  ],
  buildingId: [
    {
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (addDialogType.value === 'room' && !value) {
          callback(new Error('请选择楼栋'))
          return
        }
        callback()
      }
    }
  ],
  roomNo: [
    {
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (addDialogType.value === 'room' && !String(value || '').trim()) {
          callback(new Error('请输入宿舍号'))
          return
        }
        callback()
      }
    }
  ],
  capacity: [
    {
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (addDialogType.value === 'room' && !String(value || '').trim()) {
          callback(new Error('请输入可住人数'))
          return
        }
        callback()
      }
    }
  ]
}))

const tableData = computed(() => roomList.value)

const handleQuery = () => {
  if (currentPage.value === 1) {
    loadRoomList()
    return
  }
  currentPage.value = 1
}

const handleReset = () => {
  keywords.value = ''
  selectedBuildingId.value = ''
  if (currentPage.value === 1) {
    loadRoomList()
    return
  }
  currentPage.value = 1
}

const handleSelectBuilding = (building) => {
  selectedBuildingId.value = building?.id ?? ''
  if (currentPage.value === 1) {
    loadRoomList()
    return
  }
  currentPage.value = 1
}

const resetAddForm = () => {
  addFormModel.value = {
    buildingNo: '',
    buildingId: '',
    roomNo: '',
    capacity: ''
  }
}

const handleAddDialogOpen = () => {
  addDialogType.value = 'building'
  resetAddForm()
  addDialogVisible.value = true
  nextTick(() => {
    addFormRef.value?.clearValidate?.()
  })
}

const buildAddPayload = () => {
  if (addDialogType.value === 'building') {
    return {
      id: '',
      parentId: '0000',
      roomNum: addFormModel.value.buildingNo?.trim() ?? '',
      capacity: undefined
    }
  }
  const capacityValue = Number(addFormModel.value.capacity)
  return {
    id: '',
    parentId: addFormModel.value.buildingId,
    roomNum: addFormModel.value.roomNo?.trim() ?? '',
    capacity: Number.isNaN(capacityValue) ? undefined : capacityValue
  }
}

const handleAddConfirm = async () => {
  try {
    await addFormRef.value?.validate()
  } catch {
    return
  }
  submitLoading.value = true
  try {
    const payload = buildAddPayload()
    await addRoom(payload)
    showSuccess('新增成功')
    addDialogVisible.value = false
    await loadBuildingList()
  } catch (error) {
    showError(error, '新增失败')
  } finally {
    submitLoading.value = false
  }
}

watch(addDialogType, (type) => {
  if (type === 'building') {
    addFormModel.value.buildingId = ''
    addFormModel.value.roomNo = ''
    addFormModel.value.capacity = ''
  } else {
    addFormModel.value.buildingNo = ''
  }
  nextTick(() => {
    addFormRef.value?.clearValidate?.()
  })
})

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows
  if (Array.isArray(payload?.data?.list)) return payload.data.list
  return []
}

const loadBuildingList = async () => {
  loading.value = true
  try {
    const response = await fetchBuildingList()
    const list = normalizeList(response)
    buildingList.value = list.map((item) => ({
      id: item?.key ?? item?.id ?? '',
      buildingNo: item?.value ?? item?.buildingNo ?? item?.name ?? ''
    }))
  } catch (error) {
    buildingList.value = []
    showError(error, '获取楼栋列表失败')
  } finally {
    loading.value = false
  }
}

const normalizePage = (payload) => {
  const data = payload?.data ?? payload ?? {}
  const list =
    data?.list ??
    data?.rows ??
    data?.records ??
    data?.data ??
    (Array.isArray(data) ? data : [])
  const normalizedList = Array.isArray(list) ? list : []
  const normalizedTotal =
    Number(data?.total ?? data?.count ?? normalizedList.length) || 0
  return { list: normalizedList, total: normalizedTotal }
}

const loadRoomList = async () => {
  loading.value = true
  try {
    const response = await fetchRoomList({
      parentId: selectedBuildingId.value,
      keywords: keywords.value,
      pageNum: currentPage.value,
      pageSize: pageSize.value
    })
    const normalized = normalizePage(response)
    roomList.value = normalized.list
    total.value = normalized.total
  } catch (error) {
    roomList.value = []
    total.value = 0
    showError(error, '获取宿舍列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBuildingList()
  loadRoomList()
})

watch([currentPage, pageSize], () => {
  loadRoomList()
})
</script>

<template>
  <section class="room-page" v-loading="loading">
    <div class="room-content">
      <aside class="room-building">
        <div class="room-building__header">
          <AddButton class="room-building__add" size="default" @click="handleAddDialogOpen">
            新增楼栋/宿舍
          </AddButton>
        </div>
        <div class="room-building__list">
          <button
            v-for="building in buildingList"
            :key="building.id"
            type="button"
            class="room-building__item"
            :class="{ 'room-building__item--active': building.id === selectedBuildingId }"
            @click="handleSelectBuilding(building)"
          >
            {{ building.buildingNo || '-' }}
          </button>
        </div>
      </aside>

      <div class="room-main">
        <div class="room-card room-card--search">
          <div class="room-search">
            <SearchInput
              v-model="keywords"
              label="关键字"
              placeholder="宿舍号/楼栋号"
              width="100%"
              @enter="handleQuery"
            />
            <div class="room-search__actions">
              <QueryButton @click="handleQuery" />
              <ResetButton @click="handleReset" />
            </div>
          </div>
        </div>

        <PageList
          :data="tableData"
          :total="total"
          v-model:currentPage="currentPage"
          v-model:pageSize="pageSize"
          :table-props="{ border: true }"
          table-height="100%"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="宿舍号" min-width="140">
            <template #default="{ row }">
              {{ row.roomNum || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="楼栋号" min-width="140">
            <template #default="{ row }">
              {{ row.buildingNum || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="宿舍可住人数" min-width="160">
            <template #default="{ row }">
              {{ row.capacity ?? '-' }}
            </template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="180">
            <template #default="{ row }">
              {{ row.createTime || '-' }}
            </template>
          </el-table-column>
        </PageList>
      </div>
    </div>

    <el-dialog
      v-model="addDialogVisible"
      width="520px"
      align-center
      title="新增楼栋/宿舍"
      class="room-dialog"
    >
      <el-form ref="addFormRef" :model="addFormModel" :rules="addFormRules" label-width="120px">
        <el-form-item label="新增类型">
          <el-radio-group v-model="addDialogType" class="room-dialog__type">
            <el-radio-button label="building">楼栋</el-radio-button>
            <el-radio-button label="room">宿舍</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="addDialogType === 'building'" label="楼栋号" prop="buildingNo">
          <el-input v-model="addFormModel.buildingNo" placeholder="请输入楼栋号" />
        </el-form-item>
        <template v-else>
          <el-form-item label="楼栋" prop="buildingId">
            <el-select
              v-model="addFormModel.buildingId"
              placeholder="请选择楼栋"
              clearable
              class="room-dialog__select"
            >
              <el-option
                v-for="building in buildingList"
                :key="building.id"
                :label="building.buildingNo || '-'"
                :value="building.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="宿舍号" prop="roomNo">
            <el-input v-model="addFormModel.roomNo" placeholder="请输入宿舍号" />
          </el-form-item>
          <el-form-item label="可住人数" prop="capacity">
            <el-input v-model="addFormModel.capacity" placeholder="请输入可住人数" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <div class="room-dialog__footer">
          <CancelButton @click="addDialogVisible = false" />
          <ConfirmButton :loading="submitLoading" @click="handleAddConfirm" />
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.room-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  height: 100%;
  overflow: hidden;
}

.room-content {
  display: flex;
  gap: 16px;
  flex: 1 1 auto;
  min-height: 0;
}

.room-building {
  width: 220px;
  background: #ffffff;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.room-building__header {
  display: flex;
  align-items: center;
}

.room-building__add {
  width: 100%;
}

.room-building__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
}

.room-building__item {
  text-align: left;
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  background: #ffffff;
  cursor: pointer;
  border-radius: 6px;
}

.room-building__item--active {
  border-color: #409eff;
  color: #409eff;
}

.room-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1 1 auto;
  min-width: 0;
}

.room-card {
  background: #ffffff;
  border-radius: 0;
  box-shadow: none;
}

.room-card--search {
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.room-search {
  display: flex;
  align-items: center;
  gap: 16px;
}

.room-search > :first-child {
  flex: 1 1 auto;
  min-width: 0;
}

.room-search__actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

:deep(.room-dialog .el-input__wrapper),
:deep(.room-dialog .el-select__wrapper) {
  border-radius: 6px;
}

.room-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.room-dialog__type {
  display: flex;
  gap: 8px;
}

.room-dialog__select {
  width: 100%;
}

@media (max-width: 1024px) {
  .room-content {
    flex-direction: column;
  }

  .room-building {
    width: 100%;
  }

  .room-search {
    flex-direction: column;
    align-items: stretch;
  }

  .room-search__actions {
    justify-content: flex-start;
  }
}
</style>
    
