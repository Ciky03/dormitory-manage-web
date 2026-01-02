<script setup>
import { onMounted, ref } from 'vue'
import { fetchMenuList } from '../../../api/menu'

const tableData = ref([])
const loading = ref(false)

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

onMounted(loadMenus)
</script>

<template>
  <section class="menu-page">
    <section class="menu-card">
      <div class="menu-card__toolbar">
        <el-button type="primary">新增</el-button>
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
              {{ row.visible ? '启用中' : '已禁用' }}
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
  </section>
</template>

<style scoped>
.menu-page {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.menu-table {
  border-radius: 12px;
  width: 100%;
}

.menu-card {
  background: #ffffff;
  border-radius: 18px;
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
</style>
