# SQL查询功能 - 管理员数据库控制台

## 📋 功能概述

在Administrator Dashboard页面的左侧菜单Rankings下面，新增了一个**SQL Query**页面，允许管理员直接对`hands_on_training`数据库执行SQL查询。

## 🎯 功能特性

### 🔒 安全特性
- **只允许SELECT查询**: 出于安全考虑，只允许执行SELECT语句
- **查询超时限制**: 30秒查询超时，防止长时间运行的查询
- **危险操作拦截**: 自动拦截DROP、DELETE、UPDATE等危险操作
- **管理员权限**: 只有管理员角色可以访问此功能

### 💻 用户界面特性
- **SQL编辑器**: 支持语法高亮的SQL查询编辑器
- **数据库架构浏览**: 左侧面板显示所有表和字段信息
- **示例查询**: 预置常用查询模板，一键插入
- **查询历史**: 自动保存最近10条查询历史
- **结果导出**: 支持将查询结果导出为CSV文件
- **格式化工具**: 一键格式化SQL语句

### 📊 查询功能
- **实时执行**: 即时执行SQL查询并显示结果
- **结果统计**: 显示返回行数和执行时间
- **数据类型支持**: 正确显示NULL值、布尔值、JSON等数据类型
- **分页显示**: 大结果集的优化显示

## 🏗️ 技术实现

### 后端API (Node.js/Express)

#### 新增路由文件: `backend/src/routes/sql.js`

**API端点:**

1. **POST /api/sql/execute** - 执行SQL查询
   ```json
   {
     "query": "SELECT * FROM students LIMIT 10;"
   }
   ```

2. **GET /api/sql/schema** - 获取数据库架构
   ```json
   {
     "success": true,
     "data": {
       "tables": [...],
       "totalTables": 4
     }
   }
   ```

3. **GET /api/sql/samples** - 获取示例查询
   ```json
   {
     "success": true,
     "data": [
       {
         "name": "All Students",
         "description": "Get all registered students",
         "query": "SELECT * FROM students;"
       }
     ]
   }
   ```

### 前端组件 (React/TypeScript)

#### 新增页面: `frontend/src/pages/admin/SqlQuery.tsx`

**主要组件:**
- SQL查询编辑器
- 数据库架构浏览器
- 查询结果表格
- 示例查询面板
- 查询历史记录

#### 更新的文件:
- `frontend/src/components/Layout/Sidebar.tsx` - 添加菜单项
- `frontend/src/App.tsx` - 添加路由
- `frontend/src/services/api.ts` - 添加API服务

## 📝 预置示例查询

1. **所有学员** - 获取所有注册学员信息
2. **学员排名** - 按分数排序的学员排行榜
3. **最近提交** - 最近的练习提交记录
4. **练习统计** - 各练习的完成情况统计
5. **每日活动** - 每日提交活动统计
6. **优秀学员** - 表现最佳的学员列表

## 🚀 使用方法

### 1. 访问SQL查询页面
1. 以管理员身份登录系统
2. 在左侧菜单中点击 **SQL Query** (🗄️ Database Console)

### 2. 执行查询
1. 在SQL编辑器中输入查询语句
2. 点击 **Execute Query** 按钮
3. 查看下方的查询结果

### 3. 使用辅助功能
- **浏览架构**: 点击左侧表名查看字段信息
- **插入示例**: 点击示例查询直接插入到编辑器
- **格式化**: 使用Format按钮美化SQL语句
- **导出结果**: 将查询结果导出为CSV文件

## 🔍 示例查询

### 查看所有学员
```sql
SELECT id, name, access_key, registered_at, last_active_at 
FROM students 
ORDER BY registered_at DESC;
```

### 学员成绩排行榜
```sql
SELECT 
  s.name as student_name,
  s.access_key,
  COUNT(sub.id) as total_submissions,
  COALESCE(MAX(sub.score), 0) as highest_score,
  COALESCE(AVG(sub.score), 0) as average_score
FROM students s
LEFT JOIN submissions sub ON s.id = sub.student_id
GROUP BY s.id, s.name, s.access_key
ORDER BY highest_score DESC, average_score DESC;
```

### 最近提交记录
```sql
SELECT 
  s.name as student_name,
  sub.score,
  sub.operating_system,
  sub.instance_type,
  sub.elastic_ip_address,
  sub.submitted_at
FROM submissions sub
JOIN students s ON sub.student_id = s.id
ORDER BY sub.submitted_at DESC
LIMIT 20;
```

## ⚠️ 安全注意事项

1. **只允许SELECT**: 系统会自动拦截非SELECT语句
2. **查询超时**: 30秒超时限制，避免长时间查询
3. **管理员专用**: 只有管理员角色可以访问
4. **审计日志**: 所有查询都会记录在服务器日志中

## 🧪 测试

运行测试脚本验证功能：

```bash
# 启动后端服务器
cd backend
npm start

# 在另一个终端运行测试
node test-sql-api.js
```

## 📊 数据库表结构

当前系统包含以下主要表：

- **students** - 学员信息
- **exercises** - 练习题目
- **submissions** - 提交记录
- **administrators** - 管理员账户

每个表的详细字段信息可以在SQL查询页面的左侧架构面板中查看。

## 🔄 未来增强

可能的功能增强：
- 查询结果的图表可视化
- 更多的数据导出格式 (Excel, JSON)
- 查询性能分析
- 查询收藏夹功能
- 多标签页支持
- SQL语法自动补全

---

这个SQL查询功能为管理员提供了强大而安全的数据库访问能力，便于进行数据分析和系统监控。