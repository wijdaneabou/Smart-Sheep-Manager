# Smart Sheep Manager (SSM)

## 📌 About the Project

**Smart Sheep Manager** is a digital platform for intelligent sheep farming in Morocco. It helps farmers, cooperatives, and veterinarians manage their herds, health, reproduction, feeding, finances, and more — all in one place.

- **Built with:** Node.js, Hono, Drizzle ORM, MySQL, React Native + Expo, TypeScript.
- **Core features:** User management, RBAC (roles & permissions), authentication, and a modular dashboard.

---

## 🚀 Getting Started (Local Development)

### Prerequisites

1. **Node.js** (v18+)
   - Download from [nodejs.org](https://nodejs.org) or use a version manager like nvm
   - Verify installation: `node -v` and `npm -v`

2. **MySQL** (XAMPP recommended)
   - Install XAMPP: https://www.apachefriends.org/index.html
   - Start MySQL from XAMPP Control Panel

3. **Expo CLI**
   - Install globally: `npm install -g expo-cli`

4. **Git**
   - For version control: https://git-scm.com

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/Smart-Sheep-Manager.git
cd Smart-Sheep-Manager
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create the `.env` file with the following content:

```
DATABASE_URL=mysql://root:@localhost:3306/smart_sheep_manager
JWT_SECRET=ssm2026
JWT_REFRESH_SECRET=ssm_refresh_2026
PORT=5000
```

#### Database Setup Steps:

1. Start MySQL through XAMPP Control Panel
2. Create the database:
   ```bash
   sudo mysql -e "CREATE DATABASE IF NOT EXISTS smart_sheep_manager;"
   ```
3. Run migrations and seed data:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run seed:roles
   npm run seed:permissions
   npm run seed:role-permissions
   npm run seed:exploitations
   ```

Start the backend server:
```bash
npm run dev
```

The server will run on http://localhost:5000

---

### 3. Mobile App Setup

```bash
cd ../mobile
npm install
```

Create the `.env` file with the following content:

```
EXPO_PUBLIC_API_URL=http://localhost:5000
```

Start the mobile application:
```bash
npx expo start -c
```

- Press `w` for web version
- Scan QR code with Expo Go app on your phone (same Wi-Fi network)

---

### 4. Default Admin Credentials

| Role        | Email                          | Password     |
|-----------|--------------------------------|--------------|
| Super Admin | f.laassiri0988@uca.ac.ma       | Admin@2026   |
| Admin       | admin@ssm.com                  | admin123     |

---

## 🛠️ Development Workflow

### Backend
- Run `npm run dev` for development mode (auto-restarts on code changes)
- Run `npm run start` for production build
- Database migrations: `npm run db:migrate`
- Seed data: `npm run seed:roles`, `npm run seed:permissions`, etc.

### Mobile App
- Use `npm run ios` or `npm run android` for building native apps
- Use `npx expo start` to run the development server
- Press `a` for Android simulator, `i` for iOS simulator
- Press `w` for web version

---

## 🧪 Testing

The project includes seed data for testing. To reset the database:

```bash
npm run db:generate
npm run db:migrate
npm run seed:all
```

---

## 📱 Mobile App Features

The mobile app includes:

- Herd management (animal creation, editing, viewing)
- Health records with status filtering
- Fattening lot tracking with performance metrics
- IoT sensor and shield monitoring
- Financial management (budgets, expenses, revenues)
- AI assistant for decision support
- Reproduction cycle tracking
- Comprehensive reporting and analytics

---

## 🔐 Permissions System

The application uses a robust Role-Based Access Control (RBAC) system with granular permissions:

- **Roles:** admin, manager, eleveur, ouvrier, veterinaire, cooperative, admin
- **Permissions:** Granular access like `FATTENING:LOT:READ`, `HEALTH_RECORD:DELETE`, etc.
- **Module-based access:** Users can only access modules they have permissions for
- **Admin-only features:** Certain administrative functions are restricted to admin users

---

## 🐛 Troubleshooting

### Common Issues

1. **Database connection errors:**
   - Ensure MySQL is running
   - Verify `.env` file has correct `DATABASE_URL`
   - Check that the database exists: `sudo mysql -e "SHOW DATABASES;"`

2. **Port conflicts:**
   - If port 5000 is in use, change `PORT=5000` in `.env` to another port

3. **Expo not starting:**
   - Ensure Expo CLI is installed globally: `npm install -g expo-cli`
   - Check for Node.js version compatibility

4. **Permission denied errors:**
   - Verify you have proper read/write access to project directories
   - Check file permissions with `ls -la`

---

## 📂 Project Structure

```
Smart-Sheep-Manager/
├── backend/              # Node.js backend
│   ├── src/
│   │   ├── routes/       # API route definitions
│   │   ├── controllers/  # Business logic
│   │   ├── services/     # Data access layer
│   │   ├── db/           # Database schema and models
│   │   ├── middlewares/  # Authentication and RBAC
│   │   └── constants/    # Permission definitions
│   ├── drizzle/          # Database migrations
│   └── package.json
│
└── mobile/               # React Native mobile app
    ├── src/
    │   ├── app/          # Screens organized by modules
    │   ├── services/     # API service layer
    │   ├── contexts/     # Global state (PermissionsContext)
    │   ├── components/   # Reusable UI components
    │   ├── hooks/        # Custom React hooks
    │   └── constants/    # Module definitions and icons
    └── package.json
```

---

## 📚 Documentation

For detailed documentation about the project structure, modules, and permissions, see the `PROJECT_DOCUMENTATION.md` file.

---

## 🤝 Contributing

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.