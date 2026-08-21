# Smart Sheep Manager (SSM) - Comprehensive Project Documentation

## 📌 Project Overview
Smart Sheep Manager (SSM) is a comprehensive digital platform for intelligent sheep farming in Morocco, designed to help farmers, cooperatives, and veterinarians manage their herds, health, reproduction, feeding, finances, and more through a unified interface.

## 🏗️ Project Structure

### Backend Structure
- **/backend**: Node.js backend application
  - **src/**: Source code
    - **routes/**: API route definitions for all modules
    - **controllers/**: Business logic for each route
    - **services/**: Data access layer
    - **db/**: Database schema and models
    - **middlewares/**: Authentication and RBAC middleware
    - **constants/**: Permission definitions and constants
  - **drizzle/**: Database migration and schema files
  - **package.json**: Dependencies including Hono, Drizzle ORM, MySQL2

### Mobile Structure
- **/mobile**: React Native Expo application
  - **src/**: Source code
    - **app/**: Application screens organized by modules
    - **services/**: API service layer
    - **contexts/**: Global context (PermissionsContext)
    - **components/**: Reusable UI components
    - **hooks/**: Custom React hooks
    - **constants/**: Module definitions and icons

## 🔐 Permissions & RBAC System

### Roles and Permissions
The system uses a robust Role-Based Access Control (RBAC) model with the following roles:
- **admin**: Full access to all modules and features
- **manager**: High-level access to most modules
- **eleveur**: Farm operator with moderate access
- **ouvrier**: Worker with limited permissions
- **veterinaire**: Veterinarian with health-focused permissions
- **cooperative**: Cooperative member with aggregated view access
- **admin** (for permissions management)

### Permission Granularity
Permissions are highly granular, e.g.:
- `FATTENING:LOT:READ`, `FATTENING:FEED:CREATE`, `HEALTH_RECORD:DELETE`
- Each module has specific permission requirements
- Admin role has all permissions (`*` access)

### Permission Implementation
- Backend uses `requirePermission(module, action)` middleware
- Mobile uses `hasPermission(module, action)` context hook
- Permission checks are integrated throughout all modules

## 🧩 Module Structure

### Core Modules (16 Total)
1. **Users**: User management with role assignments
2. **Permissions**: Module and role permission definitions
3. **Exploitations**: Farm/parcel management
4. **Herd**: Animal management (create, edit, view animals)
5. **IoT**: Sensor and shield management for monitoring
6. **Health**: Medical records, treatments, vaccinations
7. **Reproduction**: Mating cycles, pregnancy tracking
8. **Feeding**: Ration management and stock
9. **Fattening**: Weight tracking and performance monitoring
10. **AI**: Decision support and alerts
10. **Finance**: Budgeting, expenses, revenues, cashflow
11. **Commercial**: Sales and client management
12. **BI**: Business intelligence dashboard
13. **Communication**: Internal messaging and notifications
14. **Reporting**: Export and compliance reports
15. **AI Assistant**: Decision support assistant (placeholder)
16. **Users**: User management and authentication

### Module Details

#### Health Module
- Tracks animal health records, treatments, vaccinations
- Includes health status filtering (HEALTHY, SURVEILLANCE, SICK, etc.)
- Shows BCS (Body Condition Score) radar charts
- Includes veterinary intervention tracking
- Accessible via `/health` route with proper permissions

#### AI Assistant Module
- Dedicated module for AI-powered decision support
- Currently implemented as a placeholder (`ModulePlaceholder`)
- Will provide quick answers and assistance
- Accessible via `/ai-assistant` route

#### Dashboard Structure
- Main dashboard with bottom navigation bar
- Tabs system showing 3 primary modules + "more" option
- Permission-based tab visibility
- AI Assistant tab included in main navigation
- Each module has its own dedicated screen(s)

## 📱 Mobile App Features

### Navigation System
- Bottom navigation bar with scrollable tabs
- 3 primary tabs displayed based on user permissions
- "More" option for additional modules
- AI Assistant tab included in main navigation

### Key Screens
- **Herd Management**: Animal creation, editing, and viewing
- **Health Records**: Detailed medical history with status filtering
- **Fattening**: Lot tracking with performance metrics
- **IoT**: Real-time sensor and shield monitoring
- **Finance**: Budget and expense tracking
- **AI Assistant**: Decision support interface

### Permissions Context
- `PermissionsContext.tsx` manages user roles and permissions
- `usePermissions()` hook provides access to permission checks
- `hasPermission(module, action)` method for access validation
- `isAdmin` flag for admin-specific features

## 🔧 Technical Implementation

### Backend
- Built with Hono framework
- Uses Drizzle ORM for database interactions
- MySQL database with comprehensive schema
- JWT-based authentication with refresh tokens
- RBAC middleware enforces permissions on all routes

### Mobile App
- Built with React Native and Expo
- TypeScript for type safety
- Expo Router for navigation
- React Context for global state management
- Secure storage for tokens via `expo-secure-store`

## ✅ Verification Steps

To verify the implementation is correct:

1. Run `npm run dev` in backend directory
2. Run `npx expo start -c` in mobile directory
3. Check that all modules have proper permission restrictions
4. Verify AI Assistant placeholder is in place
5. Confirm health module functionality with record management
6. Validate that all dashboard modules respect permission constraints

## 📌 Important Notes

- The AI Assistant is currently a placeholder component that needs to be implemented
- All modules follow consistent UI patterns and permission checks
- The system supports granular permissions down to individual actions
- Mobile app uses Expo for cross-platform deployment
- Backend uses Hono for lightweight HTTP server
- Database schema is extensive with multiple related tables

This documentation provides a complete overview of the Smart Sheep Manager project structure, modules, permissions, and implementation details.