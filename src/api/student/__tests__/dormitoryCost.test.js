import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../request', () => ({
  request: vi.fn()
}))

import { request } from '../../request'
import {
  addDormitoryCost,
  cancelDormitoryCost,
  deleteDormitoryCost,
  editDormitoryCost,
  fetchDormitoryCostDetail,
  fetchDormitoryCostList,
  fetchDormitoryCostStat,
  fetchDormitoryRoomMembers,
  payDormitoryCost,
  publishDormitoryCost,
  uploadDormitoryCostAttach
} from '../dormitoryCost'

describe('dormitoryCost api', () => {
  beforeEach(() => {
    request.mockReset()
    request.mockResolvedValue({ code: '200', data: {} })
  })

  it('uses the exact read and write paths', async () => {
    await fetchDormitoryCostStat()
    await fetchDormitoryCostList({ keywords: '聚餐', status: '1', month: '2026-03', onlyMine: true, pageNum: 1, pageSize: 10 })
    await fetchDormitoryCostDetail('cost-1')
    await fetchDormitoryRoomMembers()
    await addDormitoryCost({ title: '3月聚餐费用' })
    await editDormitoryCost('cost-1', { title: '更新标题' })
    await publishDormitoryCost('cost-1')
    await payDormitoryCost('detail-1', { voucherAttachId: 'att-2' })
    await cancelDormitoryCost('cost-1')
    await deleteDormitoryCost('cost-1')

    expect(request).toHaveBeenNthCalledWith(1, '/business/dormitory/cost/stat', { method: 'GET' })
    expect(request).toHaveBeenNthCalledWith(
      2,
      '/business/dormitory/cost/list?keywords=%E8%81%9A%E9%A4%90&status=1&month=2026-03&onlyMine=true&pageNum=1&pageSize=10',
      { method: 'GET' }
    )
    expect(request).toHaveBeenNthCalledWith(3, '/business/dormitory/cost/detail/cost-1', { method: 'GET' })
    expect(request).toHaveBeenNthCalledWith(4, '/business/person/room/member/list', { method: 'GET' })
    expect(request).toHaveBeenNthCalledWith(5, '/business/dormitory/cost/add', { method: 'POST', body: { title: '3月聚餐费用' } })
    expect(request).toHaveBeenNthCalledWith(6, '/business/dormitory/cost/edit/cost-1', { method: 'PUT', body: { title: '更新标题' } })
    expect(request).toHaveBeenNthCalledWith(7, '/business/dormitory/cost/publish/cost-1', { method: 'POST' })
    expect(request).toHaveBeenNthCalledWith(8, '/business/dormitory/cost/pay/detail-1', { method: 'POST', body: { voucherAttachId: 'att-2' } })
    expect(request).toHaveBeenNthCalledWith(9, '/business/dormitory/cost/cancel/cost-1', { method: 'POST' })
    expect(request).toHaveBeenNthCalledWith(10, '/business/dormitory/cost/del/cost-1', { method: 'DELETE' })
  })

  it('returns payload.data for stat and detail responses', async () => {
    request.mockResolvedValueOnce({ code: '200', data: { total: 12, summary: 'ok' } })
    request.mockResolvedValueOnce({ code: '200', data: { id: 'cost-1', title: '3月聚餐费用' } })

    await expect(fetchDormitoryCostStat()).resolves.toEqual({ total: 12, summary: 'ok' })
    await expect(fetchDormitoryCostDetail('cost-1')).resolves.toEqual({ id: 'cost-1', title: '3月聚餐费用' })
  })

  it('normalizes list responses and falls back to empty defaults', async () => {
    request.mockResolvedValueOnce({ code: '200', data: { list: [{ id: 'cost-1' }], total: '7' } })
    request.mockResolvedValueOnce({ code: '200', data: { list: null } })
    request.mockResolvedValueOnce({ code: '200', data: {} })

    await expect(fetchDormitoryCostList({ pageNum: 1, pageSize: 10 })).resolves.toEqual({
      list: [{ id: 'cost-1' }],
      total: 7
    })
    await expect(fetchDormitoryCostList({ pageNum: 2, pageSize: 10 })).resolves.toEqual({
      list: [],
      total: 0
    })
    await expect(fetchDormitoryCostList({ pageNum: 3, pageSize: 10 })).resolves.toEqual({
      list: [],
      total: 0
    })
  })

  it('normalizes room member responses and falls back to an empty list', async () => {
    request.mockResolvedValueOnce({
      code: '200',
      data: [
        { studentId: 'stu-1', studentName: '张三', isCurrentUser: true, avatarUrl: 'https://example.com/a.png' }
      ]
    })
    request.mockResolvedValueOnce({ code: '200', data: null })
    request.mockResolvedValueOnce({ code: '200' })

    await expect(fetchDormitoryRoomMembers()).resolves.toEqual([
      { studentId: 'stu-1', studentName: '张三', isCurrentUser: true, avatarUrl: 'https://example.com/a.png' }
    ])
    await expect(fetchDormitoryRoomMembers()).resolves.toEqual([])
    await expect(fetchDormitoryRoomMembers()).resolves.toEqual([])
  })

  it('uploads attachments as form-data with the business bucket', async () => {
    const file = new File(['voucher'], 'voucher.png', { type: 'image/png' })
    await uploadDormitoryCostAttach(file)

    const [, options] = request.mock.calls[0]
    expect(request).toHaveBeenCalledWith('/attach/upload', expect.objectContaining({ method: 'POST' }))
    expect(options.body).toBeInstanceOf(FormData)
    expect(options.body.get('file')).toBe(file)
    expect(options.body.get('bucket')).toBe('dm-business-cost')
  })
})
