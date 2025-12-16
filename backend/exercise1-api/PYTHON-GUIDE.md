# Python版本使用指南

## 🐍 Python API测试和示例程序

本目录包含了Exercise 1 API的Python版本测试和示例程序，方便Python开发者使用。

## 📋 文件说明

- `test-api.py` - 完整的API测试脚本
- `student-example.py` - 学员示例程序
- `test-avatar-storage.py` - 头像存储数据库测试
- `requirements.txt` - Python依赖文件

## 🚀 快速开始

### 1. 安装Python依赖

```bash
# 安装基础依赖
pip install requests

# 或安装完整依赖 (包含数据库测试)
pip install -r requirements.txt
```

### 2. 运行API测试

```bash
# 基础API测试
python test-api.py

# 头像存储测试 (需要数据库访问)
python test-avatar-storage.py
```

### 3. 运行学员示例程序

```bash
# 使用默认学员姓名
python student-example.py

# 自定义学员姓名
STUDENT_NAME="李四" python student-example.py

# 使用现有访问密钥
ACCESS_KEY="your_access_key" python student-example.py
```

## 🔧 环境变量配置

### API配置
```bash
export API_BASE_URL="http://localhost:3001/api"  # API服务器地址
export STUDENT_NAME="张三"                        # 学员姓名
export ACCESS_KEY="your_access_key"               # 访问密钥 (可选)
```

### 数据库配置 (用于数据库测试)
```bash
export DB_HOST="localhost"        # 数据库主机
export DB_PORT="5432"            # 数据库端口
export DB_NAME="training_system" # 数据库名称
export DB_USER="postgres"        # 数据库用户
export DB_PASSWORD="password"    # 数据库密码
```

## 📊 测试功能

### test-api.py 功能
- ✅ 健康检查
- ✅ 学员注册
- ✅ 访问密钥查询
- ✅ Exercise 1提交 (无头像)
- ✅ Exercise 1提交 (带头像)
- ✅ 文件上传方式提交
- ✅ 头像下载测试
- ✅ 学员提交记录查询
- ✅ 学员统计信息
- ✅ 排行榜查询

### student-example.py 功能
- 🔑 自动注册获取访问密钥
- 📊 收集EC2实例信息
- 👤 创建头像图片
- 📤 提交练习数据
- 📈 查看成绩和排名

### test-avatar-storage.py 功能
- 🗄️ 直接数据库验证
- 🔍 数据完整性检查
- 📥 头像下载测试
- ✅ 端到端验证

## 💻 代码示例

### 基础API调用
```python
import requests

# 注册学员
response = requests.post(
    'http://localhost:3001/api/auth/student/register',
    json={'name': '张三'}
)
data = response.json()
access_key = data['student']['accessKey']

# 提交练习 (带头像)
submission_data = {
    'studentName': '张三',
    'accessKey': access_key,
    'ec2InstanceInfo': {
        'operatingSystem': 'Linux',
        'amiId': 'ami-123',
        'internalIpAddress': '10.0.1.100',
        'elasticIpAddress': '203.0.113.100',
        'instanceType': 't3.micro'
    },
    'avatarBase64': 'data:image/png;base64,iVBORw0KGgo...'
}

response = requests.post(
    'http://localhost:3001/api/submissions/exercise1',
    json=submission_data
)
```

### 文件上传方式
```python
import requests

# 准备表单数据
data = {
    'studentName': '张三',
    'accessKey': access_key,
    'ec2InstanceInfo[operatingSystem]': 'Linux',
    'ec2InstanceInfo[amiId]': 'ami-123',
    'ec2InstanceInfo[internalIpAddress]': '10.0.1.100',
    'ec2InstanceInfo[elasticIpAddress]': '203.0.113.100',
    'ec2InstanceInfo[instanceType]': 't3.micro'
}

# 上传头像文件
files = {
    'avatar': ('avatar.png', open('avatar.png', 'rb'), 'image/png')
}

response = requests.post(
    'http://localhost:3001/api/submissions/exercise1',
    data=data,
    files=files
)
```

## 🔍 故障排除

### 常见错误

**ImportError: No module named 'requests'**
```bash
pip install requests
```

**ImportError: No module named 'psycopg2'**
```bash
pip install psycopg2-binary
```

**连接被拒绝**
```bash
# 检查API服务器是否运行
curl http://localhost:3001/health
```

**数据库连接失败**
```bash
# 检查数据库配置
export DB_HOST="localhost"
export DB_PASSWORD="your_password"
```

### 调试技巧

1. **启用详细输出**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

2. **检查响应状态**
```python
response = requests.post(url, json=data)
print(f"状态码: {response.status_code}")
print(f"响应: {response.text}")
```

3. **验证数据格式**
```python
import json
print(json.dumps(data, indent=2, ensure_ascii=False))
```

## 📈 性能优化

### 会话复用
```python
import requests

# 使用会话复用连接
session = requests.Session()
response1 = session.post(url1, json=data1)
response2 = session.post(url2, json=data2)
```

### 超时设置
```python
# 设置请求超时
response = requests.post(url, json=data, timeout=10)
```

### 重试机制
```python
import time

def retry_request(url, data, max_retries=3):
    for i in range(max_retries):
        try:
            response = requests.post(url, json=data, timeout=10)
            if response.status_code == 200:
                return response
        except Exception as e:
            if i == max_retries - 1:
                raise e
            time.sleep(2 ** i)  # 指数退避
```

## 🎯 最佳实践

1. **使用环境变量管理配置**
2. **实现适当的错误处理**
3. **添加日志记录**
4. **使用类型提示提高代码可读性**
5. **编写单元测试**
6. **遵循PEP 8代码规范**

## 📚 相关资源

- [Python Requests文档](https://docs.python-requests.org/)
- [Exercise 1 API文档](./CLIENT-DEVELOPMENT-GUIDE.md)
- [数据库更新说明](./DATABASE-UPDATE.md)

---

**开始您的Python Exercise 1之旅！** 🐍🚀