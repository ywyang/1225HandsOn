# Product Overview

这是一个用于培训过程中Hands on的后台系统，后台系统包含管理员界面和学员界面。功能见Purpose部分。采用BS架构，浏览器方式访问。页面要美观，酷炫。后端项目在AWS 上实现，可使用aws 数据库等服务。

## Purpose
针对管理员
- 管理员登陆
- Hands on 试题管理，配置、发放Z（学员界面可以看到题目）
- Hands on 完成度统计，按照分数和完成时间排名

针对学员
- 学员登陆，输入姓名后即分配一个唯一的access key，
- access key 查询，通过姓名查询 access key
- hands on 题目查看
- hands on 题目结果查看

hands on 题目1
系统实现一个API接口，学员本地开发程序调用这个接口提交信息（学员在本地实现），本地程序开发完成之后部署在aws ec2中。 API 收集学员姓名，access key， 调用api client 的ip地址，本地程序运行所在的ec2信息，如操作系统（ami）、内网ip、实例类型等。

hands on 题目2 待定。

