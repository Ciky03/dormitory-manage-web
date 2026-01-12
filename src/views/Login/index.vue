<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchCaptcha,
  fetchWxLoginQrCodeInfo,
  fetchWxLoginQrCodeStatus,
  login,
  loginWithWechatMp
} from '../../api/auth'
import { fetchCurrentUser } from '../../api/system/user'
import { request } from '../../api/request'
import { setPermissions } from '../../util/permission/permission'
import { setCurrentUser } from '../../util/user'
import { showError, showSuccess } from '../../util/message/message'
import topicIcon from '../../assets/topic.svg'
import wxLogo from '../../assets/wxLogo.svg'

const form = ref({
  username: '',
  password: '',
  captchaCode: ''
})
const loading = ref(false)
const router = useRouter()
const loginMode = ref('account')
const captchaKey = ref('')
const captchaImage = ref('')
const wxQrUrl = ref('')
const wxLoginToken = ref('')
const wxExpired = ref(false)
const wxStatusToken = ref('')
let wxPollTimer = null

const normalizeCaptchaImage = (base64) => {
  if (!base64) return ''
  if (base64.startsWith('data:image')) return base64
  return `data:image/png;base64,${base64}`
}

const loadCaptcha = async () => {
  try {
    const payload = await fetchCaptcha()
    const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload
    captchaKey.value = data?.captchaKey || ''
    captchaImage.value = normalizeCaptchaImage(data?.captchaBase64 || '')
  } catch (error) {
    captchaKey.value = ''
    captchaImage.value = ''
    showError(error, '获取验证码失败')
  }
}

const normalizeWxQrInfo = (payload) => {
  if (!payload) return { qrCodeUrl: '', loginToken: '' }
  const data = typeof payload?.data === 'object' ? payload.data : payload
  return {
    qrCodeUrl: data?.qrCodeUrl || '',
    loginToken: data?.loginToken || ''
  }
}

const normalizeWxStatus = (payload) => {
  if (!payload) return { status: '', token: '' }
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload
  return {
    status: typeof data?.key === 'string' ? data.key : '',
    token: typeof data?.value === 'string' ? data.value : ''
  }
}

const clearWxPolling = () => {
  if (wxPollTimer) {
    clearInterval(wxPollTimer)
    wxPollTimer = null
  }
}

const startWxPolling = (token) => {
  if (!token) return
  clearWxPolling()
  const doPoll = async () => {
    try {
      const payload = await fetchWxLoginQrCodeStatus(token)
      const { status, token: statusToken } = normalizeWxStatus(payload)
      wxStatusToken.value = statusToken || ''
      if (status === 'PENDING') {
        return
      }
      if (status === 'EXPIRED') {
        wxExpired.value = true
        clearWxPolling()
        return
      }
      if (status === 'CONFIRMED') {
        clearWxPolling()
        try {
          const data = await loginWithWechatMp(statusToken)
          showSuccess('登录成功!')
          const currentUser = await fetchCurrentUser()
          const storedUser = setCurrentUser(currentUser)
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('is_bind_wx_mp', String(Boolean(storedUser?.isBindWxMp)))
          }
          setPermissions(storedUser?.perms ?? [])
          await router.push({ name: 'home' })
        } catch (error) {
          showError(error, '登录失败，请稍后再试')
          await loadWxQrCode()
        }
        return
      }
    } catch (error) {
      showError(error, '轮询失败')
    }
  }
  doPoll()
  wxPollTimer = setInterval(doPoll, 2000)
}

const loadWxQrCode = async () => {
  clearWxPolling()
  wxQrUrl.value = ''
  wxLoginToken.value = ''
  wxExpired.value = false
  try {
    const payload = await fetchWxLoginQrCodeInfo()
    const info = normalizeWxQrInfo(payload)
    if (!info.qrCodeUrl) {
      showError(null, '二维码获取失败')
      return
    }
    wxQrUrl.value = info.qrCodeUrl
    wxLoginToken.value = info.loginToken
    if (wxLoginToken.value) {
      startWxPolling(wxLoginToken.value)
    }
  } catch (error) {
    showError(error, '二维码获取失败')
  }
}

const handleSubmit = async () => {
  if (!form.value.username || !form.value.password) {
    showError(null, '请输入账号和密码')
    return
  }

  loading.value = true
  try {
    const data = await login({
      username: form.value.username,
      password: form.value.password,
      captchaKey: captchaKey.value,
      captchaCode: form.value.captchaCode
    })
    showSuccess('登录成功!')
    try {
      const currentUser = await fetchCurrentUser()
      const storedUser = setCurrentUser(currentUser)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('is_bind_wx_mp', String(Boolean(storedUser?.isBindWxMp)))
      }
      setPermissions(storedUser?.perms ?? [])
    } catch (error) {
      setCurrentUser({})
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('is_bind_wx_mp')
      }
      setPermissions([])
    }
    await router.push({ name: 'home' })
  } catch (error) {
    showError(error, '登录失败，请稍后再试')
    await loadCaptcha()
  } finally {
    loading.value = false
  }
}



onMounted(() => {
  loadCaptcha()
})

watch(loginMode, (mode) => {
  if (mode === 'wx') {
    loadWxQrCode()
  } else {
    clearWxPolling()
  }
})

onBeforeUnmount(() => {
  clearWxPolling()
})
</script>

<template>
  <div class="login-page">
    <section class="hero">
      <div class="hero-content">
        <div class="page-brand">
          <img :src="topicIcon" alt="topic" />
          <span>宿舍管理平台</span>
        </div>
        <!-- <p class="hero-tag">Dormitory Manage</p>
        <div class="hero-highlights">
          <div>
            <h3>统一管理</h3>
            <p>入住、调宿、退宿全流程可视化。</p>
          </div>
          <div>
            <h3>数据统计</h3>
            <p>实时查看床位与考勤统计。</p>
          </div>
        </div> -->
      </div>
    </section>

    <section class="form-panel">
      <div class="form-card">
        <div class="login-tabs">
          <button
            type="button"
            class="login-tab"
            :class="{ active: loginMode === 'account' }"
            @click="loginMode = 'account'"
          >
            账号密码登录
          </button>
          <span class="login-tab-divider">|</span>
          <button
            type="button"
            class="login-tab"
            :class="{ active: loginMode === 'wx' }"
            @click="loginMode = 'wx'"
          >
            微信扫码登录
          </button>
        </div>
        

        <el-form
          v-if="loginMode === 'account'"
          class="login-form"
          :model="form"
          label-position="top"
          @submit.prevent="handleSubmit"
        >
            <el-form-item label="账号">
              <el-input
                v-model.trim="form.username"
                name="username"
                autocomplete="username"
                placeholder="请输入账号/手机号/邮箱"
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
            <el-form-item label="验证码">
              <div class="captcha-row">
                <el-input
                  v-model="form.captchaCode"
                  name="captchaCode"
                  autocomplete="off"
                  placeholder="请输入验证码"
                />
                <button
                  type="button"
                  class="captcha-image"
                  :disabled="!captchaImage"
                  @click="loadCaptcha"
                >
                  <img v-if="captchaImage" :src="captchaImage" alt="captcha" />
                  <span v-else>加载中</span>
                </button>
              </div>
            </el-form-item>
            <el-button class="submit-btn" type="primary" native-type="submit" :loading="loading">
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
        </el-form>

        <div v-else class="wx-login-panel">
          <div class="wx-qr-title">
            <img :src="wxLogo" alt="WeChat" />
            <span>微信扫码登录</span>
          </div>
          <div class="wx-qr-placeholder">
            <img v-if="wxQrUrl" :src="wxQrUrl" :class="{ blurred: wxExpired }" alt="wechat-qr" />
            <button v-if="wxExpired" class="wx-qr-expired" type="button" @click="loadWxQrCode">
              二维码已过期，点击刷新
            </button>
            <span v-else-if="!wxQrUrl">二维码加载中...</span>
          </div>
          <div class="wx-qr-tip">请使用微信扫码登录</div>
        </div>

        <div class="form-footer">
          <a href="#">忘记密码?</a>
          <span>如需帮助请联系管理员</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  position: relative;
  background: linear-gradient(90deg, #ffffff 0%, var(--app-primary) 100%);
}

.page-brand {
  position: absolute;
  top: 24px;
  left: 24px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #1f2a44;
  font-weight: 600;
  z-index: 2;
  font-size: 38px;
}

.page-brand img {
  width: 48px;
  height: 48px;
  display: block;
}

.hero {
  position: relative;
  padding: 24px 40px;
  color: #1f2a44;
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
  border-radius: 6px;
  background: var(--el-color-primary-light-9);
  color: var(--app-primary);
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
  color: var(--app-info);
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
  color: var(--app-info);
}

.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px 48px;
}

.form-card {
  width: min(420px, 100%);
  min-height: 520px;
  background: var(--app-surface);
  border-radius: 6px;
  padding: 38px 36px;
  box-shadow: 0 26px 60px rgba(16, 36, 64, 0.15);
  border: 1px solid var(--app-border);
  animation: floatIn 0.8s ease-out both 0.1s;
  display: flex;
  flex-direction: column;
}

.login-tabs {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  justify-content: center;
  align-items: center;
}

.login-tab {
  border: none;
  background: transparent;
  padding: 0 0 6px;
  color: #6b7280;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.login-tab.active {
  color: #111827;
  border-bottom-color: var(--app-primary);
}

.login-tab-divider {
  color: #c7cfdf;
  font-size: 18px;
  padding-bottom: 8px;
}

.form-card h2 {
  margin: 0 0 8px;
  font-size: 1.9rem;
}

.form-subtitle {
  margin: 0 0 26px;
  color: var(--app-info);
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
  border-radius: 6px;
  background: #f7f9fd;
  transition: box-shadow 0.2s ease;
  height: 32px;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--app-primary);
}

.captcha-row {
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 12px;
  align-items: stretch;
  width: 100%;
}

.captcha-image {
  border: 1px solid var(--app-border);
  border-radius: 6px;
  background: var(--app-surface-alt);
  padding: 0;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--app-info);
  font-size: 12px;
}

.captcha-image:disabled {
  cursor: default;
  opacity: 0.7;
}

.captcha-image img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: 6px;
}

.submit-btn {
  margin-top: 6px;
  padding: 12px 16px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 6px;
}

.test-btn {
  margin-top: 6px;
}

.wx-login-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 8px 0 10px;
  flex: 1;
  justify-content: center;
}

.wx-qr-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.wx-qr-title img {
  width: 20px;
  height: 20px;
  display: block;
}

.wx-qr-placeholder {
  width: 240px;
  height: 240px;
  border-radius: 6px;
  border: 1px dashed var(--app-border);
  background: var(--app-surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-info);
  font-size: 14px;
  position: relative;
  overflow: hidden;
}

.wx-qr-tip {
  font-size: 13px;
  color: var(--app-info);
}

.wx-qr-placeholder img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

.wx-qr-placeholder img.blurred {
  filter: blur(4px);
}

.wx-qr-expired {
  position: absolute;
  inset: 0;
  border: none;
  background: rgba(15, 23, 42, 0.55);
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 16px;
  cursor: pointer;
}

.wx-qr-expired:hover {
  background: rgba(15, 23, 42, 0.65);
}

.form-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--app-info);
}

.form-footer a {
  color: var(--app-primary);
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
