#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
快速检查服务器状态
"""

import requests
import sys

def check_server():
    """检查服务器状态"""
    base_url = 'http://localhost:3001'
    
    print('🔍 检查Exercise 1 API服务器状态...')
    print(f'服务器地址: {base_url}')
    
    try:
        # 1. 检查健康状态
        print('\n1️⃣ 检查健康状态...')
        health_response = requests.get(f'{base_url}/health', timeout=5)
        
        if health_response.status_code == 200:
            health_data = health_response.json()
            print('✅ 服务器运行正常')
            print(f'响应: {health_data}')
        else:
            print(f'❌ 健康检查失败: {health_response.status_code}')
            return False
            
    except requests.exceptions.ConnectionError:
        print('❌ 无法连接到服务器')
        print('\n💡 解决建议:')
        print('1. 启动服务器: npm start')
        print('2. 检查端口3000是否被占用')
        print('3. 确认在exercise1-api目录中运行')
        return False
    except Exception as e:
        print(f'❌ 检查失败: {e}')
        return False
    
    try:
        # 2. 检查API信息
        print('\n2️⃣ 检查API信息...')
        api_response = requests.get(f'{base_url}/api', timeout=5)
        
        if api_response.status_code == 200:
            api_data = api_response.json()
            print('✅ API信息获取成功')
            print('可用端点:')
            for endpoint in api_data.get('endpoints', []):
                print(f'   {endpoint}')
        else:
            print(f'❌ API信息获取失败: {api_response.status_code}')
            
    except Exception as e:
        print(f'⚠️ API信息检查失败: {e}')
    
    try:
        # 3. 测试提交端点
        print('\n3️⃣ 测试提交端点...')
        submit_response = requests.post(
            f'{base_url}/api/submissions/exercise1',
            json={},  # 空数据，应该返回验证错误而不是404
            timeout=5
        )
        
        print(f'提交端点状态码: {submit_response.status_code}')
        
        if submit_response.status_code == 404:
            print('❌ 提交端点不存在 (404错误)')
            try:
                error_data = submit_response.json()
                print(f'错误响应: {error_data}')
            except:
                print(f'错误响应: {submit_response.text}')
            return False
        elif submit_response.status_code == 400:
            print('✅ 提交端点存在 (返回验证错误，这是正常的)')
            try:
                error_data = submit_response.json()
                print(f'验证错误: {error_data.get("error", "未知错误")}')
            except:
                print('验证错误: 无法解析响应')
        else:
            print(f'⚠️ 意外的状态码: {submit_response.status_code}')
            
    except Exception as e:
        print(f'❌ 提交端点检查失败: {e}')
        return False
    
    print('\n🎉 服务器状态检查完成!')
    return True

if __name__ == '__main__':
    success = check_server()
    sys.exit(0 if success else 1)