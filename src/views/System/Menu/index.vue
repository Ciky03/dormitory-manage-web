<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
import AddButton from '../../../components/button/AddButton.vue'
import AddLinkButton from '../../../components/button/AddLinkButton.vue'
import ConfirmButton from '../../../components/button/ConfirmButton.vue'
import DeleteLinkButton from '../../../components/button/DeleteLinkButton.vue'
import EditLinkButton from '../../../components/button/EditLinkButton.vue'
import StatusLinkButton from '../../../components/button/StatusLinkButton.vue'
import List from '../../../components/list/List.vue'
import ActionConfirmDialog from '../../../components/item/ActionConfirmDialog.vue'
import { showError, showSuccess } from '../../../util/message/message'
import {
  addMenu,
  deleteMenu,
  editMenu,
  fetchMenuForm,
  fetchMenuList,
  fetchMenuOptions,
  fetchMenuSort,
  updateMenuVisible
} from '../../../api/system/menu'

const ROOT_PARENT_ID = import.meta.env.VITE_MENU_ROOT_PARENT_ID ?? '0000'

const tableData = ref([])
const loadingCount = ref(0)
const loading = ref(false)
const optionsLoading = ref(false)
const submitLoading = ref(false)
const addLoading = ref(false)
const editLoading = ref(false)
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

const fileIconModules = import.meta.glob('../../../assets/menu-icons/*', {
  eager: true,
  import: 'default'
})

const pitchIconModules = import.meta.glob('../../../assets/menu-pitch-icons/*', {
  eager: true,
  import: 'default'
})

const fileIconOptions = computed(() =>
  Object.keys(fileIconModules).map((path) => {
    const segments = path.split('/')
    const filename = segments[segments.length - 1]
    return { label: filename, value: filename }
  })
)

const pitchIconOptions = computed(() =>
  Object.keys(pitchIconModules).map((path) => {
    const segments = path.split('/')
    const filename = segments[segments.length - 1]
    return { label: filename, value: filename }
  })
)

const fileIconMap = computed(
  () =>
    new Map(
      Object.entries(fileIconModules).map(([path, url]) => {
        const segments = path.split('/')
        const filename = segments[segments.length - 1]
        return [filename, url]
      })
    )
)

const pitchIconMap = computed(
  () =>
    new Map(
      Object.entries(pitchIconModules).map(([path, url]) => {
        const segments = path.split('/')
        const filename = segments[segments.length - 1]
        return [filename, url]
      })
    )
)

const selectedFileIcon = computed(() => {
  const filename = formModel.value.icon
  if (!filename) return null
  return { label: filename, value: fileIconMap.value.get(filename) }
})

const selectedPitchIcon = computed(() => {
  const filename = formModel.value.pitchIcon
  if (!filename) return null
  return { label: filename, value: pitchIconMap.value.get(filename) }
})

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

const withLoading = async (task) => {
  loadingCount.value += 1
  try {
    return await task()
  } finally {
    loadingCount.value -= 1
  }
}

const loadMenus = async () =>
  withLoading(async () => {
    loading.value = true
    try {
      const data = await fetchMenuList()
      tableData.value = normalizeList(data)
    } catch (error) {
      tableData.value = []
    } finally {
      loading.value = false
    }
  })

const loadParentOptions = async () =>
  withLoading(async () => {
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
  })

const resetForm = () => {
  formModel.value = defaultForm()
  currentMenuId.value = ''
}

const loadMenuForm = async (menuId) =>
  withLoading(async () => {
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
  })

const applySort = async (parentId) =>
  withLoading(async () => {
    try {
      const data = await fetchMenuSort(parentId)
      const sortValue = data?.data ?? data?.sort ?? data
      if (sortValue !== undefined && sortValue !== null && sortValue !== '') {
        formModel.value.sort = Number(sortValue)
      }
    } catch (error) {
      console.error(error)
    }
  })
const handleAdd = async () => {
  addLoading.value = true
  try {
    isEdit.value = false
    drawerTitle.value = '新增菜单'
    resetForm()
    await loadParentOptions()
    await applySort(ROOT_PARENT_ID)
    drawerVisible.value = true
    await formRef.value?.clearValidate()
  } finally {
    addLoading.value = false
  }
}

  const handleRowAdd = async (row) => {
    addLoading.value = true
    try {
      isEdit.value = false
      drawerTitle.value = '新增菜单'
      resetForm()
      if (row?.type === 2) {
        formModel.value.type = 1
      } else if (row?.type === 1) {
        formModel.value.type = 4
      }
      const parentId = row?.id ?? ROOT_PARENT_ID
      formModel.value.parentId = parentId
      await loadParentOptions()
      await applySort(parentId)
    drawerVisible.value = true
    await formRef.value?.clearValidate()
  } finally {
    addLoading.value = false
  }
}

const handleEdit = async (row) => {
  if (!row?.id) return
  editLoading.value = true
  try {
    isEdit.value = true
    drawerTitle.value = '编辑菜单'
    currentMenuId.value = row.id
    resetForm()
    await loadParentOptions()
    await loadMenuForm(row.id)
    drawerVisible.value = true
    await nextTick()
    await formRef.value?.clearValidate()
  } finally {
    editLoading.value = false
  }
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

const handleToggleConfirm = async () =>
  withLoading(async () => {
    const row = actionRow.value
    if (!row?.id) {
      actionDialogVisible.value = false
      return
    }
    try {
      if (actionMode.value === 'delete') {
        await deleteMenu(row.id)
        showSuccess('删除成功')
      } else {
        const visible = actionMode.value === 'enable'
        await updateMenuVisible(row.id, visible)
        showSuccess(visible ? '启用成功' : '禁用成功')
      }
      actionDialogVisible.value = false
      await loadMenus()
    } catch (error) {
      showError(error)
    }
  })

const handleConfirm = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  submitLoading.value = true
  await withLoading(async () => {
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
        showSuccess('修改成功')
      } else {
        await addMenu(payload)
        showSuccess('新增成功')
      }
      drawerVisible.value = false
      await loadMenus()
    } catch (error) {
      showError(error)
    } finally {
      submitLoading.value = false
    }
  })
}

onMounted(loadMenus)
</script>

<template>
  <div class="menu-page" v-loading="loadingCount > 0">
    <div class="menu-card__toolbar">
      <AddButton v-permission="'sys:menu:add'" :loading="addLoading" @click="handleAdd" />
    </div>
    <!-- 关键：给表格区域一个可计算的剩余高度 -->
    <div class="menu-table__wrap">
      <List
        :data="tableData"
        :table-props="{
          rowKey: 'id',
          defaultExpandAll: true,
          class: 'menu-table'
        }"
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
            <AddLinkButton v-permission="'sys:menu:add'" @click="handleRowAdd(row)" />
            <EditLinkButton v-permission="'sys:menu:edit'" @click="handleEdit(row)" />
            <StatusLinkButton
              v-if="row.visible"
              v-permission="'sys:menu:edit'"
              :enabled="true"
              @click="openToggleDialog(row)"
            />
            <StatusLinkButton
              v-else
              :enabled="false"
              @click="openToggleDialog(row)"
            />
            <DeleteLinkButton v-permission="'sys:menu:del'" @click="openDeleteDialog(row)" />
          </template>
        </el-table-column>
      </List>
    </div>
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
              <span class="menu-component__prefix">src/views/</span>
              <el-input v-model="formModel.component" placeholder="system/user/index" />
              <span class="menu-component__suffix">.vue</span>
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
            <el-select
              v-model="formModel.icon"
              placeholder="请选择图标"
              class="menu-field"
              filterable
              clearable
            >
              <template #prefix>
                <img
                  v-if="selectedFileIcon"
                  :src="selectedFileIcon.value"
                  :alt="selectedFileIcon.label"
                  class="menu-select__icon"
                />
              </template>
              <el-option
                v-for="item in fileIconOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <span class="menu-icon-option">
                  <img
                    :src="fileIconMap.get(item.value)"
                    :alt="item.label"
                    class="menu-icon-option__img"
                  />
                  <span>{{ item.label }}</span>
                </span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="选中图标">
            <el-select
              v-model="formModel.pitchIcon"
              placeholder="请选择选中图标"
              class="menu-field"
              filterable
              clearable
            >
              <template #prefix>
                <img
                  v-if="selectedPitchIcon"
                  :src="selectedPitchIcon.value"
                  :alt="selectedPitchIcon.label"
                  class="menu-select__icon"
                />
              </template>
              <el-option
                v-for="item in pitchIconOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                <span class="menu-icon-option">
                  <img
                    :src="pitchIconMap.get(item.value)"
                    :alt="item.label"
                    class="menu-icon-option__img"
                  />
                  <span>{{ item.label }}</span>
                </span>
              </el-option>
            </el-select>
          </el-form-item>
        </template>
      </el-form>
    </el-drawer>
    <ActionConfirmDialog
      v-model="actionDialogVisible"
      :message="`您确定要${getActionVerb()}【${actionRow?.name || ''}】吗?`"
      @confirm="handleToggleConfirm"
    />
  </div>
</template>

<style scoped>

.menu-page {
  display: flex;
  flex-direction: column;

  /* 这里用 100%：前提是你的外层布局（layout/content）给了高度。
     如果外层没有高度，你可以把这里改成：height: 100vh; 直接解决。 */
  height: 100%;
  min-height: 0;
}

.menu-table {
  border-radius: 6px;
  width: 100%;
}

.menu-card__toolbar {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 12px;
}

/* 关键：让表格区域吃掉剩余高度 */
.menu-table__wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
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
  gap: 0;
  width: 100%;
}

.menu-component :deep(.el-input__wrapper) {
  width: 100%;
  border-radius: 0;
}

.menu-component__prefix,
.menu-component__suffix {
  display: inline-flex;
  align-items: center;
  padding: 0 10px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  color: #8c8f99;
  font-size: 12px;
  white-space: nowrap;
}

.menu-component__prefix {
  border-right: none;
  border-radius: 6px 0 0 6px;
}

.menu-component__suffix {
  border-left: none;
  border-radius: 0 6px 6px 0;
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


.menu-icon-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.menu-icon-option__img {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.menu-select__icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

</style>
