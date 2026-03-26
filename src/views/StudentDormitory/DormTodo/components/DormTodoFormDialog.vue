<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  form: { type: Object, required: true },
  assigneeOptions: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'submit', 'update:form'])

const titleText = computed(() => (props.mode === 'edit' ? '编辑待办' : '新建待办'))
const actionText = computed(() => (props.mode === 'edit' ? '保存修改' : '创建待办'))
const availableAssignees = computed(() => props.assigneeOptions.slice(1))
const priorityOptions = [
  { label: '低', value: '1' },
  { label: '中', value: '2' },
  { label: '高', value: '3' }
]

const updateField = (key, value) => {
  emit('update:form', { [key]: value })
}
</script>

<template>
  <el-dialog :model-value="visible" :title="titleText" width="640px" @close="emit('close')">
    <el-form label-position="top" @submit.prevent>
      <el-form-item label="标题">
        <el-input
          :model-value="form.title"
          maxlength="100"
          show-word-limit
          placeholder="请输入待办标题"
          @update:model-value="updateField('title', $event)"
        />
      </el-form-item>
      <el-form-item label="正文">
        <el-input
          :model-value="form.content"
          type="textarea"
          :rows="5"
          maxlength="1000"
          show-word-limit
          placeholder="请输入任务说明"
          @update:model-value="updateField('content', $event)"
        />
      </el-form-item>
      <div class="form-grid">
        <el-form-item label="优先级">
          <el-select
            :model-value="form.priority"
            placeholder="请选择优先级"
            @update:model-value="updateField('priority', $event)"
          >
            <el-option v-for="option in priorityOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-select
            :model-value="form.assigneeStudentId"
            clearable
            placeholder="未指派"
            @update:model-value="updateField('assigneeStudentId', $event || '')"
          >
            <el-option v-for="option in availableAssignees" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </el-form-item>
      </div>
      <el-form-item label="截止时间">
        <el-date-picker
          :model-value="form.dueTime"
          type="datetime"
          format="YYYY-MM-DD HH:mm"
          value-format="YYYY-MM-DD HH:mm"
          placeholder="请选择截止时间"
          @update:model-value="updateField('dueTime', $event || '')"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="emit('close')">取消</el-button>
        <el-button type="primary" :loading="loading" @click="emit('submit')">{{ actionText }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 720px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>