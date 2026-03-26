import { reactive } from 'vue'
import * as dormTodoApi from '../../../api/student/dormTodo'
import { showError } from '../../../util/message/message'
import { getCurrentUser } from '../../../util/user'

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
  form: {
    id: '',
    title: '',
    content: '',
    priority: '2',
    assigneeStudentId: '',
    dueTime: ''
  },
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
    loadList,
    loadBootstrap,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    handleCloseDetail
  }
}