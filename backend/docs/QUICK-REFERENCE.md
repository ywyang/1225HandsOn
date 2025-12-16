# Exercise 1 快速参考

## 🎯 任务目标
开发程序收集EC2实例信息并提交到API获得分数

## 📋 必需信息
| 字段 | 获取方式 | 示例 |
|------|----------|------|
| `operatingSystem` | 系统API | "Amazon Linux 2" |
| `amiId` | 元数据服务 | "ami-0abc123" |
| `internalIpAddress` | 元数据服务 | "10.0.1.100" |
| `instanceType` | 元数据服务 | "t3.micro" |

## 🔗 关键API

### 1. 学员注册
```http
POST /api/auth/student/register
Content-Type: application/json

{
  "name": "您的姓名"
}
```

### 2. 提交数据
```http
POST /api/submissions/exercise1
Content-Type: application/json

{
  "studentName": "您的姓名",
  "accessKey": "您的密钥",
  "ec2InstanceInfo": {
    "operatingSystem": "Amazon Linux 2",
    "amiId": "ami-0abc123",
    "internalIpAddress": "10.0.1.100", 
    "instanceType": "t3.micro"
  }
}
```

### 3. 查看成绩
```http
GET /api/statistics/student/{accessKey}
GET /api/statistics/rankings
```

## 💻 EC2元数据命令
```bash
# AMI ID
curl http://169.254.169.254/latest/meta-data/ami-id

# 实例类型  
curl http://169.254.169.254/latest/meta-data/instance-type

# 内网IP
curl http://169.254.169.254/latest/meta-data/local-ipv4
```

## 📊 评分标准
- ✅ **100分**: 完整信息
- ⚠️ **50分**: 部分信息  
- ❌ **0分**: 提交失败

## 🚀 快速开始

### Node.js
```javascript
import fetch from 'node-fetch';

const API_URL = 'http://服务器地址/api';
const STUDENT_NAME = '您的姓名';

// 1. 注册获取密钥
const registerResponse = await fetch(`${API_URL}/auth/student/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: STUDENT_NAME })
});
const { student } = await registerResponse.json();
const accessKey = student.accessKey;

// 2. 收集EC2信息
const getMetadata = async (path) => {
  const response = await fetch(`http://169.254.169.254/latest/meta-data/${path}`);
  return response.text();
};

const ec2Info = {
  operatingSystem: require('os').type(),
  amiId: await getMetadata('ami-id'),
  internalIpAddress: await getMetadata('local-ipv4'),
  instanceType: await getMetadata('instance-type')
};

// 3. 提交数据
const submitResponse = await fetch(`${API_URL}/submissions/exercise1`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentName: STUDENT_NAME,
    accessKey: accessKey,
    ec2InstanceInfo: ec2Info
  })
});

const result = await submitResponse.json();
console.log('分数:', result.score);
```

### Python
```python
import requests
import platform

API_URL = 'http://服务器地址/api'
STUDENT_NAME = '您的姓名'

# 1. 注册获取密钥
response = requests.post(f'{API_URL}/auth/student/register', 
                        json={'name': STUDENT_NAME})
access_key = response.json()['student']['accessKey']

# 2. 收集EC2信息
def get_metadata(path):
    response = requests.get(f'http://169.254.169.254/latest/meta-data/{path}')
    return response.text

ec2_info = {
    'operatingSystem': platform.system(),
    'amiId': get_metadata('ami-id'),
    'internalIpAddress': get_metadata('local-ipv4'),
    'instanceType': get_metadata('instance-type')
}

# 3. 提交数据
response = requests.post(f'{API_URL}/submissions/exercise1', json={
    'studentName': STUDENT_NAME,
    'accessKey': access_key,
    'ec2InstanceInfo': ec2_info
})

result = response.json()
print('分数:', result['score'])
```

## ⚠️ 常见错误
- **401错误**: 检查姓名和密钥
- **超时**: 增加请求超时时间
- **元数据获取失败**: 确保在EC2实例中运行
- **网络错误**: 检查服务器地址和网络连接

## 🔧 调试技巧
```bash
# 测试API连接
curl http://服务器地址/health

# 测试元数据服务
curl http://169.254.169.254/latest/meta-data/

# 查看详细错误
curl -v http://服务器地址/api/...
```

---
**记住**: 保存好您的Access Key，可以多次提交取最高分！ 🏆