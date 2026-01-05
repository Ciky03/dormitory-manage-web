<script setup>
  import { computed, ref, watch } from 'vue'
  import AddButton from '../../../components/button/AddButton.vue'
  import QueryButton from '../../../components/button/QueryButton.vue'
  import ResetButton from '../../../components/button/ResetButton.vue'
  import SearchInput from '../../../components/list/SearchInput.vue'
  import StatusSelect from '../../../components/list/StatusSelect.vue'
  import PageList from '../../../components/list/pageList.vue'
  import { fetchRolePage } from '../../../api/role'
  
  const keywords = ref('')
  const status = ref('all')
  const currentPage = ref(1)
  const pageSize = ref(10)
  
  const statusOptions = [
    { label: '全部', value: 'all' },
    { label: '启用中', value: 'true' },
    { label: '已禁用', value: 'false' }
  ]
  
  const roleData = ref([])
  const total = ref(0)
  const keywordTimer = ref(null)
  const suppressAutoQuery = ref(false)
  const loading = ref(false)
  
  const tableData = computed(() => roleData.value)

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

  const loadRoles = async () => {
    const query = keywords.value.trim()
    const payload = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }
    if (query) {
      payload.keywords = query
    }
    if (status.value !== 'all') {
      payload.status = status.value
    }
    loading.value = true
    try {
      const data = await fetchRolePage(payload)
      const normalized = normalizePage(data)
      roleData.value = normalized.list
      total.value = normalized.total
    } catch (error) {
      roleData.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }
  
  const handleQuery = () => {
    if (currentPage.value === 1) {
      loadRoles()
      return
    }
    currentPage.value = 1
  }
  
  const handleReset = () => {
    suppressAutoQuery.value = true
    if (keywordTimer.value) {
      clearTimeout(keywordTimer.value)
      keywordTimer.value = null
    }
    keywords.value = ''
    status.value = 'all'
    Promise.resolve().then(() => {
      suppressAutoQuery.value = false
    })
  }
  
  watch(keywords, () => {
    if (suppressAutoQuery.value) {
      return
    }
    if (keywordTimer.value) {
      clearTimeout(keywordTimer.value)
    }
    keywordTimer.value = setTimeout(() => {
      if (currentPage.value === 1) {
        loadRoles()
        return
      }
      currentPage.value = 1
    }, 400)
  })

  watch(status, () => {
    if (suppressAutoQuery.value) {
      return
    }
    if (currentPage.value === 1) {
      loadRoles()
      return
    }
    currentPage.value = 1
  })

  watch([currentPage, pageSize], () => {
    loadRoles()
  }, { immediate: true })
  </script>
  
  <template>
    <section class="role-page" v-loading="loading">
      <div class="role-card role-card--search">
        <div class="role-search">
          <SearchInput
            v-model="keywords"
            label="关键词"
            placeholder="角色名称/角色描述"
            width="100%"
            @enter="handleQuery"
          />
          <StatusSelect
            v-model="status"
            label="启用状态"
            placeholder="全部"
            width="240px"
            :options="statusOptions"
          />
          <div class="role-search__actions">
            <QueryButton @click="handleQuery" />
            <ResetButton @click="handleReset" />
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
        <el-table-column type="index" label="序号" width="60" align="center"/>
        <el-table-column prop="name" label="角色名称" min-width="140" />
        <el-table-column prop="code" label="角色编码" min-width="100" />
        <el-table-column prop="remark" label="角色描述" min-width="280" />
        <el-table-column prop="sort" label="排序ID" width="90" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'info'" effect="light" class="role-tag">
              {{ row.status ? '启用中' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary">编辑</el-button>
            <el-button link type="primary">分配权限</el-button>
            <el-button link type="warning">
              {{ row.status ? '禁用' : '启用' }}
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
  display: flex;
  align-items: center;
  gap: 16px;
}

.role-search > :first-child {
  flex: 1 1 auto;
  min-width: 0;
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
    flex-direction: column;
    align-items: stretch;
  }
    .role-search__actions {
      justify-content: flex-start;
    }
  }
  </style>
  
