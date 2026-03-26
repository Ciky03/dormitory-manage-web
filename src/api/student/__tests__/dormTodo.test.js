import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../request', () => ({
  request: vi.fn()
}))

import { request } from '../../request'
import {
  addDormTodo,
  addDormTodoComment,
  cancelDormTodo,
  completeDormTodo,
  editDormTodo,
  fetchDormTodoAssigneeOptions,
  fetchDormTodoCommentList,
  fetchDormTodoDetail,
  fetchDormTodoList,
  fetchDormTodoStat,
  startDormTodo
} from '../dormTodo'

describe('dormTodo api', () => {
  beforeEach(() => {
    request.mockReset()
    request.mockResolvedValue({})
  })

  it('uses the exact read paths', async () => {
    await fetchDormTodoStat()
    await fetchDormTodoList({ keywords: '卫生', pageNum: 1, pageSize: 10 })
    await fetchDormTodoDetail('todo-1')
    await fetchDormTodoCommentList('todo-1')
    await fetchDormTodoAssigneeOptions()

    expect(request).toHaveBeenNthCalledWith(1, '/dormitory/todo/stat', { method: 'GET' })
    expect(request).toHaveBeenNthCalledWith(2, '/dormitory/todo/list?keywords=%E5%8D%AB%E7%94%9F&pageNum=1&pageSize=10', { method: 'GET' })
    expect(request).toHaveBeenNthCalledWith(3, '/dormitory/todo/todo-1', { method: 'GET' })
    expect(request).toHaveBeenNthCalledWith(4, '/dormitory/todo/comment/list/todo-1', { method: 'GET' })
    expect(request).toHaveBeenNthCalledWith(5, '/dormitory/todo/assignee/options', { method: 'GET' })
  })

  it('uses the exact write paths', async () => {
    await addDormTodo({ title: '采购洗衣液' })
    await editDormTodo('todo-1', { title: '更新标题' })
    await startDormTodo('todo-1')
    await completeDormTodo('todo-1')
    await cancelDormTodo('todo-1', { cancelReason: '宿舍已处理' })
    await addDormTodoComment({ todoId: 'todo-1', content: '今晚一起做' })

    expect(request).toHaveBeenNthCalledWith(1, '/dormitory/todo/add', { method: 'POST', body: { title: '采购洗衣液' } })
    expect(request).toHaveBeenNthCalledWith(2, '/dormitory/todo/edit/todo-1', { method: 'PUT', body: { title: '更新标题' } })
    expect(request).toHaveBeenNthCalledWith(3, '/dormitory/todo/start/todo-1', { method: 'POST' })
    expect(request).toHaveBeenNthCalledWith(4, '/dormitory/todo/complete/todo-1', { method: 'POST' })
    expect(request).toHaveBeenNthCalledWith(5, '/dormitory/todo/cancel/todo-1', { method: 'POST', body: { cancelReason: '宿舍已处理' } })
    expect(request).toHaveBeenNthCalledWith(6, '/dormitory/todo/comment/add', { method: 'POST', body: { todoId: 'todo-1', content: '今晚一起做' } })
  })
})