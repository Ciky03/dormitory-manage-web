import { reactive } from 'vue'
import * as dormitoryCostApi from '../../../api/student/dormitoryCost'
import { showError } from '../../../util/message/message'

const createInitialState = () => ({
  stat: {
    loading: false,
    data: {
      roomId: '',
      buildingNum: '',
      roomNum: '',
      totalCount: 0,
      unpaidCount: 0,
      monthCompletedCount: 0
    }
  },
  filters: {
    keywords: '',
    status: '',
    month: '',
    onlyMine: false,
    pageNum: 1,
    pageSize: 10
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
    data: null
  },
  form: {
    id: '',
    title: '',
    totalAmount: '',
    occurredDate: '',
    dueTime: '',
    remark: '',
    sourceVoucherAttachId: '',
    sourceVoucherUrl: '',
    memberList: []
  },
  pay: {
    visible: false,
    detailId: '',
    studentName: '',
    amountDue: '',
    voucherAttachId: '',
    voucherUrl: ''
  },
  ui: {
    pageLoading: false,
    bootstrapError: '',
    noRoomBinding: false,
    formVisible: false,
    formMode: 'create',
    submitLoading: false,
    publishLoading: false,
    payLoading: false,
    cancelLoading: false,
    deleteLoading: false,
    uploadingSourceVoucher: false,
    uploadingPayVoucher: false,
    memberSourceUnavailable: true
  }
})

export function createDormitoryCostPageModel(deps = {}) {
  const api = deps.api ?? dormitoryCostApi
  const onError = deps.showError ?? showError
  const state = reactive(createInitialState())

  const buildListParams = () => ({
    keywords: String(state.filters.keywords || '').trim(),
    status: state.filters.status,
    month: state.filters.month,
    onlyMine: state.filters.onlyMine,
    pageNum: state.filters.pageNum,
    pageSize: state.filters.pageSize
  })

  const updateFilters = (next = {}) => {
    Object.assign(state.filters, next)
  }

  const updateForm = (next = {}) => {
    Object.assign(state.form, next)
  }

  const closeForm = () => {
    state.ui.formVisible = false
  }

  const closePayDialog = () => {
    state.pay.visible = false
  }

  const handleCloseDetail = () => {
    state.detail.visible = false
    state.detail.loading = false
    state.detail.data = null
    state.list.selectedId = ''
  }

  const loadList = async () => {
    state.list.loading = true
    try {
      const data = await api.fetchDormitoryCostList(buildListParams())
      state.list.items = Array.isArray(data?.list) ? data.list : []
      state.list.total = Number(data?.total ?? 0)
    } catch (error) {
      onError(error, '加载宿舍费用公摊列表失败')
      state.list.items = []
      state.list.total = 0
    } finally {
      state.list.loading = false
    }
  }

  const loadStat = async (options = {}) => {
    const { silent = false, throwOnError = false } = options
    state.stat.loading = true
    try {
      state.stat.data = await api.fetchDormitoryCostStat()
      return state.stat.data
    } catch (error) {
      state.stat.data = createInitialState().stat.data
      if (!silent) {
        onError(error, '加载宿舍费用公摊统计失败')
      }
      if (throwOnError) throw error
    } finally {
      state.stat.loading = false
    }
  }

  const handleSelectCost = async (item) => {
    const id = item?.id
    if (!id) return
    state.list.selectedId = id
    state.detail.visible = true
    state.detail.loading = true
    try {
      state.detail.data = await api.fetchDormitoryCostDetail(id)
    } catch (error) {
      onError(error, '加载宿舍费用公摊详情失败')
      state.detail.data = null
    } finally {
      state.detail.loading = false
    }
  }

  const loadBootstrap = async () => {
    state.ui.pageLoading = true
    state.ui.bootstrapError = ''
    state.ui.noRoomBinding = false
    try {
      const stat = await loadStat({ throwOnError: true, silent: true })
      if (!String(stat?.roomId || '').trim()) {
        state.ui.noRoomBinding = true
        state.list.items = []
        state.list.total = 0
        return
      }
      await loadList()
    } catch (error) {
      state.ui.bootstrapError = String(error?.message || '加载宿舍费用公摊失败')
    } finally {
      state.ui.pageLoading = false
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

  const openCreate = () => {
    if (state.ui.memberSourceUnavailable) {
      onError(null, '待宿舍成员接口补齐后启用新建公摊单')
    }
  }

  return {
    state,
    buildListParams,
    updateFilters,
    updateForm,
    closeForm,
    closePayDialog,
    handleCloseDetail,
    handleReset,
    handlePageChange,
    handlePageSizeChange,
    openCreate,
    loadStat,
    loadList,
    loadBootstrap,
    handleSelectCost
  }
}
