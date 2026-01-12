<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { fetchWxQrCodeInfo, fetchWxQrCodeStatus } from '../../../api/person/bindwx'
import { fetchCurrentUser } from '../../../api/system/user'
import wxLogo from '../../../assets/wxLogo.svg'
import { showError } from '../../../util/message/message'
import { setCurrentUser } from '../../../util/user'

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const qrUrl = ref('')
const bindToken = ref('')
const expired = ref(false)
const BIND_WX_KEY = 'is_bind_wx_mp'
let pollTimer = null

const normalizeQrInfo = (payload) => {
  if (!payload) {
    return { qrCodeUrl: '', bindToken: '' }
  }
  const data = typeof payload?.data === 'object' ? payload.data : payload
  return {
    qrCodeUrl: data?.qrCodeUrl || '',
    bindToken: data?.bindToken || ''
  }
}

const normalizeStatus = (payload) => {
  if (!payload) return ''
  if (typeof payload === 'string') return payload
  if (typeof payload?.data === 'string') return payload.data
  if (typeof payload?.status === 'string') return payload.status
  return ''
}

const clearPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const startPolling = (token) => {
  if (!token) return
  clearPolling()
  const doPoll = async () => {
    try {
      const payload = await fetchWxQrCodeStatus(token)
      const status = normalizeStatus(payload)
      if (status === 'PENDING') {
        return
      }
      if (status === 'CONFIRMED') {
        qrUrl.value = ''
        successMessage.value = '已绑定'
        try {
          const currentUser = await fetchCurrentUser()
          const storedUser = setCurrentUser(currentUser)
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(BIND_WX_KEY, String(Boolean(storedUser?.isBindWxMp)))
          }
        } catch (error) {
          showError(error, '获取用户信息失败')
        }
        clearPolling()
        return
      }
      if (status === 'EXPIRED') {
        expired.value = true
        clearPolling()
        return
      }
    } catch (error) {
      showError(error, '轮询失败')
    }
  }
  doPoll()
  pollTimer = setInterval(doPoll, 2000)
}

const loadQrCode = async () => {
  clearPolling()
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  qrUrl.value = ''
  bindToken.value = ''
  expired.value = false
  if (typeof localStorage !== 'undefined') {
    const cached = localStorage.getItem(BIND_WX_KEY)
    if (cached === 'true') {
      successMessage.value = '已绑定'
      loading.value = false
      return
    }
  }
  try {
    const payload = await fetchWxQrCodeInfo()
    const info = normalizeQrInfo(payload)
    if (!info.qrCodeUrl) {
      errorMessage.value = 'QR code not available.'
      return
    }
    qrUrl.value = info.qrCodeUrl
    bindToken.value = info.bindToken
    if (bindToken.value) {
      startPolling(bindToken.value)
    }
  } catch (error) {
    errorMessage.value = 'Failed to load QR code.'
    showError(error, errorMessage.value)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadQrCode()
})

onBeforeUnmount(() => {
  clearPolling()
})
</script>

<template>
  <section class="bindwx-page">
    <div class="bindwx-card">
      <div class="bindwx-title">
        <img class="bindwx-title-icon" :src="wxLogo" alt="WeChat" />
        微信扫码绑定
      </div>
      <div class="qr-wrapper">
        <div v-if="loading" class="qr-placeholder">Loading QR code...</div>
        <div v-else-if="errorMessage" class="qr-placeholder">{{ errorMessage }}</div>
        <el-result v-else-if="successMessage" class="success-result" icon="success" title="已绑定" />
        <div v-else-if="qrUrl" class="qr-container">
          <img :src="qrUrl" :class="{ blurred: expired }" alt="wechat-qr" />
          <button v-if="expired" class="qr-expired" type="button" @click="loadQrCode">
            二维码已过期，请点击刷新
          </button>
        </div>
        <div v-else class="qr-placeholder">QR code not available.</div>
      </div>
      <div class="qr-tip">请使用微信扫描二维码绑定</div>
    </div>
  </section>
</template>

<style scoped>
.bindwx-page {
  min-height: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.bindwx-card {
  width: 520px;
  max-width: 100%;
  background: #ffffff;
  padding: 28px 24px 24px;
  border-radius: 12px;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.bindwx-title {
  font-size: 16px;
  font-weight: 600;
  color: #2b2f33;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.bindwx-title-icon {
  width: 24px;
  height: 24px;
  display: block;
}

.qr-wrapper {
  width: 320px;
  height: 320px;
  border-radius: 12px;
  border: 1px dashed #d4d8e1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafbff;
}

.qr-container {
  width: 300px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.qr-container img {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

.qr-container img.blurred {
  filter: blur(4px);
}

.qr-expired {
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

.qr-expired:hover {
  background: rgba(15, 23, 42, 0.65);
}

.qr-placeholder {
  font-size: 14px;
  color: #8c94a4;
  text-align: center;
  padding: 0 16px;
}

.qr-tip {
  font-size: 13px;
  color: #6b7280;
  text-align: center;
}

.success-result {
  padding: 0;
}

.success-result :deep(.el-result__title) {
  margin-top: 8px;
}
</style>
