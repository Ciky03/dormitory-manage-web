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
  fetchRoomForm,
  fetchRoomList,
  fetchRoomTreeList
} from '../../../api/config/room'
import { fetchDormitoryManagerList } from '../../../api/person'
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
  capacity: '',
  dmId: '',
  dmName: ''
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

const dmDialogVisible = ref(false)
const dmLoading = ref(false)
const dmKeywords = ref('')
const dmList = ref([])
const dmTotal = ref(0)
const dmPage = ref(1)
const dmPageSize = ref(10)
const dmSelectedId = ref('')
const dmSelectedName = ref('')

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
    capacity: '',
    dmId: '',
    dmName: ''
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
      capacity: undefined,
      dmId: addFormModel.value.dmId || undefined
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
    addFormModel.value.dmId = ''
    addFormModel.value.dmName = ''
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

const loadBuildingList = async (withLoading = true) => {
  if (withLoading) {
    loading.value = true
  }
  try {
    const response = await fetchRoomTreeList()
    const list = normalizeList(response)
    buildingList.value = list.map((item) => ({
      id: item?.id ?? '',
      buildingNo: item?.roomNum ?? item?.name ?? '',
      dmName: item?.dmName ?? item?.dormitoryManagerName ?? item?.managerName ?? ''
    }))
  } catch (error) {
    buildingList.value = []
    showError(error, '获取楼栋列表失败')
  } finally {
    if (withLoading) {
      loading.value = false
    }
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

const loadDormManagerList = async () => {
  dmLoading.value = true
  try {
    const response = await fetchDormitoryManagerList({
      keywords: dmKeywords.value,
      pageNum: dmPage.value,
      pageSize: dmPageSize.value
    })
    const normalized = normalizePage(response)
    dmList.value = normalized.list
    dmTotal.value = normalized.total
  } catch (error) {
    dmList.value = []
    dmTotal.value = 0
    showError(error, '获取宿管列表失败')
  } finally {
    dmLoading.value = false
  }
}

const handleDmDialogOpen = () => {
  dmSelectedId.value = addFormModel.value.dmId || ''
  dmSelectedName.value = addFormModel.value.dmName || ''
  dmPage.value = 1
  dmDialogVisible.value = true
  loadDormManagerList()
}

const handleDmSelect = (row) => {
  if (!row) return
  dmSelectedId.value = row.id || ''
  dmSelectedName.value = row.realName || row.name || ''
}

const handleDmQuery = () => {
  if (dmPage.value === 1) {
    loadDormManagerList()
    return
  }
  dmPage.value = 1
}

const handleDmReset = () => {
  dmKeywords.value = ''
  if (dmPage.value === 1) {
    loadDormManagerList()
    return
  }
  dmPage.value = 1
}

const handleDmDialogConfirm = () => {
  if (!dmSelectedId.value) {
    showError(null, '请选择宿管')
    return
  }
  addFormModel.value.dmId = dmSelectedId.value
  addFormModel.value.dmName = dmSelectedName.value
  dmDialogVisible.value = false
}

const loadRoomList = async (withLoading = true) => {
  if (withLoading) {
    loading.value = true
  }
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
    if (withLoading) {
      loading.value = false
    }
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
      addFormModel.value.dmId = data?.dmId ?? ''
      addFormModel.value.dmName =
        data?.dmName ?? data?.dormitoryManagerName ?? data?.managerName ?? ''
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
  loading.value = true
  Promise.all([loadBuildingList(false), loadRoomList(false)]).finally(() => {
    loading.value = false
  })
})

watch([currentPage, pageSize], () => {
  loadRoomList()
})

watch([dmPage, dmPageSize], () => {
  if (dmDialogVisible.value) {
    loadDormManagerList()
  }
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
            <div class="room-building__info">
              <span class="room-building__label">{{ building.buildingNo || '-' }}</span>
              <span class="room-building__meta">{{ building.dmName || '-' }}</span>
            </div>
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
        <el-form-item
          v-if="addDialogType === 'building'"
          label="楼栋号"
          prop="buildingNo"
          :required="true"
        >
          <el-input v-model="addFormModel.buildingNo" placeholder="请输入楼栋号" />
        </el-form-item>
        <el-form-item v-if="addDialogType === 'building'" label="宿管" prop="dmId">
          <el-input
            v-model="addFormModel.dmName"
            placeholder="请选择宿管"
            readonly
            @click="handleDmDialogOpen"
          />
        </el-form-item>
        <template v-else>
          <el-form-item label="楼栋" prop="buildingId" :required="true">
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
          <el-form-item label="宿舍号" prop="roomNo" :required="true">
            <el-input v-model="addFormModel.roomNo" placeholder="请输入宿舍号" />
          </el-form-item>
          <el-form-item label="可住人数" prop="capacity" :required="true">
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

    <el-dialog
      v-model="dmDialogVisible"
      width="860px"
      align-center
      title="选择宿管"
      class="room-dialog"
    >
      <div class="room-dm-dialog" v-loading="dmLoading">
        <div class="room-dm-dialog__search">
          <SearchInput
            v-model="dmKeywords"
            label="关键字"
            placeholder="宿管姓名/工号"
            width="100%"
            @enter="handleDmQuery"
          />
          <div class="room-dm-dialog__actions">
            <QueryButton @click="handleDmQuery" />
            <ResetButton @click="handleDmReset" />
          </div>
        </div>
        <PageList
          :data="dmList"
          :total="dmTotal"
          v-model:currentPage="dmPage"
          v-model:pageSize="dmPageSize"
          :table-props="{ border: true, onRowClick: handleDmSelect }"
          table-height="100%"
        >
          <el-table-column label="" width="50" align="center">
            <template #default="{ row }">
              <el-radio
                v-model="dmSelectedId"
                :label="row.id"
                class="room-dm-radio"
                @change="handleDmSelect(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="姓名" min-width="140">
            <template #default="{ row }">
              {{ row.realName || row.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="工号" min-width="140">
            <template #default="{ row }">
              {{ row.dmNum || '-' }}
            </template>
          </el-table-column>
        </PageList>
      </div>
      <template #footer>
        <div class="room-dialog__footer">
          <CancelButton @click="dmDialogVisible = false" />
          <ConfirmButton @click="handleDmDialogConfirm" />
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
  width: 280px;
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
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-building__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.room-building__meta {
  font-size: 12px;
  color: #909399;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
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

.room-dm-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 520px;
}

.room-dm-dialog__search {
  display: flex;
  align-items: center;
  gap: 16px;
}

.room-dm-dialog__search > :first-child {
  flex: 1 1 auto;
  min-width: 0;
}

.room-dm-dialog__actions {
  display: flex;
  gap: 10px;
}

.room-dm-radio :deep(.el-radio__label) {
  display: none;
}

.room-dm-dialog :deep(.table-card) {
  flex: 1 1 auto;
  min-height: 0;
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
    

