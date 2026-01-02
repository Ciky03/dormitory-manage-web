<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import AddButton from '../../../components/AddButton.vue'
import CancelButton from '../../../components/CancelButton.vue'
import ConfirmButton from '../../../components/ConfirmButton.vue'
import {
  addMenu,
  deleteMenu,
  editMenu,
  fetchMenuForm,
  fetchMenuList,
  fetchMenuOptions,
  fetchMenuSort,
  updateMenuVisible
} from '../../../api/menu'

const ROOT_PARENT_ID = import.meta.env.VITE_MENU_ROOT_PARENT_ID ?? '0000'

const tableData = ref([])
const loading = ref(false)
const optionsLoading = ref(false)
const submitLoading = ref(false)
const drawerVisible = ref(false)
const drawerTitle = ref('新增菜单')
const isEdit = ref(false)
const currentMenuId = ref('')
const actionDialogVisible = ref(false)
const actionMode = ref('disable')
const actionRow = ref(null)
const formRef = ref(null)
const parentOptions = ref([])

const defaultForm = () => ({
  id: '',
  parentId: ROOT_PARENT_ID,
  name: '',
  type: 2,
  routeName: '',
  routePath: '',
  component: '',
  perm: '',
  visible: true,
  keepAlive: true,
  sort: 1,
  icon: '',
  pitchIcon: ''
})

const formModel = ref(defaultForm())

const formRules = {
  parentId: [{ required: true, message: '父菜单ID不能为空', trigger: 'change' }],
  name: [{ required: true, message: '菜单名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '菜单类型不能为空', trigger: 'change' }],
  routeName: [
    {
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (formModel.value.type === 1 && !value) {
          callback(new Error('路由名称不能为空'))
          return
        }
        callback()
      }
    }
  ],
  routePath: [
    {
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if ((formModel.value.type === 1 || formModel.value.type === 2) && !value) {
          callback(new Error('路由路径不能为空'))
          return
        }
        callback()
      }
    }
  ],
  component: [
    {
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (formModel.value.type === 1 && !value) {
          callback(new Error('组件路径不能为空'))
          return
        }
        callback()
      }
    }
  ],
  perm: [
    {
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (formModel.value.type === 4 && !value) {
          callback(new Error('权限标识不能为空'))
          return
        }
        callback()
      }
    }
  ],
  sort: [
    { required: true, message: '排序不能为空', trigger: 'change' },
    {
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (value === null || value === undefined || value === '') {
          callback(new Error('排序不能为空'))
          return
        }
        const numeric = Number(value)
        if (!Number.isFinite(numeric) || numeric < 0 || numeric > 999) {
          callback(new Error('排序不正确'))
          return
        }
        callback()
      }
    }
  ]
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

const normalizeOptions = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.list)) return payload.data.list
  return []
}

const normalizeForm = (payload) => {
  if (payload?.data && typeof payload.data === 'object') return payload.data
  if (payload && typeof payload === 'object') return payload
  return {}
}

const loadMenus = async () => {
  loading.value = true
  try {
    const data = await fetchMenuList()
    tableData.value = normalizeList(data)
  } catch (error) {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

const loadParentOptions = async () => {
  optionsLoading.value = true
  try {
    const data = await fetchMenuOptions()
    parentOptions.value = [
      { value: ROOT_PARENT_ID, label: '作为一级菜单', children: [] },
      ...normalizeOptions(data)
    ]
  } catch (error) {
    parentOptions.value = [{ value: ROOT_PARENT_ID, label: '作为一级菜单', children: [] }]
  } finally {
    optionsLoading.value = false
  }
}

const resetForm = () => {
  formModel.value = defaultForm()
  currentMenuId.value = ''
}

const loadMenuForm = async (menuId) => {
  const data = await fetchMenuForm(menuId)
  const payload = normalizeForm(data)
  formModel.value = {
    ...defaultForm(),
    ...payload,
    parentId: payload.parentId ?? ROOT_PARENT_ID,
    routeName: payload.routeName ?? '',
    routePath: payload.routePath ?? '',
    component: payload.component ?? '',
    perm: payload.perm ?? '',
    icon: payload.icon ?? '',
    pitchIcon: payload.pitchIcon ?? ''
  }
}

const applySort = async (parentId) => {
  try {
    const data = await fetchMenuSort(parentId)
    const sortValue = data?.data ?? data?.sort ?? data
    if (sortValue !== undefined && sortValue !== null && sortValue !== '') {
      formModel.value.sort = Number(sortValue)
    }
  } catch (error) {
    console.error(error)
  }
}
const handleAdd = async () => {
  isEdit.value = false
  drawerTitle.value = '新增菜单'
  resetForm()
  drawerVisible.value = true
  await loadParentOptions()
  await applySort(ROOT_PARENT_ID)
  await formRef.value?.clearValidate()
}

const handleRowAdd = async (row) => {
  isEdit.value = false
  drawerTitle.value = '新增菜单'
  resetForm()
  const parentId = row?.id ?? ROOT_PARENT_ID
  formModel.value.parentId = parentId
  drawerVisible.value = true
  await loadParentOptions()
  await applySort(parentId)
  await formRef.value?.clearValidate()
}

const handleEdit = async (row) => {
  if (!row?.id) return
  isEdit.value = true
  drawerTitle.value = '编辑菜单'
  currentMenuId.value = row.id
  drawerVisible.value = true
  await loadParentOptions()
  await loadMenuForm(row.id)
  await formRef.value?.clearValidate()
}

const closeDrawer = () => {
  drawerVisible.value = false
}

const openToggleDialog = (row) => {
  actionRow.value = row || null
  actionMode.value = row?.visible ? 'disable' : 'enable'
  actionDialogVisible.value = true
}

const openDeleteDialog = (row) => {
  actionRow.value = row || null
  actionMode.value = 'delete'
  actionDialogVisible.value = true
}

const getActionVerb = () => {
  if (actionMode.value === 'delete') return '删除'
  return actionMode.value === 'disable' ? '禁用' : '启用'
}

const handleToggleConfirm = async () => {
  const row = actionRow.value
  if (!row?.id) {
    actionDialogVisible.value = false
    return
  }
  if (actionMode.value === 'delete') {
    await deleteMenu(row.id)
  } else {
    const visible = actionMode.value === 'enable'
    await updateMenuVisible(row.id, visible)
  }
  actionDialogVisible.value = false
  await loadMenus()
}

const handleConfirm = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  submitLoading.value = true
  try {
    const payload = {
      parentId: formModel.value.parentId,
      name: formModel.value.name,
      type: formModel.value.type,
      routeName: formModel.value.routeName,
      routePath: formModel.value.routePath,
      component: formModel.value.component,
      perm: formModel.value.perm,
      visible: formModel.value.visible,
      sort: formModel.value.sort,
      icon: formModel.value.icon,
      pitchIcon: formModel.value.pitchIcon,
      keepAlive: formModel.value.keepAlive
    }
    if (isEdit.value) {
      const menuId = currentMenuId.value || formModel.value.id
      if (!menuId) {
        throw new Error('menuId is required for edit')
      }
      await editMenu(menuId, payload)
      ElMessage.success('修改成功')
    } else {
      await addMenu(payload)
      ElMessage.success('新增成功')
    }
    drawerVisible.value = false
    await loadMenus()
  } catch (error) {
    console.error(error)
  } finally {
    submitLoading.value = false
  }
}

onMounted(loadMenus)
</script>

<template>
  <div class="menu-card__toolbar">
    <AddButton @click="handleAdd" />
  </div>
  <el-table
    v-loading="loading"
    :data="tableData"
    row-key="id"
    default-expand-all
    border
    class="menu-table"
  >
    <el-table-column prop="name" label="菜单名称" min-width="180" fixed="left" />
    <el-table-column label="类型" width="90">
      <template #default="{ row }">
        <el-tag
          :type="row.type === 2 ? 'warning' : row.type === 1 ? 'success' : 'info'"
          effect="light"
        >
          {{
            row.type === 1
              ? '菜单'
              : row.type === 2
                ? '目录'
                : row.type === 3
                  ? '外链'
                  : row.type === 4
                    ? '按钮'
                    : '-'
          }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="routeName" label="路由名称" min-width="140" />
    <el-table-column prop="routePath" label="路由路径" min-width="160" />
    <el-table-column prop="component" label="组件路径" min-width="220" />
    <el-table-column prop="perm" label="权限标识" min-width="120" />
    <el-table-column label="状态" width="90">
      <template #default="{ row }">
        <el-tag :type="row.visible ? 'success' : 'info'" effect="light">
          {{ row.visible ? '已启用' : '已禁用' }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="sort" label="排序ID" width="90" />
    <el-table-column label="操作" width="200" fixed="right">
      <template #default="{ row }">
        <el-button type="primary" link @click="handleRowAdd(row)">新增</el-button>
        <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
        <el-button
          v-if="row.visible"
          type="warning"
          link
          @click="openToggleDialog(row)"
        >
          禁用
        </el-button>
        <el-button
          v-else
          type="warning"
          link
          @click="openToggleDialog(row)"
        >
          启用
        </el-button>
        <el-button type="danger" link @click="openDeleteDialog(row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
    <el-drawer
      v-model="drawerVisible"
      direction="rtl"
      size="480px"
      :title="drawerTitle"
      :with-header="true"
      class="menu-drawer"
      @close="closeDrawer"
    >
      <template #footer>
        <div class="menu-drawer__footer">
          <ConfirmButton :loading="submitLoading" @click="handleConfirm" />
        </div>
      </template>
      <el-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-width="90px"
        class="menu-form"
      >
        <el-form-item label="父级菜单" prop="parentId">
          <el-tree-select
            v-model="formModel.parentId"
            :data="parentOptions"
            :props="{ label: 'label', value: 'value', children: 'children' }"
            node-key="value"
            clearable
            check-strictly
            :loading="optionsLoading"
            placeholder="作为一级菜单"
            class="menu-field"
          />
        </el-form-item>
        <el-form-item label="菜单名称" prop="name" required>
          <el-input v-model="formModel.name" placeholder="请输入菜单名称" class="menu-field" />
        </el-form-item>
        <el-form-item label="菜单类型" prop="type" required>
          <el-radio-group v-model="formModel.type">
            <el-radio :label="2">目录</el-radio>
            <el-radio :label="1">菜单</el-radio>
            <el-radio :label="4">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="formModel.type === 1">
          <el-form-item label="路由名称" prop="routeName" required>
            <template #label>
              <span class="menu-label">
                路由名称
                <el-tooltip content="路由名称（如：User)" placement="top">
                  <el-icon class="menu-label__icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
            </template>
            <el-input v-model="formModel.routeName" placeholder="User" class="menu-field" />
          </el-form-item>
          <el-form-item label="路由路径" prop="routePath" required>
            <template #label>
              <span class="menu-label">
                路由路径
                <el-tooltip content="定义应用中不同页面对应的 URL 路径，目录需要/ 开头，菜单项不用。例如：系统管理目录 /system，系统管理下的用户管理菜单 user" placement="top">
                  <el-icon class="menu-label__icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
            </template>
            <el-input v-model="formModel.routePath" placeholder="user" class="menu-field" />
          </el-form-item>
          <el-form-item label="组件路径" prop="component" required>
            <template #label>
              <span class="menu-label">
                组件路径
                <el-tooltip content="组件页面完整路径，相对于 src/views/，如 system/user/index，缺省后缀 .vue" placement="top">
                  <el-icon class="menu-label__icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
            </template>
            <div class="menu-component">
              <el-input v-model="formModel.component" placeholder="system/user/index" />
            </div>
          </el-form-item>
      
        </template>
        <el-form-item v-else-if="formModel.type === 2" label="路由路径" prop="routePath" required>
          <template #label>
              <span class="menu-label">
                路由路径
                <el-tooltip content="定义应用中不同页面对应的 URL 路径，目录需要/ 开头，菜单项不用。例如：系统管理目录 /system，系统管理下的用户管理菜单 user" placement="top">
                  <el-icon class="menu-label__icon"><QuestionFilled /></el-icon>
                </el-tooltip>
              </span>
            </template>
          <el-input v-model="formModel.routePath" placeholder="system" class="menu-field" />
        </el-form-item>
        <el-form-item v-if="formModel.type === 1" label="缓存页面">
          <el-radio-group v-model="formModel.keepAlive">
            <el-radio :label="true">开启</el-radio>
            <el-radio :label="false">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="formModel.type === 4">
          <el-form-item label="排序ID" prop="sort">
            <el-input-number v-model="formModel.sort" :min="1" class="menu-number" />
          </el-form-item>
          <el-form-item label="权限标识" prop="perm">
            <el-input v-model="formModel.perm" placeholder="sys:user:add" class="menu-field" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="排序ID" prop="sort">
            <el-input-number v-model="formModel.sort" :min="1" class="menu-number" />
          </el-form-item>
          <el-form-item label="图标">
            <el-input v-model="formModel.icon" placeholder="点击选择图标" class="menu-field" />
          </el-form-item>
          <el-form-item label="选中图标">
            <el-input
              v-model="formModel.pitchIcon"
              placeholder="点击选择图标"
              class="menu-field"
            />
          </el-form-item>
        </template>
      </el-form>
    </el-drawer>
    <el-dialog v-model="actionDialogVisible" title="提示" width="360px" center align-center>
      <p class="menu-dialog__text">
        您确定要{{ getActionVerb() }}【{{ actionRow?.name || '' }}】吗?
      </p>
      <template #footer>
        <div class="menu-dialog__footer">
          <CancelButton @click="actionDialogVisible = false" />
          <ConfirmButton @click="handleToggleConfirm" />
        </div>
      </template>
    </el-dialog>
</template>

<style scoped>
.menu-table {
  border-radius: 6px;
  width: 100%;
}

.menu-card__toolbar {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 12px;
}

.menu-table :deep(.el-table__body-wrapper) {
  overflow-x: auto;
}

.menu-drawer :deep(.el-drawer__body) {
  padding: 12px 20px 16px;
}

.menu-drawer__footer {
  display: flex;
  justify-content: flex-end;
  padding: 0 20px 12px;
}

.menu-form {
  display: grid;
  gap: 4px;
}

.menu-field {
  width: 100%;
}

.menu-number {
  width: 120px;
}

.menu-component {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.menu-component :deep(.el-input__wrapper) {
  width: 100%;
}

.menu-component__prefix,
.menu-component__suffix {
  color: #8c8f99;
  font-size: 12px;
  white-space: nowrap;
}

.menu-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.menu-label__icon {
  color: #909399;
  font-size: 12px;
  cursor: pointer;
}

.menu-form :deep(.el-input__wrapper),
.menu-form :deep(.el-select__wrapper),
.menu-form :deep(.el-textarea__inner),
.menu-form :deep(.el-input-number__decrease),
.menu-form :deep(.el-input-number__increase),
.menu-form :deep(.el-input-number__wrapper) {
  border-radius: 6px;
}

.menu-dialog__text {
  margin: 0;
  color: #303133;
}

.menu-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>






