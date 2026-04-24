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

The startup script enforces a deterministic bootstrap sequence: venv check, dependency install, DB migration, conditional seed, then service startup.  
启动脚本实现了固定顺序的启动链路：检查 venv、安装依赖、数据库迁移、按条件 seed、最后启动服务。  

Backend bootstrap executes in this order in `start-dev.ps1`:  
`start-dev.ps1` 中后端启动顺序如下：  

1. Resolve backend Python executable from `.venv` or `venv`.  
1. 从 `.venv` 或 `venv` 解析后端 Python 可执行路径。  
2. Install/verify dependencies from `requirements.txt`.  
2. 按 `requirements.txt` 安装并校验依赖。  
3. Run Alembic migration with `flask db upgrade`.  
3. 通过 `flask db upgrade` 执行 Alembic 迁移。  
4. Decide whether seed is required using bootstrap marker + DB existence checks.  
4. 通过 bootstrap marker 与数据库文件存在性判断是否需要 seed。  
5. Start Flask server on `127.0.0.1:5000`.  
5. 启动 Flask 服务到 `127.0.0.1:5000`。  

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

### 5.1.1 How Seed Is Triggered
### 5.1.1 Seed 触发条件说明

Seed behavior is not unconditional; it is controlled by two runtime checks in `start-dev.ps1`:  
seed 不是每次都执行；它在 `start-dev.ps1` 中由两个条件控制：  

- `bootstrapMarker`: `.dev_bootstrap_done`  
- `bootstrapMarker`：`.dev_bootstrap_done`  
- `dbPath`: `.\instance\assetguard.db` existence before migration  
- `dbPath`：迁移前 `.\instance\assetguard.db` 是否存在  

Seed runs when either condition is true:  
当以下任一条件为真时会执行 seed：  

1. Marker file does not exist (first bootstrap state).  
1. 标记文件不存在（首次引导状态）。  
2. Database file did not exist before current startup (fresh DB recreation case).  
2. 当前启动前数据库文件不存在（数据库重建/丢失场景）。  

If both marker exists and DB existed before startup, seed is skipped to avoid unnecessary reseeding.  
如果标记文件存在且数据库在启动前已存在，则跳过 seed，避免重复灌入。  

Relevant decision block:  
对应判断代码片段：  

```powershell
# start-dev.ps1
$bootstrapMarker = '.dev_bootstrap_done'
$dbPath = '.\instance\assetguard.db'
$dbExistedBeforeUpgrade = Test-Path $dbPath
$markerExists = Test-Path $bootstrapMarker

& $pyExe -m flask --app assetguard_app.py db upgrade

if (-not $markerExists -or -not $dbExistedBeforeUpgrade) {
    & $pyExe -m flask --app assetguard_app.py seed
    if ($LASTEXITCODE -eq 0) {
        New-Item -ItemType File -Path $bootstrapMarker -Force | Out-Null
    }
}
```

### 5.1.2 Bug Case: DB Deleted but Seed Skipped
### 5.1.2 Bug 场景：删除 DB 后 seed 被错误跳过

I identified and fixed a bootstrap bug in the startup script logic.  
我定位并修复了启动脚本中的一个引导逻辑 bug。  

Bug symptom: after deleting the DB file under `instance`, re-running startup did not re-seed data.  
bug 现象：手动删除 `instance` 下数据库文件后，再次运行启动脚本时不会重新灌入 seed 数据。  

The old behavior was marker-only driven: once `.dev_bootstrap_done` existed, seed was always skipped.  
旧逻辑只依赖 marker：只要 `.dev_bootstrap_done` 存在，就会始终跳过 seed。  

That means deleting DB but keeping marker caused an empty/fresh database without demo data.  
这会导致“数据库被删但 marker 还在”时，得到一个空/新数据库却不执行 seed。  

#### Old logic (problematic)
#### 旧逻辑（有缺陷）

```powershell
# old behavior (conceptual)
& $pyExe -m flask --app assetguard_app.py db upgrade

$bootstrapMarker = '.dev_bootstrap_done'
if (-not (Test-Path $bootstrapMarker)) {
    & $pyExe -m flask --app assetguard_app.py seed
    New-Item -ItemType File -Path $bootstrapMarker -Force | Out-Null
} else {
    # marker exists -> always skip seed
}
```

Root cause: marker existence alone cannot represent database state.  
根因：仅凭 marker 是否存在，无法真实反映数据库当前状态。  

`flask db upgrade` can recreate schema after DB deletion, but it does not populate demo rows.  
`flask db upgrade` 在数据库被删后只会重建表结构，不会填充演示数据。  

#### Fix strategy
#### 修复策略

I added a second condition to seed decision: whether DB file existed **before** migration.  
我在 seed 判定中增加了第二个条件：迁移执行前数据库文件是否存在。  

Seed is now triggered when either:
现在 seed 在以下任一条件下触发：  

1. Marker is missing (first bootstrap).  
1. marker 缺失（首次引导）。  
2. DB file was missing before startup (DB recreated scenario).  
2. 启动前数据库文件不存在（数据库重建场景）。  

#### Updated logic (fixed)
#### 修复后逻辑

```powershell
# start-dev.ps1
$bootstrapMarker = '.dev_bootstrap_done'
$dbPath = '.\instance\assetguard.db'
$dbExistedBeforeUpgrade = Test-Path $dbPath
$markerExists = Test-Path $bootstrapMarker

& $pyExe -m flask --app assetguard_app.py db upgrade

if (-not $markerExists -or -not $dbExistedBeforeUpgrade) {
    & $pyExe -m flask --app assetguard_app.py seed
    if ($LASTEXITCODE -eq 0) {
        New-Item -ItemType File -Path $bootstrapMarker -Force | Out-Null
    }
} else {
    Write-Host '[Normal] Bootstrap marker found and database existed before startup. Skip flask seed.' -ForegroundColor Green
}
```

Result: deleting `instance/assetguard.db` now correctly re-triggers seed on next startup, while normal restarts still avoid redundant reseeding.  
结果：现在删除 `instance/assetguard.db` 后，下次启动会正确重新 seed；而正常重启仍会避免重复灌数据。  

### 5.2 Seed Data and Demo Accounts
### 5.2 种子数据与演示账号

Seed command file: `AssetGuard AI/app/commands/seed.py`.  
seed 命令文件：`AssetGuard AI/app/commands/seed.py`。  

Seed logic uses an **upsert-style strategy** for users/assets and recreates sample evaluation logs for demo consistency.  
seed 逻辑对用户/资产采用 **upsert 风格**，并重建示例评估日志以保证演示一致性。  

Specifically, seed prepares:  
具体而言，seed 会准备：  

- 3 demo users with roles (`System_Admin`, `Asset_Manager`, `Contractors`) and known credentials.  
- 3 个演示账号（`System_Admin`、`Asset_Manager`、`Contractors`）及固定凭据。  
- 1 default location (`Port of Bunbury`).  
- 1 个默认地点（`Port of Bunbury`）。  
- 6 assets under that location with standardized load capacity rows.  
- 该地点下 6 个资产及标准化承载能力记录。  
- Fresh sample `evaluation_logs` records for dashboard/history demo usage.  
- 刷新的 `evaluation_logs` 示例数据，用于 dashboard/history 演示。  

Default seeded accounts are listed below.  
默认 seed 账号如下。  

- `admin@demo.com / admin123` (`System_Admin`)  
- `manager@demo.com / manager123` (`Asset_Manager`)  
- `contractor@demo.com / contractor123` (`Contractors`)  

Example of user upsert in seed command:  
seed 命令中用户 upsert 示例：  

```python
# AssetGuard AI/app/commands/seed.py
def upsert_user(email: str, password: str, role: UserRole):
    user = User.query.filter_by(email=email).first()
    if user is None:
        user = User(email=email, role=role, is_first_login=False)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user, True

    user.role = role
    user.is_first_login = False
    user.set_password(password)
    db.session.commit()
    return user, False
```

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
