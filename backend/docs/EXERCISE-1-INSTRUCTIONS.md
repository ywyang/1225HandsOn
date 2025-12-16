# Hands-on Exercise 1: EC2实例信息收集与API提交

## 题目概述

本练习要求您开发一个本地程序，该程序能够自动收集当前EC2实例的系统信息，并通过API调用将这些信息提交到训练系统后台。这是一个真实的云计算场景练习，模拟了在AWS环境中进行系统监控和数据收集的常见任务。

## 学习目标

通过完成本练习，您将学会：

1. **AWS EC2元数据服务使用** - 学习如何从EC2实例获取系统信息
2. **HTTP API调用** - 掌握RESTful API的调用方法
3. **错误处理和重试机制** - 实现健壮的网络通信
4. **系统信息收集** - 获取操作系统、网络等系统信息
5. **JSON数据处理** - 处理API请求和响应数据
6. **环境变量配置** - 管理应用程序配置

## 技术要求

### 支持的编程语言
- **Node.js** (推荐)
- **Python**
- **Java**
- **Go**
- **其他语言** (需要支持HTTP请求)

### 运行环境
- AWS EC2实例 (任意类型)
- 能够访问互联网
- 安装对应的编程语言运行时

## 任务详细说明

### 第一步：学员注册

您的程序需要首先向训练系统注册，获取唯一的访问密钥(Access Key)。

**API接口**: `POST /api/auth/student/register`

**请求示例**:
```json
{
  "name": "您的姓名"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "Registration successful! Please save your access key.",
  "student": {
    "name": "您的姓名",
    "accessKey": "ABC123XYZ789",
    "registeredAt": "2024-01-15T10:30:00.000Z"
  },
  "isNewRegistration": true
}
```

**重要提示**: 请保存返回的`accessKey`，后续提交需要使用。

### 第二步：收集EC2实例信息

您的程序需要收集以下EC2实例信息：

#### 必需信息
1. **操作系统信息** (`operatingSystem`)
   - 示例: "Amazon Linux 2", "Ubuntu 20.04", "Windows Server 2019"
   
2. **AMI ID** (`amiId`) 
   - 从EC2元数据服务获取: `http://169.254.169.254/latest/meta-data/ami-id`
   - 示例: "ami-0abcdef1234567890"

3. **内网IP地址** (`internalIpAddress`)
   - 从EC2元数据服务获取: `http://169.254.169.254/latest/meta-data/local-ipv4`
   - 示例: "10.0.1.100"

4. **实例类型** (`instanceType`)
   - 从EC2元数据服务获取: `http://169.254.169.254/latest/meta-data/instance-type`
   - 示例: "t3.micro", "t3.small"

#### EC2元数据服务使用方法

```bash
# 获取AMI ID
curl http://169.254.169.254/latest/meta-data/ami-id

# 获取实例类型
curl http://169.254.169.254/latest/meta-data/instance-type

# 获取内网IP
curl http://169.254.169.254/latest/meta-data/local-ipv4

# 获取可用区
curl http://169.254.169.254/latest/meta-data/placement/availability-zone
```

### 第三步：提交数据到API

将收集到的信息提交到训练系统。

**API接口**: `POST /api/submissions/exercise1`

**请求格式**:
```json
{
  "studentName": "您的姓名",
  "accessKey": "您的访问密钥",
  "ec2InstanceInfo": {
    "operatingSystem": "Amazon Linux 2",
    "amiId": "ami-0abcdef1234567890", 
    "internalIpAddress": "10.0.1.100",
    "instanceType": "t3.micro"
  }
}
```

**成功响应**:
```json
{
  "success": true,
  "message": "Submission received and processed successfully",
  "submissionId": "sub-12345",
  "score": 100,
  "timestamp": "2024-01-15T11:00:00.000Z",
  "clientIp": "203.0.113.1"
}
```

### 第四步：查看结果

提交成功后，您可以查看个人成绩和排名。

**查看个人统计**: `GET /api/statistics/student/{accessKey}`

**查看排行榜**: `GET /api/statistics/rankings`

## 评分标准

| 完成度 | 分数 | 说明 |
|--------|------|------|
| 完整提交 | 100分 | 提供所有必需的EC2实例信息 |
| 部分提交 | 50分 | 提供部分信息或信息不完整 |
| 提交失败 | 0分 | 程序错误或数据无效 |

## 代码示例

### Node.js 示例

```javascript
import fetch from 'node-fetch';
import os from 'os';

const API_BASE_URL = 'http://training-api.example.com/api';
const STUDENT_NAME = '您的姓名';

async function getEC2Metadata(path) {
  try {
    const response = await fetch(`http://169.254.169.254/latest/meta-data/${path}`, {
      timeout: 5000
    });
    return await response.text();
  } catch (error) {
    console.error(`获取元数据失败: ${path}`, error.message);
    return null;
  }
}

async function collectEC2Info() {
  const operatingSystem = `${os.type()} ${os.release()}`;
  const amiId = await getEC2Metadata('ami-id');
  const internalIpAddress = await getEC2Metadata('local-ipv4');
  const instanceType = await getEC2Metadata('instance-type');
  
  return {
    operatingSystem,
    amiId,
    internalIpAddress,
    instanceType
  };
}

async function registerStudent() {
  const response = await fetch(`${API_BASE_URL}/auth/student/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: STUDENT_NAME })
  });
  
  const data = await response.json();
  return data.student.accessKey;
}

async function submitExercise(accessKey, ec2Info) {
  const response = await fetch(`${API_BASE_URL}/submissions/exercise1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentName: STUDENT_NAME,
      accessKey: accessKey,
      ec2InstanceInfo: ec2Info
    })
  });
  
  return await response.json();
}

async function main() {
  try {
    console.log('🚀 开始Exercise 1...');
    
    // 1. 注册学员
    const accessKey = await registerStudent();
    console.log(`✅ 注册成功，Access Key: ${accessKey}`);
    
    // 2. 收集EC2信息
    const ec2Info = await collectEC2Info();
    console.log('📊 EC2信息收集完成:', ec2Info);
    
    // 3. 提交数据
    const result = await submitExercise(accessKey, ec2Info);
    console.log('🎉 提交成功!', result);
    
  } catch (error) {
    console.error('❌ 程序执行失败:', error.message);
  }
}

main();
```

### Python 示例

```python
import requests
import platform
import json

API_BASE_URL = 'http://training-api.example.com/api'
STUDENT_NAME = '您的姓名'

def get_ec2_metadata(path):
    try:
        response = requests.get(f'http://169.254.169.254/latest/meta-data/{path}', timeout=5)
        return response.text
    except Exception as e:
        print(f"获取元数据失败: {path}, {e}")
        return None

def collect_ec2_info():
    operating_system = f"{platform.system()} {platform.release()}"
    ami_id = get_ec2_metadata('ami-id')
    internal_ip = get_ec2_metadata('local-ipv4')
    instance_type = get_ec2_metadata('instance-type')
    
    return {
        'operatingSystem': operating_system,
        'amiId': ami_id,
        'internalIpAddress': internal_ip,
        'instanceType': instance_type
    }

def register_student():
    response = requests.post(f'{API_BASE_URL}/auth/student/register', 
                           json={'name': STUDENT_NAME})
    data = response.json()
    return data['student']['accessKey']

def submit_exercise(access_key, ec2_info):
    payload = {
        'studentName': STUDENT_NAME,
        'accessKey': access_key,
        'ec2InstanceInfo': ec2_info
    }
    
    response = requests.post(f'{API_BASE_URL}/submissions/exercise1', json=payload)
    return response.json()

def main():
    try:
        print('🚀 开始Exercise 1...')
        
        # 1. 注册学员
        access_key = register_student()
        print(f'✅ 注册成功，Access Key: {access_key}')
        
        # 2. 收集EC2信息
        ec2_info = collect_ec2_info()
        print('📊 EC2信息收集完成:', ec2_info)
        
        # 3. 提交数据
        result = submit_exercise(access_key, ec2_info)
        print('🎉 提交成功!', result)
        
    except Exception as e:
        print(f'❌ 程序执行失败: {e}')

if __name__ == '__main__':
    main()
```

## 开发提示

### 1. 错误处理
- 网络请求可能失败，需要实现重试机制
- EC2元数据服务可能不可用，需要提供备用方案
- API响应需要验证状态码和数据格式

### 2. 超时设置
- EC2元数据服务请求建议设置5秒超时
- API请求建议设置10秒超时

### 3. 环境变量
建议使用环境变量管理配置：
```bash
export STUDENT_NAME="您的姓名"
export API_BASE_URL="http://training-api.example.com/api"
export ACCESS_KEY="您的访问密钥"  # 可选，程序可自动获取
```

### 4. 日志记录
- 记录关键步骤的执行情况
- 记录错误信息便于调试
- 记录提交结果和分数

## 测试环境

### 本地测试
如果您不在EC2环境中开发，可以使用模拟数据：

```javascript
// 模拟EC2元数据
const mockEC2Info = {
  operatingSystem: "Ubuntu 20.04",
  amiId: "ami-0abcdef1234567890",
  internalIpAddress: "10.0.1.100", 
  instanceType: "t3.micro"
};
```

### API测试服务器
训练系统提供测试服务器供开发调试：
- 测试地址: `http://localhost:3000/api` (本地测试)
- 生产地址: 由培训讲师提供

## 常见问题

### Q1: 无法访问EC2元数据服务
**A**: 确保您在EC2实例中运行程序。如果在本地开发，请使用模拟数据。

### Q2: API调用返回401错误
**A**: 检查学员姓名和Access Key是否正确，确保先完成注册步骤。

### Q3: 网络连接超时
**A**: 检查网络连接，确认API服务器地址正确，适当增加超时时间。

### Q4: 获取的EC2信息为空
**A**: 确保在EC2实例中运行，检查实例是否有访问元数据服务的权限。

## 提交要求

1. **源代码文件** - 包含完整的程序代码
2. **运行说明** - 如何运行您的程序
3. **依赖说明** - 需要安装的依赖包
4. **测试结果** - 程序运行的输出截图

## 扩展挑战 (可选)

1. **多次提交优化** - 实现增量更新，只在信息变化时提交
2. **配置文件支持** - 支持从配置文件读取设置
3. **日志文件** - 将运行日志保存到文件
4. **定时任务** - 实现定期自动提交功能
5. **健康检查** - 添加API服务器健康检查功能

## 技术支持

如果在开发过程中遇到问题：

1. 查看API文档: `backend/README-EXERCISE1.md`
2. 参考示例代码: `backend/student-example.js`
3. 运行测试程序: `backend/test-api.js`
4. 联系培训讲师获取帮助

---

**祝您编程愉快！完成后请及时提交并查看排行榜上的成绩。** 🚀