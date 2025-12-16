#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Exercise 1 API 测试脚本 (Python版本)
"""

import requests
import json
import base64
import sys
from typing import Dict, Any, Optional

# API配置
API_BASE_URL = 'http://54.89.123.129:3001/api'

# 测试配置
TEST_STUDENT = {
    'name': 'Python测试学员',
    'access_key': None  # 注册后设置
}

TEST_EC2_INFO = {
    'operatingSystem': 'Amazon Linux 2',
    'amiId': 'ami-0abcdef1234567890',
    'internalIpAddress': '10.0.1.100',
    'elasticIpAddress': '203.0.113.100',
    'instanceType': 't3.micro'
}

def make_request(url: str, method: str = 'GET', data: Optional[Dict] = None, files: Optional[Dict] = None) -> Optional[Dict]:
    """发送HTTP请求"""
    try:
        headers = {'Content-Type': 'application/json'} if not files else {}
        
        if method.upper() == 'GET':
            response = requests.get(url, headers=headers)
        elif method.upper() == 'POST':
            if files:
                response = requests.post(url, data=data, files=files)
            else:
                response = requests.post(url, json=data, headers=headers)
        else:
            raise ValueError(f"不支持的HTTP方法: {method}")
        
        print(f"{method.upper()} {url}")
        print(f"状态码: {response.status_code}")
        
        try:
            result = response.json()
            print(f"响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
        except:
            print(f"响应: {response.text}")
            result = {'status_code': response.status_code, 'text': response.text}
        
        print('-' * 60)
        
        return {
            'response': response,
            'data': result
        }
        
    except Exception as error:
        print(f"请求失败: {error}")
        return None

def test_health_check() -> bool:
    """测试健康检查"""
    print('=== 测试健康检查 ===')
    
    result = make_request('http://54.89.123.129:3001/health')
    
    if result and result['response'].status_code == 200:
        print('✅ 健康检查成功')
        return True
    else:
        print('❌ 健康检查失败')
        return False

def test_student_registration() -> bool:
    """测试学员注册"""
    print('=== 测试学员注册 ===')
    
    result = make_request(
        f'{API_BASE_URL}/auth/student/register',
        'POST',
        {'name': TEST_STUDENT['name']}
    )
    
    if result and result['data'].get('success'):
        TEST_STUDENT['access_key'] = result['data']['student']['accessKey']
        print(f"✅ 学员注册成功，Access Key: {TEST_STUDENT['access_key']}")
        return True
    else:
        print('❌ 学员注册失败')
        return False

def test_access_key_lookup() -> bool:
    """测试访问密钥查询"""
    print('=== 测试访问密钥查询 ===')
    
    # URL编码学员姓名
    import urllib.parse
    encoded_name = urllib.parse.quote(TEST_STUDENT['name'])
    
    result = make_request(f'{API_BASE_URL}/auth/student/lookup/{encoded_name}')
    
    if (result and result['data'].get('success') and 
        result['data']['student']['accessKey'] == TEST_STUDENT['access_key']):
        print('✅ 访问密钥查询成功')
        return True
    else:
        print('❌ 访问密钥查询失败')
        return False

def test_exercise1_submission() -> Optional[str]:
    """测试Exercise 1提交 (无头像)"""
    print('=== 测试Exercise 1提交 (无头像) ===')
    
    submission_data = {
        'studentName': TEST_STUDENT['name'],
        'accessKey': TEST_STUDENT['access_key'],
        'ec2InstanceInfo': TEST_EC2_INFO
    }
    
    result = make_request(
        f'{API_BASE_URL}/submissions/exercise1',
        'POST',
        submission_data
    )
    
    if result and result['data'].get('success'):
        submission_id = result['data']['submissionId']
        score = result['data']['score']
        print(f"✅ Exercise 1提交成功! 分数: {score}")
        print(f"   提交ID: {submission_id}")
        return submission_id
    else:
        print('❌ Exercise 1提交失败')
        return None

def test_exercise1_submission_with_avatar() -> Optional[str]:
    """测试Exercise 1提交 (带头像)"""
    print('=== 测试Exercise 1提交 (带头像) ===')
    
    # 创建一个简单的测试头像 (1x1像素PNG)
    test_avatar_base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=='
    
    submission_data = {
        'studentName': TEST_STUDENT['name'],
        'accessKey': TEST_STUDENT['access_key'],
        'ec2InstanceInfo': TEST_EC2_INFO,
        'avatarBase64': f'data:image/png;base64,{test_avatar_base64}'
    }
    
    result = make_request(
        f'{API_BASE_URL}/submissions/exercise1',
        'POST',
        submission_data
    )
    
    if result and result['data'].get('success'):
        submission_id = result['data']['submissionId']
        score = result['data']['score']
        print(f"✅ Exercise 1提交 (带头像) 成功! 分数: {score}")
        print(f"   提交ID: {submission_id}")
        if result['data'].get('avatarInfo'):
            avatar_info = result['data']['avatarInfo']
            print(f"   头像: {avatar_info['filename']} ({avatar_info['size']} bytes)")
        return submission_id
    else:
        print('❌ Exercise 1提交 (带头像) 失败')
        return None

def test_avatar_download(submission_id: str) -> bool:
    """测试头像下载"""
    print('=== 测试头像下载 ===')
    
    try:
        response = requests.get(f'{API_BASE_URL}/submissions/{submission_id}/avatar')
        
        print(f"GET {API_BASE_URL}/submissions/{submission_id}/avatar")
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type')
            content_length = response.headers.get('content-length')
            print(f"Content-Type: {content_type}")
            print(f"Content-Length: {content_length} bytes")
            print('✅ 头像下载成功')
            return True
        elif response.status_code == 404:
            print('⚠️  该提交没有头像')
            return True  # 对于没有头像的提交，这是预期的
        else:
            print('❌ 头像下载失败')
            return False
    except Exception as error:
        print(f'头像下载错误: {error}')
        return False

def test_student_submissions() -> bool:
    """测试学员提交记录查询"""
    print('=== 测试学员提交记录查询 ===')
    
    result = make_request(f'{API_BASE_URL}/submissions/student/{TEST_STUDENT["access_key"]}')
    
    if result and result['data'].get('success'):
        submissions_count = len(result['data']['submissions'])
        print(f"✅ 查询到 {submissions_count} 条学员提交记录")
        return True
    else:
        print('❌ 学员提交记录查询失败')
        return False

def test_student_statistics() -> bool:
    """测试学员统计信息"""
    print('=== 测试学员统计信息 ===')
    
    result = make_request(f'{API_BASE_URL}/statistics/student/{TEST_STUDENT["access_key"]}')
    
    if result and result['data'].get('success'):
        stats = result['data']['statistics']
        print('✅ 学员统计信息查询成功')
        print(f"   总分: {stats['totalScore']}")
        print(f"   完成练习数: {stats['completedExercises']}")
        return True
    else:
        print('❌ 学员统计信息查询失败')
        return False

def test_rankings() -> bool:
    """测试排行榜"""
    print('=== 测试排行榜 ===')
    
    result = make_request(f'{API_BASE_URL}/statistics/rankings')
    
    if result and result['data'].get('success'):
        total_students = result['data']['totalStudents']
        print(f"✅ 排行榜查询成功，共 {total_students} 名学员")
        return True
    else:
        print('❌ 排行榜查询失败')
        return False

def test_file_upload_submission() -> Optional[str]:
    """测试文件上传方式提交"""
    print('=== 测试文件上传方式提交 ===')
    
    # 创建一个简单的测试头像文件
    test_avatar_data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==')
    
    # 准备表单数据
    data = {
        'studentName': TEST_STUDENT['name'],
        'accessKey': TEST_STUDENT['access_key'],
        'ec2InstanceInfo[operatingSystem]': TEST_EC2_INFO['operatingSystem'],
        'ec2InstanceInfo[amiId]': TEST_EC2_INFO['amiId'],
        'ec2InstanceInfo[internalIpAddress]': TEST_EC2_INFO['internalIpAddress'],
        'ec2InstanceInfo[elasticIpAddress]': TEST_EC2_INFO['elasticIpAddress'],
        'ec2InstanceInfo[instanceType]': TEST_EC2_INFO['instanceType']
    }
    
    files = {
        'avatar': ('test-avatar.png', test_avatar_data, 'image/png')
    }
    
    result = make_request(
        f'{API_BASE_URL}/submissions/exercise1',
        'POST',
        data,
        files
    )
    
    if result and result['data'].get('success'):
        submission_id = result['data']['submissionId']
        score = result['data']['score']
        print(f"✅ 文件上传提交成功! 分数: {score}")
        print(f"   提交ID: {submission_id}")
        if result['data'].get('avatarInfo'):
            avatar_info = result['data']['avatarInfo']
            print(f"   头像: {avatar_info['filename']} ({avatar_info['size']} bytes)")
        return submission_id
    else:
        print('❌ 文件上传提交失败')
        return None

def run_tests():
    """运行所有测试"""
    print('🚀 开始Exercise 1 API测试 (Python版本)\n')
    
    # 测试健康检查
    if not test_health_check():
        print('❌ 测试在健康检查步骤失败')
        return
    
    # 测试学员注册
    if not test_student_registration():
        print('❌ 测试在注册步骤失败')
        return
    
    # 测试访问密钥查询
    if not test_access_key_lookup():
        print('❌ 测试在访问密钥查询步骤失败')
        return
    
    # 测试Exercise 1提交 (无头像)
    submission_id1 = test_exercise1_submission()
    if not submission_id1:
        print('❌ 测试在提交步骤失败')
        return
    
    # 测试Exercise 1提交 (带头像)
    submission_id2 = test_exercise1_submission_with_avatar()
    if not submission_id2:
        print('❌ 测试在带头像提交步骤失败')
        return
    
    # 测试文件上传方式提交
    submission_id3 = test_file_upload_submission()
    if not submission_id3:
        print('❌ 测试在文件上传步骤失败')
        return
    
    # 测试头像下载
    if not test_avatar_download(submission_id1):
        print('❌ 测试在头像下载步骤失败 (提交1)')
        return
    
    if not test_avatar_download(submission_id2):
        print('❌ 测试在头像下载步骤失败 (提交2)')
        return
    
    if not test_avatar_download(submission_id3):
        print('❌ 测试在头像下载步骤失败 (提交3)')
        return
    
    # 测试学员提交记录查询
    if not test_student_submissions():
        print('❌ 测试在提交记录查询步骤失败')
        return
    
    # 测试学员统计信息
    if not test_student_statistics():
        print('❌ 测试在统计信息步骤失败')
        return
    
    # 测试排行榜
    if not test_rankings():
        print('❌ 测试在排行榜步骤失败')
        return
    
    print('🎉 所有测试完成成功!')
    print('\n📋 测试总结:')
    print(f'   学员姓名: {TEST_STUDENT["name"]}')
    print(f'   Access Key: {TEST_STUDENT["access_key"]}')
    print(f'   提交1 ID: {submission_id1} (无头像)')
    print(f'   提交2 ID: {submission_id2} (带头像)')
    print(f'   提交3 ID: {submission_id3} (文件上传)')
    print('\n✨ Exercise 1 API工作正常!')

if __name__ == '__main__':
    try:
        run_tests()
    except KeyboardInterrupt:
        print('\n\n⚠️  测试被用户中断')
        sys.exit(1)
    except Exception as e:
        print(f'\n\n❌ 测试过程中发生错误: {e}')
        sys.exit(1)