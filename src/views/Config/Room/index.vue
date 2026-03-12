<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import AddButton from '../../../components/button/AddButton.vue'
import DeleteLinkButton from '../../../components/button/DeleteLinkButton.vue'
import EditLinkButton from '../../../components/button/EditLinkButton.vue'
import QueryButton from '../../../components/button/QueryButton.vue'
import ConfirmButton from '../../../components/button/ConfirmButton.vue'
import CancelButton from '../../../components/button/CancelButton.vue'
import ResetButton from '../../../components/button/ResetButton.vue'
import SearchInput from '../../../components/list/SearchInput.vue'
import PageList from '../../../components/list/pageList.vue'
import ActionConfirmDialog from '../../../components/item/ActionConfirmDialog.vue'
import {
  addRoom,
  deleteRoom,
  editRoom,
  fetchBuildingList,
  fetchRoomForm,
  fetchRoomList
} from '../../../api/config/room'
import { showError, showSuccess } from '../../../util/message/message'

const keywords = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedBuildingId = ref('')
const addDialogVisible = ref(false)
const addDialogType = ref('building')
const addFormRef = ref(null)
const submitLoading = ref(false)
const isEdit = ref(false)
const editTarget = ref(null)
const actionDialogVisible = ref(false)
const actionType = ref('room')
const actionRow = ref(null)
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

const addDialogTitle = computed(() => {
  if (!isEdit.value) return '新增楼栋/宿舍'
  return addDialogType.value === 'building' ? '编辑楼栋' : '编辑宿舍'
})

const actionDialogMessage = computed(() => {
  const label =
    actionType.value === 'building'
      ? actionRow.value?.buildingNo || actionRow.value?.buildingNum || ''
      : actionRow.value?.roomNum || ''
  return `您确定要删除【${label}】吗？`
})

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

const handleEditBuilding = (building) => {
  if (!building) return
  isEdit.value = true
  addDialogType.value = 'building'
  resetAddForm()
  editTarget.value = { id: building.id || '' }
  loadRoomForm(building.id, 'building')
  addDialogVisible.value = true
  nextTick(() => {
    addFormRef.value?.clearValidate?.()
  })
}

const handleDeleteBuilding = (building) => {
  if (!building) return
  actionType.value = 'building'
  actionRow.value = building
  actionDialogVisible.value = true
}

const handleEditRoom = (row) => {
  if (!row) return
  isEdit.value = true
  addDialogType.value = 'room'
  resetAddForm()
  editTarget.value = { id: row.id || '' }
  loadRoomForm(row.id, 'room')
  addDialogVisible.value = true
  nextTick(() => {
    addFormRef.value?.clearValidate?.()
  })
}

const handleDeleteRoom = (row) => {
  if (!row) return
  actionType.value = 'room'
  actionRow.value = row
  actionDialogVisible.value = true
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
  isEdit.value = false
  editTarget.value = null
  addDialogType.value = 'building'
  resetAddForm()
  addDialogVisible.value = true
  nextTick(() => {
    addFormRef.value?.clearValidate?.()
  })
}

const buildAddPayload = () => {
  const editId = isEdit.value ? editTarget.value?.id || '' : ''
  if (addDialogType.value === 'building') {
    return {
      id: editId,
      parentId: '0000',
      roomNum: addFormModel.value.buildingNo?.trim() ?? '',
      capacity: undefined
    }
  }
  const capacityValue = Number(addFormModel.value.capacity)
  return {
    id: editId,
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
    if (isEdit.value && editTarget.value?.id) {
      await editRoom(editTarget.value.id, payload)
    } else {
      await addRoom(payload)
    }
    showSuccess(isEdit.value ? '编辑成功' : '新增成功')
    addDialogVisible.value = false
    await loadBuildingList()
    await loadRoomList()
  } catch (error) {
    showError(error, isEdit.value ? '编辑失败' : '新增失败')
  } finally {
    submitLoading.value = false
  }
}

const handleDeleteConfirm = async () => {
  const id = actionRow.value?.id
  if (!id) {
    actionDialogVisible.value = false
    return
  }
  try {
    await deleteRoom(id)
    showSuccess('删除成功')
    actionDialogVisible.value = false
    await loadBuildingList()
    await loadRoomList()
  } catch (error) {
    showError(error, '删除失败')
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

const normalizeForm = (payload) => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data || {}
  }
  return payload || {}
}

const loadRoomForm = async (id, type) => {
  if (!id) return
  loading.value = true
  try {
    const response = await fetchRoomForm(id)
    const data = normalizeForm(response)
    if (type === 'building') {
      addFormModel.value.buildingNo = data?.roomNum ?? ''
    } else {
      addFormModel.value.buildingId = data?.parentId ?? ''
      addFormModel.value.roomNo = data?.roomNum ?? ''
      addFormModel.value.capacity = data?.capacity ?? ''
    }
  } catch (error) {
    showError(error, '获取详情失败')
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
        <el-scrollbar class="room-building__list">
          <div
            v-for="building in buildingList"
            :key="building.id"
            class="room-building__item"
            :class="{ 'room-building__item--active': building.id === selectedBuildingId }"
            @click="handleSelectBuilding(building)"
          >
            <span class="room-building__label">{{ building.buildingNo || '-' }}</span>
            <span class="room-building__actions">
              <button
                class="room-building__icon"
                type="button"
                @click.stop="handleEditBuilding(building)"
              >
                <img class="room-building__icon-img" src="../../../assets/button/edit.svg" alt="edit" />
              </button>
              <button
                class="room-building__icon"
                type="button"
                @click.stop="handleDeleteBuilding(building)"
              >
                <img
                  class="room-building__icon-img"
                  src="../../../assets/button/delete.svg"
                  alt="delete"
                />
              </button>
            </span>
          </div>
        </el-scrollbar>
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
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <EditLinkButton @click="handleEditRoom(row)" />
              <DeleteLinkButton @click="handleDeleteRoom(row)" />
            </template>
          </el-table-column>
        </PageList>
      </div>
    </div>

    <el-dialog
      v-model="addDialogVisible"
      width="520px"
      align-center
      :title="addDialogTitle"
      class="room-dialog"
    >
      <el-form ref="addFormRef" :model="addFormModel" :rules="addFormRules" label-width="120px">
        <el-form-item label="类型">
          <el-radio-group v-model="addDialogType" class="room-dialog__type" :disabled="isEdit">
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

    <ActionConfirmDialog
      v-model="actionDialogVisible"
      :message="actionDialogMessage"
      @confirm="handleDeleteConfirm"
    />
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
  flex: 1 1 auto;
  min-height: 0;
}

.room-building__list :deep(.el-scrollbar__view) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.room-building__list :deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}

.room-building__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  background: #ffffff;
  cursor: pointer;
  border-radius: 6px;
}

.room-building__label {
  flex: 1 1 auto;
  min-width: 0;
}

.room-building__actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.room-building__icon {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.room-building__icon-img {
  width: 14px;
  height: 14px;
  display: block;
}

.room-building__item--active {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
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

.room-dialog__type :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #ffffff;
}

.room-dialog__type :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner)::after {
  border-color: var(--el-color-primary);
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
    
