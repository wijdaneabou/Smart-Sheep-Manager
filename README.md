# Smart Sheep Manager (SSM)

## 📌 About the Project

**Smart Sheep Manager** is a digital platform for intelligent sheep farming in Morocco.  
It helps farmers, cooperatives, and veterinarians manage their herds, health, reproduction, feeding, finances, and more — all in one place.

- **Built with:** Node.js, Hono, Drizzle ORM, MySQL, React Native + Expo, TypeScript.
- **Core features:** User management, RBAC (roles & permissions), authentication, and a modular dashboard.

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- MySQL (XAMPP recommended)
- Expo CLI (`npm install -g expo-cli`)

---

### 1. Clone the repository
```bash
git clone https://github.com/your-org/Smart-Sheep-Manager.git
cd Smart-Sheep-Manager

2. Backend Setup
bash
cd backend
npm install
Create a .env file:

env
DATABASE_URL=mysql://root:@localhost:3306/smart_sheep_manager
JWT_SECRET=ssm2026
JWT_REFRESH_SECRET=ssm_refresh_2026
PORT=5000
Start MySQL (XAMPP):

bash
sudo /opt/lampp/lampp startmysql
Create the database:

bash
sudo mysql -e "CREATE DATABASE IF NOT EXISTS smart_sheep_manager;"
Run migrations & seed data:

bash
npm run db:generate
npm run db:migrate
npm run seed:roles
npm run seed:permissions
npm run seed:role-permissions
npm run seed:exploitations
Start the backend:

bash
npm run dev
The server will run on http://localhost:5000.

3. Mobile App Setup
bash
cd ../mobile
npm install
Create a .env file:

env
# For web testing (same machine)
EXPO_PUBLIC_API_URL=http://localhost:5000

# For physical device (Expo Go) – use your LAN IP
# EXPO_PUBLIC_API_URL=http://192.168.x.x:5000
Start the app:

bash
npx expo start -c
Press w for web.

Scan the QR code with Expo Go on your phone (same Wi‑Fi).

4. Default Admin Credentials
Role	: Email	         Password
Super Admin	: f.laassiri0988@uca.ac.ma	Admin@2026
Admin : 	admin@ssm.com	admin123
