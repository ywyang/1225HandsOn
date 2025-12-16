# 📸 截图上传功能说明

## 🎯 功能概述

Exercise 1 API 现已支持截图上传功能，学员可以在提交EC2实例信息的同时上传屏幕截图，以获得更高的分数。

## 🚀 新增功能

### 1. 截图上传支持
- **Base64格式**: 通过JSON请求体上传Base64编码的图片
- **文件上传**: 通过multipart/form-data上传图片文件
- **格式支持**: 支持所有常见图片格式 (PNG, JPEG, GIF等)
- **大小限制**: 单个文件最大5MB

### 2. 数据库存储
- 截图数据直接存储在PostgreSQL数据库中
- 包含文件名、MIME类型、文件大小等元数据
- 支持高效的二进制数据存储和检索

### 3. 图片下载
- 提供专用的下载接口
- 自动设置正确的Content-Type头
- 支持浏览器内联显示

### 4. 智能评分
- **100分**: 完整EC2信息 + 截图
- **80分**: 完整EC2信息，无截图
- **60分**: 有截图但EC2信息不完整
- **40分**: 信息不完整且无截图

## 📋 API接口更新

### 提交接口 (更新)
```http
POST /api/submissions/exercise1
```

**支持两种方式**:

#### 方式1: JSON + Base64
```json
{
  "studentName": "张三",
  "accessKey": "abc123xyz789",
  "ec2InstanceInfo": {
    "operatingSystem": "Amazon Linux 2",
    "amiId": "ami-0abcdef1234567890",
    "internalIpAddress": "10.0.1.100",
    "instanceType": "t3.micro"
  },
  "screenshotBase64": "data:image/png;base64,iVBORw0KGgo...",
  "screenshotFilename": "screenshot.png"
}
```

#### 方式2: 表单上传
```
Content-Type: multipart/form-data

studentName: 张三
accessKey: abc123xyz789
ec2InstanceInfo[operatingSystem]: Amazon Linux 2
ec2InstanceInfo[amiId]: ami-0abcdef1234567890
ec2InstanceInfo[internalIpAddress]: 10.0.1.100
ec2InstanceInfo[instanceType]: t3.micro
screenshot: [文件数据]
```

### 下载接口 (新增)
```http
GET /api/submissions/{submissionId}/screenshot
```

**响应**:
- **200**: 返回图片二进制数据
- **404**: 该提交没有截图

## 🛠️ 技术实现

### 后端技术栈
- **Express.js**: Web框架
- **Multer**: 文件上传处理
- **PostgreSQL**: 数据库存储
- **Joi**: 数据验证

### 数据库结构
```sql
ALTER TABLE submissions ADD COLUMN screenshot_data BYTEA;
ALTER TABLE submissions ADD COLUMN screenshot_filename VARCHAR(255);
ALTER TABLE submissions ADD COLUMN screenshot_mimetype VARCHAR(100);
ALTER TABLE submissions ADD COLUMN screenshot_size INTEGER;
```

### 安全特性
- 文件类型验证 (仅允许图片)
- 文件大小限制 (5MB)
- 输入数据验证
- SQL注入防护

## 💻 客户端开发指南

### Node.js 示例 (Base64方式)
```javascript
import fs from 'fs';

// 读取截图文件
const screenshotBuffer = fs.readFileSync('screenshot.png');
const screenshotBase64 = screenshotBuffer.toString('base64');

// 提交数据
const response = await fetch('/api/submissions/exercise1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    studentName: '张三',
    accessKey: 'abc123xyz789',
    ec2InstanceInfo: { /* ... */ },
    screenshotBase64: `data:image/png;base64,${screenshotBase64}`,
    screenshotFilename: 'screenshot.png'
  })
});
```

### Node.js 示例 (文件上传方式)
```javascript
import FormData from 'form-data';
import fs from 'fs';

const formData = new FormData();
formData.append('studentName', '张三');
formData.append('accessKey', 'abc123xyz789');
formData.append('ec2InstanceInfo[operatingSystem]', 'Amazon Linux 2');
formData.append('ec2InstanceInfo[amiId]', 'ami-0abcdef1234567890');
formData.append('ec2InstanceInfo[internalIpAddress]', '10.0.1.100');
formData.append('ec2InstanceInfo[instanceType]', 't3.micro');
formData.append('screenshot', fs.createReadStream('screenshot.png'));

const response = await fetch('/api/submissions/exercise1', {
  method: 'POST',
  body: formData
});
```

### Python 示例
```python
import requests
import base64

# Base64方式
with open('screenshot.png', 'rb') as f:
    screenshot_data = base64.b64encode(f.read()).decode('utf-8')

response = requests.post('/api/submissions/exercise1', json={
    'studentName': '张三',
    'accessKey': 'abc123xyz789',
    'ec2InstanceInfo': { /* ... */ },
    'screenshotBase64': f'data:image/png;base64,{screenshot_data}',
    'screenshotFilename': 'screenshot.png'
})

# 文件上传方式
files = {'screenshot': open('screenshot.png', 'rb')}
data = {
    'studentName': '张三',
    'accessKey': 'abc123xyz789',
    'ec2InstanceInfo[operatingSystem]': 'Amazon Linux 2',
    # ... 其他字段
}

response = requests.post('/api/submissions/exercise1', data=data, files=files)
```

## 🔧 截图工具推荐

### Linux
```bash
# 安装截图工具
sudo apt-get install scrot                    # Ubuntu/Debian
sudo yum install scrot                        # CentOS/RHEL
sudo apt-get install gnome-screenshot         # GNOME桌面
sudo apt-get install imagemagick              # ImageMagick

# 使用示例
scrot screenshot.png                          # 全屏截图
gnome-screenshot -f screenshot.png            # GNOME截图
import -window root screenshot.png            # ImageMagick截图
```

### Windows
```powershell
# PowerShell截图
Add-Type -AssemblyName System.Windows.Forms
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
$bitmap.Save("screenshot.png")
```

### macOS
```bash
# 使用screencapture命令
screencapture screenshot.png                  # 全屏截图
screencapture -i screenshot.png               # 交互式截图
```

## 🧪 测试功能

### 运行测试
```bash
# 基础API测试
npm test

# 截图功能测试
npm run test-screenshot

# 学员示例程序 (包含截图)
npm run example
```

### 测试场景
1. **无截图提交** - 验证基础功能
2. **Base64截图提交** - 验证JSON方式
3. **文件上传提交** - 验证表单方式
4. **截图下载** - 验证下载功能
5. **错误处理** - 验证各种异常情况

## 📊 性能考虑

### 存储优化
- 图片直接存储在数据库中，适合小到中等大小的截图
- 5MB文件大小限制，平衡功能需求和性能
- 使用PostgreSQL的BYTEA类型，支持高效的二进制存储

### 网络优化
- 支持Base64和文件上传两种方式，适应不同场景
- 合理的文件大小限制，避免网络传输问题
- 适当的超时设置和错误处理

### 扩展性考虑
- 如需处理大量大文件，可考虑迁移到对象存储 (如AWS S3)
- 当前实现适合中小规模的训练场景
- 数据库索引优化，支持快速查询

## 🔍 故障排除

### 常见问题

**Q: 截图上传失败**
```
Error: Only image files are allowed
```
**A**: 确保上传的文件是图片格式 (PNG, JPEG, GIF等)

**Q: 文件太大**
```
Error: File too large
```
**A**: 截图文件大小不能超过5MB，请压缩后重试

**Q: Base64格式错误**
```
Error: Invalid base64 image data
```
**A**: 检查Base64字符串格式，确保包含正确的数据头

**Q: 截图下载404**
```
Error: Screenshot not found
```
**A**: 该提交记录没有包含截图，或提交ID不正确

### 调试技巧
```bash
# 检查服务器日志
npm run dev

# 测试API连通性
curl http://localhost:3001/health

# 验证数据库连接
npm run test

# 测试截图功能
npm run test-screenshot
```

## 🎓 学员指导

### 开发建议
1. **优先实现基础功能** - 先确保EC2信息收集正确
2. **添加截图功能** - 在基础功能稳定后添加截图
3. **错误处理** - 实现完善的错误处理和重试机制
4. **用户体验** - 提供清晰的进度提示和结果反馈

### 最佳实践
- 在截图前确保屏幕显示相关信息
- 使用适当的图片格式和压缩
- 实现截图失败时的降级处理
- 提供清晰的用户反馈

---

**🎉 现在开始使用新的截图功能，获得更高的分数吧！**