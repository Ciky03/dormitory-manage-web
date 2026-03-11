<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
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
import { showError, showSuccess } from '../../../util/message/message'
import { addUnit, fetchClassList, fetchUnitTreeList } from '../../../api/config/class'

const keywords = ref('')
const collegeFilter = ref('')
const majorFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const dialogTitle = ref('新增班级')
const isEdit = ref(false)
const formRef = ref(null)
const formModel = ref({
  id: '',
  className: '',
  collegeId: '',
  majorId: '',
  collegeName: '',
  majorName: '',
  createdAt: ''
})
const formRules = {
  className: [{ required: true, message: '班级名称不能为空', trigger: 'blur' }],
  collegeId: [{ required: true, message: '学院名称不能为空', trigger: 'change' }],
  majorId: [{ required: true, message: '专业名称不能为空', trigger: 'change' }]
}

const classData = ref([])
const loading = ref(false)
const submitLoading = ref(false)
const actionDialogVisible = ref(false)
const actionRow = ref(null)
const selectedParentId = ref('')
const total = ref(0)
const addUnitDialogVisible = ref(false)
const addUnitFormRef = ref(null)
const addUnitSubmitLoading = ref(false)
const addUnitFormModel = ref({
  parentId: 'root',
  name: '',
  gradeYear: '',
  headTeacher: '',
  headTeacherId: ''
})

const collegeOptions = ref([])
const majorOptionsMap = ref({})

const treeProps = {
  label: 'label',
  children: 'children'
}

const treeSelectProps = {
  label: 'label',
  children: 'children',
  value: 'value'
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

const treeSource = ref([])

const mapTreeNodes = (nodes, parentId = '') =>
  (Array.isArray(nodes) ? nodes : []).map((node) => ({
    label: node?.name ?? '',
    value: node?.id ?? '',
    type: node?.type ?? null,
    parentId: node?.parentId ?? parentId ?? '',
    children: mapTreeNodes(node?.children || [], node?.id ?? '')
  }))

const treeData = computed(() => mapTreeNodes(treeSource.value))

const treeNodeMap = computed(() => {
  const map = new Map()
  const walk = (nodes) => {
    nodes.forEach((node) => {
      map.set(node.value, node)
      if (Array.isArray(node.children) && node.children.length) {
        walk(node.children)
      }
    })
  }
  walk(treeData.value)
  return map
})

const selectedAddUnitType = computed(() => {
  const parentId = addUnitFormModel.value.parentId
  if (!parentId || parentId === 'root') return null
  const node = treeNodeMap.value.get(parentId)
  return Number(node?.type) || null
})

const addUnitNameLabel = computed(() => {
  if (!selectedAddUnitType.value) return '学院名称'
  if (selectedAddUnitType.value === 1) return '专业名称'
  if (selectedAddUnitType.value === 2) return '班级名称'
  return '名称'
})

const isAddUnitClass = computed(() => selectedAddUnitType.value === 2)

const addUnitFormRules = computed(() => ({
  parentId: [{ required: true, message: '请选择学院/专业', trigger: 'change' }],
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  gradeYear: [
    {
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (isAddUnitClass.value && !value) {
          callback(new Error('年级不能为空'))
          return
        }
        callback()
      }
    }
  ],
  headTeacherId: [
    {
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (isAddUnitClass.value && !value) {
          callback(new Error('班主任不能为空'))
          return
        }
        callback()
      }
    }
  ]
}))

const addUnitTreeData = computed(() => [
  { label: '新增学院', value: 'root', children: [] },
  ...treeData.value
])

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

const tableData = computed(() => classData.value)

const majorOptions = computed(() => {
  const options = majorOptionsMap.value[formModel.value.collegeId]
  return Array.isArray(options) ? options : []
})

const filterMajorOptions = computed(() => {
  if (!collegeFilter.value) {
    return Object.values(majorOptionsMap.value).flat()
  }
  const options = majorOptionsMap.value[collegeFilter.value]
  return Array.isArray(options) ? options : []
})

const resetForm = () => {
  formModel.value = {
    id: '',
    className: '',
    collegeId: '',
    majorId: '',
    collegeName: '',
    majorName: '',
    createdAt: ''
  }
}

const formatNow = () => {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join('-') + ` ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

const getCreatedAt = (row) =>
  row?.createdAt ?? row?.createTime ?? row?.createdTime ?? ''

const getClassDisplayName = (row) => {
  const className = row?.className ?? ''
  const gradeYear = row?.gradeYear ?? ''
  const value = `${gradeYear}${className}`.trim()
  return value || '-'
}

const handleQuery = () => {
  if (currentPage.value === 1) {
    loadClassList()
    return
  }
  currentPage.value = 1
}

const handleReset = () => {
  keywords.value = ''
  collegeFilter.value = ''
  majorFilter.value = ''
  if (currentPage.value === 1) {
    loadClassList()
    return
  }
  currentPage.value = 1
}

const handleTreeNodeClick = (node) => {
  selectedParentId.value = node?.value ?? ''
  const nodeType = Number(node?.type)
  if (nodeType === 1 || node?.type === 'college') {
    collegeFilter.value = node.value
    majorFilter.value = ''
  } else if (nodeType === 2 || node?.type === 'major') {
    collegeFilter.value = node.parentId || ''
    majorFilter.value = node.value
  } else if (nodeType === 3) {
    majorFilter.value = node.parentId || ''
    const parentNode = treeNodeMap.value.get(node.parentId)
    collegeFilter.value = parentNode?.parentId || ''
  } else {
    collegeFilter.value = ''
    majorFilter.value = ''
  }
  if (currentPage.value === 1) {
    loadClassList()
    return
  }
  currentPage.value = 1
}

const handleTreeEdit = () => {
  // Placeholder for tree edit behavior.
}

const handleTreeDelete = () => {
  // Placeholder for tree delete behavior.
}

const syncOptionsFromTree = (nodes) => {
  const colleges = []
  const majorsMap = {}
  nodes.forEach((node) => {
    if (Number(node?.type) !== 1) return
    const collegeId = node?.id ?? ''
    if (!collegeId) return
    colleges.push({ label: node?.name ?? '', value: collegeId })
    const majors = Array.isArray(node?.children) ? node.children : []
    majorsMap[collegeId] = majors
      .filter((child) => Number(child?.type) === 2)
      .map((child) => ({ label: child?.name ?? '', value: child?.id ?? '' }))
  })
  if (colleges.length) {
    collegeOptions.value = colleges
    majorOptionsMap.value = majorsMap
  }
}

const loadTreeData = async () => {
  loading.value = true
  try {
    const response = await fetchUnitTreeList()
    const list = normalizeList(response)
    if (list.length) {
      treeSource.value = list
      syncOptionsFromTree(list)
    }
  } catch (error) {
    showError(error?.message || '获取树数据失败')
  } finally {
    loading.value = false
  }
}

const loadClassList = async () => {
  if (!selectedParentId.value) {
    classData.value = []
    total.value = 0
    return
  }
  loading.value = true
  try {
    const response = await fetchClassList({
      parentId: selectedParentId.value,
      keywords: keywords.value,
      pageNum: currentPage.value,
      pageSize: pageSize.value
    })
    const normalized = normalizePage(response)
    classData.value = normalized.list
    total.value = normalized.total
  } catch (error) {
    classData.value = []
    total.value = 0
    showError(error?.message || '获取班级列表失败')
  } finally {
    loading.value = false
  }
}

const resetAddUnitForm = () => {
  addUnitFormModel.value = {
    parentId: 'root',
    name: '',
    gradeYear: '',
    headTeacher: '',
    headTeacherId: ''
  }
}

const handleAddUnit = () => {
  resetAddUnitForm()
  addUnitDialogVisible.value = true
  nextTick(() => {
    addUnitFormRef.value?.clearValidate()
  })
  loadTreeData()
}

const buildAddUnitPayload = () => {
  const selectedParentId = addUnitFormModel.value.parentId
  if (!selectedParentId || selectedParentId === 'root') {
    return {
      id: '',
      parentId: '0000',
      eduType: 1,
      name: addUnitFormModel.value.name?.trim() ?? '',
      gradeYear: addUnitFormModel.value.gradeYear || undefined,
      headTeacherId: addUnitFormModel.value.headTeacherId || '',
      headTeacher: addUnitFormModel.value.headTeacher || ''
    }
  }
  const parentNode = treeNodeMap.value.get(selectedParentId)
  const parentType = Number(parentNode?.type)
  if (parentType !== 1 && parentType !== 2) {
    return null
  }
  return {
    id: '',
    parentId: selectedParentId,
    eduType: parentType === 1 ? 2 : 3,
    name: addUnitFormModel.value.name?.trim() ?? '',
    gradeYear: addUnitFormModel.value.gradeYear || undefined,
    headTeacherId: addUnitFormModel.value.headTeacherId || '',
    headTeacher: addUnitFormModel.value.headTeacher || ''
  }
}

const handleAddUnitConfirm = async () => {
  try {
    await addUnitFormRef.value?.validate()
  } catch {
    return
  }
  const payload = buildAddUnitPayload()
  if (!payload) {
    showError('请选择学院或专业')
    return
  }
  addUnitSubmitLoading.value = true
  try {
    await addUnit(payload)
    showSuccess('新增成功')
    addUnitDialogVisible.value = false
    await loadTreeData()
    if (selectedParentId.value) {
      await loadClassList()
    }
  } catch (error) {
    showError(error, '新增失败')
  } finally {
    addUnitSubmitLoading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增班级'
  resetForm()
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const handleEdit = (row) => {
  if (!row) return
  isEdit.value = true
  dialogTitle.value = '编辑班级'
  const collegeId =
    collegeOptions.value.find((option) => option.label === row.collegeName)?.value ?? ''
  const majorId =
    majorOptionsMap.value[collegeId]?.find((option) => option.label === row.majorName)?.value ?? ''
  formModel.value = {
    id: row.id ?? '',
    className: row.className ?? '',
    collegeId,
    majorId,
    collegeName: row.collegeName ?? '',
    majorName: row.majorName ?? '',
    createdAt: getCreatedAt(row)
  }
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const openDeleteDialog = (row) => {
  actionRow.value = row || null
  actionDialogVisible.value = true
}

const handleDeleteConfirm = () => {
  const row = actionRow.value
  if (!row) {
    actionDialogVisible.value = false
    return
  }
  classData.value = classData.value.filter((item) => item.id !== row.id)
  actionDialogVisible.value = false
  showSuccess('删除成功')
}

const handleConfirm = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  submitLoading.value = true
  try {
    const selectedCollege =
      collegeOptions.value.find((option) => option.value === formModel.value.collegeId) ?? null
    const selectedMajor =
      majorOptions.value.find((option) => option.value === formModel.value.majorId) ?? null
    const collegeName = selectedCollege?.label ?? ''
    const majorName = selectedMajor?.label ?? ''
    if (isEdit.value) {
      classData.value = classData.value.map((item) => {
        if (item.id !== formModel.value.id) return item
        return {
          ...item,
          className: formModel.value.className,
          collegeName,
          majorName
        }
      })
      showSuccess('编辑成功')
    } else {
      classData.value = [
        ...classData.value,
        {
          id: String(Date.now()),
          className: formModel.value.className,
          collegeName,
          majorName,
          createdAt: formatNow()
        }
      ]
      showSuccess('新增成功')
    }
    dialogVisible.value = false
  } finally {
    submitLoading.value = false
  }
}

const ensurePageInRange = () => {
  const totalPages = Math.max(1, Math.ceil(total.value / pageSize.value))
  if (currentPage.value > totalPages) {
    currentPage.value = totalPages
  }
}

watch([currentPage, pageSize], () => {
  loadClassList()
})
watch([total, pageSize], ensurePageInRange)
watch(collegeFilter, () => {
  majorFilter.value = ''
})
watch(
  () => formModel.value.collegeId,
  () => {
    formModel.value.majorId = ''
  }
)
watch(selectedAddUnitType, (type) => {
  if (type !== 2) {
    addUnitFormModel.value.gradeYear = ''
    addUnitFormModel.value.headTeacherId = ''
  }
  nextTick(() => {
    addUnitFormRef.value?.clearValidate?.(['gradeYear', 'headTeacherId'])
  })
})

onMounted(() => {
  loadTreeData()
})
</script>

<template>
  <section class="class-page" v-loading="loading">
    <div class="class-content">
      <aside class="class-tree">
        <div class="class-tree__header">
          <AddButton class="class-tree__add" size="default" @click="handleAddUnit">新增学院/专业/班级</AddButton>
        </div>
        <el-tree
          class="class-tree__body"
          :data="treeData"
          :props="treeProps"
          node-key="value"
          default-expand-all
          highlight-current
          @node-click="handleTreeNodeClick"
        >
          <template #default="{ data }">
            <div class="class-tree__node">
              <span class="class-tree__label">{{ data.label }}</span>
              <span class="class-tree__actions">
                <button class="class-tree__icon" type="button" @click.stop="handleTreeEdit(data)">
                  <img
                    class="class-tree__icon-img"
                    src="../../../assets/button/edit.svg"
                    alt="edit"
                  />
                </button>
                <button class="class-tree__icon" type="button" @click.stop="handleTreeDelete(data)">
                  <img
                    class="class-tree__icon-img"
                    src="../../../assets/button/delete.svg"
                    alt="delete"
                  />
                </button>
              </span>
            </div>
          </template>
        </el-tree>
      </aside>

      <div class="class-main">
        <div class="class-card class-card--search">
          <div class="class-search">
            <SearchInput
              v-model="keywords"
              label="关键字"
              placeholder="班级名称/学院名称/专业名称"
              width="100%"
              @enter="handleQuery"
            />
            <div class="class-search__actions">
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
          <el-table-column label="班级名称" min-width="160">
            <template #default="{ row }">
              {{ getClassDisplayName(row) }}
            </template>
          </el-table-column>
          <el-table-column label="学院名称" min-width="160">
            <template #default="{ row }">
              {{ row.collegeName || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="专业名称" min-width="160">
            <template #default="{ row }">
              {{ row.majorName || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="180">
            <template #default="{ row }">
              {{ getCreatedAt(row) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <EditLinkButton @click="handleEdit(row)" />
              <DeleteLinkButton @click="openDeleteDialog(row)" />
            </template>
          </el-table-column>
        </PageList>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      width="520px"
      align-center
      :title="dialogTitle"
      class="class-dialog"
    >
      <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="120px">
        <el-form-item label="班级名称" prop="className">
          <el-input v-model="formModel.className" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="学院名称" prop="collegeId">
          <el-select
            v-model="formModel.collegeId"
            placeholder="请选择学院"
            filterable
            clearable
            class="class-select"
          >
            <el-option
              v-for="option in collegeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="专业名称" prop="majorId">
          <el-select
            v-model="formModel.majorId"
            placeholder="请选择专业"
            filterable
            clearable
            class="class-select"
          >
            <el-option
              v-for="option in majorOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="class-dialog__footer">
          <ConfirmButton :loading="submitLoading" @click="handleConfirm" />
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="addUnitDialogVisible"
      width="640px"
      align-center
      title="新增学院/专业/班级"
      class="class-dialog"
    >
      <el-form
        ref="addUnitFormRef"
        :model="addUnitFormModel"
        :rules="addUnitFormRules"
        label-width="160px"
      >
        <el-form-item label="所属学院/专业" prop="parentId">
          <el-tree-select
            v-model="addUnitFormModel.parentId"
            :data="addUnitTreeData"
            :props="treeSelectProps"
            placeholder="请选择学院/专业"
            clearable
            check-strictly
            class="class-select"
          />
        </el-form-item>
        <el-form-item :label="addUnitNameLabel" prop="name">
          <el-input
            v-model="addUnitFormModel.name"
            :placeholder="`请输入${addUnitNameLabel}`"
          />
        </el-form-item>
        <el-form-item prop="gradeYear" :required="isAddUnitClass">
          <template #label>
            <span class="class-dialog__label">
              年级
              <el-tooltip content="学院/专业不需要填写" placement="top">
                <el-icon class="class-dialog__hint">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-input
            v-model="addUnitFormModel.gradeYear"
            placeholder="请输入年级"
            :disabled="!isAddUnitClass"
          />
        </el-form-item>
        <el-form-item prop="headTeacherId" :required="isAddUnitClass">
          <template #label>
            <span class="class-dialog__label">
              班主任
              <el-tooltip content="学院/专业不需要填写" placement="top">
                <el-icon class="class-dialog__hint">
                  <QuestionFilled />
                </el-icon>
              </el-tooltip>
            </span>
          </template>
          <el-input
            v-model="addUnitFormModel.headTeacherId"
            placeholder="请选择班主任"
            :disabled="!isAddUnitClass"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="class-dialog__footer">
          <CancelButton @click="addUnitDialogVisible = false" />
          <ConfirmButton :loading="addUnitSubmitLoading" @click="handleAddUnitConfirm" />
        </div>
      </template>
    </el-dialog>

    <ActionConfirmDialog
      v-model="actionDialogVisible"
      :message="`您确定要删除班级「${actionRow?.className || ''}」吗？`"
      @confirm="handleDeleteConfirm"
    />
  </section>
</template>

<style scoped>
.class-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
  height: 100%;
  overflow: hidden;
}

.class-content {
  display: flex;
  gap: 16px;
  flex: 1 1 auto;
  min-height: 0;
}

.class-tree {
  width: 260px;
  background: #ffffff;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.class-tree__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.class-tree__add {
  width: calc(100% - 8px);
}

.class-tree__body {
  flex: 1 1 auto;
  overflow: auto;
}

.class-tree__body :deep(.el-tree-node__content) {
  min-height: 36px;
}

.class-tree__node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.class-tree__label {
  flex: 1 1 auto;
  min-width: 0;
}

.class-tree__actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.class-tree__icon {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.class-tree__icon-img {
  width: 14px;
  height: 14px;
  display: block;
}

.class-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1 1 auto;
  min-width: 0;
}

.class-card {
  background: #ffffff;
  border-radius: 0;
  box-shadow: none;
}

.class-card--search {
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.class-search {
  display: flex;
  align-items: center;
  gap: 16px;
}

.class-search > :first-child {
  flex: 1 1 auto;
  min-width: 0;
}

.class-search__actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

:deep(.class-dialog .el-input__wrapper),
:deep(.class-dialog .el-textarea__inner),
:deep(.class-dialog .el-input-number__wrapper) {
  border-radius: 6px;
}

:deep(.class-dialog .el-dialog__header) {
  padding-left: 12px;
}

.class-dialog__footer {
  display: flex;
  justify-content: flex-end;
}

.class-dialog__hint {
  color: #909399;
  cursor: pointer;
}

.class-select {
  width: 100%;
}

@media (max-width: 1024px) {
  .class-content {
    flex-direction: column;
  }
  .class-tree {
    width: 100%;
  }
  .class-search {
    flex-direction: column;
    align-items: stretch;
  }
  .class-search__actions {
    justify-content: flex-start;
  }
}
</style>
