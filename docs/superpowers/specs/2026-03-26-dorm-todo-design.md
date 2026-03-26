# 宿舍待办事务页面设计

## 概要

- 功能名称：宿舍待办事务
- 页面名称：宿舍待办事务
- 路由：`/student/dorm-todo`
- 面向端：学生端
- 页面目标：管理当前登录学生所在宿舍内的待办事务，覆盖查看列表、查看详情、创建、编辑、开始处理、完成、取消、评论

## 约束与联调契约

### 基础约束

- 接口前缀统一使用 `/dormitory/todo`
- 前端不传 `roomId`
- 当前登录用户统一按学生端处理
- 所有时间字段使用 `yyyy-MM-dd HH:mm`
- 标签文案优先显示后端返回的 `priorityLabel`、`statusLabel`
- `summary`、`overdue` 直接使用后端返回值，前端不重算

### 枚举契约

- `priority`
  - `1=低`
  - `2=中`
  - `3=高`
- `status`
  - `0=待处理`
  - `1=进行中`
  - `2=已完成`
  - `3=已取消`
- `dueType`
  - `1=今日到期`
  - `2=3天内到期`
  - `3=已逾期`

### 字段契约

#### 统计

- 接口：`GET /dormitory/todo/stat`
- 返回字段：`roomId,buildingNum,roomNum,totalCount,pendingCount,processingCount,weekCompletedCount`
- 顶部统计只展示后端值，不从列表聚合

#### 列表

- 接口：`GET /dormitory/todo/list`
- 请求参数：`keywords,status,priority,assigneeStudentId,dueType,pageNum,pageSize`
- 返回字段：`id,title,summary,priority,priorityLabel,status,statusLabel,assigneeStudentId,assigneeName,creatorStudentId,creatorName,dueTime,createTime,overdue`
- 列表不推导权限，不放依赖 `canXxx` 的操作按钮

#### 详情

- 接口：`GET /dormitory/todo/{id}`
- 返回字段：`id,title,content,priority,priorityLabel,status,statusLabel,assigneeStudentId,assigneeName,creatorStudentId,creatorName,dueTime,startTime,completedTime,completedBy,completedByName,cancelReason,canEdit,canStart,canComplete,canCancel,commentList`
- 按钮显隐严格以 `canEdit/canStart/canComplete/canCancel` 为准

#### 评论

- 评论列表接口：`GET /dormitory/todo/comment/list/{todoId}`
- 评论新增接口：`POST /dormitory/todo/comment/add`
- 评论字段：`id,todoId,commenterStudentId,commenterName,content,createTime`
- 评论新增字段：`todoId,content`
- 评论成功后仅刷新评论区

#### 负责人候选项

- 接口：`GET /dormitory/todo/assignee/options`
- 返回：`Result<List<Option<String>>>`
- `Option.value = studentId`
- `Option.label = realName`
- 用途：新增/编辑负责人下拉、列表筛选负责人下拉
- 前端本地只补一个“全部”
- 不补“未指派筛选”
- 不使用自由输入框替代下拉

### 状态流转契约

- 允许
  - `0 -> 1`
  - `0 -> 2`
  - `0 -> 3`
  - `1 -> 2`
  - `1 -> 3`
- 不允许
  - `2 -> *`
  - `3 -> *`
- 非法流转时，前端直接 toast 展示后端返回原文，不做二次改写
- 未指派任务允许任一宿舍成员点击“开始处理”，后端自动认领负责人
- 取消时必须填写 `cancelReason`

### 空值展示契约

- `assigneeName` 为空时显示“未指派”
- `dueTime/startTime/completedTime/completedByName/cancelReason` 为空时显示 `-`
- `commentList` 为空时显示空态

### 明确不做

- 不传 `roomId`
- 不自行计算顶部统计
- 不自行计算按钮权限
- 不自行定义状态码和优先级码
- 不把删除能力做成强依赖，当前不按 `canDelete` 做显隐逻辑

## 设计目标

页面采用“任务流驱动”的信息架构。学生进入页面后先看到当前宿舍的待办队列和统计概况，再通过右侧详情抽屉查看正文、状态和评论，并在第二轮、第三轮联调中逐步接入写操作。

保留最终页面骨架，但按联调轮次控制功能暴露：

- 第一轮：只接统计、列表、详情、评论列表、负责人选项
- 第二轮：接新增、编辑、开始处理、完成、取消
- 第三轮：接评论新增

首轮未接入的能力不显示为可操作入口，不做禁用占位。

## 页面信息架构

### 顶部概览区

- 宿舍信息：`buildingNum-roomNum`
- 统计卡片：全部待办、待处理、进行中、本周已完成
- 主按钮位：`新建待办`

说明：

- 第一轮保留按钮位但不渲染实际写操作入口
- 第二轮接入新增接口后显示“新建待办”

### 筛选区

- `keywords`
- `status`
- `priority`
- `assigneeStudentId`
- `dueType`
- `只看我负责`

说明：

- `只看我负责` 仅是前端交互项，不额外传 `onlyMine`
- 勾选时将查询参数中的 `assigneeStudentId` 替换为当前登录学生 `studentId`
- 取消勾选时恢复用户手动选择的负责人筛选值

### 列表区

- 卡片式列表
- 每项展示：
  - `title`
  - `priorityLabel`
  - `statusLabel`
  - `assigneeName`
  - `creatorName`
  - `dueTime`
  - `summary`
  - `overdue`

说明：

- 列表项只承担“查看详情”
- 不在列表上显示依赖权限的操作按钮

### 详情抽屉

- 展示：
  - `content`
  - `statusLabel`
  - `priorityLabel`
  - `assigneeName`
  - `creatorName`
  - `dueTime`
  - `startTime`
  - `completedTime`
  - `completedByName`
  - `cancelReason`
- 底部：
  - 评论时间线
  - 评论输入框（第三轮接入）

说明：

- 点击列表项后打开右侧抽屉
- 首次打开详情时，请求 `GET /dormitory/todo/{id}`
- 评论首屏优先使用 `detail.commentList`
- 如需显式刷新评论区，调用 `GET /dormitory/todo/comment/list/{todoId}`

### 新建/编辑弹窗

- 新建与编辑共用一个表单弹窗
- 字段：
  - `title`
  - `content`
  - `priority`
  - `assigneeStudentId`
  - `dueTime`

说明：

- `assigneeStudentId` 可为空，表示未指派
- 第一轮不显示该弹窗入口
- 第二轮接入新增、编辑接口后启用

## 交互流程

### 首次进入

- 并行请求：
  - `GET /dormitory/todo/stat`
  - `GET /dormitory/todo/list`
  - `GET /dormitory/todo/assignee/options`

### 点击列表项

- 打开详情抽屉
- 请求：`GET /dormitory/todo/{id}`
- 优先渲染详情返回中的 `commentList`

### 首轮联调

- 显示统计、筛选、卡片列表、详情抽屉、评论时间线
- 隐藏：
  - 新建待办
  - 编辑
  - 开始处理
  - 完成
  - 取消
  - 评论输入框

### 第二轮联调

- 接通：
  - 新建
  - 编辑
  - 开始处理
  - 完成
  - 取消
- 成功后统一刷新：
  - 详情
  - 列表
  - 统计

### 第三轮联调

- 接通评论新增
- 评论成功后立即重新请求 `GET /dormitory/todo/comment/list/{todoId}`
- 只刷新评论区，不整页刷新

## 前端状态模型

### `statState`

- `data`
- `loading`

### `filterState`

- `keywords`
- `status`
- `priority`
- `assigneeStudentId`
- `dueType`
- `onlyMine`
- `pageNum`
- `pageSize`

### `assigneeOptionState`

- `options`
- `loading`

### `listState`

- `items`
- `total`
- `loading`
- `selectedId`

### `detailState`

- `visible`
- `loading`
- `data`
- `comments`
- `commentLoading`

### `uiState`

- `pageLoading`
- `formVisible`
- `formMode`
- `actionLoading`
- `cancelDialogVisible`

## 组件拆分建议

页面容器统一持有状态和请求，子组件只负责展示和事件抛出：

- 页面容器：`/student/dorm-todo`
- 子组件建议拆分为：
  - 顶部概览区
  - 筛选区
  - 待办卡片列表
  - 详情抽屉
  - 新建/编辑弹窗
  - 评论时间线

约束：

- 请求不下沉到子组件
- 子组件只收 `props` 和抛 `emit`

## API 组织建议

新增独立 API 文件：

- `src/api/student/dormTodo.js`

### 第一轮接口

- `fetchDormTodoStat`
- `fetchDormTodoList`
- `fetchDormTodoDetail`
- `fetchDormTodoCommentList`
- `fetchDormTodoAssigneeOptions`

### 第二轮接口

- `addDormTodo`
- `editDormTodo`
- `startDormTodo`
- `completeDormTodo`
- `cancelDormTodo`

### 第三轮接口

- `addDormTodoComment`

实现策略：

- 只解开统一 `Result` 包装
- 不做多字段别名兼容
- 契约字段一旦缺失，视为联调问题，不用宽松映射掩盖

## 详情动作规则

### 编辑

- 只在 `canEdit=true` 时显示

### 开始处理

- 只在 `canStart=true` 时显示
- 对应 `0 -> 1`

### 完成

- 只在 `canComplete=true` 时显示
- 对应 `0/1 -> 2`

### 取消

- 只在 `canCancel=true` 时显示
- 对应 `0/1 -> 3`
- 提交时必须填写 `cancelReason`

## 异常态与空态

### 页面级

- 统计失败或列表失败：页面级错误态 + 重试

### 详情级

- 详情加载失败：抽屉内错误态，不影响列表继续浏览

### 空态

- 列表为空：显示当前宿舍暂无待办
- 评论为空：显示暂无评论

## 测试策略

当前项目未见现成测试栈。实现阶段补最小测试能力，并按轮次执行 TDD。

### 第一轮测试

- 首屏并行加载 `stat + list + assignee/options`
- 列表筛选请求参数只发契约字段，不带 `roomId`
- `onlyMine` 正确转换为当前登录学生 `assigneeStudentId`
- 空值展示安全
- 详情优先消费 `detail.commentList`

### 第二轮测试

- `canEdit/canStart/canComplete/canCancel` 控制按钮显隐
- 状态操作成功后刷新 `detail + list + stat`
- 非法流转直接展示后端原文
- 取消操作必须填写 `cancelReason`

### 第三轮测试

- 评论新增后只刷新评论区
- 不触发整页刷新

## 验收清单

- 路由 `/student/dorm-todo` 可正常访问
- 顶部统计只展示 `stat` 返回值
- 列表字段与共享契约一致
- 详情字段与共享契约一致
- 按钮显隐只认 `canXxx`
- 负责人筛选与表单负责人都来自 `/dormitory/todo/assignee/options`
- 不传 `roomId`
- 不猜删除规则
- 评论新增后即时可见
- 空值与空评论场景展示稳定

## 实施顺序

1. 搭建页面骨架、路由、API 文件和只读链路
2. 接通第二轮写操作和详情权限按钮
3. 接通第三轮评论新增与局部刷新

