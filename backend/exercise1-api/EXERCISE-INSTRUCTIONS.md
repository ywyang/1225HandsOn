# Exercise 1: EC2实例信息收集与API提交

## 🎯 任务目标

开发一个程序，自动收集当前EC2实例的系统信息，并通过API调用将这些信息提交到训练系统获得分数。

## 📋 完成步骤

### 1️⃣ 学员注册
调用API获取您的专属访问密钥：

```bash
curl -X POST http://localhost:3001/api/auth/student/register \
  -H "Content-Type: application/json" \
  -d '{"name": "您的姓名"}'
```

### 2️⃣ 收集EC2信息
从EC2元数据服务获取以下信息：

| 信息项 | 获取命令 | 示例值 |
|--------|----------|--------|
| 操作系统 | `uname -a` | "Linux 5.4.0" |
| AMI ID | `curl http://169.254.169.254/latest/meta-data/ami-id` | "ami-0abc123" |
| 内网IP | `curl http://169.254.169.254/latest/meta-data/local-ipv4` | "10.0.1.100" |
| 实例类型 | `curl http://169.254.169.254/latest/meta-data/instance-type` | "t3.micro" |

### 3️⃣ 提交数据
将收集的信息提交到API：

```bash
curl -X POST http://localhost:3001/api/submissions/exercise1 \
  -H "Content-Type: application/json" \
  -d '{
    "studentName": "您的姓名",
    "accessKey": "您的访问密钥",
    "ec2InstanceInfo": {
      "operatingSystem": "Linux 5.4.0",
      "amiId": "ami-0abc123",
      "internalIpAddress": "10.0.1.100",
      "instanceType": "t3.micro"
    }
  }'
```

### 4️⃣ 查看成绩
提交成功后查看分数和排名：

```bash
# 个人成绩
curl http://localhost:3001/api/statistics/student/{您的访问密钥}

# 排行榜
curl http://localhost:3001/api/statistics/rankings
```

## 📊 评分标准

- ✅ **100分**：提供完整准确的EC2信息
- ⚠️ **50分**：信息不完整或部分错误  
- ❌ **0分**：提交失败或数据无效

## 💻 编程语言支持

### Node.js 示例
```javascript
import fetch from 'node-fetch';
import os from 'os';

const API_URL = 'http://localhost:3001/api';
const STUDENT_NAME = '您的姓名';

async function main() {
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
    try {
      const response = await fetch(`http://169.254.169.254/latest/meta-data/${path}`);
      return await response.text();
    } catch (error) {
      return 'unknown';
    }
  };

  const ec2Info = {
    operatingSystem: os.type() + ' ' + os.release(),
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
  console.log('提交结果:', result);
}

main();
```

### Python 示例
```python
import requests
import platform
import subprocess

API_URL = 'http://localhost:3001/api'
STUDENT_NAME = '您的姓名'

def get_metadata(path):
    try:
        response = requests.get(f'http://169.254.169.254/latest/meta-data/{path}', timeout=2)
        return response.text
    except:
        return 'unknown'

def main():
    # 1. 注册获取密钥
    response = requests.post(f'{API_URL}/auth/student/register', 
                           json={'name': STUDENT_NAME})
    access_key = response.json()['student']['accessKey']

    # 2. 收集EC2信息
    ec2_info = {
        'operatingSystem': f"{platform.system()} {platform.release()}",
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
    print('提交结果:', result)

if __name__ == '__main__':
    main()
```

### Bash 脚本示例
```bash
#!/bin/bash

API_URL="http://localhost:3001/api"
STUDENT_NAME="您的姓名"

# 1. 注册获取密钥
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/student/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$STUDENT_NAME\"}")

ACCESS_KEY=$(echo $REGISTER_RESPONSE | jq -r '.student.accessKey')
echo "Access Key: $ACCESS_KEY"

# 2. 收集EC2信息
OS_INFO=$(uname -s)
AMI_ID=$(curl -s http://169.254.169.254/latest/meta-data/ami-id 2>/dev/null || echo "ami-unknown")
INTERNAL_IP=$(curl -s http://169.254.169.254/latest/meta-data/local-ipv4 2>/dev/null || echo "10.0.1.100")
INSTANCE_TYPE=$(curl -s http://169.254.169.254/latest/meta-data/instance-type 2>/dev/null || echo "t3.micro")

# 3. 提交数据
SUBMIT_RESPONSE=$(curl -s -X POST "$API_URL/submissions/exercise1" \
  -H "Content-Type: application/json" \
  -d "{
    \"studentName\": \"$STUDENT_NAME\",
    \"accessKey\": \"$ACCESS_KEY\",
    \"ec2InstanceInfo\": {
      \"operatingSystem\": \"$OS_INFO\",
      \"amiId\": \"$AMI_ID\",
      \"internalIpAddress\": \"$INTERNAL_IP\",
      \"instanceType\": \"$INSTANCE_TYPE\"
    }
  }")

echo "提交结果: $SUBMIT_RESPONSE"
```

## 🔧 开发提示

### 1. 错误处理
- 网络请求可能失败，需要实现重试机制
- EC2元数据服务可能不可用，需要提供备用方案
- API响应需要验证状态码和数据格式

### 2. 超时设置
- EC2元数据服务请求建议设置2秒超时
- API请求建议设置10秒超时

### 3. 本地开发
如果不在EC2环境中开发，可以使用模拟数据：
```javascript
const mockEC2Info = {
  operatingSystem: "Ubuntu 20.04",
  amiId: "ami-0abcdef1234567890",
  internalIpAddress: "10.0.1.100", 
  instanceType: "t3.micro"
};
```

## 🚀 快速测试

### 启动API服务器
```bash
cd exercise1-api
npm install
npm start
```

### 运行示例程序
```bash
export STUDENT_NAME="您的姓名"
npm run example
```

### 测试API功能
```bash
npm run test
```

## ❓ 常见问题

**Q: 无法访问元数据服务？**
A: 确保在EC2实例中运行，或使用模拟数据测试。

**Q: API返回401错误？**  
A: 检查学员姓名和访问密钥是否正确。

**Q: 提交后没有分数？**
A: 检查提交的数据格式，确保所有必需字段完整。

## 📝 提交要求

1. **源代码文件** - 完整的程序代码
2. **运行截图** - 显示成功提交和分数
3. **说明文档** - 简要的运行说明

---

**开始编程吧！记得查看排行榜上的实时排名！** 🏆