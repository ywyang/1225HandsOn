# 实训练习1：EC2实例信息收集程序

## 任务目标

开发一个程序，自动收集当前EC2实例的系统信息，并提交到训练系统获得分数。

## 完成步骤

### 1️⃣ 学员注册
调用API获取您的专属访问密钥：

```
POST /api/auth/student/register
{
  "name": "您的姓名"
}
```

### 2️⃣ 收集EC2信息
从EC2元数据服务获取以下信息：

| 信息项 | 获取方式 | 示例值 |
|--------|----------|--------|
| 操作系统 | 系统API | "Amazon Linux 2" |
| AMI ID | `curl http://169.254.169.254/latest/meta-data/ami-id` | "ami-0abc123" |
| 内网IP | `curl http://169.254.169.254/latest/meta-data/local-ipv4` | "10.0.1.100" |
| 实例类型 | `curl http://169.254.169.254/latest/meta-data/instance-type` | "t3.micro" |

### 3️⃣ 提交数据
将收集的信息提交到API：

```
POST /api/submissions/exercise1
{
  "studentName": "您的姓名",
  "accessKey": "您的访问密钥", 
  "ec2InstanceInfo": {
    "operatingSystem": "Amazon Linux 2",
    "amiId": "ami-0abc123",
    "internalIpAddress": "10.0.1.100",
    "instanceType": "t3.micro"
  }
}
```

### 4️⃣ 查看成绩
提交成功后查看分数和排名：
- 个人成绩：`GET /api/statistics/student/{accessKey}`
- 排行榜：`GET /api/statistics/rankings`

## 评分标准

- ✅ **100分**：提供完整准确的EC2信息
- ⚠️ **50分**：信息不完整或部分错误  
- ❌ **0分**：提交失败或数据无效

## 快速开始

### Node.js版本
```javascript
// 1. 安装依赖
npm install node-fetch

// 2. 基础代码框架
import fetch from 'node-fetch';

const API_URL = 'http://训练服务器地址/api';
const STUDENT_NAME = '您的姓名';

async function main() {
  // TODO: 实现注册、收集信息、提交数据
}

main();
```

### Python版本
```python
# 1. 安装依赖
pip install requests

# 2. 基础代码框架
import requests

API_URL = 'http://训练服务器地址/api'
STUDENT_NAME = '您的姓名'

def main():
    # TODO: 实现注册、收集信息、提交数据
    pass

if __name__ == '__main__':
    main()
```

## 开发提示

💡 **EC2元数据获取**
```bash
# 测试元数据服务是否可用
curl -w "%{http_code}" http://169.254.169.254/latest/meta-data/
```

💡 **错误处理**
- 设置合理的请求超时时间（5-10秒）
- 检查API响应状态码
- 处理网络异常情况

💡 **本地开发**
如果不在EC2环境中，可以使用模拟数据进行测试。

## 常见问题

**Q: 无法访问元数据服务？**
A: 确保在EC2实例中运行，或使用模拟数据测试。

**Q: API返回401错误？**  
A: 检查学员姓名和访问密钥是否正确。

**Q: 提交后没有分数？**
A: 检查提交的数据格式是否正确，所有必需字段是否完整。

## 提交要求

1. 源代码文件
2. 运行截图（显示成功提交和分数）
3. 简要说明文档

---

**开始编程吧！记得查看排行榜上的实时排名！** 🏆