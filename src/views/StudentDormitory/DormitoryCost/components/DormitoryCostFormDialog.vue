<script setup>
import { computed } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'

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
  loading: {
    type: Boolean,
    default: false
  },
  uploadingSourceVoucher: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit', 'update:form', 'source-voucher-change'])

const dialogTitle = computed(() => (props.mode === 'edit' ? '编辑公摊单' : '新建公摊单'))
const actionText = computed(() => (props.mode === 'edit' ? '保存修改' : '创建公摊单'))
const memberList = computed(() => (Array.isArray(props.form?.memberList) ? props.form.memberList : []))
const memberTotal = computed(() =>
  memberList.value.reduce((sum, item) => sum + Number(item?.amountDue || 0), 0)
)

const updateField = (key, value) => {
  emit('update:form', { [key]: value })
}

const updateMemberAmount = (index, value) => {
  const nextMemberList = memberList.value.map((item, itemIndex) =>
    itemIndex === index
      ? {
          ...item,
          amountDue: value ?? ''
        }
      : item
  )
  emit('update:form', { memberList: nextMemberList })
}

const handleUploadChange = (file) => {
  emit('source-voucher-change', file?.raw ?? file)
}

const clearSourceVoucher = () => {
  emit('update:form', {
    sourceVoucherAttachId: '',
    sourceVoucherUrl: ''
  })
}

const isImageUrl = (value) => {
  const url = String(value || '').toLowerCase()
  return ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'].some((ext) => url.includes(ext))
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="dialogTitle"
    class="cost-form-dialog"
    width="760px"
    top="4vh"
    destroy-on-close
    @close="emit('close')"
  >
    <el-form label-position="top" @submit.prevent>
      <div class="form-grid">
        <el-form-item label="标题" class="form-grid-span-2">
          <el-input
            :model-value="form.title"
            maxlength="100"
            show-word-limit
            placeholder="请输入公摊标题"
            @update:model-value="updateField('title', $event)"
          />
        </el-form-item>

        <el-form-item label="总金额">
          <el-input-number
            :model-value="Number(form.totalAmount || 0) || undefined"
            :min="0"
            :precision="2"
            :step="1"
            controls-position="right"
            class="full-width"
            placeholder="请输入总金额"
            @update:model-value="updateField('totalAmount', $event ?? '')"
          />
        </el-form-item>

        <el-form-item label="发生日期">
          <el-date-picker
            :model-value="form.occurredDate"
            type="date"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            class="full-width"
            placeholder="请选择发生日期"
            @update:model-value="updateField('occurredDate', $event || '')"
          />
        </el-form-item>

        <el-form-item label="截止日期">
          <el-date-picker
            :model-value="form.dueTime"
            type="datetime"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            class="full-width"
            placeholder="请选择截止时间"
            @update:model-value="updateField('dueTime', $event || '')"
          />
        </el-form-item>

        <el-form-item label="备注" class="form-grid-span-2">
          <el-input
            :model-value="form.remark"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="请输入费用说明"
            @update:model-value="updateField('remark', $event)"
          />
        </el-form-item>
      </div>

      <section class="form-section">
        <div class="section-header">
          <div class="section-heading">
            <h3>成员分摊明细</h3>
            <el-tooltip content="默认带出当前宿舍成员，请手动调整每个人的应缴金额。" placement="top">
              <el-icon class="section-hint">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <div class="member-total">
            合计 <strong>{{ memberTotal.toFixed(2) }}</strong>
          </div>
        </div>

        <div class="member-list">
          <article
            v-for="(member, index) in memberList"
            :key="member.detailId || member.studentId || index"
            class="member-item"
          >
            <div class="member-copy">
              <strong>{{ member.studentName || `成员 ${index + 1}` }}</strong>
              <span>{{ member.studentId || '-' }}</span>
            </div>
            <el-input-number
              :model-value="member.amountDue === '' ? undefined : Number(member.amountDue)"
              :min="0"
              :precision="2"
              :step="1"
              controls-position="right"
              class="member-amount-input"
              @update:model-value="updateMemberAmount(index, $event)"
            />
          </article>
        </div>
      </section>

      <section class="form-section">
        <div class="section-header">
          <div class="section-heading">
            <h3>费用原始凭证</h3>
            <el-tooltip content="可选上传账单、付款截图或 PDF，便于舍友核对费用来源。" placement="top">
              <el-icon class="section-hint">
                <QuestionFilled />
              </el-icon>
            </el-tooltip>
          </div>
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleUploadChange"
            accept=".jpg,.jpeg,.png,.pdf"
          >
            <el-button :loading="uploadingSourceVoucher">上传原始凭证</el-button>
          </el-upload>
        </div>
        <div class="voucher-panel">
          <template v-if="form.sourceVoucherUrl && isImageUrl(form.sourceVoucherUrl)">
            <div class="voucher-preview-row">
              <div class="voucher-preview-box">
                <el-image
                  class="voucher-preview-image"
                  :src="form.sourceVoucherUrl"
                  :preview-src-list="[form.sourceVoucherUrl]"
                  fit="cover"
                  preview-teleported
                />
                <button type="button" class="voucher-remove-button" @click="clearSourceVoucher">×</button>
              </div>
            </div>
          </template>
          <template v-else-if="form.sourceVoucherUrl">
            <div class="voucher-preview-row">
              <a :href="form.sourceVoucherUrl" target="_blank" rel="noreferrer">查看已上传凭证</a>
              <el-button plain @click="clearSourceVoucher">删除凭证</el-button>
            </div>
          </template>
          <span v-else-if="form.sourceVoucherAttachId">已上传凭证，等待预览地址返回</span>
          <span v-else>未上传原始凭证也可以直接提交</span>
        </div>
      </section>
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 12px;
}

.form-grid :deep(.el-form-item) {
  margin-bottom: 8px;
}

.form-grid :deep(.el-form-item__label) {
  padding-bottom: 4px;
}

.form-grid-span-2 {
  grid-column: 1 / -1;
}

.full-width {
  width: 100%;
}

.full-width :deep(.el-input-number__decrease),
.full-width :deep(.el-input-number__increase) {
  border-radius: 0;
}

.full-width :deep(.el-input-number .el-input__inner) {
  text-align: left !important;
}

.form-section {
  margin-top: 20px;
  padding: 16px;
  border: 1px solid #dde6f2;
  border-radius: 12px;
  background: #f8fbff;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.section-heading {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.section-header h3 {
  margin: 0;
  color: #122033;
  font-size: 16px;
}

.section-hint {
  color: #94a3b8;
  font-size: 14px;
  cursor: help;
}

.voucher-panel {
  padding: 12px 14px;
  border-radius: 10px;
  background: #fff;
  color: #475569;
  word-break: break-all;
}

.voucher-preview-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.voucher-preview-image {
  display: block;
  width: 112px;
  height: 112px;
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  border: 1px solid #d7e1ef;
}

.voucher-preview-box {
  position: relative;
  width: fit-content;
}

.voucher-remove-button {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.7);
  color: #fff;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.member-total {
  flex-shrink: 0;
  color: #475569;
  font-size: 14px;
}

.member-total strong {
  color: #122033;
  font-size: 18px;
}

.member-list {
  display: grid;
  gap: 10px;
}

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #fff;
}

.member-copy {
  display: grid;
  gap: 4px;
}

.member-copy strong {
  color: #122033;
  font-size: 14px;
}

.member-copy span {
  color: #64748b;
  font-size: 12px;
}

.member-amount-input {
  width: 180px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.cost-form-dialog :deep(.el-button) {
  border-radius: var(--el-border-radius-base);
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-grid-span-2 {
    grid-column: auto;
  }

  .section-header,
  .member-item {
    flex-direction: column;
    align-items: stretch;
  }

  .member-amount-input {
    width: 100%;
  }
}
</style>
