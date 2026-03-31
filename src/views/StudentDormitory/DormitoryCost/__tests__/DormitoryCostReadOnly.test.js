import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import DormitoryCostFormDialog from '../components/DormitoryCostFormDialog.vue'

const USER_STORAGE_KEY = import.meta.env.VITE_USER_STORAGE_KEY ?? 'current_user'

const testContext = vi.hoisted(() => ({
  loadBootstrap: vi.fn(),
  loadList: vi.fn(),
  updateFilters: vi.fn(),
  handleReset: vi.fn(),
  handleSelectCost: vi.fn(),
  handlePageChange: vi.fn(),
  handlePageSizeChange: vi.fn(),
  openCreate: vi.fn(),
  closeForm: vi.fn(),
  closePayDialog: vi.fn(),
  handleCloseDetail: vi.fn(),
  handlePublish: vi.fn(),
  openPayDialog: vi.fn(),
  handleCancel: vi.fn(),
  handleDeleteDraft: vi.fn(),
  handlePayVoucherChange: vi.fn(),
  submitPay: vi.fn(),
  state: {
    stat: {
      data: {
        roomId: 'room-1',
        buildingNum: '1栋',
        roomNum: '101',
        totalCount: 8,
        unpaidCount: 3,
        monthCompletedCount: 2
      }
    },
    filters: { keywords: '', status: '', month: '', onlyMine: false, pageNum: 1, pageSize: 10 },
    list: {
      loading: false,
      items: [
        {
          id: 'cost-1',
          title: '3月聚餐费用',
          totalAmount: 168,
          initiatorName: '张三',
          occurredDate: '2026-03-30',
          dueTime: '2026-04-02 22:00',
          statusLabel: '已发布',
          myAmountDue: 42,
          myPayStatusLabel: '未缴'
        }
      ],
      total: 1,
      selectedId: ''
    },
    detail: { visible: false, loading: false, data: null },
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
    pay: { visible: false, detailId: '', studentName: '', amountDue: '', voucherAttachId: '', voucherUrl: '' },
    ui: {
      pageLoading: false,
      bootstrapError: '',
      noRoomBinding: false,
      formVisible: false,
      formMode: 'create',
      memberSourceUnavailable: true,
      publishLoading: false,
      payLoading: false,
      cancelLoading: false,
      deleteLoading: false,
      uploadingPayVoucher: false
    }
  }
}))

vi.mock('../useDormitoryCostPage', () => ({
  createDormitoryCostPageModel: () => testContext
}))

const setStudentUser = () => {
  localStorage.setItem(
    USER_STORAGE_KEY,
    JSON.stringify({
      userType: '1',
      businessUserId: 'stu-1',
      studentId: 'stu-1'
    })
  )
}

const resetState = () => {
  Object.assign(testContext.state.stat.data, {
    roomId: 'room-1',
    buildingNum: '1栋',
    roomNum: '101',
    totalCount: 8,
    unpaidCount: 3,
    monthCompletedCount: 2
  })
  Object.assign(testContext.state.filters, {
    keywords: '',
    status: '',
    month: '',
    onlyMine: false,
    pageNum: 1,
    pageSize: 10
  })
  testContext.state.list.loading = false
  testContext.state.list.items = [
    {
      id: 'cost-1',
      title: '3月聚餐费用',
      totalAmount: 168,
      initiatorName: '张三',
      occurredDate: '2026-03-30',
      dueTime: '2026-04-02 22:00',
      statusLabel: '已发布',
      myAmountDue: 42,
      myPayStatusLabel: '未缴'
    }
  ]
  testContext.state.list.total = 1
  testContext.state.list.selectedId = ''
  testContext.state.detail.visible = false
  testContext.state.detail.loading = false
  testContext.state.detail.data = null
  Object.assign(testContext.state.pay, {
    visible: false,
    detailId: '',
    studentName: '',
    amountDue: '',
    voucherAttachId: '',
    voucherUrl: ''
  })
  testContext.state.ui.pageLoading = false
  testContext.state.ui.bootstrapError = ''
  testContext.state.ui.noRoomBinding = false
  testContext.state.ui.formVisible = false
  testContext.state.ui.formMode = 'create'
  testContext.state.ui.memberSourceUnavailable = true
  testContext.state.ui.publishLoading = false
  testContext.state.ui.payLoading = false
  testContext.state.ui.cancelLoading = false
  testContext.state.ui.deleteLoading = false
  testContext.state.ui.uploadingPayVoucher = false
}

const buildWrapper = async (options = {}) => {
  const { default: DormitoryCostPage } = await import('../index.vue')
  return mount(DormitoryCostPage, {
    global: {
      stubs: {
        teleport: true,
        transition: false,
        ElDrawer: {
          props: ['modelValue', 'title'],
          template: '<div v-if="modelValue" class="drawer-stub"><div>{{ title }}</div><slot /></div>'
        },
        ...options.stubs
      }
    }
  })
}

describe('DormitoryCost page shell', () => {
  beforeEach(() => {
    testContext.loadBootstrap.mockReset()
    testContext.handleSelectCost.mockReset()
    testContext.handlePublish.mockReset()
    testContext.openPayDialog.mockReset()
    testContext.handleCancel.mockReset()
    testContext.handleDeleteDraft.mockReset()
    testContext.handlePayVoucherChange.mockReset()
    testContext.submitPay.mockReset()
    resetState()
    setStudentUser()
  })

  it('renders student room stats, the table, and a disabled create action', async () => {
    const wrapper = await buildWrapper()
    await flushPromises()

    expect(testContext.loadBootstrap).toHaveBeenCalled()
    expect(wrapper.text()).toContain('1栋101')
    expect(wrapper.text()).toContain('3月聚餐费用')
    expect(wrapper.text()).toContain('待缴人数')
    expect(wrapper.find('.overview-create-button').attributes('disabled')).toBeDefined()
  })

  it('renders a non-student empty state without bootstrapping', async () => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ userType: '2', businessUserId: 'teacher-1' }))

    const wrapper = await buildWrapper()
    await flushPromises()

    expect(testContext.loadBootstrap).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('当前用户不是学生')
  })

  it('renders a no-room-binding empty state for students', async () => {
    testContext.state.ui.noRoomBinding = true

    const wrapper = await buildWrapper()
    await flushPromises()

    expect(testContext.loadBootstrap).toHaveBeenCalled()
    expect(wrapper.text()).toContain('当前学生暂未绑定宿舍')
  })

  it('renders bootstrap errors with a retry entry point', async () => {
    testContext.state.ui.bootstrapError = '加载失败'

    const wrapper = await buildWrapper()
    await flushPromises()

    expect(wrapper.text()).toContain('加载失败')
    expect(wrapper.text()).toContain('重试')
  })

  it('wires the table detail entry point and renders the detail drawer shell', async () => {
    testContext.state.detail.visible = true
    testContext.state.detail.data = {
      title: '3月聚餐费用',
      totalAmount: 168,
      initiatorName: '张三',
      occurredDate: '2026-03-30',
      dueTime: '2026-04-02 22:00',
      statusLabel: '已发布',
      remark: '凭证待补'
    }

    const wrapper = await buildWrapper()
    await flushPromises()

    const detailButton = wrapper.findAll('button').find((item) => item.text().includes('查看详情'))
    expect(detailButton).toBeTruthy()
    await detailButton.trigger('click')

    expect(testContext.handleSelectCost).toHaveBeenCalledWith(testContext.state.list.items[0])
    expect(wrapper.text()).toContain('公摊详情')
    expect(wrapper.text()).toContain('凭证待补')
  })

  it('wires detail actions and pay dialog events back to the page model', async () => {
    testContext.state.detail.visible = true
    testContext.state.detail.data = {
      id: 'cost-1',
      title: '3月聚餐费用',
      totalAmount: 168,
      initiatorName: '张三',
      occurredDate: '2026-03-30',
      dueTime: '2026-04-02 22:00',
      status: 0,
      statusLabel: '草稿',
      canPublish: true,
      canPay: true,
      canCancel: true,
      remark: '凭证待补',
      memberList: []
    }
    testContext.state.pay.visible = true

    const wrapper = await buildWrapper({
      stubs: {
        DormitoryCostDetailDrawer: {
          emits: ['publish', 'pay', 'cancel', 'delete-draft', 'close'],
          template: `
            <div class="detail-drawer-stub">
              <button class="publish-action" @click="$emit('publish')">publish</button>
              <button class="pay-action" @click="$emit('pay')">pay</button>
              <button class="cancel-action" @click="$emit('cancel')">cancel</button>
              <button class="delete-action" @click="$emit('delete-draft')">delete</button>
            </div>
          `
        },
        DormitoryCostPayDialog: {
          emits: ['voucher-change', 'submit', 'close'],
          template: `
            <div class="pay-dialog-stub">
              <button class="voucher-action" @click="$emit('voucher-change', 'file-token')">voucher</button>
              <button class="submit-pay-action" @click="$emit('submit')">submit-pay</button>
            </div>
          `
        }
      }
    })
    await flushPromises()

    await wrapper.find('.publish-action').trigger('click')
    await wrapper.find('.pay-action').trigger('click')
    await wrapper.find('.cancel-action').trigger('click')
    await wrapper.find('.delete-action').trigger('click')
    await wrapper.find('.voucher-action').trigger('click')
    await wrapper.find('.submit-pay-action').trigger('click')

    expect(testContext.handlePublish).toHaveBeenCalledTimes(1)
    expect(testContext.openPayDialog).toHaveBeenCalledTimes(1)
    expect(testContext.handleCancel).toHaveBeenCalledTimes(1)
    expect(testContext.handleDeleteDraft).toHaveBeenCalledTimes(1)
    expect(testContext.handlePayVoucherChange).toHaveBeenCalledWith('file-token')
    expect(testContext.submitPay).toHaveBeenCalledTimes(1)
  })
})

describe('DormitoryCostFormDialog', () => {
  it('shows the placeholder alert only for disabled create mode', () => {
    const createWrapper = mount(DormitoryCostFormDialog, {
      props: {
        visible: true,
        mode: 'create',
        form: {},
        disabledCreate: true
      },
      global: {
        stubs: {
          teleport: true,
          transition: false,
          ElDialog: {
            props: ['modelValue', 'title'],
            template: '<div v-if="modelValue"><div>{{ title }}</div><slot /><slot name="footer" /></div>'
          }
        }
      }
    })

    const editWrapper = mount(DormitoryCostFormDialog, {
      props: {
        visible: true,
        mode: 'edit',
        form: {},
        disabledCreate: true
      },
      global: {
        stubs: {
          teleport: true,
          transition: false,
          ElDialog: {
            props: ['modelValue', 'title'],
            template: '<div v-if="modelValue"><div>{{ title }}</div><slot /><slot name="footer" /></div>'
          }
        }
      }
    })

    expect(createWrapper.text()).toContain('宿舍成员数据暂不可用')
    expect(editWrapper.text()).not.toContain('宿舍成员数据暂不可用')
  })
})
