<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { onBeforeRouteLeave } from 'vue-router'
import { MdEditor, MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import {
  agreeConvention,
  editConventionDraft,
  fetchConventionAckState,
  fetchConventionHistory,
  fetchConventionVersionDetail,
  fetchMyRoomProfile,
  markConventionRead,
  publishConventionDraft,
  saveConventionDraft
} from '../../../api/student/convention'
import { showError, showSuccess } from '../../../util/message/message'
import { getCurrentUser } from '../../../util/user'

const PAGE_STATUS = Object.freeze({
  INIT: 'INIT',
  LOADING: 'LOADING',
  EMPTY: 'EMPTY',
  VIEW: 'VIEW',
  EDIT_DRAFT: 'EDIT_DRAFT',
  PUBLISHING: 'PUBLISHING',
  ACKING: 'ACKING',
  ERROR: 'ERROR'
})

const STATUS_TEXT = { 0: '草稿', 1: '已发布', 2: '已作废' }
const STATUS_TYPE = { 0: 'warning', 1: 'success', 2: 'info' }
const DRAFT_EDITOR_MODE = Object.freeze({
  CREATE: 'create',
  EDIT: 'edit',
  BACKFILL: 'backfill'
})

const pageStatus = ref(PAGE_STATUS.INIT)
const errorMessage = ref('')
const noRoomBinding = ref(false)
const publishDialogVisible = ref(false)
const currentUser = ref(getCurrentUser())

const roomInfo = ref({ roomId: '', roomName: '', roomNo: '' })
const currentConvention = ref(null)
const draftConvention = ref(null)
const editingConvention = ref(null)
const viewingVersion = ref(null)
const historyVersions = ref([])
const memberAckRows = ref([])
const ackState = ref({ agreedCount: 0, totalCount: 0, agreeStatus: 0 })

const historyDrawerVisible = ref(false)
const loadingHistory = ref(false)
const savingDraft = ref(false)
const publishing = ref(false)
const acking = ref(false)
const markingRead = ref(false)
const leftCollapsed = ref(false)

const draftForm = reactive({ title: '', content: '' })
const draftSnapshot = ref('')
const draftEditorMode = ref(DRAFT_EDITOR_MODE.CREATE)

const isEditable = computed(() => pageStatus.value === PAGE_STATUS.EDIT_DRAFT)
const isStudentUser = computed(() => String(currentUser.value?.userType ?? '') === '1')
const hasData = computed(() => Boolean(currentConvention.value || draftConvention.value))
const activeConvention = computed(() => viewingVersion.value || currentConvention.value)
const headerConvention = computed(() => {
  if (!isEditable.value) return activeConvention.value
  return editingConvention.value || draftConvention.value || { status: 0 }
})
const viewingCurrent = computed(() => !viewingVersion.value)
const isDraftDirty = computed(() => {
  const now = JSON.stringify({ title: draftForm.title, content: draftForm.content })
  return now !== draftSnapshot.value
})

const dormLabel = computed(() => roomInfo.value.roomName || roomInfo.value.roomNo || '-')
const currentVersionText = computed(() => {
  const versionNo = currentConvention.value?.versionNo ?? ''
  return versionNo ? `v${versionNo}` : '-'
})
const publishTimeText = computed(() => formatDateTime(currentConvention.value?.publishTime))
const isDraftState = computed(
  () => isEditable.value || Number(activeConvention.value?.status) === 0
)
const draftUpdateTimeText = computed(() => {
  const source = isEditable.value ? headerConvention.value : activeConvention.value
  return formatDateTime(source?.updateTime ?? source?.publishTime)
})
const draftUpdateByText = computed(() => {
  const source = isEditable.value ? headerConvention.value : activeConvention.value
  return source?.updateBy || source?.publisherName || '-'
})
const ackText = computed(() => `${ackState.value.agreedCount} / ${ackState.value.totalCount} 人`)
const myAckLabel = computed(() => {
  if (Number(ackState.value.agreeStatus) === 2) return '已同意'
  if (Number(ackState.value.agreeStatus) === 1) return '已读'
  return '未读'
})
const myAckType = computed(() => {
  if (Number(ackState.value.agreeStatus) === 2) return 'success'
  if (Number(ackState.value.agreeStatus) === 1) return 'warning'
  return 'info'
})
const conventionStatusText = computed(() => STATUS_TEXT[Number(headerConvention.value?.status)] || '未知')
const conventionStatusType = computed(() => STATUS_TYPE[Number(headerConvention.value?.status)] || 'info')
const readMarkdownText = computed(() => activeConvention.value?.content || '')
const showMemberAckPanel = computed(
  () => !isEditable.value && Number(activeConvention.value?.status) === 1
)
const publishTargetConvention = computed(() => {
  if (isEditable.value) return editingConvention.value || draftConvention.value || null
  if (Number(activeConvention.value?.status) === 0) return activeConvention.value
  return draftConvention.value || null
})

const agreeDisabled = computed(
  () => acking.value || !activeConvention.value || Number(ackState.value.agreeStatus) === 2
)
const readDisabled = computed(
  () =>
    markingRead.value ||
    !activeConvention.value ||
    Number(ackState.value.agreeStatus) >= 1
)
const publishDisabled = computed(() => {
  if (publishing.value || pageStatus.value === PAGE_STATUS.LOADING) return true
  if (isEditable.value && isDraftDirty.value) return true
  if (!publishTargetConvention.value?.id) return true
  const contentText = isEditable.value ? draftForm.content : publishTargetConvention.value?.content
  return !String(contentText || '').trim()
})
const mdToolbars = [
  'bold',
  'underline',
  'italic',
  'strikeThrough',
  'title',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  'code',
  'link',
  'table',
  'revoke',
  'next',
  '=',
  'pageFullscreen',
  'preview'
]

const normalizeData = (payload) =>
  payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload

const normalizeList = (payload) => {
  const data = normalizeData(payload)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.list)) return data.list
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.records)) return data.records
  return []
}

const normalizeConvention = (payload) => {
  const source = normalizeData(payload)
  if (!source || typeof source !== 'object') return null
  const title = source.title ?? source.name ?? ''
  const content = source.contentMd ?? source.content ?? source.body ?? source.markdown ?? ''
  if (!title && !content && !source.id) return null
  return {
    id: source.id ?? source.versionId ?? source.conventionId ?? '',
    roomId: source.roomId ?? source.room_id ?? source.dormitoryId ?? source.dormitory_id ?? '',
    roomName: source.roomName ?? source.roomNum ?? source.dormitoryName ?? '',
    versionNo: source.versionNo ?? source.versionNum ?? source.version ?? '',
    title: title || '未命名公约',
    content: String(content || ''),
    status: Number(source.status ?? source.versionStatus ?? source.state ?? 1),
    isCurrent: Boolean(source.isCurrent ?? source.currentFlag ?? false),
    editable: Boolean(source.editable ?? source.canEdit ?? false),
    publisherName:
      source.publishBy ?? source.publisherName ?? source.publishUserName ?? source.createByName ?? '',
    publishTime: source.publishTime ?? source.releaseTime ?? source.updateTime ?? source.createTime ?? '',
    updateBy:
      source.updateBy ?? source.updateUserName ?? source.modifyBy ?? source.modifierName ?? '',
    updateTime: source.updateTime ?? source.modifyTime ?? source.update_at ?? ''
  }
}

const normalizeConventionList = (payload) =>
  normalizeList(payload).map((item) => normalizeConvention(item)).filter(Boolean)

const resolveProfileRoomId = (payload) => {
  const source = normalizeData(payload) || {}
  const sourceRoom = source.room || source.dormitory || {}
  return String(
    source.roomId ??
      source.room_id ??
      source.dormitoryId ??
      source.dormitory_id ??
      sourceRoom.id ??
      ''
  ).trim()
}

const normalizeRoomInfo = (payload) => {
  const source = normalizeData(payload) || {}
  const user = getCurrentUser() || {}
  const sourceRoom = source.room || source.dormitory || {}
  const userRoom = user.room || user.dormitory || {}
  return {
    roomId:
      source.roomId ??
      source.room_id ??
      source.dormitoryId ??
      source.dormitory_id ??
      sourceRoom.id ??
      user.roomId ??
      user.room_id ??
      user.dormitoryId ??
      user.dormitory_id ??
      user.currentRoomId ??
      userRoom.id ??
      '',
    roomName:
      source.roomName ??
      source.roomNum ??
      source.dormitoryName ??
      sourceRoom.name ??
      sourceRoom.roomName ??
      user.roomName ??
      user.roomNum ??
      user.dormitoryName ??
      userRoom.name ??
      userRoom.roomName ??
      '',
    roomNo:
      source.roomNo ??
      source.room_num ??
      source.roomNum ??
      sourceRoom.roomNo ??
      sourceRoom.roomNum ??
      user.roomNo ??
      user.room_num ??
      user.roomNum ??
      userRoom.roomNo ??
      userRoom.roomNum ??
      ''
  }
}

const normalizeAckState = (payload) => {
  const source = normalizeData(payload) || {}
  return {
    agreedCount: Number(source.agreedCount ?? source.agreeCount ?? source.agreeNum ?? 0),
    totalCount: Number(source.totalCount ?? source.totalNum ?? source.memberTotal ?? 0),
    agreeStatus: Number(source.agreeStatus ?? source.status ?? 0)
  }
}

const normalizeMemberAckList = (payload) =>
  normalizeList(payload).map((item, index) => ({
    id: item?.studentId ?? item?.id ?? String(index),
    studentId: item?.studentId ?? item?.id ?? '-',
    studentName:
      item?.studentName ??
      item?.realName ??
      item?.name ??
      item?.userName ??
      item?.username ??
      '-',
    agreeStatus: Number(item?.agreeStatus ?? item?.status ?? 0),
    readTime: item?.readTime ?? item?.read_at ?? '',
    agreeTime: item?.agreeTime ?? item?.agree_at ?? ''
  }))

const formatDateTime = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).replace('T', ' ').slice(0, 16)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const syncDraftSnapshot = () => {
  draftSnapshot.value = JSON.stringify({ title: draftForm.title, content: draftForm.content })
}

const openDraftEditor = (convention) => {
  const source = convention || {}
  viewingVersion.value = null
  editingConvention.value = {
    ...source,
    status: Number(source.status ?? 0)
  }
  draftEditorMode.value =
    source.mode ??
    (Number(source.status) === 0 && source.id ? DRAFT_EDITOR_MODE.EDIT : DRAFT_EDITOR_MODE.CREATE)
  draftForm.title = source.title || ''
  draftForm.content = source.content || ''
  syncDraftSnapshot()
  pageStatus.value = PAGE_STATUS.EDIT_DRAFT
}

const resetDraftForm = () => {
  editingConvention.value = null
  draftEditorMode.value = DRAFT_EDITOR_MODE.CREATE
  draftForm.title = ''
  draftForm.content = ''
  syncDraftSnapshot()
}

const defaultDraft = () => {
  const source = currentConvention.value || viewingVersion.value
  if (!source) {
    return {
      title: '宿舍公约（首版）',
      content:
        '# 宿舍公约\n\n1. 保持公共区域整洁。\n2. 共同维护作息秩序。\n3. 爱护宿舍公共设施。\n\n> 本公约由宿舍成员共同维护。'
    }
  }
  const title = String(source.title || '').trim()
  const content = String(source.content || '').trim()
  return {
    title: title || '宿舍公约',
    content:
      content ||
      '# 宿舍公约\n\n1. 保持公共区域整洁。\n2. 共同维护作息秩序。\n3. 爱护宿舍公共设施。\n\n> 本公约由宿舍成员共同维护。'
  }
}

const applyRoomCurrentPayload = (payload) => {
  const source = normalizeData(payload) || {}
  roomInfo.value = normalizeRoomInfo(source)

  const directConvention = normalizeConvention(source)
  currentConvention.value =
    normalizeConvention(
      source.currentConvention ??
        source.current ??
        source.currentVersion ??
        source.convention ??
        source.currentInfo
    ) || directConvention

  draftConvention.value = normalizeConvention(
    source.draftConvention ?? source.draft ?? source.editingDraft ?? source.draftInfo
  )
}

const refreshMainData = async (initialPayload) => {
  const payload =
    initialPayload ??
    (await fetchMyRoomProfile().catch((error) =>
      error?.status === 404 ? null : Promise.reject(error)
    ))
  applyRoomCurrentPayload(payload)
}

const getActiveRoomId = () =>
  roomInfo.value.roomId || currentConvention.value?.roomId || draftConvention.value?.roomId || ''

const resetAckState = () => {
  ackState.value = { agreedCount: 0, totalCount: 0, agreeStatus: 0 }
  memberAckRows.value = []
}

const loadAckStateByConvention = async (convention, silent = true) => {
  const conventionId = convention?.id
  const conventionStatus = Number(convention?.status)
  if (!conventionId || conventionStatus !== 1) {
    resetAckState()
    return
  }
  try {
    const payload = await fetchConventionAckState(conventionId)
    const source = normalizeData(payload) || {}
    ackState.value = normalizeAckState(source)
    memberAckRows.value = normalizeMemberAckList(source.memberAckList)
  } catch (error) {
    resetAckState()
    if (!silent) showError(error, '加载宿舍人员阅读情况失败')
  }
}

const loadAckStateForDisplay = async (silent = true) =>
  loadAckStateByConvention(activeConvention.value || currentConvention.value, silent)

const loadHistory = async () => {
  const roomId = getActiveRoomId()
  if (!roomId) {
    showError(null, '未获取到宿舍ID，无法查询历史/草稿')
    return
  }
  loadingHistory.value = true
  try {
    const payload = await fetchConventionHistory(roomId)
    historyVersions.value = normalizeConventionList(payload)
  } catch (error) {
    showError(error, '加载历史/草稿失败')
  } finally {
    loadingHistory.value = false
  }
}

const handleLoadError = (error) => {
  if (error?.status === 403) {
    errorMessage.value = '无权限访问该宿舍公约'
    pageStatus.value = PAGE_STATUS.ERROR
    return showError(error, '无权限访问该宿舍公约')
  }
  const message = String(error?.message || '')
  if (error?.status === 404 && /room|宿舍|未分配|未绑定/i.test(message)) {
    noRoomBinding.value = true
    pageStatus.value = PAGE_STATUS.EMPTY
    return
  }
  errorMessage.value = message || '页面数据加载失败'
  pageStatus.value = PAGE_STATUS.ERROR
  showError(error, '页面数据加载失败')
}

const syncCurrentUser = () => {
  currentUser.value = getCurrentUser()
}

const resetPageState = () => {
  pageStatus.value = PAGE_STATUS.INIT
  errorMessage.value = ''
  noRoomBinding.value = false
  publishDialogVisible.value = false
  historyDrawerVisible.value = false
  roomInfo.value = { roomId: '', roomName: '', roomNo: '' }
  currentConvention.value = null
  draftConvention.value = null
  editingConvention.value = null
  viewingVersion.value = null
  historyVersions.value = []
  memberAckRows.value = []
  resetAckState()
  resetDraftForm()
}

const loadPageData = async () => {
  if (!isStudentUser.value) {
    resetPageState()
    return
  }
  pageStatus.value = PAGE_STATUS.LOADING
  errorMessage.value = ''
  noRoomBinding.value = false
  viewingVersion.value = null
  resetDraftForm()
  try {
    const payload = await fetchMyRoomProfile().catch((error) =>
      error?.status === 404 ? null : Promise.reject(error)
    )
    await refreshMainData(payload)
    noRoomBinding.value = !resolveProfileRoomId(payload)
    await loadAckStateForDisplay()
    pageStatus.value = noRoomBinding.value ? PAGE_STATUS.EMPTY : hasData.value ? PAGE_STATUS.VIEW : PAGE_STATUS.EMPTY
  } catch (error) {
    handleLoadError(error)
  }
}

const handleCreateDraft = () => {
  if (noRoomBinding.value) return showError(null, '当前学生暂未分配宿舍，无法创建草稿')
  openDraftEditor({ title: '', content: '', status: 0, mode: DRAFT_EDITOR_MODE.CREATE })
}

const handleHistoryOrDraft = () => {
  if (draftConvention.value) {
    openDraftEditor({ ...draftConvention.value, mode: DRAFT_EDITOR_MODE.EDIT })
    return
  }
  historyDrawerVisible.value = true
  loadHistory()
}

const handleCancelEdit = async () => {
  if (isDraftDirty.value) {
    try {
      await ElMessageBox.confirm('当前草稿未保存，确定放弃编辑吗？', '离开编辑', {
        type: 'warning',
        confirmButtonText: '放弃',
        cancelButtonText: '继续编辑'
      })
    } catch {
      return
    }
  }
  editingConvention.value = null
  draftEditorMode.value = DRAFT_EDITOR_MODE.CREATE
  pageStatus.value = hasData.value ? PAGE_STATUS.VIEW : PAGE_STATUS.EMPTY
}

const handleSaveDraft = async () => {
  const titleText = String(draftForm.title || '').trim()
  if (!titleText) {
    showError(null, '标题不能为空')
    return
  }
  if (titleText.length > 100) {
    showError(null, '标题长度需在 1-100 之间')
    return
  }
  const contentText = String(draftForm.content || '').trim()
  if (!contentText) {
    showError(null, '公约正文不能为空')
    return
  }
  if (contentText.length < 20) {
    showError(null, '公约正文最少 20 个字符')
    return
  }
  savingDraft.value = true
  try {
    const payload = {
      roomId: roomInfo.value.roomId || currentConvention.value?.roomId || undefined,
      title: draftForm.title.trim(),
      contentMd: draftForm.content.trim()
    }
    const isEditMode =
      draftEditorMode.value === DRAFT_EDITOR_MODE.EDIT && Boolean(editingConvention.value?.id)
    const response = isEditMode
      ? await editConventionDraft(editingConvention.value.id, payload)
      : await saveConventionDraft(payload)
    draftConvention.value = normalizeConvention(response) || {
      id: isEditMode ? editingConvention.value?.id : '',
      roomId: payload.roomId || '',
      title: payload.title,
      content: payload.contentMd,
      status: 0
    }
    editingConvention.value = draftConvention.value
    draftEditorMode.value = DRAFT_EDITOR_MODE.EDIT
    syncDraftSnapshot()
    pageStatus.value = PAGE_STATUS.VIEW
    showSuccess(isEditMode ? '草稿编辑成功' : '草稿保存成功')
    await refreshMainData()
  } catch (error) {
    showError(error, draftEditorMode.value === DRAFT_EDITOR_MODE.EDIT ? '草稿编辑失败' : '草稿保存失败')
  } finally {
    savingDraft.value = false
  }
}

const handlePublish = async () => {
  if (publishing.value) return
  const publishId = publishTargetConvention.value?.id
  if (!publishId) {
    showError(null, '请先保存草稿后再发布')
    return
  }
  publishDialogVisible.value = false
  publishing.value = true
  pageStatus.value = PAGE_STATUS.PUBLISHING
  try {
    await publishConventionDraft(publishId)
    showSuccess('公约发布成功')
    await refreshMainData()
    await loadAckStateForDisplay()
    await loadHistory()
    viewingVersion.value = null
    pageStatus.value = PAGE_STATUS.VIEW
  } catch (error) {
    if (error?.status === 409 || /版本已变化/i.test(String(error?.message || ''))) {
      showError(null, '发布失败：版本已变化，请刷新后重试')
    } else {
      showError(error, '发布失败')
    }
    pageStatus.value = hasData.value ? PAGE_STATUS.VIEW : PAGE_STATUS.EMPTY
  } finally {
    publishing.value = false
  }
}

const handleRead = async () => {
  if (readDisabled.value) return
  markingRead.value = true
  try {
    await markConventionRead({
      conventionId: activeConvention.value?.id
    })
    showSuccess('已标记已读')
    await loadAckStateByConvention(activeConvention.value, false)
  } catch (error) {
    showError(error, '标记已读失败')
  } finally {
    markingRead.value = false
  }
}

const handleAgree = async () => {
  if (agreeDisabled.value) return
  acking.value = true
  pageStatus.value = PAGE_STATUS.ACKING
  try {
    await agreeConvention({
      conventionId: activeConvention.value?.id
    })
    showSuccess('已确认同意')
    await loadAckStateByConvention(activeConvention.value, false)
    pageStatus.value = PAGE_STATUS.VIEW
  } catch (error) {
    showError(error, '确认同意失败')
    pageStatus.value = hasData.value ? PAGE_STATUS.VIEW : PAGE_STATUS.EMPTY
  } finally {
    acking.value = false
  }
}

const handleBackToCurrentVersion = async () => {
  viewingVersion.value = null
  await loadAckStateByConvention(currentConvention.value)
}

const handleViewVersion = async (row) => {
  if (!row) return
  try {
    if (row.content) {
      editingConvention.value = null
      draftEditorMode.value = DRAFT_EDITOR_MODE.CREATE
      pageStatus.value = PAGE_STATUS.VIEW
      viewingVersion.value = row
      await loadAckStateByConvention(viewingVersion.value)
      historyDrawerVisible.value = false
      return
    }
    const payload = await fetchConventionVersionDetail(row.id)
    editingConvention.value = null
    draftEditorMode.value = DRAFT_EDITOR_MODE.CREATE
    pageStatus.value = PAGE_STATUS.VIEW
    viewingVersion.value = normalizeConvention(payload) || row
    await loadAckStateByConvention(viewingVersion.value)
    historyDrawerVisible.value = false
  } catch (error) {
    showError(error, '获取版本详情失败')
  }
}

const handleBackfill = async (row) => {
  if (!row) return
  const payload = await fetchConventionVersionDetail(row.id)
  const detail = normalizeConvention(payload)
  if (!detail) return showError(null, '该版本内容为空，无法回填')
  openDraftEditor({ ...detail, status: 0, versionNo: '', mode: DRAFT_EDITOR_MODE.BACKFILL })
  historyDrawerVisible.value = false
  showSuccess('已回填为草稿')
}

const handleEditDraft = async (row) => {
  if (!row) return
  if (Number(row.status) !== 0) return
  if (row.editable !== true) return
  try {
    const payload = await fetchConventionVersionDetail(row.id)
    const detail = normalizeConvention(payload)
    if (!detail) return showError(null, '该草稿内容为空，无法编辑')
    openDraftEditor({ ...detail, mode: DRAFT_EDITOR_MODE.EDIT })
    historyDrawerVisible.value = false
  } catch (error) {
    showError(error, '获取草稿详情失败')
  }
}

const handleBeforeUnload = (event) => {
  if (!isEditable.value || !isDraftDirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

onBeforeRouteLeave(async () => {
  if (!isEditable.value || !isDraftDirty.value) return true
  try {
    await ElMessageBox.confirm('草稿尚未保存，确定离开当前页面吗？', '离开确认', {
      type: 'warning',
      confirmButtonText: '离开',
      cancelButtonText: '取消'
    })
    return true
  } catch {
    return false
  }
})

onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('beforeunload', handleBeforeUnload)
  if (typeof window !== 'undefined') window.addEventListener('user-updated', syncCurrentUser)
  if (isStudentUser.value) {
    loadPageData()
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('beforeunload', handleBeforeUnload)
  if (typeof window !== 'undefined') window.removeEventListener('user-updated', syncCurrentUser)
})

watch(isStudentUser, (isStudent) => {
  if (isStudent) {
    loadPageData()
    return
  }
  resetPageState()
})
</script>

<template>
  <section class="convention-page" v-loading="pageStatus === PAGE_STATUS.LOADING">
    <el-card v-if="!isStudentUser" shadow="never">
      <el-empty description="当前用户不是学生" />
    </el-card>

    <el-card v-else-if="pageStatus === PAGE_STATUS.ERROR" shadow="never">
      <el-result icon="error" :title="errorMessage || '接口请求失败'" sub-title="请重试或稍后再试">
        <template #extra>
          <el-button type="primary" @click="loadPageData">重试</el-button>
        </template>
      </el-result>
    </el-card>

    <el-card v-else-if="noRoomBinding" shadow="never">
      <el-empty description="当前学生暂未分配宿舍" />
    </el-card>

    <div v-else class="layout-wrap" :class="{ 'left-collapsed': leftCollapsed }">
      <div class="left-panel-wrap">
        <el-card class="left-panel" :class="{ 'is-collapsed': leftCollapsed }" shadow="never">
          <template #header>
            <div class="left-header">
              <template v-if="!leftCollapsed">
                <span>宿舍公约</span>
                <div class="left-header-actions">
                  <el-button size="small" type="primary" plain @click="handleCreateDraft">新建草稿</el-button>
                  <el-button size="small" @click="handleHistoryOrDraft">历史/草稿</el-button>
                </div>
              </template>
            </div>
          </template>
          <template v-if="!leftCollapsed">
            <template v-if="isDraftState">
              <div class="kv-line"><span>宿舍号</span><strong>{{ dormLabel }}</strong></div>
              <div class="kv-line"><span>修改人</span><strong>{{ draftUpdateByText }}</strong></div>
              <div class="kv-line"><span>修改时间</span><strong>{{ draftUpdateTimeText }}</strong></div>
              <div class="left-actions draft-actions">
                <el-button v-if="!viewingCurrent" @click="handleBackToCurrentVersion">返回当前版本</el-button>
                <el-button
                  type="primary"
                  :disabled="publishDisabled"
                  :loading="publishing"
                  @click="publishDialogVisible = true"
                >
                  发布草稿
                </el-button>
              </div>
            </template>
            <template v-else>
              <div class="kv-line"><span>宿舍号</span><strong>{{ dormLabel }}</strong></div>
              <div class="kv-line"><span>当前版本</span><strong>{{ currentVersionText }}</strong></div>
              <div class="kv-line"><span>已同意</span><strong>{{ ackText }}</strong></div>
              <div class="kv-line"><span>发布时间</span><strong>{{ publishTimeText }}</strong></div>
              <div class="kv-line">
                <span>状态</span>
                <el-tag :type="myAckType">{{ myAckLabel }}</el-tag>
              </div>

              <div class="left-actions">
                <el-button
                  v-if="hasData && Number(activeConvention?.status) !== 1"
                  type="primary"
                  :disabled="publishDisabled"
                  :loading="publishing"
                  @click="publishDialogVisible = true"
                >
                  发布草稿
                </el-button>
                <el-button v-if="!viewingCurrent" @click="handleBackToCurrentVersion">返回当前版本</el-button>
              </div>

              <div class="ack-actions">
                <el-button size="small" :disabled="readDisabled" :loading="markingRead" @click="handleRead">
                  标记已读
                </el-button>
                <el-button size="small" type="success" :disabled="agreeDisabled" :loading="acking" @click="handleAgree">
                  阅读并同意
                </el-button>
              </div>
            </template>
          </template>
        </el-card>
        <el-button class="left-collapse-handle" :class="{ 'is-collapsed': leftCollapsed }" @click="leftCollapsed = !leftCollapsed">
          {{ leftCollapsed ? '>' : '<' }}
        </el-button>
      </div>

      <div class="right-panel" :class="{ 'with-ack': showMemberAckPanel }">
        <el-card class="right-top" :class="{ 'is-editing': isEditable }" shadow="never">
          <template #header>
            <div class="header-row">
              <div class="header-main">
                <el-input
                  v-if="isEditable"
                  v-model="draftForm.title"
                  class="header-title-input"
                  maxlength="100"
                  show-word-limit
                  placeholder="请输入公约标题（1-100）"
                />
                <h3 v-else class="title">{{ activeConvention?.title || '当前版本内容' }}</h3>
                <div class="header-tags" v-if="headerConvention">
                  <el-tag
                    v-if="
                      !isEditable &&
                      headerConvention.versionNo !== '' &&
                      headerConvention.versionNo !== null &&
                      headerConvention.versionNo !== undefined
                    "
                    size="small"
                  >
                    v{{ headerConvention.versionNo }}
                  </el-tag>
                  <el-tag size="small" :type="conventionStatusType">{{ conventionStatusText }}</el-tag>
                </div>
              </div>
              <div class="header-actions" v-if="isEditable">
                <el-button @click="handleCancelEdit">取消编辑</el-button>
                <el-button type="primary" :loading="savingDraft" @click="handleSaveDraft">保存草稿</el-button>
              </div>
            </div>
          </template>

          <template v-if="isEditable">
            <MdEditor
              v-model="draftForm.content"
              :toolbars="mdToolbars"
              class="md-editor"
            />
          </template>
          <template v-else-if="pageStatus === PAGE_STATUS.EMPTY">
            <el-empty description="该宿舍暂无公约">
              <el-button type="primary" @click="handleCreateDraft">创建首版公约</el-button>
            </el-empty>
          </template>
          <template v-else>
            <div class="content-scroll">
              <MdPreview :model-value="readMarkdownText" class="md-preview" />
            </div>
          </template>
        </el-card>

        <el-card v-if="showMemberAckPanel" class="right-bottom" shadow="never">
          <template #header>宿舍人员阅读情况</template>
          <el-table :data="memberAckRows" border stripe height="100%">
            <el-table-column type="index" label="#" width="56" align="center" />
            <el-table-column prop="studentName" label="成员姓名" min-width="120" />
            <el-table-column label="同意状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="
                    row.agreeStatus === 2 ? 'success' : row.agreeStatus === 1 ? 'warning' : 'info'
                  "
                >
                  {{
                    row.agreeStatus === 2 ? '已同意' : row.agreeStatus === 1 ? '已读' : '未读'
                  }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="阅读时间" min-width="150">
              <template #default="{ row }">{{ formatDateTime(row.readTime) }}</template>
            </el-table-column>
            <el-table-column label="同意时间" min-width="150">
              <template #default="{ row }">{{ formatDateTime(row.agreeTime) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </div>

    <el-drawer v-model="historyDrawerVisible" title="版本历史" direction="rtl" size="760px" :z-index="3000">
      <div class="history-wrap" v-loading="loadingHistory">
        <el-table :data="historyVersions" border stripe height="100%">
          <el-table-column
            prop="title"
            label="标题"
            width="240"
            fixed="left"
            show-overflow-tooltip
          />
          <el-table-column label="版本号" width="88" align="center">
            <template #default="{ row }">{{ row.versionNo ? `v${row.versionNo}` : '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="88" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="STATUS_TYPE[Number(row.status)] || 'info'">
                {{ STATUS_TEXT[Number(row.status)] || '未知' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="发布人" min-width="100">
            <template #default="{ row }">{{ row.publisherName || '-' }}</template>
          </el-table-column>
          <el-table-column label="发布时间" min-width="150">
            <template #default="{ row }">{{ formatDateTime(row.publishTime) }}</template>
          </el-table-column>
          <el-table-column label="修改人" min-width="100">
            <template #default="{ row }">{{ row.updateBy || '-' }}</template>
          </el-table-column>
          <el-table-column label="修改时间" min-width="150">
            <template #default="{ row }">{{ formatDateTime(row.updateTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleViewVersion(row)">查看</el-button>
              <el-button link @click="handleBackfill(row)">回填草稿</el-button>
              <el-button
                v-if="Number(row.status) === 0"
                link
                :disabled="row.editable !== true"
                @click="handleEditDraft(row)"
              >
                编辑
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <el-dialog v-model="publishDialogVisible" title="发布确认" width="420px" align-center>
      <p>发布后将成为当前版本，是否继续？</p>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="publishDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="publishing" @click="handlePublish">确认发布</el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.convention-page :deep(.el-button) {
  border-radius: var(--el-border-radius-base);
}

.convention-page {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.layout-wrap {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 12px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.layout-wrap.left-collapsed {
  grid-template-columns: 0 1fr;
  gap: 0;
  overflow: visible;
}

.left-panel-wrap {
  position: relative;
  min-height: 0;
  height: 100%;
  overflow: visible;
}

.left-panel,
.right-top,
.right-bottom {
  border-radius: 10px;
  border: 1px solid #e6ecf5;
}

.left-panel {
  height: 100%;
}

.left-panel :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.kv-line {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.kv-line strong {
  color: #1f2937;
}

.left-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.left-header-actions {
  display: inline-flex;
  margin-left: auto;
  justify-content: flex-end;
  gap: 4px;
  flex-wrap: nowrap;
}

.left-header-actions :deep(.el-button) {
  border-radius: var(--el-border-radius-base);
}

.left-collapse-handle {
  position: absolute;
  right: -10px;
  top: 56%;
  transform: translateY(-50%);
  z-index: 6;
  min-width: 22px;
  width: 22px;
  height: 48px;
  padding: 0;
  border: 1px solid #d6deeb;
  border-radius: var(--el-border-radius-base);
  background: #ffffff;
  color: #6b7280;
}

.left-collapse-handle:hover {
  color: #334155;
  border-color: #c4d0e2;
  background: #f8fafc;
}

.left-collapse-handle :deep(span) {
  font-size: 12px;
  font-weight: 700;
}

.left-collapse-handle.is-collapsed :deep(span) {
  display: inline-block;
  transform: translateX(2px);
}

.left-panel.is-collapsed :deep(.el-card__header) {
  display: none;
}

.left-panel.is-collapsed :deep(.el-card__body) {
  display: none;
}

.layout-wrap.left-collapsed .left-panel {
  display: none;
}

.layout-wrap.left-collapsed .left-panel-wrap {
  width: 0;
}

.layout-wrap.left-collapsed .left-collapse-handle {
  left: -9px;
  right: auto;
}

.left-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.draft-actions {
  margin-top: auto;
}

.draft-actions :deep(.el-button) {
  width: 100%;
}

.draft-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.ack-actions {
  margin-top: auto;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.right-panel {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}

.right-panel.with-ack {
  grid-template-rows: minmax(0, 2fr) minmax(0, 1fr);
}

.right-top {
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-bottom {
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-top :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.right-top.is-editing :deep(.el-card__body) {
  padding: 0;
}

.right-top.is-editing {
  border-color: transparent;
}

.right-bottom :deep(.el-card__body) {
  min-height: 0;
  overflow: hidden;
  padding: 0;
}

.header-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.title {
  margin: 0;
  font-size: 17px;
  color: #1f2937;
  flex: 1;
  min-width: 0;
}

.header-title-input {
  flex: 1;
  min-width: 320px;
}

.header-tags {
  display: inline-flex;
  gap: 6px;
  flex-shrink: 0;
}

.header-actions {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

.md-editor {
  width: 100%;
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 1;
}

.md-preview {
  min-height: 100%;
}

.content-scroll {
  position: relative;
  z-index: 1;
}
.content-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.history-wrap {
  height: calc(100vh - 140px);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 1200px) {
  .layout-wrap {
    grid-template-columns: 1fr;
  }

  .right-panel {
    grid-template-rows: minmax(420px, auto);
  }

  .right-panel.with-ack {
    grid-template-rows: minmax(420px, auto) minmax(280px, auto);
  }
}

@media (max-width: 900px) {
  .header-row {
    flex-direction: column;
  }

  .header-main {
    width: 100%;
  }
}
</style>

