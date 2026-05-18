# AI 博客平台

一个集成了博客系统和 AI 工具的全栈 Web 应用平台。

## 🚀 功能特性

### 博客系统
- 文章发布、编辑、删除
- 文章分类（日常/开发）
- 标签管理
- 评论系统（支持嵌套回复）
- 点赞功能
- 用户个人中心

### AI 工具
- 文案润色
- 多语言翻译
- AI 对话助手
- 代码注释生成
- 代码优化建议

### 用户系统
- 用户注册/登录
- 个人资料编辑
- 头像上传
- 消费记录统计

## 🛠️ 技术栈

### 前端
- Vue 3 + TypeScript
- Vite 构建工具
- Element Plus UI 组件库
- Vue Router 路由管理
- Axios HTTP 客户端

### 后端
- Node.js + Express
- MySQL 数据库
- JWT 认证
- bcryptjs 密码加密

### DevOps
- Docker 容器化
- Docker Compose 编排
- ESLint + Prettier 代码规范

## 📦 快速开始

### 方式一：Docker 一键启动（推荐）

1. 确保已安装 [Docker Desktop](https://www.docker.com/get-started)

2. 双击运行 `start.bat` 启动服务

3. 访问 http://localhost 开始使用

### 方式二：本地开发

#### 后端启动
```bash
cd backend
npm install
npm run dev
```

#### 前端启动
```bash
cd frontend
npm install
npm run dev
```

## 📊 默认账号

| 用户名 | 密码 | 说明 |
|--------|------|------|
| admin | 123456 | 管理员账号 |
| testuser | 123456 | 测试账号 |

## 🗂️ 项目结构

```
integrated-blog-ai/
├── backend/           # 后端服务
│   ├── controllers/   # 控制器
│   ├── middleware/    # 中间件
│   ├── routes/        # 路由
│   ├── config/        # 配置
│   ├── init.sql       # 数据库初始化脚本
│   ├── Dockerfile     # 后端 Docker 配置
│   └── server.js      # 入口文件
├── frontend/          # 前端应用
│   ├── src/
│   │   ├── views/     # 页面组件
│   │   ├── api/       # API 接口
│   │   └── router/    # 路由配置
│   ├── Dockerfile     # 前端 Docker 配置
│   └── nginx.conf     # Nginx 配置
├── docker-compose.yml # Docker 编排配置
├── start.bat          # Windows 一键启动脚本
├── stop.bat           # 停止服务脚本
└── README.md
```

## 🔧 常用命令

### Docker 相关
```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重新构建并启动
docker-compose up -d --build
```

### 代码规范
```bash
# 前端
cd frontend
npm run lint
npm run format

# 后端
cd backend
npm run lint
npm run format
```

## 🌐 访问地址

| 服务 | 本地地址 | Docker 地址 |
|------|----------|-------------|
| 前端 | http://localhost:5173 | http://localhost |
| 后端 | http://localhost:3001 | http://localhost:3001 
| 数据库 | localhost:3306 | localhost:3306 |

## 📝 注意事项

1. 首次运行 Docker 需要等待数据库初始化完成（约 30 秒）
2. 默认密码都是 `123456`，生产环境请修改
3. 数据库数据持久化在 `mysql-data` 卷中

