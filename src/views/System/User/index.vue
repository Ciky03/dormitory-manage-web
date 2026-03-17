<script setup>
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import AddButton from '../../../components/button/AddButton.vue'
  import DeleteLinkButton from '../../../components/button/DeleteLinkButton.vue'
  import EditLinkButton from '../../../components/button/EditLinkButton.vue'
  import QueryButton from '../../../components/button/QueryButton.vue'
  import ConfirmButton from '../../../components/button/ConfirmButton.vue'
  import ResetButton from '../../../components/button/ResetButton.vue'
  import StatusLinkButton from '../../../components/button/StatusLinkButton.vue'
  import SearchInput from '../../../components/list/SearchInput.vue'
  import StatusSelect from '../../../components/list/StatusSelect.vue'
  import PageList from '../../../components/list/pageList.vue'
  import ActionConfirmDialog from '../../../components/item/ActionConfirmDialog.vue'
  import { fetchRoleOptions } from '../../../api/system/role'
  import { addUser, deleteUser, editUser, fetchUserForm, fetchUserPage, resetUserPassword, updateUserStatus } from '../../../api/system/user'
  import { showError, showSuccess } from '../../../util/message/message'
  
  const keywords = ref('')
  const status = ref('all')
  const currentPage = ref(1)
  const pageSize = ref(10)
  const dialogVisible = ref(false)
  const dialogTitle = ref('新增用户')
  const isEdit = ref(false)
  const currentUserId = ref('')
  const formRef = ref(null)
  const formModel = ref({
    id: '',
    username: '',
    realName: '',
    password: '',
    confirmPassword: '',
    phone: '',
    email: '',
    roleIds: []
  })
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  const formRules = computed(() => ({
    username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
    phone: [{ required: true, message: '手机号不能为空', trigger: 'blur' }],
    email: [],
    password: [
      {
        validator: (rule, value, callback) => {
          if (!value) {
            if (!isEdit.value) {
              return callback(new Error('密码不能为空'))
            }
            return callback()
          }
          if (!passwordPattern.test(value)) {
            return callback(new Error('密码至少包含大小写字母和数字，长度至少为8位'))
          }
          callback()
        },
        trigger: 'blur'
      }
    ],
    confirmPassword: [
      {
        validator: (rule, value, callback) => {
          if (!value && !formModel.value.password) {
            if (!isEdit.value) {
              return callback(new Error('确认密码不能为空'))
            }
            return callback()
          }
          if (!passwordPattern.test(value || '')) {
            return callback(new Error('密码至少包含大小写字母和数字，长度至少为8位'))
          }
          if (value !== formModel.value.password) {
            return callback(new Error('两次输入的密码不一致'))
          }
          callback()
        },
        trigger: 'blur'
      }
    ]
  }))
  
  const statusOptions = [
    { label: '全部', value: 'all' },
    { label: '启用中', value: 'true' },
    { label: '已禁用', value: 'false' }
  ]
  
  const roleOptions = ref([])
  const userData = ref([])
  const total = ref(0)
  const keywordTimer = ref(null)
  const suppressAutoQuery = ref(false)
  const loading = ref(false)
  const submitLoading = ref(false)
  const dialogLoading = ref(false)
  const actionDialogVisible = ref(false)
  const actionMode = ref('disable')
  const actionRow = ref(null)
  
  const tableData = computed(() => userData.value)
  
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

  const normalizeOptions = (payload) => {
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.list)) return payload.list
    if (Array.isArray(payload?.data)) return payload.data
    if (Array.isArray(payload?.data?.list)) return payload.data.list
    return []
  }

  const normalizeRoleIds = (roleIds) =>
    Array.isArray(roleIds) ? roleIds.map((id) => String(id)) : []

  const normalizeRoleOptions = (options) =>
    options
      .map((option) => {
        if (option === null || option === undefined) return null
        if (typeof option !== 'object') {
          const value = String(option)
          return { label: value, value }
        }
        const rawValue = option.value ?? option.id ?? option.code ?? option.key
        const value = rawValue === undefined || rawValue === null ? '' : String(rawValue)
        const label = option.label ?? option.name ?? option.roleName ?? value
        return { ...option, value, label }
      })
      .filter((option) => option && option.value !== '')
  
  const formatRoleLabel = (roles) => {
    if (!Array.isArray(roles)) return ''
    const labels = roles
      .map((role) => role?.name ?? role?.roleNames ?? role?.label ?? role)
      .filter(Boolean)
    return labels.join('、')
  }
  
  const getDisplayName = (row) =>
    row?.name ?? row?.realName ?? row?.username ?? ''

  const getUsername = (row) =>
    row?.username ?? row?.userName ?? row?.loginName ?? ''

  const getPhone = (row) => row?.phone ?? row?.mobile ?? row?.tel ?? ''
  
  const getRoleLabel = (row) => {
    if (!row) return ''
    if (Array.isArray(row.roles)) return formatRoleLabel(row.roles)
    return row.roleNames ?? row.role ?? ''
  }
  
  const getRowId = (row) => row?.id ?? row?.userId ?? ''
  
  const isEnabled = (row) => {
    const value = row?.status ?? row?.enabled ?? false
    return value === true || value === 1 || value === '1' || value === 'true'
  }

  const loadRoleOptions = async () => {
    try {
      const data = await fetchRoleOptions()
      roleOptions.value = normalizeRoleOptions(normalizeOptions(data))
    } catch (error) {
      roleOptions.value = []
      showError(error, '加载角色选项失败')
    }
  }
  
  const loadUsers = async () => {
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
      const data = await fetchUserPage(payload)
      const normalized = normalizePage(data)
      userData.value = normalized.list
      total.value = normalized.total
    } catch (error) {
      userData.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }
  
  const handleQuery = () => {
    if (currentPage.value === 1) {
      loadUsers()
      return
    }
    currentPage.value = 1
  }
  
  const loadUserForm = async (userId) => {
    const data = await fetchUserForm(userId)
    const payload = normalizeForm(data)
    formModel.value = {
      id: payload.id ?? payload.userId ?? userId ?? '',
      username: payload.username ?? payload.userName ?? payload.loginName ?? '',
      realName: payload.realName ?? payload.name ?? '',
      password: '',
      confirmPassword: '',
      phone: payload.phone ?? payload.mobile ?? payload.tel ?? '',
      email: payload.email ?? '',
      roleIds: normalizeRoleIds(payload.roleIds)
    }
  }
  
  const handleEdit = async (row) => {
    const userId = getRowId(row)
    if (!userId) return
    isEdit.value = true
    currentUserId.value = userId
    dialogTitle.value = '编辑用户'
    dialogLoading.value = true
    try {
      await loadUserForm(userId)
      dialogVisible.value = true
    } finally {
      dialogLoading.value = false
    }
    await nextTick()
    formRef.value?.clearValidate()
  }
  
  const handleAdd = () => {
    isEdit.value = false
    currentUserId.value = ''
    dialogTitle.value = '新增用户'
    formModel.value = {
      id: '',
      username: '',
      realName: '',
      password: '',
      confirmPassword: '',
      phone: '',
      email: '',
      roleIds: []
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
      const payload = { 
        id: formModel.value.id,
        username: formModel.value.username,
        realName: formModel.value.realName,
        password: formModel.value.password,
        confirmPassword: formModel.value.confirmPassword,
        phone: formModel.value.phone,
        email: formModel.value.email,
        roleIds: normalizeRoleIds(formModel.value.roleIds)
      }
      if (!payload.password && !payload.confirmPassword) {
        delete payload.password
        delete payload.confirmPassword
      }
      if (isEdit.value) {
        const userId = currentUserId.value
        if (!userId) {
          throw new Error('userId is required for edit')
        }
        await editUser(userId, payload)
        showSuccess('编辑成功')
      } else {
        await addUser(payload)
        showSuccess('新增成功')
      }
      dialogVisible.value = false
      loadUsers()
    } catch (error) {
      showError(error, isEdit.value ? '编辑失败' : '新增失败')
    } finally {
      submitLoading.value = false
    }
  }
  
  const openToggleDialog = (row) => {
    actionRow.value = row || null
    actionMode.value = isEnabled(row) ? 'disable' : 'enable'
    actionDialogVisible.value = true
  }
  
  const openDeleteDialog = (row) => {
    actionRow.value = row || null
    actionMode.value = 'delete'
    actionDialogVisible.value = true
  }

  const openResetPasswordDialog = (row) => {
    actionRow.value = row || null
    actionMode.value = 'reset-password'
    actionDialogVisible.value = true
  }
  
  const getActionVerb = () => {
    if (actionMode.value === 'delete') return '删除'
    if (actionMode.value === 'reset-password') return '重置密码'
    return actionMode.value === 'disable' ? '禁用' : '启用'
  }
  
  const handleToggleConfirm = async () => {
    const row = actionRow.value
    const userId = getRowId(row)
    if (!userId) {
      actionDialogVisible.value = false
      return
    }
    try {
      if (actionMode.value === 'delete') {
        await deleteUser(userId)
        showSuccess('删除成功')
      } else if (actionMode.value === 'reset-password') {
        await resetUserPassword(userId)
        showSuccess('重置密码成功')
      } else {
        const nextStatus = isEnabled(row) ? 0 : 1
        await updateUserStatus(userId, nextStatus)
        showSuccess(nextStatus ? '启用成功' : '禁用成功')
      }
      actionDialogVisible.value = false
      loadUsers()
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

  onMounted(() => {
    loadRoleOptions()
  })

  onBeforeUnmount(() => {
    roleOptions.value = []
  })
  
  watch(keywords, () => {
    if (suppressAutoQuery.value) {
      return
    }
    if (keywordTimer.value) {
      clearTimeout(keywordTimer.value)
    }
    keywordTimer.value = setTimeout(() => {
      if (currentPage.value === 1) {
        loadUsers()
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
      loadUsers()
      return
    }
    currentPage.value = 1
  })
  
  watch([currentPage, pageSize], () => {
    loadUsers()
  }, { immediate: true })
  </script>
  
  <template>
    <section class="user-page" v-loading="loading || dialogLoading">
      <div class="user-card user-card--search">
        <div class="user-search">
          <SearchInput
            v-model="keywords"
            label="关键字"
            placeholder="用户姓名/手机号"
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
          <div class="user-search__actions">
            <QueryButton @click="handleQuery" />
            <ResetButton @click="handleReset" />
          </div>
        </div>
      </div>
  
      <div class="user-toolbar">
        <AddButton v-permission="'sys:user:add'" @click="handleAdd" />
      </div>
  
      <PageList
        :data="tableData"
        :total="total"
        v-model:currentPage="currentPage"
        v-model:pageSize="pageSize"
        :table-props="{ border: true }"
        table-height="100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center"/>
        <el-table-column label="用户名" min-width="120">
          <template #default="{ row }">
            {{ getUsername(row) }}
          </template>
        </el-table-column>
        <el-table-column label="用户姓名" min-width="120">
          <template #default="{ row }">
            {{ getDisplayName(row) }}
          </template>
        </el-table-column>
        <el-table-column label="手机号" min-width="140">
          <template #default="{ row }">
            {{ getPhone(row) }}
          </template>
        </el-table-column>
        <el-table-column label="角色" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getRoleLabel(row) }}
          </template>
        </el-table-column>
        <el-table-column label="启用状态" width="110">
          <template #default="{ row }">
            <el-tag :type="isEnabled(row) ? 'success' : 'info'" effect="light" class="user-tag">
              {{ isEnabled(row) ? '启用中' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <EditLinkButton v-permission="'sys:user:edit'" @click="handleEdit(row)" />
            <el-button
              v-permission="'sys:user:edit'"
              link
              type="primary"
              @click="openResetPasswordDialog(row)"
            >
              重置密码
            </el-button>
            <StatusLinkButton
              v-permission="'sys:user:edit'"
              :enabled="isEnabled(row)"
              @click="openToggleDialog(row)"
            />
            <DeleteLinkButton v-permission="'sys:user:del'" @click="openDeleteDialog(row)" />
          </template>
        </el-table-column>
      </PageList>
  
      <el-dialog
        v-model="dialogVisible"
        width="560px"
        align-center
        :title="dialogTitle"
        class="user-dialog"
      >
        <el-form ref="formRef" :model="formModel" :rules="formRules" label-width="90px">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="formModel.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="formModel.realName" placeholder="请输入真实姓名" />
          </el-form-item>
          <el-form-item v-if="!isEdit" label="密码" prop="password" required>
            <el-input
              v-model="formModel.password"
              type="password"
              show-password
              placeholder="请输入密码"
              autocomplete="new-password"
            />
          </el-form-item>
          <el-form-item v-if="!isEdit" label="确认密码" prop="confirmPassword" required>
            <el-input
              v-model="formModel.confirmPassword"
              type="password"
              show-password
              placeholder="请再次输入密码"
              autocomplete="new-password"
            />
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="formModel.phone" placeholder="请输入手机号" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formModel.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="角色">
            <el-select
              v-model="formModel.roleIds"
              multiple
              filterable
              clearable
              placeholder="请选择角色"
              class="user-role-select"
            >
              <el-option
                v-for="option in roleOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="user-dialog__footer">
            <ConfirmButton :loading="submitLoading" @click="handleConfirm" />
          </div>
        </template>
      </el-dialog>
  
      <ActionConfirmDialog
        v-model="actionDialogVisible"
        :message="`您确定要${getActionVerb()}【${getDisplayName(actionRow) || ''}】吗？`"
        @confirm="handleToggleConfirm"
      />
    </section>
  </template>
  
  <style scoped>
  .user-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 100%;
    height: 100%;
    overflow: hidden;
  }
  
  .user-card {
    background: #ffffff;
    border-radius: 0;
    box-shadow: none;
  }
  
  .user-card--search {
    padding: 0;
    background: transparent;
    box-shadow: none;
  }
  
  .user-tag {
    padding: 2px 10px;
  }
  
  .user-search {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .user-search > :first-child {
    flex: 1 1 auto;
    min-width: 0;
  }
  
  .user-search__actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
  
  .user-toolbar {
    display: flex;
    justify-content: flex-start;
  }
  
  :deep(.user-dialog .el-input__wrapper),
  :deep(.user-dialog .el-textarea__inner),
  :deep(.user-dialog .el-input-number__wrapper) {
    border-radius: 6px;
  }
  
  :deep(.user-dialog .el-dialog__header) {
    padding-left: 12px;
  }
  
.user-dialog__footer {
  display: flex;
  justify-content: flex-end;
}

.user-role-select {
  width: 100%;
}

@media (max-width: 1024px) {
    .user-search {
      flex-direction: column;
      align-items: stretch;
    }
    .user-search__actions {
      justify-content: flex-start;
    }
  }
  </style>
