# Detailed Contribution Report (Bilingual)
# 详细个人贡献报告（中英双语）

## 1) Scope of My Work
## 1）工作范围

My work focused on frontend-backend integration, database runtime readiness, and local development automation.  
我的工作重点是前后端联调、数据库运行可用性和本地开发自动化。  

I moved the project from a mostly static UI prototype to a runnable workflow with real authentication and repeatable setup.  
我把项目从“以静态页面为主”的原型推进到“可真实认证、可重复运行”的工作流。  

---

## 2) Authentication Integration (Frontend -> Backend -> DB)
## 2）认证链路打通（前端 -> 后端 -> 数据库）

### 2.1 Login API Integration
### 2.1 登录接口联动

API endpoint: `POST /api/v1/auth/login`.  
接口地址：`POST /api/v1/auth/login`。  

Frontend caller file: `assetguard-ui/src/pages/LoginEmailPage.jsx`.  
前端调用文件：`assetguard-ui/src/pages/LoginEmailPage.jsx`。  

Backend route file: `AssetGuard AI/app/controllers/auth_controller.py`.  
后端路由文件：`AssetGuard AI/app/controllers/auth_controller.py`。  

Backend service file: `AssetGuard AI/app/services/auth_service.py`.  
后端业务文件：`AssetGuard AI/app/services/auth_service.py`。  

The frontend sends email/password to the backend and handles success/error response.  
前端向后端提交邮箱和密码，并处理成功或失败响应。  

```javascript
// assetguard-ui/src/pages/LoginEmailPage.jsx
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: email.trim(),
    password,
  }),
});
```

The backend validates input, calls AuthService, and returns token + user data.  
后端进行参数校验，调用 AuthService，并返回 token 和用户信息。  

```python
# AssetGuard AI/app/controllers/auth_controller.py
@auth_bp.post("/login")
def login():
    body = request.get_json(silent=True) or {}
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""
    if not email or not password:
        raise ApiError("email and password are required", 400, code="validation_error")
    data = AuthService.login(email=email, password=password)
    return ok(data)
```

AuthService checks user credentials from DB and issues signed token.  
AuthService 从数据库校验用户凭据并签发 token。  

```python
# AssetGuard AI/app/services/auth_service.py
user = User.query.filter_by(email=email).first()
if user is None or not user.check_password(password):
    raise ApiError("Invalid email or password", 401, code="invalid_credentials")

token = issue_token(user=user)
return {
    "token": token,
    "user": {
        "id": user.id,
        "email": user.email,
        "role": user.role.value,
        "isFirstLogin": user.is_first_login,
    },
}
```

### 2.2 First-Login Password Setup Integration
### 2.2 首次登录设密接口联动

API endpoint: `POST /api/v1/auth/set-initial-password`.  
接口地址：`POST /api/v1/auth/set-initial-password`。  

Frontend caller file: `assetguard-ui/src/pages/PasswordSetupPage.jsx`.  
前端调用文件：`assetguard-ui/src/pages/PasswordSetupPage.jsx`。  

Backend route file: `AssetGuard AI/app/controllers/auth_controller.py`.  
后端路由文件：`AssetGuard AI/app/controllers/auth_controller.py`。  

Backend service file: `AssetGuard AI/app/services/auth_service.py`.  
后端业务文件：`AssetGuard AI/app/services/auth_service.py`。  

The frontend sends `newPassword` with `Authorization: Bearer <token>`.  
前端携带 `Authorization: Bearer <token>` 提交 `newPassword`。  

```javascript
// assetguard-ui/src/pages/PasswordSetupPage.jsx
const response = await fetch(`${API_BASE_URL}/auth/set-initial-password`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ newPassword }),
});
```

---

## 3) Session Flow and Auth State in Frontend
## 3）前端会话流与认证状态管理

Main state flow file: `assetguard-ui/src/App.jsx`.  
主状态流文件：`assetguard-ui/src/App.jsx`。  

Session helper files: `assetguard-ui/src/services/authSession.js` and `assetguard-ui/src/services/apiClient.js`.  
会话辅助文件：`assetguard-ui/src/services/authSession.js` 和 `assetguard-ui/src/services/apiClient.js`。  

The app uses state-based page transition: `login -> password setup -> dashboard`.  
应用使用状态驱动页面流转：`login -> password setup -> dashboard`。  

Token is managed in memory with centralized unauthorized handling (401).  
token 通过内存态管理，并统一处理未授权（401）回调。  

```javascript
// assetguard-ui/src/App.jsx
setToken(nextToken);
setAuthToken(nextToken);
setUser(nextUser);
setCurrentPage(nextUser?.isFirstLogin ? "password" : "dashboard");
```

```javascript
// assetguard-ui/src/services/apiClient.js
const token = getAuthToken();
const response = await fetch(`${API_BASE_URL}${path}`, {
  headers: {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  ...options,
});
if (response.status === 401) notifyUnauthorized();
```

---

## 4) Local Integration Stability (Proxy)
## 4）本地联调稳定性（代理配置）

Config file: `assetguard-ui/vite.config.js`.  
配置文件：`assetguard-ui/vite.config.js`。  

I added Vite dev proxy to route `/api` to `http://127.0.0.1:5000`.  
我添加了 Vite 开发代理，将 `/api` 转发到 `http://127.0.0.1:5000`。  

This reduces local cross-origin friction and stabilizes frontend-backend requests.  
该方案减少了本地跨域干扰，并稳定了前后端请求链路。  

```javascript
// assetguard-ui/vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:5000',
      changeOrigin: true,
    },
  },
},
```

---

## 5) Database/Backend Runtime Automation
## 5）数据库与后端运行自动化

### 5.1 One-Click Startup Scripts
### 5.1 一键启动脚本

Script files: `start-dev.ps1` and `start-dev.bat`.  
脚本文件：`start-dev.ps1` 和 `start-dev.bat`。  

The script automates venv setup, dependency install, migration, seed, and service startup.  
脚本自动处理 venv、依赖安装、迁移、seed 和服务启动。  

Key backend bootstrap logic is shown below.  
关键后端启动逻辑如下。  

```powershell
# start-dev.ps1
& $pyExe -m flask --app assetguard_app.py db upgrade

if (-not $markerExists -or -not $dbExistedBeforeUpgrade) {
    & $pyExe -m flask --app assetguard_app.py seed
    New-Item -ItemType File -Path $bootstrapMarker -Force | Out-Null
}

& $pyExe -m flask --app assetguard_app.py run
```

### 5.2 Seed Data and Demo Accounts
### 5.2 种子数据与演示账号

Seed command file: `AssetGuard AI/app/commands/seed.py`.  
seed 命令文件：`AssetGuard AI/app/commands/seed.py`。  

Seed includes demo users, locations, assets, load capacities, and sample evaluation logs.  
seed 包含演示用户、地点、资产、承载能力以及示例评估日志。  

Default seeded accounts are listed below.  
默认 seed 账号如下。  

- `admin@demo.com / admin123` (`System_Admin`)  
- `manager@demo.com / manager123` (`Asset_Manager`)  
- `contractor@demo.com / contractor123` (`Contractors`)  

---

## 6) Dashboard Interaction and User Context
## 6）Dashboard 交互与用户上下文优化

Sidebar interaction file: `assetguard-ui/src/components/layout/Sidebar.jsx`.  
侧边栏交互文件：`assetguard-ui/src/components/layout/Sidebar.jsx`。  

I implemented clickable navigation, active-state switching, and admin submenu behavior.  
我实现了可点击导航、active 状态切换以及 admin 子菜单交互。  

Topbar identity files:  
顶部身份显示相关文件：  
- `assetguard-ui/src/components/layout/Topbar.jsx`  
- `assetguard-ui/src/components/layout/AppLayout.jsx`  
- `assetguard-ui/src/pages/DashboardPage.jsx`

Topbar now displays logged-in user email instead of static placeholder text.  
顶部栏现在显示登录用户邮箱，而不是静态占位文案。  

```javascript
// assetguard-ui/src/components/layout/Topbar.jsx
const userLabel = user?.email || "Unknown User";
<div className="topbar-user">{userLabel} ▾</div>
```

---

## 7) Runtime Configuration
## 7）运行配置说明

Backend config file: `AssetGuard AI/app/config.py`.  
后端配置文件：`AssetGuard AI/app/config.py`。  

The project uses environment-driven settings for DB, token secret, and token expiration.  
项目使用环境变量驱动数据库连接、token 密钥与 token 过期时间。  

Key config keys include `DATABASE_URL`, `SECRET_KEY`, and `TOKEN_EXPIRES_SECONDS`.  
关键配置项包括 `DATABASE_URL`、`SECRET_KEY`、`TOKEN_EXPIRES_SECONDS`。  

---

## 8) End-to-End Validation Flow
## 8）端到端验证流程

The implemented demo workflow is: login -> first-login password setup (if needed) -> dashboard.  
已实现的演示流程是：登录 -> 首次设密（如需要） -> 进入 dashboard。  

This confirms API availability, DB readiness, and frontend auth flow correctness.  
这可以验证 API 可用性、数据库准备状态以及前端认证流程正确性。  

Recommended demo command entry is `start-dev.bat` in project root.  
推荐使用项目根目录下的 `start-dev.bat` 作为演示启动入口。  
