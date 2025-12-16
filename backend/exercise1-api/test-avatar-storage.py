#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
测试头像数据存储到数据库 (Python版本)
"""

import requests
import psycopg2
import base64
import os
import sys
from typing import Optional

# API配置
API_BASE_URL = 'http://localhost:3001/api'

# 数据库配置
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', '5432')),
    'database': os.getenv('DB_NAME', 'training_system'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', 'password')
}

# 创建一个简单的测试头像 (红色1x1像素PNG)
TEST_AVATAR_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='

def test_avatar_storage():
    """测试头像数据存储到数据库"""
    print('🧪 测试头像数据存储到数据库 (Python版本)')
    print('=' * 60)
    
    conn = None
    
    try:
        # 1. 注册学员
        print('1. 注册测试学员...')
        register_response = requests.post(
            f'{API_BASE_URL}/auth/student/register',
            json={'name': '测试学员-数据库存储-Python'},
            headers={'Content-Type': 'application/json'}
        )
        
        register_data = register_response.json()
        if not register_data.get('success'):
            raise Exception(f'注册失败: {register_data.get("message")}')
        
        access_key = register_data['student']['accessKey']
        print(f'✅ 注册成功，Access Key: {access_key}')
        
        # 2. 提交带头像的数据
        print('2. 提交带头像的练习数据...')
        submission_data = {
            'studentName': '测试学员-数据库存储-Python',
            'accessKey': access_key,
            'ec2InstanceInfo': {
                'operatingSystem': 'Test Linux Python',
                'amiId': 'ami-test123',
                'internalIpAddress': '10.0.1.200',
                'elasticIpAddress': '203.0.113.200',
                'instanceType': 't3.nano'
            },
            'avatarBase64': f'data:image/png;base64,{TEST_AVATAR_BASE64}'
        }
        
        submit_response = requests.post(
            f'{API_BASE_URL}/submissions/exercise1',
            json=submission_data,
            headers={'Content-Type': 'application/json'}
        )
        
        submit_data = submit_response.json()
        if not submit_data.get('success'):
            raise Exception(f'提交失败: {submit_data.get("message")}')
        
        print('✅ 提交成功！')
        print(f'   分数: {submit_data["score"]}')
        print(f'   提交ID: {submit_data["submissionId"]}')
        if submit_data.get('avatarInfo'):
            avatar_info = submit_data['avatarInfo']
            print(f'   头像: {avatar_info["filename"]} ({avatar_info["size"]} bytes)')
        
        # 3. 直接从数据库查询验证数据
        print('3. 从数据库验证头像数据...')
        
        # 连接数据库
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 查询头像数据
        cursor.execute("""
            SELECT 
                screenshot_data,
                screenshot_filename,
                screenshot_mimetype,
                screenshot_size,
                LENGTH(screenshot_data) as actual_size
            FROM submissions 
            WHERE id = %s
        """, (submit_data['submissionId'],))
        
        db_row = cursor.fetchone()
        
        if not db_row:
            raise Exception('数据库中未找到提交记录')
        
        screenshot_data, screenshot_filename, screenshot_mimetype, screenshot_size, actual_size = db_row
        
        print('✅ 数据库中的头像数据:')
        print(f'   文件名: {screenshot_filename}')
        print(f'   MIME类型: {screenshot_mimetype}')
        print(f'   记录的大小: {screenshot_size} bytes')
        print(f'   实际大小: {actual_size} bytes')
        print(f'   数据存在: {"是" if screenshot_data else "否"}')
        
        # 4. 验证数据完整性
        if screenshot_data:
            stored_base64 = base64.b64encode(screenshot_data).decode('utf-8')
            is_data_intact = stored_base64 == TEST_AVATAR_BASE64
            print(f'   数据完整性: {"✅ 完整" if is_data_intact else "❌ 损坏"}')
            
            if not is_data_intact:
                print(f'   原始数据: {TEST_AVATAR_BASE64[:50]}...')
                print(f'   存储数据: {stored_base64[:50]}...')
        else:
            print('   ❌ 头像数据为空')
        
        # 5. 测试头像下载
        print('4. 测试头像下载...')
        download_response = requests.get(f'{API_BASE_URL}/submissions/{submit_data["submissionId"]}/avatar')
        
        if download_response.status_code == 200:
            content_type = download_response.headers.get('content-type')
            content_length = download_response.headers.get('content-length')
            avatar_data = download_response.content
            
            print('✅ 头像下载成功')
            print(f'   Content-Type: {content_type}')
            print(f'   Content-Length: {content_length} bytes')
            print(f'   实际下载大小: {len(avatar_data)} bytes')
            
            # 验证下载的数据是否与原始数据一致
            downloaded_base64 = base64.b64encode(avatar_data).decode('utf-8')
            is_download_intact = downloaded_base64 == TEST_AVATAR_BASE64
            print(f'   下载数据完整性: {"✅ 完整" if is_download_intact else "❌ 损坏"}')
            
        else:
            print(f'❌ 头像下载失败: {download_response.status_code}')
        
        print()
        print('🎉 头像数据存储测试完成！')
        
    except Exception as error:
        print(f'❌ 测试失败: {error}')
        sys.exit(1)
    
    finally:
        if conn:
            conn.close()

def check_dependencies():
    """检查依赖"""
    try:
        import psycopg2
        import requests
    except ImportError as e:
        print(f'❌ 缺少依赖: {e}')
        print('请安装依赖: pip install psycopg2-binary requests')
        sys.exit(1)

if __name__ == '__main__':
    check_dependencies()
    test_avatar_storage()