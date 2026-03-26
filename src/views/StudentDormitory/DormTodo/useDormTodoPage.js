import { reactive } from 'vue'
import * as dormTodoApi from '../../../api/student/dormTodo'
import { showError } from '../../../util/message/message'
import { getCurrentUser } from '../../../util/user'

const createEmptyForm = () => ({
  id: '',
  title: '',
  content: '',
  priority: '2',
  assigneeStudentId: '',
  dueTime: ''
})

const createInitialState = () => ({
  stat: {
    loading: false,
    data: {
      roomId: '',
      buildingNum: '',
      roomNum: '',
      totalCount: 0,
      pendingCount: 0,
      processingCount: 0,
      weekCompletedCount: 0
    }
  },
  filters: {
    keywords: '',
    status: '',
    priority: '',
    assigneeStudentId: '',
    dueType: '',
    onlyMine: false,
    pageNum: 1,
    pageSize: 10
  },
  assigneeOptions: {
    loading: false,
    data: [{ label: '全部', value: '' }]
  },
  list: {
    loading: false,
    items: [],
    total: 0,
    selectedId: ''
  },
  detail: {
    visible: false,
    loading: false,
    data: null,
    comments: [],
    commentLoading: false
  },
  form: createEmptyForm(),
  commentDraft: '',
  ui: {
    pageLoading: false,
    formVisible: false,
    formMode: 'create',
    submitLoading: false,
    startLoading: false,
    completeLoading: false,
    cancelLoading: false,
    commentSubmitting: false
  }
})

const resolveCurrentStudentId = (user) => String(user?.studentId ?? user?.id ?? '')

export function createDormTodoPageModel(deps = {}) {
  const api = deps.api ?? dormTodoApi
  const readCurrentUser = deps.getCurrentUser ?? getCurrentUser
  const onError = deps.showError ?? showError
  const state = reactive(createInitialState())

  const buildListParams = () => ({
    keywords: state.filters.keywords.trim(),
    status: state.filters.status,
    priority: state.filters.priority,
    assigneeStudentId: state.filters.onlyMine
      ? resolveCurrentStudentId(readCurrentUser())
      : state.filters.assigneeStudentId,
    dueType: state.filters.dueType,
    pageNum: state.filters.pageNum,
    pageSize: state.filters.pageSize
  })

  const updateFilters = (nextFilters = {}) => {
    Object.assign(state.filters, nextFilters)
  }

  const updateForm = (nextForm = {}) => {
    Object.assign(state.form, nextForm)
  }

  const updateCommentDraft = (value = '') => {
    state.commentDraft = String(value || '')
  }

  const closeForm = () => {
    state.ui.formVisible = false
  }

  const loadStat = async () => {
    state.stat.loading = true
    try {
      state.stat.data = await api.fetchDormTodoStat()
    } catch (error) {
      onError(error, '加载待办统计失败')
      state.stat.data = createInitialState().stat.data
    } finally {
      state.stat.loading = false
    }
  }

  const loadAssigneeOptions = async () => {
    state.assigneeOptions.loading = true
    try {
      const options = await api.fetchDormTodoAssigneeOptions()
      state.assigneeOptions.data = [{ label: '全部', value: '' }, ...options]
    } catch (error) {
      onError(error, '加载负责人选项失败')
      state.assigneeOptions.data = [{ label: '全部', value: '' }]
    } finally {
      state.assigneeOptions.loading = false
    }
  }

  const loadList = async () => {
    state.list.loading = true
    try {
      const data = await api.fetchDormTodoList(buildListParams())
      state.list.items = Array.isArray(data?.list) ? data.list : []
      state.list.total = Number(data?.total || 0)
    } catch (error) {
      onError(error, '加载待办列表失败')
      state.list.items = []
      state.list.total = 0
    } finally {
      state.list.loading = false
    }
  }

  const loadComments = async (todoId = state.list.selectedId) => {
    if (!todoId) return
    state.detail.commentLoading = true
    try {
      state.detail.comments = await api.fetchDormTodoCommentList(todoId)
    } catch (error) {
      onError(error, '加载评论失败')
      state.detail.comments = []
    } finally {
      state.detail.commentLoading = false
    }
  }

  const handleSelectTodo = async (item) => {
    const todoId = item?.id
    if (!todoId) return
    state.list.selectedId = todoId
    state.detail.visible = true
    state.detail.loading = true
    state.detail.comments = []
    state.commentDraft = ''
    try {
      const detail = await api.fetchDormTodoDetail(todoId)
      state.detail.data = detail
      state.detail.comments = Array.isArray(detail?.commentList) ? detail.commentList : []
    } catch (error) {
      onError(error, '加载待办详情失败')
      state.detail.data = null
      state.detail.comments = []
    } finally {
      state.detail.loading = false
    }
  }

  const refreshAfterMutation = async () => {
    const tasks = [loadStat(), loadList()]
    if (state.list.selectedId) {
      tasks.push(handleSelectTodo({ id: state.list.selectedId }))
    }
    await Promise.all(tasks)
  }

  const openCreate = () => {
    Object.assign(state.form, createEmptyForm())
    state.ui.formMode = 'create'
    state.ui.formVisible = true
  }

  const openEdit = () => {
    if (!state.detail.data) return
    Object.assign(state.form, {
      id: state.detail.data.id,
      title: state.detail.data.title || '',
      content: state.detail.data.content || '',
      priority: String(state.detail.data.priority || '2'),
      assigneeStudentId: state.detail.data.assigneeStudentId || '',
      dueTime: state.detail.data.dueTime || ''
    })
    state.ui.formMode = 'edit'
    state.ui.formVisible = true
  }

  const submitForm = async () => {
    const payload = {
      title: String(state.form.title || '').trim(),
      content: String(state.form.content || '').trim(),
      priority: state.form.priority,
      assigneeStudentId: state.form.assigneeStudentId || '',
      dueTime: state.form.dueTime
    }
    state.ui.submitLoading = true
    try {
      if (state.ui.formMode === 'edit') {
        await api.editDormTodo(state.form.id, payload)
      } else {
        await api.addDormTodo(payload)
      }
      state.ui.formVisible = false
      await Promise.all([loadStat(), loadList()])
      if (state.list.selectedId) {
        await handleSelectTodo({ id: state.list.selectedId })
      }
    } catch (error) {
      onError(error, state.ui.formMode === 'edit' ? '编辑待办失败' : '新建待办失败')
    } finally {
      state.ui.submitLoading = false
    }
  }

  const handleStart = async () => {
    if (!state.list.selectedId) return
    state.ui.startLoading = true
    try {
      await api.startDormTodo(state.list.selectedId)
      await refreshAfterMutation()
    } catch (error) {
      onError(error)
    } finally {
      state.ui.startLoading = false
    }
  }

  const handleComplete = async () => {
    if (!state.list.selectedId) return
    state.ui.completeLoading = true
    try {
      await api.completeDormTodo(state.list.selectedId)
      await refreshAfterMutation()
    } catch (error) {
      onError(error)
    } finally {
      state.ui.completeLoading = false
    }
  }

  const handleCancel = async (cancelReason) => {
    const reason = String(cancelReason || '').trim()
    if (!reason) {
      onError(null, '取消原因不能为空')
      return
    }
    if (!state.list.selectedId) return
    state.ui.cancelLoading = true
    try {
      await api.cancelDormTodo(state.list.selectedId, { cancelReason: reason })
      await refreshAfterMutation()
    } catch (error) {
      onError(error)
    } finally {
      state.ui.cancelLoading = false
    }
  }

  const submitComment = async (content = state.commentDraft) => {
    const text = String(content || '').trim()
    if (!text) {
      onError(null, '评论内容不能为空')
      return
    }
    if (!state.list.selectedId) return
    state.ui.commentSubmitting = true
    try {
      await api.addDormTodoComment({
        todoId: state.list.selectedId,
        content: text
      })
      state.commentDraft = ''
      await loadComments(state.list.selectedId)
    } catch (error) {
      onError(error, '评论失败')
    } finally {
      state.ui.commentSubmitting = false
    }
  }

  const handleReset = async () => {
    Object.assign(state.filters, createInitialState().filters)
    await loadList()
  }

  const handlePageChange = async (pageNum) => {
    state.filters.pageNum = Number(pageNum) || 1
    await loadList()
  }

  const handlePageSizeChange = async (pageSize) => {
    state.filters.pageSize = Number(pageSize) || 10
    state.filters.pageNum = 1
    await loadList()
  }

  const handleCloseDetail = () => {
    state.detail.visible = false
    state.detail.loading = false
    state.detail.data = null
    state.detail.comments = []
    state.detail.commentLoading = false
    state.list.selectedId = ''
    state.commentDraft = ''
  }

  const loadBootstrap = async () => {
    state.ui.pageLoading = true
    await Promise.all([loadStat(), loadList(), loadAssigneeOptions()])
    state.ui.pageLoading = false
  }

  return {
    state,
    buildListParams,
    updateFilters,
    updateForm,
    updateCommentDraft,
    closeForm,
    loadList,
    loadComments,
    loadBootstrap,
    openCreate,
    openEdit,
    submitForm,
    submitComment,
    handleSelectTodo,
    handleStart,
    handleComplete,
    handleCancel,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    handleCloseDetail
  }
}