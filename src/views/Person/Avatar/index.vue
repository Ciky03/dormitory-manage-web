<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import CancelButton from '../../../components/button/CancelButton.vue'
import ConfirmButton from '../../../components/button/ConfirmButton.vue'
import { updateUserAvatar, uploadAvatar } from '../../../api/person/avatar'
import { fetchCurrentUser } from '../../../api/system/user'
import { showError, showSuccess } from '../../../util/message/message'
import { clearPermissions, setPermissions } from '../../../util/permission/permission'
import { clearCurrentUser, getCurrentUser, setCurrentUser } from '../../../util/user'

const router = useRouter()
const route = useRoute()

const fileInputRef = ref(null)
const cropperRef = ref(null)
const dialogVisible = ref(false)
const imageUrl = ref('')
const cachedAvatarUrl = getCurrentUser()?.avatar || ''
const cropPreviewUrl = ref(cachedAvatarUrl)
const uploadedAttachId = ref('')
const uploadLoading = ref(false)
const confirmLoading = ref(false)

const resetFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleFileChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
  imageUrl.value = URL.createObjectURL(file)
  dialogVisible.value = true
}

const triggerFileSelect = () => {
  resetFileInput()
  fileInputRef.value?.click()
}

const handleDialogClose = () => {
  dialogVisible.value = false
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
  imageUrl.value = ''
  resetFileInput()
}

const handleCropConfirm = () => {
  const result = cropperRef.value?.getResult?.()
  const canvas = result?.canvas
  if (!canvas) return
  uploadLoading.value = true
  canvas.toBlob(async (blob) => {
    if (!blob) {
      uploadLoading.value = false
      showError(null, '裁剪失败')
      return
    }
    try {
      const file = new File([blob], 'avatar.png', { type: 'image/png' })
      const payload = await uploadAvatar(file, 'dm-system-avatar')
      const data = payload?.data ?? payload ?? {}
      uploadedAttachId.value = data?.id || ''
      cropPreviewUrl.value = data?.url || canvas.toDataURL('image/png')
      dialogVisible.value = false
      showSuccess('上传成功')
      resetFileInput()
    } catch (error) {
      showError(error, '上传失败')
    } finally {
      uploadLoading.value = false
    }
  }, 'image/png')
}

const handleCancel = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tab-close', { detail: { path: route.path } }))
  } else {
    router.back()
  }
}

const handleConfirm = () => {
  if (!uploadedAttachId.value) {
    showError(null, '请先上传头像')
    return
  }
  confirmLoading.value = true
  updateUserAvatar(uploadedAttachId.value)
    .then(async () => {
      clearCurrentUser()
      clearPermissions()
      const currentUser = await fetchCurrentUser()
      const storedUser = setCurrentUser(currentUser)
      setPermissions(storedUser?.perms ?? [])
      showSuccess('头像更新成功')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tab-close', { detail: { path: route.path } }))
      } else {
        router.back()
      }
    })
    .catch((error) => {
      showError(error, '头像更新失败')
    })
    .finally(() => {
      confirmLoading.value = false
    })
}

onBeforeUnmount(() => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
})
</script>

<template>
  <section class="avatar-page">
    <div class="avatar-card">
      <div class="avatar-title">修改头像</div>
      <div class="avatar-frame">
        <input
          ref="fileInputRef"
          class="avatar-file"
          type="file"
          accept="image/*"
          @change="handleFileChange"
        />
        <div v-if="!cropPreviewUrl" class="avatar-placeholder">
          <ConfirmButton type="primary" @click="triggerFileSelect">选择文件</ConfirmButton>
        </div>
        <div v-else class="avatar-preview">
          <img :src="cropPreviewUrl" alt="avatar" />
          <div class="avatar-reupload">
            <ConfirmButton type="primary" @click="triggerFileSelect">重新上传</ConfirmButton>
          </div>
        </div>
      </div>
      <div class="avatar-actions">
        <CancelButton @click="handleCancel" />
        <ConfirmButton :loading="confirmLoading" @click="handleConfirm" />
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="图片裁剪"
      width="640px"
      align-center
      @close="handleDialogClose"
    >
      <div class="crop-dialog">
        <Cropper
          ref="cropperRef"
          :src="imageUrl"
          class="avatar-cropper"
          :stencil-props="{ aspectRatio: 1, movable: false, resizable: true }"
          :min-width="300"
          :min-height="300"
          :max-width="4200"
          :max-height="3200"
          image-restriction="none"
          :move-image="{ mouse: true, touch: true }"
          :resize-image="{ wheel: true }"
          background-class="cropper-background"
        />
        <div class="crop-tip">可拖动图片调整范围，滚轮缩放</div>
      </div>
      <template #footer>
        <div class="crop-footer">
          <CancelButton @click="dialogVisible = false" />
          <ConfirmButton :loading="uploadLoading" @click="handleCropConfirm">确定裁剪</ConfirmButton>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.avatar-page {
  min-height: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.avatar-card {
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

.avatar-title {
  font-size: 16px;
  font-weight: 600;
  color: #2b2f33;
  margin-left: -4px;
}

.avatar-frame {
  width: 280px;
  height: 280px;
  border: 1px dashed #d4d8e1;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.avatar-file {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.avatar-preview {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #d4d8e1;
  position: relative;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-reupload {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.avatar-preview:hover .avatar-reupload {
  opacity: 1;
}

.avatar-actions {
  display: flex;
  gap: 18px;
}

.crop-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-top: 6px;
}

.avatar-cropper {
  width: 480px;
  height: 360px;
  background: transparent;
}

:deep(.cropper-background) {
  background-color: #eef1f5;
  background-image:
    linear-gradient(45deg, #d5dae2 25%, transparent 25%),
    linear-gradient(-45deg, #d5dae2 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #d5dae2 75%),
    linear-gradient(-45deg, transparent 75%, #d5dae2 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}

.crop-tip {
  font-size: 12px;
  color: #d97706;
  align-self: flex-start;
}

.crop-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
