<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../../api/auth'
import { fetchCurrentUser } from '../../api/user'
import { request } from '../../api/request'
import { setPermissions } from '../../util/permission/permission'
import { setCurrentUser } from '../../util/user'

const form = ref({
  username: '',
  password: ''
})
const loading = ref(false)
const errorMessage = ref('')
const statusMessage = ref('')
const router = useRouter()

const handleSubmit = async () => {
  errorMessage.value = ''
  statusMessage.value = ''

  if (!form.value.username || !form.value.password) {
    errorMessage.value = '请输入账号和密码'
    return
  }

  loading.value = true
  try {
    const data = await login({
      username: form.value.username,
      password: form.value.password
    })
    statusMessage.value = data?.message || '登录成功'
    try {
      const currentUser = await fetchCurrentUser()
      const storedUser = setCurrentUser(currentUser)
      setPermissions(storedUser?.perms ?? [])
    } catch (error) {
      setCurrentUser({})
      setPermissions([])
    }
    await router.push({ name: 'home' })
  } catch (error) {
    errorMessage.value = error?.message || '登录失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

const handleTestApi = async () => {
  errorMessage.value = ''
  statusMessage.value = ''
  loading.value = true
  try {
    const data = await request('/system/user/test', { method: 'GET' })
    statusMessage.value = data?.message || data?.msg || '测试接口成功'
  } catch (error) {
    errorMessage.value = error?.message || '测试接口失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <section class="hero">
      <div class="hero-content">
        <p class="hero-tag">Dormitory Manage</p>
        <h1>宿舍管理平台</h1>
        <p class="hero-subtitle">集中管理学生住宿与安全，数据一目了然。</p>
        <div class="hero-highlights">
          <div>
            <h3>统一管理</h3>
            <p>入住、调宿、退宿全流程可视化。</p>
          </div>
          <div>
            <h3>数据统计</h3>
            <p>实时查看床位与考勤统计。</p>
          </div>
        </div>
      </div>
    </section>

    <section class="form-panel">
      <div class="form-card">
        <h2>欢迎回来</h2>
        <p class="form-subtitle">请使用账号密码登录系统</p>

        <el-form class="login-form" :model="form" label-position="top" @submit.prevent="handleSubmit">
            <el-form-item label="账号">
              <el-input
                v-model.trim="form.username"
                name="username"
                autocomplete="username"
                placeholder="请输入账号"
                clearable
              />
            </el-form-item>
            <el-form-item label="密码">
              <el-input
                v-model="form.password"
                name="password"
                autocomplete="current-password"
                placeholder="请输入密码"
                show-password
              />
            </el-form-item>
            <el-button class="submit-btn" type="primary" native-type="submit" :loading="loading">
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
            <el-button class="test-btn" type="default" :loading="loading" @click="handleTestApi">
              测试接口
            </el-button>
        </el-form>

        <el-alert
          v-if="errorMessage"
          class="form-message"
          type="error"
          :closable="false"
          :title="errorMessage"
          show-icon
        />
        <el-alert
          v-if="statusMessage"
          class="form-message"
          type="success"
          :closable="false"
          :title="statusMessage"
          show-icon
        />

        <div class="form-footer">
          <a href="#">忘记密码?</a>
          <span>如需帮助请联系管理员</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
:global(:root) {
  --primary: #1f6feb;
  --primary-dark: #1547a8;
  --text-muted: #52647a;
  --card-bg: #ffffff;
  --border: rgba(18, 32, 51, 0.1);
}

.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
}

.hero {
  position: relative;
  padding: 64px 72px;
  color: #f4fbff;
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(140deg, rgba(9, 26, 48, 0.65) 0%, rgba(12, 54, 74, 0.7) 60%, rgba(12, 84, 90, 0.6) 100%);
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 520px;
  animation: floatIn 0.8s ease-out both;
}

.hero-tag {
  display: inline-flex;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero h1 {
  margin: 18px 0 12px;
  font-size: 2.9rem;
  line-height: 1.1;
}

.hero-subtitle {
  margin: 0 0 36px;
  font-size: 1.05rem;
  color: rgba(244, 251, 255, 0.86);
}

.hero-highlights {
  display: grid;
  gap: 18px;
}

.hero-highlights h3 {
  margin: 0 0 6px;
  font-size: 1.1rem;
}

.hero-highlights p {
  margin: 0;
  color: rgba(244, 251, 255, 0.75);
}

.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px 48px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.94) 0%, rgba(245, 247, 252, 0.98) 100%);
}

.form-card {
  width: min(420px, 100%);
  background: var(--card-bg);
  border-radius: 24px;
  padding: 38px 36px;
  box-shadow: 0 26px 60px rgba(16, 36, 64, 0.15);
  border: 1px solid var(--border);
  animation: floatIn 0.8s ease-out both 0.1s;
}

.form-card h2 {
  margin: 0 0 8px;
  font-size: 1.9rem;
}

.form-subtitle {
  margin: 0 0 26px;
  color: var(--text-muted);
}

.login-form {
  display: grid;
  gap: 18px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.login-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #1a2b42;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 12px;
  background: #f7f9fd;
  transition: box-shadow 0.2s ease;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 3px rgba(31, 111, 235, 0.18);
}

.submit-btn {
  margin-top: 6px;
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, var(--primary) 0%, #38bdf8 100%);
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(31, 111, 235, 0.28);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  box-shadow: none;
}

.test-btn {
  margin-top: 6px;
}

.form-message {
  margin: 16px 0 0;
  font-size: 0.95rem;
}

.form-message.error {
  color: #c2410c;
}

.form-message.success {
  color: #15803d;
}

.form-footer {
  margin-top: 22px;
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.form-footer a {
  color: var(--primary-dark);
  font-weight: 600;
}

@keyframes floatIn {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 960px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .hero {
    padding: 48px 32px;
    min-height: 40vh;
  }

  .form-panel {
    padding: 40px 24px 56px;
  }
}

@media (max-width: 600px) {
  .hero h1 {
    font-size: 2.2rem;
  }

  .form-card {
    padding: 32px 24px;
  }

  .form-footer {
    flex-direction: column;
    gap: 6px;
  }
}
</style>
