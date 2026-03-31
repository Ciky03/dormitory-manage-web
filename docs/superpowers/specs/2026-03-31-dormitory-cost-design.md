# 宿舍费用公摊页面设计

## 概要

- 功能名称：宿舍费用公摊
- 页面名称：宿舍费用公摊
- 路由：`/student/dormitory-cost`
- 面向端：学生端
- 页面目标：围绕当前登录学生所在宿舍的公摊单，完成统计查看、筛选、列表浏览、详情查看、新建、编辑、发布、支付、取消、删除草稿等联调能力。

## 契约与边界

### 基础约束

- 主接口前缀统一使用 `/dormitory/cost/`
- 附件上传接口统一使用 `POST /attach/upload`
- 上传 `bucket` 固定为 `dm-business-cost`
- 页面仅对学生用户开放
- 非学生用户显示无权限空态
- 学生用户未绑定宿舍时显示未分配宿舍空态
- 前端不根据 `status` 自行推断权限，只认详情返回的 `canEdit/canPublish/canPay/canCancel`
- 前端必须区分两类凭证：
  - `sourceVoucherAttachId/sourceVoucherUrl`：公摊费用原始凭证
  - `voucherAttachId/voucherUrl`：成员个人转账凭证

### 枚举契约

- 主单 `status`
  - `0=草稿`
  - `1=已发布`
  - `2=已完成`
  - `3=已取消`
- 明细 `payStatus`
  - `0=未缴`
  - `1=已缴`

### 字段契约

#### 统计

- 接口：`GET /dormitory/cost/stat`
- 返回字段固定：`roomId,buildingNum,roomNum,totalCount,unpaidCount,monthCompletedCount`
- 顶部统计只消费该接口返回，不从列表自行聚合

#### 列表

- 接口：`GET /dormitory/cost/list`
- 请求参数固定：`keywords,status,month,onlyMine,pageNum,pageSize`
- 列表返回字段固定：
  - `id`
  - `title`
  - `totalAmount`
  - `initiatorName`
  - `occurredDate`
  - `dueTime`
  - `status`
  - `statusLabel`
  - `myAmountDue`
  - `myPayStatus`
  - `myPayStatusLabel`

#### 详情

- 接口：`GET /dormitory/cost/detail/{id}`
- 详情返回字段固定：
  - `id`
  - `title`
  - `totalAmount`
  - `initiatorStudentId`
  - `initiatorName`
  - `occurredDate`
  - `dueTime`
  - `status`
  - `statusLabel`
  - `remark`
  - `sourceVoucherAttachId`
  - `sourceVoucherUrl`
  - `canEdit`
  - `canPublish`
  - `canPay`
  - `canCancel`
  - `memberList`
- `memberList` 每项固定字段：
  - `detailId`
  - `studentId`
  - `studentName`
  - `amountDue`
  - `payStatus`
  - `payStatusLabel`
  - `paidTime`
  - `voucherAttachId`
  - `voucherUrl`
  - `isCurrentUser`

#### 新建/编辑

- 新增接口：`POST /dormitory/cost/add`
- 编辑接口：`PUT /dormitory/cost/edit/{id}`
- 请求体字段固定：
  - `title`
  - `totalAmount`
  - `occurredDate`
  - `dueTime`
  - `remark`
  - `sourceVoucherAttachId`
  - `memberList`
- `memberList` 提交项字段固定：
  - `studentId`
  - `amountDue`

#### 支付

- 接口：`POST /dormitory/cost/pay/{detailId}`
- 请求体字段固定：`voucherAttachId`

#### 其他动作

- 发布：`POST /dormitory/cost/publish/{id}`
- 取消：`POST /dormitory/cost/cancel/{id}`
- 删除草稿：`DELETE /dormitory/cost/del/{id}`

### 明确不做

- 不从 `status` 反推按钮权限
- 不混用两类凭证字段
- 不自己聚合顶部统计
- 不用本地假成员数据冒充真实宿舍成员源
- 不在成员接口缺失时宣称新建能力已联调完成

## 页面信息架构

页面采用“统计卡 + 常驻筛选 + 表格主视图 + 右侧详情抽屉 + 业务弹窗”的结构。

### 顶部统计区

- 宿舍：`buildingNum-roomNum`
- 全部公摊单
- 待缴人数
- 本月已完成公摊单
- 主入口按钮：`新建公摊单`

说明：

- 统计区固定展示在列表上方
- 与 `DormTodo` 一样保留统一的学生宿舍页面视觉风格
- 统计值只展示后端返回值

### 常驻筛选区

- `keywords`
- `status`
- `month`
- `onlyMine`
- `查询`
- `重置`

说明：

- 采用常驻筛选，不做折叠抽屉
- `month` 使用月份选择器，查询参数按后端契约传值
- `onlyMine` 直接作为查询参数传递，不替换其他字段

### 表格列表区

列表使用表格而非卡片，列顺序固定为：

- 标题
- 总金额
- 发起人
- 发生日期
- 截止时间
- 主单状态
- 我应缴
- 我的缴费状态
- 操作

说明：

- 表格主操作至少包含“查看详情”
- 其他依赖权限的按钮不在列表区自行推断展示
- 金额统一显示为两位小数

### 详情抽屉

右侧详情抽屉分为四块：

1. 基本信息
2. 费用原始凭证
3. 成员分摊明细
4. 我的转账凭证

说明：

- 基本信息展示标题、总金额、发起人、发生日期、截止时间、主单状态、备注
- 费用原始凭证只消费 `sourceVoucherAttachId/sourceVoucherUrl`
- 成员分摊明细表展示成员姓名、应缴金额、缴费状态、缴费时间、个人转账凭证
- “我的转账凭证”从 `memberList` 中 `isCurrentUser=true` 的项提取，不和原始凭证混排
- 抽屉底部操作按钮只根据 `canEdit/canPublish/canPay/canCancel` 渲染

### 新建/编辑弹窗

新建与编辑共用同一弹窗，字段固定为：

- `title`
- `totalAmount`
- `occurredDate`
- `dueTime`
- `remark`
- `sourceVoucherAttachId`
- `memberList`

说明：

- 原始凭证必须先上传，再写回 `sourceVoucherAttachId`
- `memberList` 目标形态是默认带出当前宿舍全部成员，允许手动调整每个人的 `amountDue`
- 前端只校验“明细金额总和 = 总金额”，不自动平均分摊

### 支付弹窗

支付使用独立轻量弹窗：

- 展示当前用户对应明细信息
- 上传个人转账凭证
- 写回 `voucherAttachId`
- 提交 `POST /dormitory/cost/pay/{detailId}`

## 交互流程

### 页面进入

页面进入后请求：

1. `GET /dormitory/cost/stat`
2. `GET /dormitory/cost/list`

说明：

- 先判断是否为学生用户
- 再通过 `stat.roomId` 判断是否已绑定宿舍
- `stat` 成功但 `roomId` 为空时，不继续展示业务列表内容

### 查看详情

- 点击列表行或操作按钮
- 打开右侧抽屉
- 请求：`GET /dormitory/cost/detail/{id}`

说明：

- 详情失败时只影响抽屉，不清空列表上下文
- 抽屉中提供重试入口

### 新建公摊单

1. 打开新建弹窗
2. 上传“费用原始凭证”：`POST /attach/upload`
3. 使用返回 `id` 作为 `sourceVoucherAttachId`
4. 调用：`POST /dormitory/cost/add`
5. 成功后刷新 `stat + list`，若当前抽屉打开则同步刷新详情

### 编辑公摊单

1. 仅在 `canEdit=true` 时显示入口
2. 打开编辑弹窗并回填详情
3. 若重新上传原始凭证，仍先调 `POST /attach/upload`
4. 再调：`PUT /dormitory/cost/edit/{id}`
5. 成功后刷新 `stat + list + detail`

### 发布公摊单

1. 仅在 `canPublish=true` 时显示入口
2. 调用：`POST /dormitory/cost/publish/{id}`
3. 成功后刷新 `stat + list + detail`

### 当前学生缴费

1. 仅在 `canPay=true` 时显示入口
2. 从详情 `memberList` 中定位 `isCurrentUser=true` 的明细，取其 `detailId`
3. 上传“个人转账凭证”：`POST /attach/upload`
4. 使用返回 `id` 作为 `voucherAttachId`
5. 调用：`POST /dormitory/cost/pay/{detailId}`
6. 成功后刷新 `stat + list + detail`

### 取消公摊单

1. 仅在 `canCancel=true` 时显示入口
2. 调用：`POST /dormitory/cost/cancel/{id}`
3. 成功后刷新 `stat + list + detail`

### 删除草稿

1. 仅对草稿单提供入口
2. 调用：`DELETE /dormitory/cost/del/{id}`
3. 成功后刷新 `stat + list`
4. 若删除的是当前详情项，则关闭抽屉

备注：

- 删除草稿的最终显示位置可放在列表操作列或详情抽屉中
- 该能力不额外新增前端权限推断，仍以联调时后端提供的业务条件为准

## 前端状态模型

建议将页面状态集中在 `useDormitoryCostPage.js` 中管理。

### `statState`

- `loading`
- `data`
  - `roomId`
  - `buildingNum`
  - `roomNum`
  - `totalCount`
  - `unpaidCount`
  - `monthCompletedCount`

### `filterState`

- `keywords`
- `status`
- `month`
- `onlyMine`
- `pageNum`
- `pageSize`

### `listState`

- `loading`
- `items`
- `total`
- `selectedId`

### `detailState`

- `visible`
- `loading`
- `data`

### `formState`

- `id`
- `title`
- `totalAmount`
- `occurredDate`
- `dueTime`
- `remark`
- `sourceVoucherAttachId`
- `sourceVoucherUrl`
- `memberList`

### `payState`

- `visible`
- `detailId`
- `studentName`
- `amountDue`
- `voucherAttachId`
- `voucherUrl`

### `uiState`

- `pageLoading`
- `bootstrapError`
- `noRoomBinding`
- `formVisible`
- `formMode`
- `submitLoading`
- `publishLoading`
- `payLoading`
- `cancelLoading`
- `deleteLoading`
- `uploadingSourceVoucher`
- `uploadingPayVoucher`

## 组件拆分建议

页面容器统一持有状态和请求，子组件只负责展示和事件抛出。

- 页面容器：`src/views/StudentDormitory/DormitoryCost/index.vue`
- 业务模型：`src/views/StudentDormitory/DormitoryCost/useDormitoryCostPage.js`
- 子组件建议拆分为：
  - 统计区：`DormitoryCostOverview.vue`
  - 筛选区：`DormitoryCostFilters.vue`
  - 列表表格：`DormitoryCostTable.vue`
  - 详情抽屉：`DormitoryCostDetailDrawer.vue`
  - 新建/编辑弹窗：`DormitoryCostFormDialog.vue`
  - 支付弹窗：`DormitoryCostPayDialog.vue`

约束：

- 请求不下沉到子组件
- 子组件只收 `props` 和抛 `emit`
- API 单独放在 `src/api/student/dormitoryCost.js`

## API 组织建议

新增独立 API 文件：`src/api/student/dormitoryCost.js`

建议包含：

- `fetchDormitoryCostStat`
- `fetchDormitoryCostList`
- `fetchDormitoryCostDetail`
- `addDormitoryCost`
- `editDormitoryCost`
- `publishDormitoryCost`
- `payDormitoryCost`
- `cancelDormitoryCost`
- `deleteDormitoryCost`
- `uploadDormitoryCostAttach`

实现约束：

- 只解开统一 `Result` 包装
- 不做宽松别名映射
- 契约字段缺失视为联调问题，不在前端偷偷兜底

## 表单与校验规则

### 新建/编辑校验

- `title` 必填
- `totalAmount` 必填且大于 `0`
- `occurredDate` 必填
- `dueTime` 必填
- `sourceVoucherAttachId` 必填
- `memberList` 至少一项
- 每个成员项的 `studentId` 必填
- 每个成员项的 `amountDue` 必填且大于等于 `0`
- `memberList.amountDue` 求和必须等于 `totalAmount`

### 支付校验

- 只能支付当前用户自己的明细
- `voucherAttachId` 必填
- 上传失败时不允许继续提交支付

## 异常态与空态

### 页面级

- 非学生：显示无权限空态
- 未绑定宿舍：显示未分配宿舍空态
- `stat/list` 初始化失败：显示页面级错误态和重试按钮

### 列表级

- 列表为空：显示空表格态，不伪造数据

### 详情级

- 详情加载失败：抽屉内显示错误态和重试入口
- 明细为空：显示空态，但保留基础信息和动作区

### 上传级

- 原始凭证上传失败：保留弹窗表单，阻止 add/edit
- 个人凭证上传失败：保留支付弹窗数据，阻止 pay

## 待定依赖

当前缺少“宿舍成员列表”明确接口。

已确认目标行为：

- 新建公摊单时默认带出当前宿舍全部成员
- 允许手动调整每人的分摊金额

当前结论：

- 前端实现中预留 `loadRoomMembers` 能力位
- 联调前必须补齐真实成员接口及字段契约
- 在成员接口未补齐前，不把“新建/编辑表单默认带出成员”视为已完成能力
- 如后续仍无成员接口，只允许将该能力标记为阻塞，不允许用本地假数据替代

## 测试策略

按 TDD 拆为 API 契约测试和页面模型行为测试。

### API 契约测试

- `stat/list/detail/add/edit/publish/pay/cancel/del/upload` 路径正确
- `list` 查询参数只发送契约字段
- 上传接口使用 `form-data` 且携带 `bucket=dm-business-cost`
- `pay` 请求体只发送 `voucherAttachId`

### 页面模型行为测试

- 页面进入先加载 `stat + list`
- `stat.roomId` 为空时进入未绑定宿舍空态
- `onlyMine` 正确带参
- 点击列表项后只加载详情
- `canEdit/canPublish/canPay/canCancel` 控制动作展示
- 上传成功后再提交 add/edit/pay
- 分摊金额总和不等于总金额时阻止提交
- 发布、支付、取消、删除后刷新 `stat + list + detail`
- 删除当前详情项后关闭抽屉
- 详情失败不影响列表继续浏览

## 验收清单

- 路由 `/student/dormitory-cost` 可正常访问
- 页面仅对学生开放，并正确处理未绑定宿舍空态
- 顶部统计字段与契约一致
- 列表字段与契约一致
- 详情字段与契约一致
- 前端能正确区分两类凭证
- 上传原始凭证后能正确写入 `sourceVoucherAttachId`
- 上传个人凭证后能正确写入 `voucherAttachId`
- 主单金额等于明细金额总和
- 当前用户只能支付自己的明细
- 列表和详情状态一致
- 所有明细已缴后主单由后端自动变已完成
- 成员接口补齐后，新建弹窗可默认带出当前宿舍成员

## 实施顺序

1. 搭建路由、页面骨架、API 文件与只读链路（统计、筛选、列表、详情）
2. 接入新建/编辑、上传原始凭证与金额校验
3. 接入发布、取消、删除草稿
4. 接入支付弹窗与个人凭证上传
5. 在成员接口补齐后完成默认成员带出能力
