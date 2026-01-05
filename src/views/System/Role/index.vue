<script setup>
  import { computed, nextTick, ref, watch } from 'vue'
  import AddButton from '../../../components/button/AddButton.vue'
  import EditLinkButton from '../../../components/button/EditLinkButton.vue'
  import QueryButton from '../../../components/button/QueryButton.vue'
  import ConfirmButton from '../../../components/button/ConfirmButton.vue'
  import ResetButton from '../../../components/button/ResetButton.vue'
  import SearchInput from '../../../components/list/SearchInput.vue'
  import StatusSelect from '../../../components/list/StatusSelect.vue'
  import PageList from '../../../components/list/pageList.vue'
  import ActionConfirmDialog from '../../../components/item/ActionConfirmDialog.vue'
  import { addRole, deleteRole, editRole, fetchRoleForm, fetchRolePage, updateRoleStatus } from '../../../api/role'
  import { showError, showSuccess } from '../../../util/message/message'
  
  const keywords = ref('')
  const status = ref('all')
  const currentPage = ref(1)
  const pageSize = ref(10)
  const dialogVisible = ref(false)
  const dialogTitle = ref('新增角色')
  const isEdit = ref(false)
  const currentRoleId = ref('')
  const formRef = ref(null)
  const formModel = ref({
    name: '',
    code: '',
    remark: '',
    sort: 1,
    dataScope: '0'
  })
  const formRules = {
    name: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
    code: [{ required: true, message: '角色编码不能为空', trigger: 'blur' }],
    sort: [{ required: true, message: '排序ID不能为空', trigger: 'change' }],
    dataScope: [{ required: true, message: '数据权限不能为空', trigger: 'change' }]
  }
  
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
  const submitLoading = ref(false)
  const dialogLoading = ref(false)
  const actionDialogVisible = ref(false)
  const actionMode = ref('disable')
  const actionRow = ref(null)
  
  const tableData = computed(() => roleData.value)

  const normalizeForm = (payload) => {
    if (payload?.data && typeof payload.data === 'object') return payload.data
    if (payload && typeof payload === 'object') return payload
    return {}
  }

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

  const loadRoleForm = async (roleId) => {
    const data = await fetchRoleForm(roleId)
    const payload = normalizeForm(data)
    formModel.value = {
      name: payload.name ?? '',
      code: payload.code ?? '',
      remark: payload.remark ?? '',
      sort: payload.sort ?? 1,
      dataScope: String(payload.dataScope ?? '0')
    }
  }

  const handleEdit = async (row) => {
    if (!row?.id) return
    isEdit.value = true
    currentRoleId.value = row.id
    dialogTitle.value = '编辑角色'
    dialogLoading.value = true
    try {
      await loadRoleForm(row.id)
      dialogVisible.value = true
    } finally {
      dialogLoading.value = false
    }
    await nextTick()
    formRef.value?.clearValidate()
  }

  const handleAdd = () => {
    isEdit.value = false
    currentRoleId.value = ''
    dialogTitle.value = '新增角色'
    formModel.value = {
      name: '',
      code: '',
      remark: '',
      sort: 1,
      dataScope: '0'
    }
    dialogVisible.value = true
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }

  const handleConfirm = async () => {
    try {
      await formRef.value?.validate()
    } catch {
      return
    }
    submitLoading.value = true
    try {
      if (isEdit.value) {
        const roleId = currentRoleId.value
        if (!roleId) {
          throw new Error('roleId is required for edit')
        }
        await editRole(roleId, {
          name: formModel.value.name,
          code: formModel.value.code,
          sort: Number(formModel.value.sort),
          remark: formModel.value.remark,
          dataScope: Number(formModel.value.dataScope)
        })
        showSuccess('编辑成功')
      } else {
        await addRole({
          name: formModel.value.name,
          code: formModel.value.code,
          sort: Number(formModel.value.sort),
          remark: formModel.value.remark,
          dataScope: Number(formModel.value.dataScope)
        })
        showSuccess('新增成功')
      }
      dialogVisible.value = false
      loadRoles()
    } catch (error) {
      showError(error, isEdit.value ? '编辑失败' : '新增失败')
    } finally {
      submitLoading.value = false
    }
  }
  
  const openToggleDialog = (row) => {
    actionRow.value = row || null
    const isEnabled =
      row?.status === true ||
      row?.status === 1 ||
      row?.status === '1' ||
      row?.status === 'true'
    actionMode.value = isEnabled ? 'disable' : 'enable'
    actionDialogVisible.value = true
  }

  const openDeleteDialog = (row) => {
    actionRow.value = row || null
    actionMode.value = 'delete'
    actionDialogVisible.value = true
  }

  const getActionVerb = () => {
    if (actionMode.value === 'delete') return '\u5220\u9664'
    return actionMode.value === 'disable' ? '\u7981\u7528' : '\u542f\u7528'
  }

  const handleToggleConfirm = async () => {
    const row = actionRow.value
    if (!row?.id) {
      actionDialogVisible.value = false
      return
    }
    try {
      if (actionMode.value === 'delete') {
        await deleteRole(row.id)
        showSuccess('\u5220\u9664\u6210\u529f')
      } else {
        const isEnabled =
          row.status === true ||
          row.status === 1 ||
          row.status === '1' ||
          row.status === 'true'
        const nextStatus = isEnabled ? 0 : 1
        await updateRoleStatus(row.id, nextStatus)
        showSuccess(nextStatus ? '\u542f\u7528\u6210\u529f' : '\u7981\u7528\u6210\u529f')
      }
      actionDialogVisible.value = false
      loadRoles()
    } catch (error) {
      showError(error)
    }
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
    <section class="role-page" v-loading="loading || dialogLoading">
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
        <AddButton @click="handleAdd" />
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
            <EditLinkButton @click="handleEdit(row)" />
            <el-button link type="primary">分配权限</el-button>
            <el-button link type="warning" @click="openToggleDialog(row)">
              {{ row.status ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="openDeleteDialog(row)">删除</el-button>
          </template>
        </el-table-column>
      </PageList>

      <el-dialog
        v-model="dialogVisible"
        width="640px"
        align-center
        :title="dialogTitle"
        class="role-dialog"
>
        <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="90px">
          <el-form-item label="角色名称" prop="name">
            <el-input v-model="formModel.name" placeholder="请输入角色名称" />
          </el-form-item>
          <el-form-item label="角色编码" prop="code">
            <el-input v-model="formModel.code" placeholder="请输入角色编码" :disabled="isEdit" />
          </el-form-item>
          <el-form-item label="角色描述">
            <el-input
              v-model="formModel.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入角色描述"
            />
          </el-form-item>
          <el-form-item label="排序ID" prop="sort">
            <el-input-number v-model="formModel.sort" :min="1" />
          </el-form-item>
          <el-form-item label="数据权限" prop="dataScope">
            <el-radio-group v-model="formModel.dataScope">
              <el-radio label="0">所有数据</el-radio>
              <el-radio label="1">楼栋</el-radio>
              <el-radio label="2">宿舍</el-radio>
              <el-radio label="3">学生</el-radio>
              <el-radio label="4">无权限</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="role-dialog__footer">
            <ConfirmButton :loading="submitLoading" @click="handleConfirm" />
          </div>
        </template>
      </el-dialog>

      <ActionConfirmDialog
        v-model="actionDialogVisible"
        :message="`您确定要${getActionVerb()}【${actionRow?.name || ''}】吗?`"
        @confirm="handleToggleConfirm"
      />
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

:deep(.role-dialog .el-input__wrapper),
:deep(.role-dialog .el-textarea__inner),
:deep(.role-dialog .el-input-number__wrapper) {
  border-radius: 6px;
}

:deep(.role-dialog .el-dialog__header){
  padding-left: 12px;
}

.role-dialog__footer {
  display: flex;
  justify-content: flex-end;
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
  
