<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CancelButton from '../../../components/button/CancelButton.vue'
import ConfirmButton from '../../../components/button/ConfirmButton.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)

const formType = computed(() => {
  const type = route.query.type
  return type === 'teacher' || type === 'dormitory' ? type : 'student'
})

const title = computed(() => {
  if (formType.value === 'teacher') return '新增教师'
  if (formType.value === 'dormitory') return '新增宿管'
  return '新增学生'
})

const handleCancel = () => {
  router.push('/config/person')
}

const handleConfirm = () => {
  loading.value = false
  router.push('/config/person')
}
</script>

<template>
  <section class="person-form-tab">
    <header class="person-form-tab__header">
      <h3 class="person-form-tab__title">{{ title }}</h3>
    </header>
    <div class="person-form-tab__body">
      <div class="person-form-tab__placeholder">
        {{ formType === 'student' ? '学生表单区域' : formType === 'teacher' ? '教师表单区域' : '宿管表单区域' }}
      </div>
    </div>
    <footer class="person-form-tab__footer">
      <CancelButton @click="handleCancel" />
      <ConfirmButton :loading="loading" @click="handleConfirm" />
    </footer>
  </section>
</template>

<style scoped>
.person-form-tab {
  display: flex;
  flex-direction: column;
  min-height: 520px;
  background: #ffffff;
}

.person-form-tab__header {
  padding: 12px 0;
}

.person-form-tab__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.person-form-tab__body {
  flex: 1 1 auto;
  min-height: 0;
}

.person-form-tab__placeholder {
  color: #909399;
  text-align: center;
  padding: 24px 0;
}

.person-form-tab__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 12px;
}
</style>
