# Exercise 1 客户端开发指南

## 🎯 概述

本文档为开发者提供完整的客户端开发指导，帮助您快速理解API接口并开发出符合要求的客户端程序。

## 📋 开发任务

### 核心目标
开发一个客户端程序，能够：
1. **自动注册** - 获取唯一的访问密钥
2. **收集信息** - 获取EC2实例的系统信息
3. **提交数据** - 调用API提交收集的信息
4. **查看结果** - 获取分数和排名信息

### 技术要求
- 支持HTTP/HTTPS请求
- 能够解析JSON数据
- 具备基本的错误处理能力
- 可在EC2环境中运行

## 🌐 API服务器信息

### 基础信息
- **服务器地址**: `http://localhost:3001` (开发环境)
- **API基础路径**: `/api`
- **数据格式**: JSON
- **字符编码**: UTF-8

### 健康检查
```http
GET /health
```
**响应示例**:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "Exercise 1 API Server is running"
}
```

## 📚 API接口详细说明

### 1. 学员注册接口

**目的**: 为学员分配唯一的访问密钥

```http
POST /api/auth/student/register
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "学员姓名"
}
```

**成功响应** (HTTP 201):
```json
{
  "success": true,
  "message": "Registration successful! Please save your access key.",
  "student": {
    "name": "学员姓名",
    "accessKey": "abc123xyz789",
    "registeredAt": "2024-01-15T10:30:00.000Z"
  },
  "isNewRegistration": true,
  "instructions": "Use this access key when submitting exercise solutions via API."
}
```

**重复注册响应** (HTTP 200):
```json
{
  "success": true,
  "message": "Welcome back! Here is your existing access key.",
  "student": {
    "name": "学员姓名",
    "accessKey": "abc123xyz789",
    "registeredAt": "2024-01-15T10:30:00.000Z"
  },
  "isNewRegistration": false
}
```

**错误响应** (HTTP 400):
```json
{
  "error": "Validation failed",
  "details": ["Student name is required"]
}
```

### 2. 访问密钥查询接口

**目的**: 通过姓名查询已分配的访问密钥

```http
GET /api/auth/student/lookup/{学员姓名}
```

**成功响应** (HTTP 200):
```json
{
  "success": true,
  "message": "Access key found successfully",
  "student": {
    "name": "学员姓名",
    "accessKey": "abc123xyz789",
    "registeredAt": "2024-01-15T10:30:00.000Z",
    "lastActiveAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**未找到响应** (HTTP 404):
```json
{
  "error": "Student not found",
  "message": "No access key exists for this name. Please register first.",
  "suggestion": "Use the registration endpoint to create an access key."
}
```

### 3. Exercise 1 提交接口 ⭐

**目的**: 提交EC2实例信息并获得分数

```http
POST /api/submissions/exercise1
Content-Type: application/json
```

**支持两种提交方式**:

#### 方式1: JSON格式 (带Base64图片)
```http
Content-Type: application/json
```
```json
{
  "studentName": "学员姓名",
  "accessKey": "abc123xyz789",
  "ec2InstanceInfo": {
    "operatingSystem": "Amazon Linux 2",
    "amiId": "ami-0abcdef1234567890",
    "internalIpAddress": "10.0.1.100",
    "instanceType": "t3.micro"
  },
  "screenshotBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "screenshotFilename": "ec2-screenshot.png"
}
```

#### 方式2: 表单数据 (文件上传)
```http
Content-Type: multipart/form-data
```
```
studentName: 学员姓名
accessKey: abc123xyz789
ec2InstanceInfo[operatingSystem]: Amazon Linux 2
ec2InstanceInfo[amiId]: ami-0abcdef1234567890
ec2InstanceInfo[internalIpAddress]: 10.0.1.100
ec2InstanceInfo[instanceType]: t3.micro
screenshot: [文件数据]
```

**字段说明**:
- `studentName`: 学员姓名 (必需)
- `accessKey`: 访问密钥 (必需)
- `ec2InstanceInfo`: EC2实例信息对象 (必需)
  - `operatingSystem`: 操作系统信息 (必需)
  - `amiId`: AMI标识符 (必需)
  - `internalIpAddress`: 内网IP地址 (必需)
  - `instanceType`: 实例类型 (必需)
- `screenshotBase64`: Base64编码的截图 (可选，JSON方式)
- `screenshotFilename`: 截图文件名 (可选，JSON方式)
- `screenshot`: 截图文件 (可选，表单方式)

**成功响应** (HTTP 201):
```json
{
  "success": true,
  "message": "Submission received and processed successfully",
  "submissionId": "sub-12345",
  "score": 100,
  "timestamp": "2024-01-15T12:00:00.000Z",
  "studentInfo": {
    "name": "学员姓名",
    "accessKey": "abc123xyz789"
  },
  "ec2Info": {
    "operatingSystem": "Amazon Linux 2",
    "amiId": "ami-0abcdef1234567890",
    "internalIpAddress": "10.0.1.100",
    "instanceType": "t3.micro"
  },
  "screenshotInfo": {
    "filename": "ec2-screenshot.png",
    "size": 245760,
    "mimetype": "image/png"
  },
  "clientIp": "203.0.113.1"
}
```

**认证失败响应** (HTTP 401):
```json
{
  "error": "Authentication failed",
  "message": "Invalid student name or access key"
}
```

### 4. 学员提交记录查询

**目的**: 查看学员的所有提交记录

```http
GET /api/submissions/student/{accessKey}
```

**成功响应** (HTTP 200):
```json
{
  "success": true,
  "student": {
    "name": "学员姓名",
    "accessKey": "abc123xyz789",
    "registeredAt": "2024-01-15T10:30:00.000Z"
  },
  "submissions": [
    {
      "id": "sub-12345",
      "exerciseId": "ex-001",
      "exerciseTitle": "Hands-on Exercise 1",
      "score": 100,
      "submittedAt": "2024-01-15T12:00:00.000Z",
      "clientIpAddress": "203.0.113.1",
      "ec2InstanceInfo": {
        "operatingSystem": "Amazon Linux 2",
        "amiId": "ami-0abcdef1234567890",
        "internalIpAddress": "10.0.1.100",
        "instanceType": "t3.micro"
      },
      "screenshotInfo": {
        "filename": "ec2-screenshot.png",
        "size": 245760,
        "mimetype": "image/png",
        "hasScreenshot": true
      },
      "processingStatus": "processed"
    }
  ]
}
```

### 5. 排行榜查询

**目的**: 查看所有学员的排名情况

```http
GET /api/statistics/rankings
```

**成功响应** (HTTP 200):
```json
{
  "success": true,
  "exerciseId": "all",
  "totalStudents": 10,
  "rankings": [
    {
      "rank": 1,
      "studentId": "std-001",
      "studentName": "学员A",
      "totalScore": 100,
      "completedExercises": 1,
      "averageCompletionTime": 0,
      "lastSubmissionAt": "2024-01-15T12:00:00.000Z"
    },
    {
      "rank": 2,
      "studentId": "std-002",
      "studentName": "学员B",
      "totalScore": 95,
      "completedExercises": 1,
      "averageCompletionTime": 0,
      "lastSubmissionAt": "2024-01-15T12:30:00.000Z"
    }
  ]
}
```

### 6. 截图下载接口

**目的**: 下载提交的截图文件

```http
GET /api/submissions/{submissionId}/screenshot
```

**成功响应** (HTTP 200):
- **Content-Type**: `image/png` 或 `image/jpeg` 等
- **响应体**: 图片二进制数据

**未找到响应** (HTTP 404):
```json
{
  "error": "Screenshot not found",
  "message": "No screenshot exists for this submission"
}
```

### 7. 学员统计信息查询

**目的**: 查看学员的详细统计信息

```http
GET /api/statistics/student/{accessKey}
```

**成功响应** (HTTP 200):
```json
{
  "success": true,
  "student": {
    "name": "学员姓名",
    "accessKey": "abc123xyz789",
    "registeredAt": "2024-01-15T10:30:00.000Z",
    "lastActiveAt": "2024-01-15T12:00:00.000Z"
  },
  "statistics": {
    "totalSubmissions": 1,
    "completedExercises": 1,
    "totalExercises": 1,
    "completionRate": 100,
    "totalScore": 100,
    "averageScore": 100,
    "highestScore": 100,
    "currentRank": 1,
    "totalParticipants": 10
  },
  "submissions": [...],
  "progress": {
    "exerciseProgress": [],
    "scoreHistory": [],
    "submissionTimeline": []
  }
}
```

## 🔧 EC2实例信息收集

### AWS元数据服务

EC2实例提供元数据服务，可通过HTTP请求获取实例信息：

**基础URL**: `http://169.254.169.254/latest/meta-data/`

### 必需信息收集

#### 1. AMI ID
```bash
curl http://169.254.169.254/latest/meta-data/ami-id
```
**示例输出**: `ami-0abcdef1234567890`

#### 2. 实例类型
```bash
curl http://169.254.169.254/latest/meta-data/instance-type
```
**示例输出**: `t3.micro`

#### 3. 内网IP地址
```bash
curl http://169.254.169.254/latest/meta-data/local-ipv4
```
**示例输出**: `10.0.1.100`

#### 4. 操作系统信息
通过系统API获取：
- **Linux**: `uname -a` 或 `cat /etc/os-release`
- **Windows**: `systeminfo` 或 `Get-ComputerInfo`

### 错误处理

元数据服务可能不可用的情况：
- 不在EC2环境中运行
- 网络连接问题
- 服务暂时不可用

**建议处理方式**:
```javascript
async function getMetadata(path) {
  try {
    const response = await fetch(`http://169.254.169.254/latest/meta-data/${path}`, {
      timeout: 2000 // 2秒超时
    });
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.warn(`Failed to get metadata ${path}:`, error.message);
  }
  return null; // 返回null表示获取失败
}
```

## 💻 客户端开发示例

### Node.js 完整示例

```javascript
import fetch from 'node-fetch';
import os from 'os';

class Exercise1Client {
  constructor(apiBaseUrl = 'http://localhost:3001/api', studentName) {
    this.apiBaseUrl = apiBaseUrl;
    this.studentName = studentName;
    this.accessKey = null;
  }

  // 注册学员
  async register() {
    const response = await fetch(`${this.apiBaseUrl}/auth/student/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: this.studentName })
    });

    const data = await response.json();
    if (data.success) {
      this.accessKey = data.student.accessKey;
      console.log(`注册成功，Access Key: ${this.accessKey}`);
      return this.accessKey;
    } else {
      throw new Error(data.message || '注册失败');
    }
  }

  // 获取EC2元数据
  async getMetadata(path) {
    try {
      const response = await fetch(`http://169.254.169.254/latest/meta-data/${path}`, {
        timeout: 2000
      });
      return response.ok ? await response.text() : null;
    } catch (error) {
      return null;
    }
  }

  // 收集EC2信息
  async collectEC2Info() {
    const ec2Info = {
      operatingSystem: `${os.type()} ${os.release()}`,
      amiId: await this.getMetadata('ami-id') || 'ami-unknown',
      internalIpAddress: await this.getMetadata('local-ipv4') || '10.0.1.100',
      instanceType: await this.getMetadata('instance-type') || 't3.micro'
    };

    console.log('收集到的EC2信息:', ec2Info);
    return ec2Info;
  }

  // 截取屏幕截图 (示例 - 需要根据实际环境调整)
  async takeScreenshot() {
    // 这里是一个示例，实际实现需要根据操作系统调整
    // Linux: 可以使用 scrot, gnome-screenshot 等
    // Windows: 可以使用 PowerShell 或其他工具
    // macOS: 可以使用 screencapture
    
    try {
      const { execSync } = await import('child_process');
      const fs = await import('fs');
      
      // Linux 示例 (需要安装 scrot)
      execSync('scrot /tmp/screenshot.png');
      const screenshotBuffer = fs.readFileSync('/tmp/screenshot.png');
      const screenshotBase64 = screenshotBuffer.toString('base64');
      
      return {
        base64: `data:image/png;base64,${screenshotBase64}`,
        filename: 'ec2-screenshot.png'
      };
    } catch (error) {
      console.warn('无法截取屏幕截图:', error.message);
      return null;
    }
  }

  // 提交练习 (支持截图)
  async submitExercise(ec2Info, screenshot = null) {
    if (!this.accessKey) {
      throw new Error('请先注册获取Access Key');
    }

    const submissionData = {
      studentName: this.studentName,
      accessKey: this.accessKey,
      ec2InstanceInfo: ec2Info
    };

    // 添加截图数据 (如果有)
    if (screenshot) {
      submissionData.screenshotBase64 = screenshot.base64;
      submissionData.screenshotFilename = screenshot.filename;
    }

    const response = await fetch(`${this.apiBaseUrl}/submissions/exercise1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionData)
    });

    const data = await response.json();
    if (data.success) {
      console.log(`提交成功！分数: ${data.score}`);
      if (data.screenshotInfo) {
        console.log(`截图已上传: ${data.screenshotInfo.filename} (${data.screenshotInfo.size} bytes)`);
      }
      return data;
    } else {
      throw new Error(data.message || '提交失败');
    }
  }

  // 使用 multipart/form-data 提交 (文件上传方式)
  async submitExerciseWithFile(ec2Info, screenshotPath = null) {
    if (!this.accessKey) {
      throw new Error('请先注册获取Access Key');
    }

    const FormData = (await import('form-data')).default;
    const fs = await import('fs');
    
    const formData = new FormData();
    formData.append('studentName', this.studentName);
    formData.append('accessKey', this.accessKey);
    formData.append('ec2InstanceInfo[operatingSystem]', ec2Info.operatingSystem);
    formData.append('ec2InstanceInfo[amiId]', ec2Info.amiId);
    formData.append('ec2InstanceInfo[internalIpAddress]', ec2Info.internalIpAddress);
    formData.append('ec2InstanceInfo[instanceType]', ec2Info.instanceType);
    
    // 添加截图文件 (如果有)
    if (screenshotPath && fs.existsSync(screenshotPath)) {
      formData.append('screenshot', fs.createReadStream(screenshotPath));
    }

    const response = await fetch(`${this.apiBaseUrl}/submissions/exercise1`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (data.success) {
      console.log(`提交成功！分数: ${data.score}`);
      if (data.screenshotInfo) {
        console.log(`截图已上传: ${data.screenshotInfo.filename} (${data.screenshotInfo.size} bytes)`);
      }
      return data;
    } else {
      throw new Error(data.message || '提交失败');
    }
  }

  // 查看统计信息
  async getStatistics() {
    if (!this.accessKey) {
      throw new Error('请先注册获取Access Key');
    }

    const response = await fetch(`${this.apiBaseUrl}/statistics/student/${this.accessKey}`);
    const data = await response.json();
    
    if (data.success) {
      console.log('个人统计:', data.statistics);
      return data.statistics;
    } else {
      throw new Error(data.message || '获取统计失败');
    }
  }

  // 查看排行榜
  async getRankings() {
    const response = await fetch(`${this.apiBaseUrl}/statistics/rankings`);
    const data = await response.json();
    
    if (data.success) {
      console.log('排行榜:', data.rankings.slice(0, 5)); // 显示前5名
      return data.rankings;
    } else {
      throw new Error(data.message || '获取排行榜失败');
    }
  }

  // 完整流程
  async run() {
    try {
      console.log('🚀 开始Exercise 1客户端程序');
      
      // 1. 注册
      await this.register();
      
      // 2. 收集EC2信息
      const ec2Info = await this.collectEC2Info();
      
      // 3. 尝试截取屏幕截图
      const screenshot = await this.takeScreenshot();
      
      // 4. 提交练习
      await this.submitExercise(ec2Info, screenshot);
      
      // 5. 查看统计
      await this.getStatistics();
      
      // 6. 查看排行榜
      await this.getRankings();
      
      console.log('✅ 程序执行完成');
      
    } catch (error) {
      console.error('❌ 程序执行失败:', error.message);
      throw error;
    }
  }
}

// 使用示例
const client = new Exercise1Client('http://localhost:3001/api', '张三');
client.run();
```

### Python 完整示例

```python
import requests
import platform
import json
import os

class Exercise1Client:
    def __init__(self, api_base_url='http://localhost:3001/api', student_name=None):
        self.api_base_url = api_base_url
        self.student_name = student_name
        self.access_key = None

    def register(self):
        """注册学员"""
        response = requests.post(f'{self.api_base_url}/auth/student/register',
                               json={'name': self.student_name})
        data = response.json()
        
        if data['success']:
            self.access_key = data['student']['accessKey']
            print(f"注册成功，Access Key: {self.access_key}")
            return self.access_key
        else:
            raise Exception(data.get('message', '注册失败'))

    def get_metadata(self, path):
        """获取EC2元数据"""
        try:
            response = requests.get(f'http://169.254.169.254/latest/meta-data/{path}', 
                                  timeout=2)
            return response.text if response.ok else None
        except:
            return None

    def collect_ec2_info(self):
        """收集EC2信息"""
        ec2_info = {
            'operatingSystem': f"{platform.system()} {platform.release()}",
            'amiId': self.get_metadata('ami-id') or 'ami-unknown',
            'internalIpAddress': self.get_metadata('local-ipv4') or '10.0.1.100',
            'instanceType': self.get_metadata('instance-type') or 't3.micro'
        }
        
        print('收集到的EC2信息:', ec2_info)
        return ec2_info

    def take_screenshot(self):
        """截取屏幕截图"""
        try:
            import subprocess
            import base64
            
            # Linux 示例 (需要安装 scrot)
            subprocess.run(['scrot', '/tmp/screenshot.png'], check=True)
            
            with open('/tmp/screenshot.png', 'rb') as f:
                screenshot_data = f.read()
                screenshot_base64 = base64.b64encode(screenshot_data).decode('utf-8')
                
            return {
                'base64': f'data:image/png;base64,{screenshot_base64}',
                'filename': 'ec2-screenshot.png'
            }
        except Exception as error:
            print(f'无法截取屏幕截图: {error}')
            return None

    def submit_exercise(self, ec2_info, screenshot=None):
        """提交练习"""
        if not self.access_key:
            raise Exception('请先注册获取Access Key')

        submission_data = {
            'studentName': self.student_name,
            'accessKey': self.access_key,
            'ec2InstanceInfo': ec2_info
        }
        
        # 添加截图数据 (如果有)
        if screenshot:
            submission_data['screenshotBase64'] = screenshot['base64']
            submission_data['screenshotFilename'] = screenshot['filename']

        response = requests.post(f'{self.api_base_url}/submissions/exercise1',
                               json=submission_data)
        
        data = response.json()
        if data['success']:
            print(f"提交成功！分数: {data['score']}")
            if data.get('screenshotInfo'):
                print(f"截图已上传: {data['screenshotInfo']['filename']} ({data['screenshotInfo']['size']} bytes)")
            return data
        else:
            raise Exception(data.get('message', '提交失败'))

    def submit_exercise_with_file(self, ec2_info, screenshot_path=None):
        """使用文件上传方式提交练习"""
        if not self.access_key:
            raise Exception('请先注册获取Access Key')

        # 准备表单数据
        data = {
            'studentName': self.student_name,
            'accessKey': self.access_key,
            'ec2InstanceInfo[operatingSystem]': ec2_info['operatingSystem'],
            'ec2InstanceInfo[amiId]': ec2_info['amiId'],
            'ec2InstanceInfo[internalIpAddress]': ec2_info['internalIpAddress'],
            'ec2InstanceInfo[instanceType]': ec2_info['instanceType']
        }
        
        files = {}
        if screenshot_path and os.path.exists(screenshot_path):
            files['screenshot'] = open(screenshot_path, 'rb')

        try:
            response = requests.post(f'{self.api_base_url}/submissions/exercise1',
                                   data=data, files=files)
            
            result = response.json()
            if result['success']:
                print(f"提交成功！分数: {result['score']}")
                if result.get('screenshotInfo'):
                    print(f"截图已上传: {result['screenshotInfo']['filename']} ({result['screenshotInfo']['size']} bytes)")
                return result
            else:
                raise Exception(result.get('message', '提交失败'))
        finally:
            # 关闭文件
            for f in files.values():
                if hasattr(f, 'close'):
                    f.close()

    def get_statistics(self):
        """查看统计信息"""
        if not self.access_key:
            raise Exception('请先注册获取Access Key')

        response = requests.get(f'{self.api_base_url}/statistics/student/{self.access_key}')
        data = response.json()
        
        if data['success']:
            print('个人统计:', data['statistics'])
            return data['statistics']
        else:
            raise Exception(data.get('message', '获取统计失败'))

    def get_rankings(self):
        """查看排行榜"""
        response = requests.get(f'{self.api_base_url}/statistics/rankings')
        data = response.json()
        
        if data['success']:
            print('排行榜:', data['rankings'][:5])  # 显示前5名
            return data['rankings']
        else:
            raise Exception(data.get('message', '获取排行榜失败'))

    def run(self):
        """完整流程"""
        try:
            print('🚀 开始Exercise 1客户端程序')
            
            # 1. 注册
            self.register()
            
            # 2. 收集EC2信息
            ec2_info = self.collect_ec2_info()
            
            # 3. 尝试截取屏幕截图
            screenshot = self.take_screenshot()
            
            # 4. 提交练习
            self.submit_exercise(ec2_info, screenshot)
            
            # 5. 查看统计
            self.get_statistics()
            
            # 6. 查看排行榜
            self.get_rankings()
            
            print('✅ 程序执行完成')
            
        except Exception as error:
            print(f'❌ 程序执行失败: {error}')
            raise

# 使用示例
if __name__ == '__main__':
    client = Exercise1Client('http://localhost:3001/api', '张三')
    client.run()
```

## 📊 评分机制

### 评分标准
- **100分**: 提供完整且正确的EC2实例信息 + 截图
  - 所有4个EC2字段都存在且格式正确
  - 包含有效的截图文件
  - AMI ID格式: `ami-xxxxxxxxx`
  - IP地址格式: 有效的IPv4地址
  
- **80分**: 提供完整的EC2实例信息但无截图
  - 所有4个EC2字段都存在且格式正确
  - 未提供截图文件
  
- **60分**: 提供截图但EC2信息不完整
  - 包含有效的截图文件
  - EC2信息缺少1-2个必需字段
  
- **40分**: 信息不完整且无截图
  - EC2信息缺少字段
  - 未提供截图文件

### 排名规则
1. **按总分排序** - 分数高者排名靠前
2. **按提交时间排序** - 分数相同时，提交时间早者排名靠前
3. **允许多次提交** - 系统记录最高分

## 🔍 调试和故障排除

### 常见错误及解决方案

#### 1. 网络连接错误
**错误**: `ECONNREFUSED` 或 `Network timeout`
**解决**: 
- 检查API服务器是否运行
- 确认服务器地址和端口正确
- 检查网络连接

#### 2. 认证失败
**错误**: `HTTP 401 - Authentication failed`
**解决**:
- 确认学员姓名拼写正确
- 检查Access Key是否正确
- 重新注册获取新的Access Key

#### 3. 数据验证失败
**错误**: `HTTP 400 - Validation failed`
**解决**:
- 检查请求体格式是否正确
- 确认所有必需字段都已提供
- 验证数据类型和格式

#### 4. 元数据服务不可用
**错误**: 无法获取EC2元数据
**解决**:
- 确认在EC2实例中运行
- 使用模拟数据进行测试
- 检查实例元数据服务配置

### 调试技巧

#### 1. 启用详细日志
```javascript
// 添加请求日志
console.log('发送请求:', method, url, data);
console.log('收到响应:', response.status, responseData);
```

#### 2. 测试API连通性
```bash
# 测试服务器健康状态
curl http://localhost:3001/health

# 测试API基础信息
curl http://localhost:3001/api
```

#### 3. 验证数据格式
```javascript
// 验证EC2信息格式
function validateEC2Info(ec2Info) {
  const required = ['operatingSystem', 'amiId', 'internalIpAddress', 'instanceType'];
  for (const field of required) {
    if (!ec2Info[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  // 验证AMI ID格式
  if (!ec2Info.amiId.startsWith('ami-')) {
    console.warn('AMI ID format may be incorrect:', ec2Info.amiId);
  }
  
  // 验证IP地址格式
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ec2Info.internalIpAddress)) {
    console.warn('IP address format may be incorrect:', ec2Info.internalIpAddress);
  }
}
```

## 🚀 最佳实践

### 1. 错误处理
- 实现重试机制
- 提供友好的错误信息
- 记录详细的调试日志

### 2. 性能优化
- 设置合理的超时时间
- 缓存Access Key避免重复注册
- 并发获取元数据信息

### 3. 用户体验
- 显示进度信息
- 提供清晰的成功/失败反馈
- 支持命令行参数配置

### 4. 安全考虑
- 不要在代码中硬编码敏感信息
- 使用环境变量管理配置
- 验证所有输入数据

## 📝 提交清单

开发完成后，请确保您的客户端程序包含：

- ✅ **完整的功能实现** - 注册、收集、提交、查询
- ✅ **错误处理机制** - 网络异常、API错误、数据验证
- ✅ **清晰的日志输出** - 执行过程和结果信息
- ✅ **使用说明文档** - 如何运行和配置程序
- ✅ **源代码文件** - 完整可运行的代码
- ✅ **运行截图** - 显示成功执行和获得分数

---

**祝您开发顺利！如有问题请参考示例代码或联系技术支持。** 🚀