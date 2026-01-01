<script setup>
const tableData = [
  {
    id: 1,
    name: '客户',
    type: '目录',
    routeName: '',
    routePath: '/customer',
    componentPath: 'Layout',
    perm: '',
    status: '启用中',
    sort: 1,
    children: [
      {
        id: 11,
        name: '销售服务',
        type: '菜单',
        routeName: 'SalesService',
        routePath: 'salesService',
        componentPath: 'customer/salesService/index',
        perm: '',
        status: '启用中',
        sort: 1
      },
      {
        id: 12,
        name: '客户管理',
        type: '菜单',
        routeName: 'CustomerManagement',
        routePath: 'customerManagement',
        componentPath: 'customer/customerManagement/index',
        perm: '',
        status: '启用中',
        sort: 2,
        children: [
          {
            id: 121,
            name: '客户建档',
            type: '菜单',
            routeName: 'CustomerCreate',
            routePath: 'customerCreate',
            componentPath: 'project/projectApproval/customerManage/components/index',
            perm: '',
            status: '启用中',
            sort: 2
          },
          {
            id: 122,
            name: '所有客户',
            type: '菜单',
            routeName: 'CustomerPool',
            routePath: 'customerPool',
            componentPath: 'project/projectApproval/customerManage/index',
            perm: '',
            status: '启用中',
            sort: 3
          },
          {
            id: 123,
            name: '我的客户',
            type: '菜单',
            routeName: 'DesignDocu',
            routePath: 'designDocu',
            componentPath: 'project/design/designDocu/index',
            perm: '',
            status: '已停用',
            sort: 1
          }
        ]
      },
      {
        id: 13,
        name: '合同管理',
        type: '菜单',
        routeName: 'Contract',
        routePath: 'contract',
        componentPath: 'project/contract/index',
        perm: '',
        status: '启用中',
        sort: 3
      }
    ]
  },
  {
    id: 2,
    name: '设计',
    type: '目录',
    routeName: '',
    routePath: '/design',
    componentPath: 'Layout',
    perm: '',
    status: '启用中',
    sort: 2
  },
  {
    id: 3,
    name: '项目',
    type: '目录',
    routeName: '',
    routePath: '/project',
    componentPath: 'Layout',
    perm: '',
    status: '启用中',
    sort: 3
  },
  {
    id: 4,
    name: '供应链',
    type: '目录',
    routeName: '',
    routePath: '/supplyChain',
    componentPath: 'Layout',
    perm: '',
    status: '启用中',
    sort: 4
  },
  {
    id: 5,
    name: '财务',
    type: '目录',
    routeName: '',
    routePath: '/finance',
    componentPath: 'Layout',
    perm: '',
    status: '启用中',
    sort: 5
  },
  {
    id: 6,
    name: '人事',
    type: '目录',
    routeName: '',
    routePath: '/hr',
    componentPath: 'Layout',
    perm: '',
    status: '启用中',
    sort: 6
  },
  {
    id: 7,
    name: '报表',
    type: '目录',
    routeName: '',
    routePath: '/reportForm',
    componentPath: 'Layout',
    perm: '',
    status: '启用中',
    sort: 7
  },
  {
    id: 8,
    name: '系统',
    type: '目录',
    routeName: '',
    routePath: '/system',
    componentPath: 'Layout',
    perm: '',
    status: '启用中',
    sort: 8
  },
  {
    id: 9,
    name: '官网',
    type: '目录',
    routeName: '',
    routePath: '/website',
    componentPath: 'Layout',
    perm: '',
    status: '启用中',
    sort: 9
  }
]
</script>

<template>
  <section class="menu-page">

    <el-table
      :data="tableData"
      row-key="id"
      default-expand-all
      border
      class="menu-table"
    >
      <el-table-column prop="name" label="菜单名称" min-width="180" />
      <el-table-column label="类型" width="90">
        <template #default="{ row }">
          <el-tag
            :type="row.type === '目录' ? 'warning' : 'success'"
            effect="light"
          >
            {{ row.type }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="routeName" label="路由名称" min-width="140" />
      <el-table-column prop="routePath" label="路由路径" min-width="160" />
      <el-table-column prop="componentPath" label="组件路径" min-width="220" />
      <el-table-column prop="perm" label="权限标识" min-width="120" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === '启用中' ? 'success' : 'danger'" effect="light">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sort" label="排序ID" width="90" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default>
          <el-button type="primary" link>编辑</el-button>
          <el-button type="primary" link>新增</el-button>
          <el-button type="warning" link>禁用</el-button>
          <el-button type="danger" link>删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<style scoped>
.menu-page {
  display: grid;
  gap: 18px;
}

.menu-header {
  background: #ffffff;
  padding: 24px 28px;
  border-radius: 18px;
  box-shadow: 0 18px 40px rgba(22, 33, 60, 0.08);
}

.menu-header h1 {
  margin: 0 0 8px;
  font-size: 1.6rem;
}

.menu-header p {
  margin: 0;
  color: #5a6a82;
}

.menu-table {
  background: #ffffff;
  border-radius: 18px;
  overflow: hidden;
}
</style>
