#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
学员示例程序 - Exercise 1 (Python版本)

这个程序演示了学员如何开发程序来调用API提交练习结果
"""

import requests
import platform
import socket
import base64
import os
import sys
from typing import Dict, Any, Optional

# 配置
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3001/api')
STUDENT_NAME = os.getenv('STUDENT_NAME', '张三')  # 学员姓名
ACCESS_KEY = os.getenv('ACCESS_KEY')  # 访问密钥

print('🎯 Exercise 1 - 学员提交程序 (Python版本)')
print('=' * 50)
print()

class Exercise1Client:
    def __init__(self, api_base_url: str, student_name: str):
        self.api_base_url = api_base_url
        self.student_name = student_name
        self.access_key = None
    
    def get_ec2_instance_info(self) -> Dict[str, Any]:
        """获取EC2实例信息"""
        print('📊 正在收集EC2实例信息...')
        
        try:
            # 获取操作系统信息
            operating_system = f"{platform.system()} {platform.release()}"
            
            # 尝试获取AMI ID (在真实EC2环境中)
            ami_id = 'ami-unknown'
            try:
                response = requests.get('http://169.254.169.254/latest/meta-data/ami-id', timeout=2)
                if response.status_code == 200:
                    ami_id = response.text
            except:
                # 如果不在EC2环境中，使用模拟值
                ami_id = 'ami-0abcdef1234567890'
                print('⚠️  不在EC2环境中，使用模拟AMI ID')
            
            # 获取内网IP地址
            internal_ip_address = '127.0.0.1'
            try:
                # 尝试连接到外部地址来获取本地IP
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.connect(("8.8.8.8", 80))
                internal_ip_address = s.getsockname()[0]
                s.close()
                
                # 如果不是内网IP，使用默认值
                if not internal_ip_address.startswith('10.'):
                    internal_ip_address = '10.0.1.100'
            except:
                print('⚠️  无法获取内网IP，使用默认值')
                internal_ip_address = '10.0.1.100'
            
            # 尝试获取弹性IP地址
            elastic_ip_address = ''
            try:
                response = requests.get('http://169.254.169.254/latest/meta-data/public-ipv4', timeout=2)
                if response.status_code == 200:
                    elastic_ip_address = response.text
            except:
                # 如果不在EC2环境中或没有弹性IP，使用模拟值
                elastic_ip_address = '203.0.113.100'
                print('⚠️  不在EC2环境中或无弹性IP，使用模拟弹性IP')
            
            # 尝试获取实例类型
            instance_type = 't3.micro'
            try:
                response = requests.get('http://169.254.169.254/latest/meta-data/instance-type', timeout=2)
                if response.status_code == 200:
                    instance_type = response.text
            except:
                print('⚠️  不在EC2环境中，使用模拟实例类型')
            
            ec2_info = {
                'operatingSystem': operating_system,
                'amiId': ami_id,
                'internalIpAddress': internal_ip_address,
                'elasticIpAddress': elastic_ip_address,
                'instanceType': instance_type
            }
            
            print('✅ EC2实例信息收集完成:')
            print(f'   操作系统: {ec2_info["operatingSystem"]}')
            print(f'   AMI ID: {ec2_info["amiId"]}')
            print(f'   内网IP: {ec2_info["internalIpAddress"]}')
            print(f'   弹性IP: {ec2_info["elasticIpAddress"]}')
            print(f'   实例类型: {ec2_info["instanceType"]}')
            print()
            
            return ec2_info
            
        except Exception as error:
            print(f'❌ 获取EC2信息失败: {error}')
            raise error
    
    def get_access_key(self) -> str:
        """学员注册或获取访问密钥"""
        global ACCESS_KEY
        
        if ACCESS_KEY:
            print(f'🔑 使用现有访问密钥: {ACCESS_KEY}')
            self.access_key = ACCESS_KEY
            return ACCESS_KEY
        
        print('📝 正在注册学员账户...')
        
        try:
            response = requests.post(
                f'{self.api_base_url}/auth/student/register',
                json={'name': self.student_name},
                headers={'Content-Type': 'application/json'}
            )
            
            data = response.json()
            
            if data.get('success'):
                self.access_key = data['student']['accessKey']
                print(f'✅ 注册成功! 访问密钥: {self.access_key}')
                print('💡 请保存此访问密钥，下次可直接使用')
                print()
                return self.access_key
            else:
                raise Exception(data.get('message', '注册失败'))
                
        except Exception as error:
            print(f'❌ 学员注册失败: {error}')
            raise error
    
    def create_avatar(self) -> Optional[Dict[str, str]]:
        """创建头像图片 (示例)"""
        print('👤 创建头像图片...')
        
        try:
            # 创建一个简单的头像图片
            # 这里使用一个预定义的小头像图片的base64数据 (彩色1x1像素PNG)
            avatar_base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
            
            print('✅ 头像创建成功!')
            
            return {
                'base64': f'data:image/png;base64,{avatar_base64}'
            }
            
        except Exception as error:
            print(f'⚠️  头像创建失败: {error}')
            return None
    
    def submit_exercise(self, ec2_info: Dict[str, Any], avatar: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """提交练习完成数据 (支持头像)"""
        print('📤 正在提交练习数据到训练系统...')
        
        try:
            submission_data = {
                'studentName': self.student_name,
                'ec2InstanceInfo': ec2_info
            }
            
            # 添加头像数据 (如果有)
            if avatar:
                submission_data['avatarBase64'] = avatar['base64']
                print('   👤 包含头像数据')
            
            response = requests.post(
                f'{self.api_base_url}/submissions/exercise1',
                json=submission_data,
                headers={'Content-Type': 'application/json'}
            )
            
            data = response.json()
            
            if data.get('success'):
                print('🎉 提交成功!')
                print(f'   提交ID: {data["submissionId"]}')
                print(f'   获得分数: {data["score"]}')
                print(f'   提交时间: {data["timestamp"]}')
                print(f'   客户端IP: {data["clientIp"]}')
                if data.get('avatarInfo'):
                    avatar_info = data['avatarInfo']
                    print(f'   👤 头像: {avatar_info["filename"]} ({avatar_info["size"]} bytes)')
                print()
                return data
            else:
                raise Exception(data.get('message', '提交失败'))
                
        except Exception as error:
            print(f'❌ 提交失败: {error}')
            raise error
    
    def check_results(self):
        """查看学员成绩和排名"""
        print('📊 正在查询成绩和排名...')
        
        try:
            # 获取个人统计
            stats_response = requests.get(f'{self.api_base_url}/statistics/student/{self.access_key}')
            stats_data = stats_response.json()
            
            if stats_data.get('success'):
                stats = stats_data['statistics']
                print('📈 个人成绩统计:')
                print(f'   总分: {stats["totalScore"]}')
                print(f'   完成练习数: {stats["completedExercises"]}/{stats["totalExercises"]}')
                print(f'   平均分: {stats["averageScore"]:.1f}')
                print(f'   完成率: {stats["completionRate"]:.1f}%')
                if stats.get('currentRank'):
                    print(f'   当前排名: {stats["currentRank"]}/{stats["totalParticipants"]}')
                print()
            
            # 获取排行榜
            rankings_response = requests.get(f'{self.api_base_url}/statistics/rankings')
            rankings_data = rankings_response.json()
            
            if rankings_data.get('success') and rankings_data['rankings']:
                print('🏆 排行榜 (前5名):')
                for ranking in rankings_data['rankings'][:5]:
                    is_current_student = ranking['studentName'] == self.student_name
                    marker = '👤' if is_current_student else '  '
                    print(f'{marker} {ranking["rank"]}. {ranking["studentName"]} - {ranking["totalScore"]}分')
                print()
                
        except Exception as error:
            print(f'❌ 查询成绩失败: {error}')
    
    def run(self):
        """主程序"""
        try:
            print(f'👋 学员: {self.student_name}')
            print(f'🌐 API地址: {self.api_base_url}')
            print()
            
            # 1. 获取访问密钥
            self.get_access_key()
            
            # 2. 收集EC2实例信息
            ec2_info = self.get_ec2_instance_info()
            
            # 3. 创建头像图片
            avatar = self.create_avatar()
            
            # 4. 提交练习数据
            self.submit_exercise(ec2_info, avatar)
            
            # 5. 查看成绩和排名
            self.check_results()
            
            print('✨ 程序执行完成!')
            print()
            print('💡 提示:')
            print('   - 请保存您的访问密钥以备后用')
            print('   - 可以多次运行此程序来更新提交')
            print('   - 访问训练系统网页查看详细统计信息')
            
        except Exception as error:
            print(f'\n💥 程序执行失败: {error}')
            print()
            print('🔧 故障排除:')
            print('   1. 检查网络连接')
            print('   2. 确认API服务器正在运行')
            print('   3. 验证学员姓名和访问密钥')
            sys.exit(1)

def main():
    """主函数"""
    client = Exercise1Client(API_BASE_URL, STUDENT_NAME)
    client.run()

if __name__ == '__main__':
    main()