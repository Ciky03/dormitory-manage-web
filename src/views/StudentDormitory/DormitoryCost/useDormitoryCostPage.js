import { reactive } from 'vue'
import * as dormitoryCostApi from '../../../api/student/dormitoryCost'
import { showError } from '../../../util/message/message'

const createEmptyFormState = () => ({
  id: '',
  title: '',
  totalAmount: '',
  occurredDate: '',
  dueTime: '',
  remark: '',
  sourceVoucherAttachId: '',
  sourceVoucherUrl: '',
  memberList: []
})

const createEmptyPayState = () => ({
  visible: false,
  detailId: '',
  studentName: '',
  amountDue: '',
  voucherAttachId: '',
  voucherUrl: ''
})

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
    ...createEmptyFormState()
  },
  pay: createEmptyPayState(),
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
    memberSourceUnavailable: false
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
    Object.assign(state.pay, createEmptyPayState())
  }

  const handleCloseDetail = () => {
    state.detail.visible = false
    state.detail.loading = false
    state.detail.data = null
    state.list.selectedId = ''
  }

  const resetDetailState = () => {
    handleCloseDetail()
  }

  const refreshAfterMutation = async () => {
    await Promise.all([loadStat(), loadList()])
    if (state.list.selectedId) {
      await handleSelectCost({ id: state.list.selectedId })
    }
  }

  const loadList = async () => {
    state.list.loading = true
    try {
      const data = await api.fetchDormitoryCostList(buildListParams())
      state.list.items = Array.isArray(data?.list) ? data.list : []
      state.list.total = Number(data?.total ?? 0)
    } catch (error) {
      onError(error, '\u52a0\u8f7d\u5bbf\u820d\u8d39\u7528\u516c\u62a5\u5217\u8868\u5931\u8d25')
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
        onError(error, '\u52a0\u8f7d\u5bbf\u820d\u8d39\u7528\u516c\u62a5\u7edf\u8ba1\u5931\u8d25')
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
    state.detail.data = null
    try {
      state.detail.data = await api.fetchDormitoryCostDetail(id)
    } catch (error) {
      onError(error, '\u52a0\u8f7d\u5bbf\u820d\u8d39\u7528\u516c\u62a5\u8be6\u60c5\u5931\u8d25')
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
        resetDetailState()
        state.list.items = []
        state.list.total = 0
        return
      }
      await loadList()
    } catch (error) {
      resetDetailState()
      state.ui.bootstrapError = String(error?.message || '\u52a0\u8f7d\u5bbf\u820d\u8d39\u7528\u516c\u62a5\u5931\u8d25')
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

  const loadRoomMembers = async () => {
    try {
      const members = await api.fetchDormitoryRoomMembers()
      const memberList = Array.isArray(members) ? members : []
      if (!memberList.length) {
        state.ui.memberSourceUnavailable = true
        onError(null, '当前宿舍暂无可用于公摊的成员数据')
        return []
      }
      state.ui.memberSourceUnavailable = false
      return memberList
    } catch (error) {
      state.ui.memberSourceUnavailable = true
      onError(error, '当前宿舍暂无可用于公摊的成员数据')
      return []
    }
  }

  const openCreate = async () => {
    state.ui.formVisible = false
    const members = await loadRoomMembers()
    if (!members.length) return
    Object.assign(state.form, createEmptyFormState(), {
      memberList: members.map((item) => ({
        studentId: item?.studentId ?? '',
        studentName: item?.studentName ?? '',
        amountDue: ''
      }))
    })
    state.ui.formMode = 'create'
    state.ui.formVisible = true
  }

  const openPayDialog = () => {
    const detail = state.detail.data
    const currentMember = detail?.memberList?.find((item) => item?.isCurrentUser)
    if (!detail?.canPay || !currentMember?.detailId) return
    Object.assign(state.pay, {
      visible: true,
      detailId: currentMember.detailId,
      studentName: currentMember.studentName || '',
      amountDue: currentMember.amountDue ?? '',
      voucherAttachId: '',
      voucherUrl: ''
    })
  }

  const handlePayVoucherChange = async (file) => {
    const rawFile = file?.raw ?? file
    if (!rawFile) return
    state.ui.uploadingPayVoucher = true
    try {
      const payload = await api.uploadDormitoryCostAttach(rawFile)
      state.pay.voucherAttachId = payload?.data?.id ?? payload?.id ?? ''
      state.pay.voucherUrl = payload?.data?.url ?? payload?.url ?? ''
    } catch (error) {
      onError(error, '\u4e0a\u4f20\u7f34\u8d39\u51ed\u8bc1\u5931\u8d25')
    } finally {
      state.ui.uploadingPayVoucher = false
    }
  }

  const submitPay = async () => {
    if (!state.pay.detailId) return
    if (!state.pay.voucherAttachId) {
      onError(null, '\u8bf7\u5148\u4e0a\u4f20\u4e2a\u4eba\u8f6c\u8d26\u51ed\u8bc1')
      return
    }
    state.ui.payLoading = true
    try {
      await api.payDormitoryCost(state.pay.detailId, { voucherAttachId: state.pay.voucherAttachId })
      closePayDialog()
      await refreshAfterMutation()
    } catch (error) {
      onError(error, '\u63d0\u4ea4\u7f34\u8d39\u5931\u8d25')
    } finally {
      state.ui.payLoading = false
    }
  }

  const handlePublish = async () => {
    if (!state.detail.data?.canPublish || !state.list.selectedId) return
    state.ui.publishLoading = true
    try {
      await api.publishDormitoryCost(state.list.selectedId)
      await refreshAfterMutation()
    } catch (error) {
      onError(error, '\u53d1\u5e03\u516c\u644a\u5355\u5931\u8d25')
    } finally {
      state.ui.publishLoading = false
    }
  }

  const handleCancel = async () => {
    if (!state.detail.data?.canCancel || !state.list.selectedId) return
    state.ui.cancelLoading = true
    try {
      await api.cancelDormitoryCost(state.list.selectedId)
      await refreshAfterMutation()
    } catch (error) {
      onError(error, '\u53d6\u6d88\u516c\u644a\u5355\u5931\u8d25')
    } finally {
      state.ui.cancelLoading = false
    }
  }

  const handleDeleteDraft = async () => {
    if (Number(state.detail.data?.status) !== 0 || !state.list.selectedId) return
    state.ui.deleteLoading = true
    try {
      await api.deleteDormitoryCost(state.list.selectedId)
      handleCloseDetail()
      await Promise.all([loadStat(), loadList()])
    } catch (error) {
      onError(error, '\u5220\u9664\u8349\u7a3f\u5931\u8d25')
    } finally {
      state.ui.deleteLoading = false
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
    loadRoomMembers,
    openPayDialog,
    handlePayVoucherChange,
    submitPay,
    handlePublish,
    handleCancel,
    handleDeleteDraft,
    refreshAfterMutation,
    loadStat,
    loadList,
    loadBootstrap,
    handleSelectCost
  }
}
