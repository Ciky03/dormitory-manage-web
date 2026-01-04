<script setup>
  import { computed, ref, watch } from 'vue'
  import AddButton from '../../../components/button/AddButton.vue'
  import QueryButton from '../../../components/button/QueryButton.vue'
  import SearchInput from '../../../components/SearchInput.vue'
  import StatusSelect from '../../../components/StatusSelect.vue'
  import PageList from '../../../components/page/pageList.vue'
  
  const keyword = ref('')
  const status = ref('all')
  const currentPage = ref(1)
  const pageSize = ref(10)
  
  const statusOptions = [
    { label: '全部', value: 'all' },
    { label: '启用中', value: 'enabled' },
    { label: '已禁用', value: 'disabled' }
  ]
  
  const roleData = ref([
    { id: 1, name: '系统管理员', desc: '', sort: 1, members: 45, enabled: true },
    { id: 2, name: '系统IT管理员', desc: '', sort: 2, members: 7, enabled: true },
    { id: 3, name: '市场专用', desc: '', sort: 3, members: 1, enabled: true },
    { id: 4, name: '财务专用', desc: '', sort: 4, members: 2, enabled: true },
    { id: 5, name: '采购专用', desc: '', sort: 5, members: 1, enabled: true },
    { id: 6, name: '综管专用', desc: '', sort: 6, members: 2, enabled: true },
    { id: 7, name: '销售专用', desc: '', sort: 7, members: 2, enabled: true },
    { id: 8, name: '工程专用', desc: '', sort: 8, members: 4, enabled: true },
    { id: 9, name: '测试人员', desc: '系统专业测试人员使用', sort: 9, members: 4, enabled: true },
    { id: 10, name: '综管部意见流程角色', desc: '', sort: 10, members: 1, enabled: true },
    { id: 11, name: '访客角色', desc: '访客可访问部分页面', sort: 11, members: 2, enabled: false },
    { id: 10, name: '综管部意见流程角色', desc: '', sort: 10, members: 1, enabled: true },
    { id: 11, name: '访客角色', desc: '访客可访问部分页面', sort: 11, members: 2, enabled: false },
    { id: 10, name: '综管部意见流程角色', desc: '', sort: 10, members: 1, enabled: true },
    { id: 11, name: '访客角色', desc: '访客可访问部分页面', sort: 11, members: 2, enabled: false }
  ])
  
  const filteredRoles = computed(() => {
    const query = keyword.value.trim()
    return roleData.value.filter((item) => {
      const matchKeyword =
        !query || item.name.includes(query) || (item.desc && item.desc.includes(query))
      const matchStatus =
        status.value === 'all' ||
        (status.value === 'enabled' && item.enabled) ||
        (status.value === 'disabled' && !item.enabled)
      return matchKeyword && matchStatus
    })
  })
  
  const total = computed(() => filteredRoles.value.length)
  
  const tableData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredRoles.value.slice(start, start + pageSize.value)
  })
  
  const handleQuery = () => {
    currentPage.value = 1
  }
  
  const handleReset = () => {
    keyword.value = ''
    status.value = 'all'
    currentPage.value = 1
  }
  
  watch([keyword, status], () => {
    currentPage.value = 1
  })
  </script>
  
  <template>
    <section class="role-page">
      <div class="role-card role-card--search">
        <div class="role-search">
          <SearchInput
            v-model="keyword"
            label="关键词"
            placeholder="角色名称/角色描述"
            width="520px"
          />
          <StatusSelect
            v-model="status"
            label="启用状态"
            placeholder="全部"
            :options="statusOptions"
          />
          <div class="role-search__actions">
            <QueryButton @click="handleQuery" />
            <el-button @click="handleReset">重置条件</el-button>
          </div>
        </div>
      </div>
  
      <div class="role-toolbar">
        <AddButton />
      </div>
  
      <!-- ✅ 用通用组件替换 role-card--table -->
      <PageList
        :data="tableData"
        :total="total"
        v-model:currentPage="currentPage"
        v-model:pageSize="pageSize"
        :table-props="{ border: true }"
        table-height="100%"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="角色名称" min-width="160" />
        <el-table-column prop="desc" label="角色描述" min-width="280" />
        <el-table-column prop="sort" label="排序ID" width="90" />
        <el-table-column prop="members" label="角色成员（个）" width="140" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" effect="light" class="role-tag">
              {{ row.enabled ? '启用中' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary">编辑</el-button>
            <el-button link type="primary">分配权限</el-button>
            <el-button link type="warning">
              {{ row.enabled ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger">删除</el-button>
          </template>
        </el-table-column>
      </PageList>
    </section>
  </template>
  
  <style scoped>
  .role-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 100%;
    height: 100%;
    overflow: hidden;
  }
  
  .role-card {
    background: #ffffff;
    border-radius: 0;
    box-shadow: none;
  }
  
  .role-card--search {
    padding: 0;
    background: transparent;
    box-shadow: none;
  }
  
  .role-tag {
    padding: 2px 10px;
  }
  
  .role-search {
    display: grid;
    grid-template-columns: minmax(320px, 1.6fr) minmax(220px, 0.8fr) auto;
    align-items: center;
    gap: 16px;
  }
  
  .role-search__actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
  
  .role-toolbar {
    display: flex;
    justify-content: flex-start;
  }
  
  @media (max-width: 1024px) {
    .role-search {
      grid-template-columns: 1fr;
      justify-items: stretch;
    }
    .role-search__actions {
      justify-content: flex-start;
    }
  }
  </style>
  