<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'create'
  },
  form: {
    type: Object,
    default: () => ({})
  },
  disabledCreate: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close'])

const dialogTitle = computed(() => (props.mode === 'edit' ? '编辑公摊单' : '新建公摊单'))
</script>

<template>
  <el-dialog :model-value="visible" :title="dialogTitle" width="560px" @close="$emit('close')">
    <el-alert
      v-if="disabledCreate"
      type="warning"
      :closable="false"
      title="宿舍成员数据暂不可用，本任务仅提供只读页面壳。"
    />
    <el-descriptions class="form-placeholder" :column="1" border>
      <el-descriptions-item label="标题">{{ form.title || '-' }}</el-descriptions-item>
      <el-descriptions-item label="总金额">{{ form.totalAmount || '-' }}</el-descriptions-item>
      <el-descriptions-item label="发生日期">{{ form.occurredDate || '-' }}</el-descriptions-item>
      <el-descriptions-item label="截止时间">{{ form.dueTime || '-' }}</el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button @click="$emit('close')">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.form-placeholder {
  margin-top: 16px;
}
</style>
