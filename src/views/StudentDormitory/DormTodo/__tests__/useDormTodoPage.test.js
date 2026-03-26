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
            title: '周末卫生轮值',
            summary: '清理公共区',
            priority: 3,
            priorityLabel: '高',
            status: 1,
            statusLabel: '进行中',
            assigneeStudentId: 'stu-1',
            assigneeName: '李明',
            creatorStudentId: 'stu-2',
            creatorName: '王晨',
            dueTime: '2026-03-27 21:00',
            createTime: '2026-03-26 12:00',
            overdue: false
          }
        ],
        total: 1
      }),
      fetchDormTodoAssigneeOptions: vi.fn().mockResolvedValue([{ label: '李明', value: 'stu-1' }])
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
      { label: '全部', value: '' },
      { label: '李明', value: 'stu-1' }
    ])
  })

  it('maps onlyMine to the current student id', async () => {
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

    const model = createDormTodoPageModel({ api, getCurrentUser: () => ({ studentId: 'stu-9' }) })
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
})
