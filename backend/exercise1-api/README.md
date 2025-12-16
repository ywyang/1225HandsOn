# Exercise 1 API Server

一个简化的、纯JavaScript实现的Exercise 1 API服务器，用于hands-on训练系统。

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境

```bash
# 复制环境配置文件
cp .env.example .env

# 编辑配置文件 (使用现有数据库)
nano .env
```

### 3. 启动服务器

```bash
# 开发模式
npm run dev

# 生产模式
npm start

# 带验证的启动 (推荐)
npm run start-with-check
```

服务器将在 `http://localhost:3001` 启动。

**⚠️ 重要**: 运行Python测试前，请确保服务器已启动！

```bash
# 检查服务器状态
npm run check-server
# 或使用Python版本
python quick-check.py
```

### 4. 测试API

#### Node.js版本
```bash
# 运行API测试
npm run test

# 测试头像功能
npm run test-avatar

# 测试数据存储
npm run test-storage
```

#### Python版本
```bash
# 安装Python依赖
pip install -r requirements.txt

# 运行Python API测试
python test-api.py

# 测试头像存储 (需要数据库访问)
python test-avatar-storage.py
```

### 5. 运行学员示例

#### Node.js版本
```bash
# 设置学员姓名
export STUDENT_NAME="张三"

# 运行示例程序
npm run example
```

#### Python版本
```bash
# 安装Python依赖
pip install requests

# 运行Python示例程序
python student-example.py

# 或设置学员姓名
STUDENT_NAME="张三" python student-example.py
```

## 📋 API接口

### 学员注册
```http
POST /api/auth/student/register
Content-Type: application/json

{
  "name": "学员姓名"
}
```

### Access Key查询
```http
GET /api/auth/student/lookup/{姓名}
```

### Exercise 1提交 (支持头像)

#### 方式1: JSON格式 (带Base64头像)
```http
POST /api/submissions/exercise1
Content-Type: application/json

{
  "studentName": "学员姓名",
  "accessKey": "访问密钥",
  "ec2InstanceInfo": {
    "operatingSystem": "Amazon Linux 2",
    "amiId": "ami-0abc123",
    "internalIpAddress": "10.0.1.100",
    "elasticIpAddress": "203.0.113.100",
    "instanceType": "t3.micro"
  },
  "avatarBase64": "data:image/png;base64,iVBORw0KGgo..."
}
```

#### 方式2: 表单上传 (文件)
```http
POST /api/submissions/exercise1
Content-Type: multipart/form-data

studentName: 学员姓名
accessKey: 访问密钥
ec2InstanceInfo[operatingSystem]: Amazon Linux 2
ec2InstanceInfo[amiId]: ami-0abc123
ec2InstanceInfo[internalIpAddress]: 10.0.1.100
ec2InstanceInfo[elasticIpAddress]: 203.0.113.100
ec2InstanceInfo[instanceType]: t3.micro
avatar: [头像文件数据]
```

### 查看学员提交
```http
GET /api/submissions/student/{accessKey}
```

### 查看排行榜
```http
GET /api/statistics/rankings
```

### 查看学员统计
```http
GET /api/statistics/student/{accessKey}
```

### 下载头像
```http
GET /api/submissions/{submissionId}/avatar
```

## 🗄️ 数据库要求

本项目使用现有的PostgreSQL数据库，需要以下表结构：

- `students` - 学员信息
- `exercises` - 练习信息  
- `submissions` - 提交记录

如果表不存在，服务器会自动创建默认的Exercise 1练习。

## 📊 评分标准

- 🏆 **100分**: 提供完整的EC2实例信息 + 弹性IP + 头像
- 🥇 **90分**: 提供完整的EC2实例信息 + 弹性IP但无头像
- ✅ **85分**: 提供完整的EC2实例信息 + 头像但无弹性IP
- 🥉 **80分**: 提供完整的EC2实例信息但无弹性IP和头像
- ⚠️ **60分**: 提供头像但EC2信息不完整
- ❌ **40分**: 信息不完整且无头像

## 🔧 开发说明

### 项目特点
- 纯JavaScript实现，无需TypeScript编译
- 使用现有数据库，无需额外配置
- 简化的代码结构，易于理解和修改
- 完整的错误处理和日志记录

### 文件结构
```
exercise1-api/
├── server.js              # 主服务器文件
├── test-api.js            # API测试脚本 (Node.js)
├── test-api.py            # API测试脚本 (Python)
├── student-example.js     # 学员示例程序 (Node.js)
├── student-example.py     # 学员示例程序 (Python)
├── test-avatar-storage.py # 头像存储测试 (Python)
├── package.json           # Node.js项目配置
├── requirements.txt       # Python依赖配置
├── .env.example           # 环境配置示例
├── PYTHON-GUIDE.md        # Python使用指南
└── README.md             # 项目说明
```

### 环境变量
```env
DB_HOST=localhost       # 数据库主机
DB_PORT=5432           # 数据库端口
DB_NAME=training_system # 数据库名称
DB_USER=postgres       # 数据库用户
DB_PASSWORD=password   # 数据库密码
PORT=3000             # 服务器端口
```

## 🎓 学员使用指南

### 开发要求
学员需要开发一个程序，能够：

1. **注册获取Access Key**
2. **收集EC2实例信息**
   - 操作系统信息
   - AMI ID
   - 内网IP地址
   - 弹性IP地址 (可选，但影响分数)
   - 实例类型
3. **👤 上传头像图片** (可选，但影响分数)
4. **调用API提交数据**
5. **查看成绩和排名**

### 示例代码
- **Node.js**: 参考 `student-example.js` 文件
- **Python**: 参考 `student-example.py` 文件
- **详细指南**: 查看 `PYTHON-GUIDE.md` 了解Python版本使用方法

### EC2元数据获取
```bash
# AMI ID
curl http://169.254.169.254/latest/meta-data/ami-id

# 实例类型
curl http://169.254.169.254/latest/meta-data/instance-type

# 内网IP
curl http://169.254.169.254/latest/meta-data/local-ipv4

# 弹性IP (公网IP)
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

## 🔍 故障排除

### 数据库写入问题

如果API返回成功但数据没有写入数据库，请按以下步骤排查：

```bash
# 1. 测试数据库连接
npm run test-connection

# 2. 检查表结构
npm run check-db

# 3. 运行完整的数据库调试
npm run debug-db

# 4. 测试API写入功能
npm run test-db-write
```

**重要**: 确保使用正确的数据库名称 `hands_on_training`，不是 `training_system`。

### 常见问题

**Q: 数据库连接失败**
```bash
# 检查数据库状态
systemctl status postgresql

# 测试连接
psql -h localhost -U postgres -d hands_on_training
```

**A: 确保数据库服务运行正常，检查连接参数。**

**Q: 端口被占用**
```bash
# 查看端口使用
netstat -tlnp | grep :3000

# 更改端口
export PORT=3001
npm start
```

**Q: 学员无法提交数据**
**A: 检查学员姓名和Access Key是否正确，确认EC2信息格式正确。**

**Q: 数据没有写入数据库**
**A: 参考 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 进行详细排查。**

**Q: 学员注册返回500错误**
**A: 通常是数据库连接问题，参考 [DATABASE-CONNECTION-ISSUE.md](./DATABASE-CONNECTION-ISSUE.md) 解决。**

## 📚 相关文档

- [详细开发指南](../docs/EXERCISE-1-INSTRUCTIONS.md)
- [快速参考](../docs/QUICK-REFERENCE.md)
- [学员版说明](../docs/STUDENT-EXERCISE-1.md)
- [讲师指导手册](../docs/INSTRUCTOR-GUIDE.md)

---

**开始您的Exercise 1之旅！** 🚀