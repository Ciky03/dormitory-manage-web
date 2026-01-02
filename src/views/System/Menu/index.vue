<script setup>
import { onMounted, ref } from 'vue'
import { fetchMenuList } from '../../../api/menu'

const tableData = ref([])
const loading = ref(false)
const drawerVisible = ref(false)
const formRef = ref(null)
const formModel = ref({
  parentId: 0,
  name: '',
  type: 2,
  routeName: '',
  routePath: '',
  component: '',
  perm: '',
  visible: true,
  cache: true,
  sort: 1,
  icon: '',
  selectedIcon: ''
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

const handleAdd = () => {
  drawerVisible.value = true
}

const closeDrawer = () => {
  drawerVisible.value = false
}

onMounted(loadMenus)
</script>

<template>
  <section class="menu-page">
    <section class="menu-card">
      <div class="menu-card__toolbar">
        <el-button type="primary" @click="handleAdd">新增</el-button>
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
              {{ row.visible ? '启用' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序ID" width="90" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default>
            <el-button type="primary" link>新增</el-button>
            <el-button type="primary" link>编辑</el-button>
            <el-button type="warning" link>禁用</el-button>
            <el-button type="danger" link>删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
    <el-drawer
      v-model="drawerVisible"
      direction="rtl"
      size="480px"
      title="新增菜单"
      :with-header="true"
      class="menu-drawer"
      @close="closeDrawer"
    >
      <el-form ref="formRef" :model="formModel" label-width="90px" class="menu-form">
        <el-form-item label="父级菜单">
          <el-select v-model="formModel.parentId" placeholder="作为一级菜单" class="menu-field">
            <el-option :value="0" label="作为一级菜单" />
          </el-select>
        </el-form-item>
        <el-form-item label="菜单名称" required>
          <el-input v-model="formModel.name" placeholder="请输入菜单名称" class="menu-field" />
        </el-form-item>
        <el-form-item label="菜单类型" required>
          <el-radio-group v-model="formModel.type">
            <el-radio :label="2">目录</el-radio>
            <el-radio :label="1">菜单</el-radio>
            <el-radio :label="4">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="formModel.type === 1">
          <el-form-item label="路由名称" required>
            <el-input v-model="formModel.routeName" placeholder="User" class="menu-field" />
          </el-form-item>
          <el-form-item label="路由路径" required>
            <el-input v-model="formModel.routePath" placeholder="user" class="menu-field" />
          </el-form-item>
          <el-form-item label="组件路径" required>
            <div class="menu-component">
              <el-input v-model="formModel.component" placeholder="system/user/index" />
            </div>
          </el-form-item>
        </template>
        <el-form-item v-else-if="formModel.type === 2" label="路由路径" required>
          <el-input v-model="formModel.routePath" placeholder="system" class="menu-field" />
        </el-form-item>
        <el-form-item v-if="formModel.type === 1" label="缓存页面">
          <el-radio-group v-model="formModel.cache">
            <el-radio :label="true">开启</el-radio>
            <el-radio :label="false">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="formModel.type === 4">
          <el-form-item label="排序ID">
            <el-input-number v-model="formModel.sort" :min="1" class="menu-number" />
          </el-form-item>
          <el-form-item label="权限标识">
            <el-input v-model="formModel.perm" placeholder="sys:user:add" class="menu-field" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="排序ID">
            <el-input-number v-model="formModel.sort" :min="1" class="menu-number" />
          </el-form-item>
          <el-form-item label="图标">
            <el-input v-model="formModel.icon" placeholder="点击选择图标" class="menu-field" />
          </el-form-item>
          <el-form-item label="选中图标">
            <el-input
              v-model="formModel.selectedIcon"
              placeholder="点击选择图标"
              class="menu-field"
            />
          </el-form-item>
        </template>
      </el-form>
    </el-drawer>
  </section>
</template>

<style scoped>
.menu-page {
  display: grid;
  gap: 12px;
  padding: 12px;
  min-height: 100%;
  width: 100%;
  box-sizing: border-box;
}

.menu-table {
  border-radius: 6px;
  width: 100%;
}

.menu-card {
  background: #ffffff;
  border-radius: 10px;
  padding: 16px 18px 18px;
  box-shadow: 0 18px 40px rgba(22, 33, 60, 0.08);
  overflow: hidden;
}

.menu-card__toolbar {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 12px;
}

.menu-card :deep(.el-table__body-wrapper) {
  overflow-x: auto;
}

.menu-drawer :deep(.el-drawer__body) {
  padding: 12px 20px 16px;
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
</style>
