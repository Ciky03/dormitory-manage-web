<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AddButton from '../../../components/button/AddButton.vue'
import QueryButton from '../../../components/button/QueryButton.vue'
import ResetButton from '../../../components/button/ResetButton.vue'
import SearchInput from '../../../components/list/SearchInput.vue'
import PageList from '../../../components/list/pageList.vue'
import { fetchRoleIdByCode } from '../../../api/person'
import { showError } from '../../../util/message/message'

const router = useRouter()
const activeName = ref('student')
const loading = ref(false)
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

const handleQuery = (name) => {
  tabState.value[name].currentPage = 1
}

const handleReset = (name) => {
  tabState.value[name].keywords = ''
  tabState.value[name].currentPage = 1
}

const handleAdd = (name) => {
  tabState.value[name].currentPage = 1
  const roleCode =
    name === 'teacher' ? 'TEACHER' : name === 'dormitory' ? 'DORMITORY_MANAGER' : 'STUDENT'
  loading.value = true
  fetchRoleIdByCode(roleCode)
    .then((roleId) => {
      const normalized = roleId?.data ?? ''
      if (normalized) {
        sessionStorage.setItem('personRoleId', String(normalized))
      } else {
        sessionStorage.removeItem('personRoleId')
      }
    })
    .catch((error) => {
      sessionStorage.removeItem('personRoleId')
      showError(error, '获取角色失败')
    })
    .finally(() => {
      loading.value = false
      router.push({ path: '/config/person/form', query: { type: name } })
    })
}
</script>

<template>
  <div class="config-person-page" v-loading="loading">
    <el-tabs v-model="activeName" class="person-tabs">
      <el-tab-pane v-for="tab in tabs" :key="tab.name" :label="tab.label" :name="tab.name">
        <div class="person-panel">
          <div class="person-card person-card--search">
            <div class="person-toolbar">
              <AddButton :loading="loading" :disabled="loading" @click="handleAdd(tab.name)">
                + 新增
              </AddButton>
              <SearchInput
                v-model="tabState[tab.name].keywords"
                label="关键字"
                placeholder="请输入关键字"
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
                  {{ row.name || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="学号" min-width="140">
                <template #default="{ row }">
                  {{ row.studentNo || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="班级" min-width="160">
                <template #default="{ row }">
                  {{ row.className || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="入学年份" min-width="120">
                <template #default="{ row }">
                  {{ row.entryYear || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="毕业年份" min-width="120">
                <template #default="{ row }">
                  {{ row.graduationYear || '-' }}
                </template>
              </el-table-column>
            </template>
            <template v-else>
              <el-table-column label="姓名" min-width="140">
                <template #default="{ row }">
                  {{ row.name || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="工号" min-width="140">
                <template #default="{ row }">
                  {{ row.jobNo || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="入职时间" min-width="160">
                <template #default="{ row }">
                  {{ row.entryTime || '-' }}
                </template>
              </el-table-column>
            </template>
          </PageList>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
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
