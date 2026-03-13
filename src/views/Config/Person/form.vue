<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CancelButton from '../../../components/button/CancelButton.vue'
import ConfirmButton from '../../../components/button/ConfirmButton.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const formRef = ref(null)
const formModel = ref({
  username: '',
  realName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  roleIds: [],
  studentNum: '',
  admissionYear: '',
  graduationYear: ''
})

const formRules = {
  username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
  realName: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
  phone: [{ required: true, message: '手机号码不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '密码不能为空', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '确认密码不能为空', trigger: 'blur' },
    {
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (!value) {
          callback()
          return
        }
        if (value !== formModel.value.password) {
          callback(new Error('两次密码不一致'))
          return
        }
        callback()
      }
    }
  ],
  studentNum: [{ required: true, message: '学号不能为空', trigger: 'blur' }],
  admissionYear: [{ required: true, message: '入学年份不能为空', trigger: 'change' }],
  graduationYear: [{ required: true, message: '毕业年份不能为空', trigger: 'change' }]
}

const formType = computed(() => {
  const type = route.query.type
  return type === 'teacher' || type === 'dormitory' ? type : 'student'
})

const title = computed(() => {
  if (formType.value === 'teacher') return '新增教师'
  if (formType.value === 'dormitory') return '新增宿管'
  return '新增学生'
})

const roleLabel = computed(() => {
  if (formType.value === 'teacher') return '教师'
  if (formType.value === 'dormitory') return '宿管'
  return '学生'
})

const handleCancel = () => {
  router.push('/config/person')
}

const handleConfirm = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  loading.value = true
  setTimeout(() => {
    loading.value = false
    router.push('/config/person')
  }, 300)
}
</script>

<template>
  <section class="person-form-tab">
    <header class="person-form-tab__header">
      <h3 class="person-form-tab__title">{{ title }}</h3>
    </header>
    <div class="person-form-tab__body">
      <el-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-position="top"
        class="person-form"
      >
        <section v-if="formType === 'student'" class="person-form__section">
          <h4 class="person-form__section-title">学生信息</h4>
          <div class="person-form__grid">
            <el-form-item label="学号" prop="studentNum" required>
              <el-input v-model="formModel.studentNum" placeholder="请输入学号" />
            </el-form-item>
            <el-form-item label="姓名" prop="realName" required>
              <el-input v-model="formModel.realName" placeholder="请输入姓名" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="formModel.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="入学年份" prop="admissionYear" required>
              <el-date-picker
                v-model="formModel.admissionYear"
                type="year"
                placeholder="选择入学年份"
                value-format="YYYY"
              />
            </el-form-item>
            <el-form-item label="毕业年份" prop="graduationYear" required>
              <el-date-picker
                v-model="formModel.graduationYear"
                type="year"
                placeholder="选择毕业年份"
                value-format="YYYY"
              />
            </el-form-item>
          </div>
        </section>

        <section class="person-form__section">
          <h4 class="person-form__section-title">账号信息</h4>
          <div class="person-form__grid">
            <el-form-item label="用户名" prop="username" required>
              <el-input v-model="formModel.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="手机号码" prop="phone" required>
              <el-input v-model="formModel.phone" placeholder="请输入手机号码" />
            </el-form-item>
            <el-form-item label="角色">
              <el-input :model-value="roleLabel" disabled />
            </el-form-item>
            <el-form-item label="密码" prop="password" required>
              <el-input v-model="formModel.password" type="password" placeholder="请输入密码" />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword" required>
              <el-input
                v-model="formModel.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
              />
            </el-form-item>
          </div>
        </section>
      </el-form>
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
  height: 100%;
  min-height: 0;
  background: #ffffff;
}

.person-form-tab__header {
  padding: 12px 0;
  text-align: center;
}

.person-form-tab__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.person-form-tab__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.person-form {
  width: 100%;
}

.person-form__section {
  margin-bottom: 16px;
}

.person-form__section-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.person-form__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 16px;
}


.person-form__grid :deep(.el-form-item) {
  margin-bottom: 0;
}

.person-form__grid :deep(.el-form-item__content) {
  min-width: 0;
}

.person-form__grid :deep(.el-input),
.person-form__grid :deep(.el-select),
.person-form__grid :deep(.el-date-editor) {
  width: 100%;
}

@media (max-width: 1200px) {
  .person-form__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .person-form__grid {
    grid-template-columns: 1fr;
  }
}

.person-form-tab__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 12px;
  flex: 0 0 auto;
}
</style>
