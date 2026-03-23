<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AddButton from '../../../components/button/AddButton.vue'
import ActionConfirmDialog from '../../../components/item/ActionConfirmDialog.vue'
import CancelButton from '../../../components/button/CancelButton.vue'
import ConfirmButton from '../../../components/button/ConfirmButton.vue'
import DeleteLinkButton from '../../../components/button/DeleteLinkButton.vue'
import EditLinkButton from '../../../components/button/EditLinkButton.vue'
import QueryButton from '../../../components/button/QueryButton.vue'
import ResetButton from '../../../components/button/ResetButton.vue'
import SearchInput from '../../../components/list/SearchInput.vue'
import PageList from '../../../components/list/pageList.vue'
import {
  deleteDormitoryManager,
  deleteStudent,
  deleteTeacher,
  addStudentClassConfig,
  addStudentRoomConfig,
  fetchDormitoryManagerList,
  fetchStudentList,
  fetchTeacherList
} from '../../../api/person'
import { fetchUnitTreeList } from '../../../api/config/class'
import { fetchBuildingList } from '../../../api/config/room'
import { showError, showSuccess } from '../../../util/message/message'

const router = useRouter()
const activeName = ref('student')
const listLoading = ref(false)
const actionDialogVisible = ref(false)
const actionRow = ref(null)
const actionType = ref('student')
const classDialogVisible = ref(false)
const classDialogLoading = ref(false)
const classTreeSource = ref([])
const classSelectedId = ref('')
const classStudentRow = ref(null)
const dormDialogVisible = ref(false)
const dormDialogLoading = ref(false)
const dormTreeSource = ref([])
const dormSelectedId = ref('')
const dormStudentRow = ref(null)
const tabs = [
  { name: 'student', label: '学生' },
  { name: 'teacher', label: '教师' },
  { name: 'dormitory', label: '宿管' }
]

const tabState = ref({
  student: { keywords: '', currentPage: 1, pageSize: 10, list: [], total: 0 },
  teacher: { keywords: '', currentPage: 1, pageSize: 10, list: [], total: 0 },
  dormitory: { keywords: '', currentPage: 1, pageSize: 10, list: [], total: 0 }
})

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

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows
  if (Array.isArray(payload?.data?.list)) return payload.data.list
  return []
}

const mapTreeNodes = (nodes) =>
  (Array.isArray(nodes) ? nodes : []).map((node) => ({
    label: node?.name ?? '',
    value: node?.id ?? '',
    disabled: Number(node?.type) !== 3,
    children: mapTreeNodes(node?.children || [])
  }))

const classTreeData = computed(() => mapTreeNodes(classTreeSource.value))

const mapDormTreeNodes = (nodes) =>
  (Array.isArray(nodes) ? nodes : []).map((node) => ({
    label: node?.roomNum ?? '',
    value: node?.id ?? '',
    disabled: Array.isArray(node?.children) && node.children.length > 0,
    children: mapDormTreeNodes(node?.children || [])
  }))

const dormTreeData = computed(() => mapDormTreeNodes(dormTreeSource.value))

const findSelectedId = (nodes) => {
  const list = Array.isArray(nodes) ? nodes : []
  for (const node of list) {
    if (node?.selected === true && String(node?.id || '') !== '') {
      return String(node.id)
    }
    const childSelected = findSelectedId(node?.children || [])
    if (childSelected) return childSelected
  }
  return ''
}

const treeSelectProps = {
  label: 'label',
  children: 'children',
  value: 'value',
  disabled: 'disabled'
}

const loadList = async (name) => {
  listLoading.value = true
  try {
    const state = tabState.value[name]
    const params = {
      keywords: state.keywords,
      pageNum: state.currentPage,
      pageSize: state.pageSize
    }
    let response
    if (name === 'teacher') {
      response = await fetchTeacherList(params)
    } else if (name === 'dormitory') {
      response = await fetchDormitoryManagerList(params)
    } else {
      response = await fetchStudentList(params)
    }
    const normalized = normalizePage(response)
    state.list = normalized.list
    state.total = normalized.total
  } catch (error) {
    tabState.value[name].list = []
    tabState.value[name].total = 0
    showError(error, '获取列表失败')
  } finally {
    listLoading.value = false
  }
}

const handleQuery = (name) => {
  if (tabState.value[name].currentPage === 1) {
    loadList(name)
    return
  }
  tabState.value[name].currentPage = 1
}

const handleReset = (name) => {
  tabState.value[name].keywords = ''
  if (tabState.value[name].currentPage === 1) {
    loadList(name)
    return
  }
  tabState.value[name].currentPage = 1
}

const handleAdd = (name) => {
  tabState.value[name].currentPage = 1
  router.push({ path: '/config/person/form', query: { type: name } })
}

const handleEdit = (name, row) => {
  if (!row?.id) return
  router.push({ path: '/config/person/form', query: { type: name, id: row.id } })
}

const handleDelete = (name, row) => {
  if (!row?.id) return
  actionType.value = name
  actionRow.value = row
  actionDialogVisible.value = true
}

const handleDeleteConfirm = async () => {
  const id = actionRow.value?.id
  if (!id) {
    actionDialogVisible.value = false
    return
  }
  listLoading.value = true
  try {
    if (actionType.value === 'teacher') {
      await deleteTeacher(id)
    } else if (actionType.value === 'dormitory') {
      await deleteDormitoryManager(id)
    } else {
      await deleteStudent(id)
    }
    showSuccess('删除成功')
    actionDialogVisible.value = false
    await loadList(activeName.value)
  } catch (error) {
    showError(error, '删除失败')
  } finally {
    listLoading.value = false
  }
}

const handleClassConfigOpen = async (row) => {
  classStudentRow.value = { ...(row || {}), type: activeName.value }
  classSelectedId.value = ''
  classDialogVisible.value = true
  classDialogLoading.value = true
  try {
    const response = await fetchUnitTreeList({
      queryAll: true,
      studentId: row?.id ?? ''
    })
    const list = normalizeList(response)
    classTreeSource.value = list
    const selectedId = findSelectedId(list)
    classSelectedId.value = selectedId || ''
  } catch (error) {
    classTreeSource.value = []
    showError(error, '获取班级列表失败')
  } finally {
    classDialogLoading.value = false
  }
}

const handleClassConfigConfirm = () => {
  const studentId = classStudentRow.value?.id
  const classId = classSelectedId.value
  if (!studentId || !classId) {
    showError(null, '请选择班级')
    return
  }
  classDialogLoading.value = true
  addStudentClassConfig({ studentId, classId })
    .then(() => {
      showSuccess('配置成功')
      classDialogVisible.value = false
      return loadList(activeName.value)
    })
    .catch((error) => {
      showError(error, '配置失败')
    })
    .finally(() => {
      classDialogLoading.value = false
    })
}

const handleDormConfigOpen = async (row) => {
  dormStudentRow.value = { ...(row || {}), type: activeName.value }
  dormSelectedId.value = ''
  dormDialogVisible.value = true
  dormDialogLoading.value = true
  try {
    const response = await fetchBuildingList({
      queryAll: true,
      studentId: row?.id ?? ''
    })
    const list = normalizeList(response)
    dormTreeSource.value = list
    const selectedId = findSelectedId(list)
    dormSelectedId.value = selectedId || ''
  } catch (error) {
    dormTreeSource.value = []
    showError(error, '获取宿舍列表失败')
  } finally {
    dormDialogLoading.value = false
  }
}

const handleDormConfigConfirm = () => {
  const studentId = dormStudentRow.value?.id
  const roomId = dormSelectedId.value
  if (!studentId || !roomId) {
    showError(null, '请选择宿舍')
    return
  }
  dormDialogLoading.value = true
  addStudentRoomConfig({ studentId, roomId })
    .then(() => {
      showSuccess('配置成功')
      dormDialogVisible.value = false
      return loadList(activeName.value)
    })
    .catch((error) => {
      showError(error, '配置失败')
    })
    .finally(() => {
      dormDialogLoading.value = false
    })
}

watch(activeName, (name) => {
  loadList(name)
})

watch(
  () => [tabState.value[activeName.value].currentPage, tabState.value[activeName.value].pageSize],
  () => {
    loadList(activeName.value)
  }
)

onMounted(() => {
  loadList(activeName.value)
})
</script>

<template>
  <div class="config-person-page" v-loading="listLoading">
    <el-tabs v-model="activeName" class="person-tabs">
      <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name">
        <div class="person-panel">
          <div class="person-card person-card--search">
            <div class="person-toolbar">
              <AddButton @click="handleAdd(tab.name)">
                + 新增
              </AddButton>
              <SearchInput
                v-model="tabState[tab.name].keywords"
                label="关键字"
                placeholder="用户姓名/学号"
                width="100%"
                @enter="handleQuery(tab.name)"
              />
              <div class="person-toolbar__actions">
                <QueryButton @click="handleQuery(tab.name)" />
                <ResetButton @click="handleReset(tab.name)" />
              </div>
            </div>
          </div>

          <PageList
            :data="tabState[tab.name].list"
            :total="tabState[tab.name].total"
            v-model:currentPage="tabState[tab.name].currentPage"
            v-model:pageSize="tabState[tab.name].pageSize"
            :table-props="{ border: true }"
            table-height="100%"
          >
            <el-table-column type="index" label="序号" width="70" align="center" />
          <template v-if="tab.name === 'student'">
            <el-table-column label="姓名" min-width="120">
              <template #default="{ row }">
                {{ row.realName || '-' }}
              </template>
            </el-table-column>
              <el-table-column label="学号" min-width="140">
                <template #default="{ row }">
                  {{ row.studentNum || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="班级" min-width="160">
                <template #default="{ row }">
                  {{ row.className || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="宿舍" min-width="160">
                <template #default="{ row }">
                  {{ row.roomName || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="入学年份" min-width="120">
                <template #default="{ row }">
                  {{ row.admissionYear ?? '-' }}
                </template>
              </el-table-column>
            <el-table-column label="毕业年份" min-width="120">
              <template #default="{ row }">
                {{ row.graduationYear || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="260" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleClassConfigOpen(row)">
                  班级配置
                </el-button>
                <el-button link type="primary" @click="handleDormConfigOpen(row)">
                  宿舍配置
                </el-button>
                <EditLinkButton @click="handleEdit(tab.name, row)" />
                <DeleteLinkButton @click="handleDelete(tab.name, row)" />
              </template>
            </el-table-column>
          </template>
            <template v-else>
              <el-table-column label="姓名" min-width="140">
                <template #default="{ row }">
                  {{ row.realName || '-' }}
                </template>
              </el-table-column>
              <template v-if="tab.name === 'teacher'">
                <el-table-column label="工号" min-width="140">
                  <template #default="{ row }">
                    {{ row.teacherNum || '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="任教班级" min-width="180">
                  <template #default="{ row }">
                    {{ row.teachingClass || '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="入职日期" min-width="160">
                  <template #default="{ row }">
                    {{ row.entryDate || '-' }}
                  </template>
                </el-table-column>
              </template>
              <template v-else>
                <el-table-column label="工号" min-width="140">
                  <template #default="{ row }">
                    {{ row.dmNum || '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="负责楼栋" min-width="160">
                  <template #default="{ row }">
                    {{ row.building || '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="入职日期" min-width="160">
                  <template #default="{ row }">
                    {{ row.entryDate || '-' }}
                  </template>
                </el-table-column>
              </template>
              <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                  <EditLinkButton @click="handleEdit(tab.name, row)" />
                  <DeleteLinkButton @click="handleDelete(tab.name, row)" />
              </template>
              </el-table-column>
            </template>
          </PageList>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
  <ActionConfirmDialog
    v-model="actionDialogVisible"
    :message="`您确定要删除「${actionRow?.realName || ''}」吗？`"
    @confirm="handleDeleteConfirm"
  />
  <el-dialog
    v-model="classDialogVisible"
    width="520px"
    align-center
    title="班级配置"
    class="person-class-dialog"
  >
    <div v-loading="classDialogLoading">
      <el-tree-select
        v-model="classSelectedId"
        :data="classTreeData"
        :props="treeSelectProps"
        placeholder="请选择班级"
        clearable
        check-strictly
        class="person-class-select"
      />
    </div>
    <template #footer>
      <div class="person-class-dialog__footer">
        <CancelButton @click="classDialogVisible = false" />
        <ConfirmButton @click="handleClassConfigConfirm" />
      </div>
    </template>
  </el-dialog>
  <el-dialog
    v-model="dormDialogVisible"
    width="520px"
    align-center
    title="宿舍配置"
    class="person-class-dialog"
  >
    <div v-loading="dormDialogLoading">
      <el-tree-select
        v-model="dormSelectedId"
        :data="dormTreeData"
        :props="treeSelectProps"
        placeholder="请选择宿舍"
        clearable
        check-strictly
        class="person-class-select"
      />
    </div>
    <template #footer>
      <div class="person-class-dialog__footer">
        <CancelButton @click="dormDialogVisible = false" />
        <ConfirmButton @click="handleDormConfigConfirm" />
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.config-person-page {
  background: #ffffff;
  min-height: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.person-tabs {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.person-tabs :deep(.el-tabs__content) {
  flex: 1 1 auto;
  min-height: 0;
}

.person-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.person-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.person-panel :deep(.table-card) {
  flex: 1 1 auto;
  min-height: 0;
}

.person-card {
  background: #ffffff;
  border-radius: 0;
  box-shadow: none;
}

.person-card--search {
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.person-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
}

.person-toolbar > :first-child {
  flex: 1 1 auto;
  min-width: 0;
}

.person-toolbar__actions {
  display: flex;
  gap: 10px;
}

.person-class-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.person-class-select {
  width: 100%;
}

@media (max-width: 1024px) {
  .person-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .person-toolbar__actions {
    justify-content: flex-start;
  }
}
</style>
