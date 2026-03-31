import { describe, expect, it, vi } from 'vitest'
import { createDormTodoPageModel } from '../useDormTodoPage'

describe('createDormTodoPageModel', () => {
  it('loads stat, list, and assignee options without roomId', async () => {
    const api = {
      fetchDormTodoStat: vi.fn().mockResolvedValue({
        roomId: 'room-1',
        buildingNum: '6A',
        roomNum: '302',
        totalCount: 12,
        pendingCount: 4,
        processingCount: 5,
        weekCompletedCount: 3
      }),
      fetchDormTodoList: vi.fn().mockResolvedValue({
        list: [
          {
            id: 'todo-1',
            title: 'Weekend cleanup',
            summary: 'Clean the shared area',
            priority: 3,
            priorityLabel: 'High',
            status: 1,
            statusLabel: 'In Progress',
            assigneeStudentId: 'stu-1',
            assigneeName: 'Li Ming',
            creatorStudentId: 'stu-2',
            creatorName: 'Wang Chen',
            dueTime: '2026-03-27 21:00',
            createTime: '2026-03-26 12:00',
            overdue: false
          }
        ],
        total: 1
      }),
      fetchDormTodoAssigneeOptions: vi.fn().mockResolvedValue([{ label: 'Li Ming', value: 'stu-1' }])
    }

    const model = createDormTodoPageModel({ api, getCurrentUser: () => ({ id: 'stu-1' }) })
    await model.loadBootstrap()

    expect(api.fetchDormTodoList).toHaveBeenCalledWith({
      keywords: '',
      status: '',
      priority: '',
      assigneeStudentId: '',
      dueType: '',
      pageNum: 1,
      pageSize: 10
    })
    expect(model.state.assigneeOptions.data).toEqual([
      { label: '\u5168\u90e8', value: '' },
      { label: 'Li Ming', value: 'stu-1' }
    ])
  })

  it('maps onlyMine to the current business user id', async () => {
    const api = {
      fetchDormTodoStat: vi.fn().mockResolvedValue({
        roomId: 'room-1',
        buildingNum: '6A',
        roomNum: '302',
        totalCount: 0,
        pendingCount: 0,
        processingCount: 0,
        weekCompletedCount: 0
      }),
      fetchDormTodoList: vi.fn().mockResolvedValue({ list: [], total: 0 }),
      fetchDormTodoAssigneeOptions: vi.fn().mockResolvedValue([])
    }

    const model = createDormTodoPageModel({ api, getCurrentUser: () => ({ businessUserId: 'stu-9' }) })
    model.state.filters.onlyMine = true
    await model.loadList()

    expect(api.fetchDormTodoList).toHaveBeenCalledWith({
      keywords: '',
      status: '',
      priority: '',
      assigneeStudentId: 'stu-9',
      dueType: '',
      pageNum: 1,
      pageSize: 10
    })
  })

  it('uses detail.commentList first and refreshes comments independently', async () => {
    const api = {
      fetchDormTodoStat: vi.fn().mockResolvedValue({
        roomId: 'room-1',
        buildingNum: '6A',
        roomNum: '302',
        totalCount: 0,
        pendingCount: 0,
        processingCount: 0,
        weekCompletedCount: 0
      }),
      fetchDormTodoList: vi.fn().mockResolvedValue({ list: [], total: 0 }),
      fetchDormTodoAssigneeOptions: vi.fn().mockResolvedValue([]),
      fetchDormTodoDetail: vi.fn().mockResolvedValue({
        id: 'todo-1',
        title: 'Weekend cleanup',
        content: 'Clean the shared area',
        priorityLabel: 'High',
        statusLabel: 'In Progress',
        assigneeName: '',
        creatorName: 'Wang Chen',
        dueTime: '2026-03-27 21:00',
        startTime: '',
        completedTime: '',
        completedByName: '',
        cancelReason: '',
        canEdit: false,
        canStart: false,
        canComplete: false,
        canCancel: false,
        commentList: [
          {
            id: 'comment-1',
            todoId: 'todo-1',
            commenterName: 'Li Ming',
            content: 'I will handle it tonight',
            createTime: '2026-03-26 20:00'
          }
        ]
      }),
      fetchDormTodoCommentList: vi.fn().mockResolvedValue([
        {
          id: 'comment-2',
          todoId: 'todo-1',
          commenterName: 'Wang Chen',
          content: 'I can cover the floor cleaning',
          createTime: '2026-03-26 21:00'
        }
      ])
    }

    const model = createDormTodoPageModel({ api, getCurrentUser: () => ({ id: 'stu-1' }) })

    await model.handleSelectTodo({ id: 'todo-1' })
    expect(model.state.detail.comments).toHaveLength(1)

    await model.loadComments('todo-1')
    expect(api.fetchDormTodoCommentList).toHaveBeenCalledWith('todo-1')
    expect(model.state.detail.comments[0].id).toBe('comment-2')
  })

  it('refreshes detail, list, and stat after start, complete, and cancel', async () => {
    const api = {
      fetchDormTodoStat: vi.fn().mockResolvedValue({
        roomId: 'room-1',
        buildingNum: '6A',
        roomNum: '302',
        totalCount: 1,
        pendingCount: 1,
        processingCount: 0,
        weekCompletedCount: 0
      }),
      fetchDormTodoList: vi.fn().mockResolvedValue({
        list: [{ id: 'todo-1', title: 'Buy detergent' }],
        total: 1
      }),
      fetchDormTodoAssigneeOptions: vi.fn().mockResolvedValue([]),
      fetchDormTodoDetail: vi.fn().mockResolvedValue({
        id: 'todo-1',
        title: 'Buy detergent',
        content: 'Purchase it tonight',
        priority: 2,
        priorityLabel: 'Medium',
        statusLabel: 'Pending',
        assigneeName: '',
        creatorName: 'Zhang Yue',
        dueTime: '2026-03-26 18:00',
        startTime: '',
        completedTime: '',
        completedByName: '',
        cancelReason: '',
        canEdit: true,
        canStart: true,
        canComplete: true,
        canCancel: true,
        commentList: []
      }),
      startDormTodo: vi.fn().mockResolvedValue({}),
      completeDormTodo: vi.fn().mockResolvedValue({}),
      cancelDormTodo: vi.fn().mockResolvedValue({})
    }

    const model = createDormTodoPageModel({
      api,
      getCurrentUser: () => ({ id: 'stu-1' }),
      showError: vi.fn()
    })

    await model.loadBootstrap()
    await model.handleSelectTodo({ id: 'todo-1' })
    await model.handleStart()
    await model.handleComplete()
    await model.handleCancel('Already purchased together')

    expect(api.startDormTodo).toHaveBeenCalledWith('todo-1')
    expect(api.completeDormTodo).toHaveBeenCalledWith('todo-1')
    expect(api.cancelDormTodo).toHaveBeenCalledWith('todo-1', {
      cancelReason: 'Already purchased together'
    })
    expect(api.fetchDormTodoStat).toHaveBeenCalledTimes(4)
    expect(api.fetchDormTodoList).toHaveBeenCalledTimes(4)
    expect(api.fetchDormTodoDetail).toHaveBeenCalledTimes(4)
  })

  it('does not call cancel api without cancelReason', async () => {
    const api = {
      fetchDormTodoStat: vi.fn().mockResolvedValue({
        roomId: 'room-1',
        buildingNum: '6A',
        roomNum: '302',
        totalCount: 0,
        pendingCount: 0,
        processingCount: 0,
        weekCompletedCount: 0
      }),
      fetchDormTodoList: vi.fn().mockResolvedValue({ list: [], total: 0 }),
      fetchDormTodoAssigneeOptions: vi.fn().mockResolvedValue([]),
      fetchDormTodoDetail: vi.fn().mockResolvedValue({
        id: 'todo-1',
        title: 'Buy detergent',
        content: 'Purchase it tonight',
        priority: 2,
        priorityLabel: 'Medium',
        statusLabel: 'Pending',
        assigneeName: '',
        creatorName: 'Zhang Yue',
        dueTime: '2026-03-26 18:00',
        startTime: '',
        completedTime: '',
        completedByName: '',
        cancelReason: '',
        canEdit: true,
        canStart: true,
        canComplete: true,
        canCancel: true,
        commentList: []
      }),
      cancelDormTodo: vi.fn()
    }
    const showError = vi.fn()
    const model = createDormTodoPageModel({ api, getCurrentUser: () => ({ id: 'stu-1' }), showError })

    await model.handleSelectTodo({ id: 'todo-1' })
    await model.handleCancel('')

    expect(api.cancelDormTodo).not.toHaveBeenCalled()
    expect(showError).toHaveBeenCalledWith(null, '\u53d6\u6d88\u539f\u56e0\u4e0d\u80fd\u4e3a\u7a7a')
  })

  it('submits a comment and refreshes only comments', async () => {
    const api = {
      fetchDormTodoStat: vi.fn().mockResolvedValue({
        roomId: 'room-1',
        buildingNum: '6A',
        roomNum: '302',
        totalCount: 1,
        pendingCount: 0,
        processingCount: 1,
        weekCompletedCount: 0
      }),
      fetchDormTodoList: vi.fn().mockResolvedValue({
        list: [{ id: 'todo-1', title: 'Weekend cleanup' }],
        total: 1
      }),
      fetchDormTodoAssigneeOptions: vi.fn().mockResolvedValue([]),
      fetchDormTodoDetail: vi.fn().mockResolvedValue({
        id: 'todo-1',
        title: 'Weekend cleanup',
        content: 'Clean the shared area',
        priorityLabel: 'High',
        statusLabel: 'In Progress',
        assigneeName: 'Li Ming',
        creatorName: 'Wang Chen',
        dueTime: '2026-03-27 21:00',
        startTime: '',
        completedTime: '',
        completedByName: '',
        cancelReason: '',
        canEdit: false,
        canStart: false,
        canComplete: false,
        canCancel: false,
        commentList: []
      }),
      fetchDormTodoCommentList: vi.fn().mockResolvedValue([
        {
          id: 'comment-3',
          todoId: 'todo-1',
          commenterName: 'Li Ming',
          content: 'Meet at 8 tonight',
          createTime: '2026-03-26 20:00'
        }
      ]),
      addDormTodoComment: vi.fn().mockResolvedValue({})
    }

    const model = createDormTodoPageModel({
      api,
      getCurrentUser: () => ({ id: 'stu-1' }),
      showError: vi.fn()
    })

    await model.loadBootstrap()
    await model.handleSelectTodo({ id: 'todo-1' })
    await model.submitComment('Meet at 8 tonight')

    expect(api.addDormTodoComment).toHaveBeenCalledWith({
      todoId: 'todo-1',
      content: 'Meet at 8 tonight'
    })
    expect(api.fetchDormTodoCommentList).toHaveBeenCalledWith('todo-1')
    expect(api.fetchDormTodoList).toHaveBeenCalledTimes(1)
    expect(api.fetchDormTodoStat).toHaveBeenCalledTimes(1)
  })
})
