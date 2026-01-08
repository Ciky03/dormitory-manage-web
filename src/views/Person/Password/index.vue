<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CancelButton from '../../../components/button/CancelButton.vue'
import ConfirmButton from '../../../components/button/ConfirmButton.vue'
import { editPassword } from '../../../api/person/person'
import { showError, showSuccess } from '../../../util/message/message'
import { clearPermissions } from '../../../util/permission/permission'
import { clearCurrentUser } from '../../../util/user'

const router = useRouter()
const route = useRoute()
const tokenKey = import.meta.env.VITE_AUTH_TOKEN_KEY ?? 'token'
const MENU_ROUTES_KEY = 'menu_routes'
const formRef = ref(null)
const formModel = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
const submitLoading = ref(false)
const formRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!passwordPattern.test(value || '')) {
          return callback(new Error('密码至少包含大小写字母和数字，长度至少为8位'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!passwordPattern.test(value || '')) {
          return callback(new Error('密码至少包含大小写字母和数字，长度至少为8位'))
        }
        if (value !== formModel.value.newPassword) {
          return callback(new Error('两次输入的密码不一致'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}

const handleCancel = () => {
  formModel.value.oldPassword = ''
  formModel.value.newPassword = ''
  formModel.value.confirmPassword = ''
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tab-close', { detail: { path: route.path } }))
  } else {
    router.back()
  }
}

const handleConfirm = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await editPassword({
      oldPassword: formModel.value.oldPassword,
      newPassword: formModel.value.newPassword,
      confirmPassword: formModel.value.confirmPassword
    })
    localStorage.removeItem(tokenKey)
    localStorage.removeItem(MENU_ROUTES_KEY)
    clearCurrentUser()
    clearPermissions()
    showSuccess('修改密码成功，请重新登录')
    router.push({ name: 'login' })
  } catch (error) {
    showError(error, '修改密码失败')
  } finally {
    submitLoading.value = false
  }
}
</script>

<template>
  <section class="password-page">
    <div class="password-card">
      <div class="password-title">修改密码</div>
      <el-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-position="left"
        label-width="90px"
        class="password-form"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="formModel.oldPassword"
            type="password"
            show-password
            autocomplete="current-password"
            placeholder="请输入原密码"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="formModel.newPassword"
            type="password"
            show-password
            autocomplete="new-password"
            placeholder="请输入新密码"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="formModel.confirmPassword"
            type="password"
            show-password
            autocomplete="new-password"
            placeholder="请再次输入新密码"
          />
        </el-form-item>
      </el-form>
      <div class="password-footer">
        <div class="password-actions">
          <CancelButton @click="handleCancel" />
          <ConfirmButton :loading="submitLoading" @click="handleConfirm" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.password-page {
  min-height: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.password-card {
  width: 520px;
  max-width: 100%;
  background: #ffffff;
  padding: 24px 24px 18px;
  border-radius: 12px;
  box-shadow: none;
}

.password-form {
  margin: 16px 0 18px;
}

:deep(.password-form .el-form-item__label) {
  padding-left: 6px;
}

.password-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.password-title {
  font-size: 16px;
  font-weight: 600;
  color: #2b2f33;
}

.password-actions {
  display: flex;
  gap: 10px;
}
</style>
