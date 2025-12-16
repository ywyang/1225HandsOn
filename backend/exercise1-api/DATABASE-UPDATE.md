# 数据库更新说明

## 📋 更新内容

为了支持新的功能，`submissions` 表需要添加以下字段：

- `elastic_ip_address INET` - 存储EC2实例的弹性IP地址
- `screenshot_data BYTEA` - 存储头像图片的二进制数据
- `screenshot_filename VARCHAR(255)` - 存储头像文件名
- `screenshot_mimetype VARCHAR(100)` - 存储头像MIME类型
- `screenshot_size INTEGER` - 存储头像文件大小

## 🔍 检查数据库状态

运行以下命令检查当前数据库表结构：

```bash
npm run check-db
```

## 🚀 自动迁移

如果您使用的是全新的数据库，运行以下命令会自动创建完整的表结构：

```bash
# 使用backend项目的迁移脚本
cd ../backend
npm run migrate

# 或者直接执行schema文件
psql -h localhost -U postgres -d training_system -f src/database/schema.sql
```

## 🔧 手动迁移 (如果表已存在)

如果 `submissions` 表已经存在但缺少新字段，请运行：

```bash
psql -h localhost -U postgres -d training_system -f migrate-elastic-ip.sql
```

## ✅ 验证更新

更新完成后，再次运行检查命令确认：

```bash
npm run check-db
```

您应该看到类似以下的输出：

```
✅ submissions表结构:
================================================================================
字段名                    数据类型             可空       默认值
--------------------------------------------------------------------------------
id                       uuid                NO        gen_random_uuid()
student_id               uuid                YES       
exercise_id              uuid                YES       
client_ip_address        inet                NO        
operating_system         character varying   YES       
ami_id                   character varying   YES       
internal_ip_address      inet                YES       
elastic_ip_address       inet                YES       
instance_type            character varying   YES       
screenshot_data          bytea               YES       
screenshot_filename      character varying   YES       
screenshot_mimetype      character varying   YES       
screenshot_size          integer             YES       
score                    integer             NO        0
submitted_at             timestamp with time zone NO   CURRENT_TIMESTAMP
processing_status        character varying   NO        'pending'::character varying

🔍 检查关键字段:
   ✅ elastic_ip_address
   ✅ internal_ip_address
   ✅ screenshot_data
   ✅ screenshot_filename
   ✅ screenshot_mimetype
   ✅ screenshot_size

🎉 数据库表结构完整！
```

## 🔄 回滚 (如果需要)

如果需要移除新添加的字段，可以运行：

```sql
-- 移除弹性IP字段
ALTER TABLE submissions DROP COLUMN IF EXISTS elastic_ip_address;

-- 移除头像相关字段
ALTER TABLE submissions DROP COLUMN IF EXISTS screenshot_data;
ALTER TABLE submissions DROP COLUMN IF EXISTS screenshot_filename;
ALTER TABLE submissions DROP COLUMN IF EXISTS screenshot_mimetype;
ALTER TABLE submissions DROP COLUMN IF EXISTS screenshot_size;
```

## 📊 数据兼容性

- 新字段都是可选的 (允许NULL)，不会影响现有数据
- 现有的提交记录会继续正常工作
- 新的评分系统会根据字段完整性给出相应分数

## 🎯 测试新功能

数据库更新完成后，可以测试新功能：

```bash
# 测试基础API功能
npm test

# 测试头像上传功能
npm run test-avatar

# 运行学员示例程序
npm run example
```