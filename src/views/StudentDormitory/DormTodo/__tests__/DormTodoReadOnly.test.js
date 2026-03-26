import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const testContext = vi.hoisted(() => ({
  closeForm: vi.fn(),
  handleCancel: vi.fn(),
  handleCloseDetail: vi.fn(),
  handleComplete: vi.fn(),
  handlePageChange: vi.fn(),
  handlePageSizeChange: vi.fn(),
  handleReset: vi.fn(),
  handleSelectTodo: vi.fn(),
  handleStart: vi.fn(),
  loadBootstrap: vi.fn(),
  loadComments: vi.fn(),
  loadList: vi.fn(),
  openCreate: vi.fn(),
  openEdit: vi.fn(),
  submitForm: vi.fn(),
  updateFilters: vi.fn(),
  updateForm: vi.fn(),
  state: {
    stat: {
      data: {
        roomId: 'room-1',
        buildingNum: '6A',
        roomNum: '302',
        totalCount: 12,
        pendingCount: 4,
        processingCount: 5,
        weekCompletedCount: 3
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
      data: [{ label: '\u5168\u90e8', value: '' }]
    },
    list: {
      loading: false,
      items: [
        {
          id: 'todo-1',
          title: '\u5468\u672b\u536b\u751f\u8f6e\u503c',
          priorityLabel: '\u9ad8',
          statusLabel: '\u8fdb\u884c\u4e2d',
          assigneeName: '',
          creatorName: '\u738b\u6668',
          dueTime: '2026-03-27 21:00',
          summary: '\u6e05\u7406\u516c\u5171\u533a',
          overdue: false
        }
      ],
      total: 1
    },
    detail: {
      visible: true,
      loading: false,
      data: {
        id: 'todo-1',
        title: '\u5468\u672b\u536b\u751f\u8f6e\u503c',
        content: '\u6e05\u7406\u516c\u5171\u533a',
        priorityLabel: '\u9ad8',
        statusLabel: '\u8fdb\u884c\u4e2d',
        assigneeName: '',
        creatorName: '\u738b\u6668',
        dueTime: '2026-03-27 21:00',
        startTime: '',
        completedTime: '',
        completedByName: '',
        cancelReason: '',
        canEdit: false,
        canStart: false,
        canComplete: false,
        canCancel: false
      },
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
    ui: {
      pageLoading: false,
      formVisible: false,
      formMode: 'create',
      submitLoading: false,
      startLoading: false,
      completeLoading: false,
      cancelLoading: false
    }
  }
}))

vi.mock('../useDormTodoPage', () => ({
  createDormTodoPageModel: () => ({
    state: testContext.state,
    closeForm: testContext.closeForm,
    handleCancel: testContext.handleCancel,
    handleCloseDetail: testContext.handleCloseDetail,
    handleComplete: testContext.handleComplete,
    handlePageChange: testContext.handlePageChange,
    handlePageSizeChange: testContext.handlePageSizeChange,
    handleReset: testContext.handleReset,
    handleSelectTodo: testContext.handleSelectTodo,
    handleStart: testContext.handleStart,
    loadBootstrap: testContext.loadBootstrap,
    loadComments: testContext.loadComments,
    loadList: testContext.loadList,
    openCreate: testContext.openCreate,
    openEdit: testContext.openEdit,
    submitForm: testContext.submitForm,
    updateFilters: testContext.updateFilters,
    updateForm: testContext.updateForm
  })
}))

describe('DormTodo page shell', () => {
  beforeEach(() => {
    testContext.loadBootstrap.mockReset()
  })

  it('renders the create entry while hiding permission-gated detail actions', async () => {
    const { default: DormTodoPage } = await import('../index.vue')
    const wrapper = mount(DormTodoPage, {
      global: {
        stubs: {
          teleport: true,
          transition: false,
          ElDrawer: {
            props: ['modelValue'],
            template: '<div v-if="modelValue"><slot /></div>'
          }
        }
      }
    })

    await flushPromises()

    const pageText = wrapper.text()

    expect(testContext.loadBootstrap).toHaveBeenCalled()
    expect(pageText).toContain('6A-302')
    expect(pageText).toContain('\u65b0\u5efa\u5f85\u529e')
    expect(pageText).toContain('\u5468\u672b\u536b\u751f\u8f6e\u503c')
    expect(pageText).toContain('\u6682\u65e0\u8bc4\u8bba')
    expect(pageText).not.toContain('\u5f00\u59cb\u5904\u7406')
    expect(pageText).not.toContain('\u8bf7\u8f93\u5165\u53d6\u6d88\u539f\u56e0')
    expect(pageText).not.toContain('\u53d1\u8868\u8bc4\u8bba')
  })
})