<div align="center">
  
# 🏦 SecureBank
**A Next-Generation Enterprise Banking Platform**

[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

*SecureBank is a full-stack, highly secure, and feature-rich digital banking application designed to demonstrate enterprise-grade software architecture, robust security practices, and modern UI/UX design.*

</div>

---

## ✨ Key Features

### 🛡️ Enterprise Security & Authentication
- **Stateless JWT Authentication**: Secure, token-based session management with role-based access control (RBAC).
- **Fraud Detection Engine**: Automated transaction flagging for suspicious activity (e.g., velocity checks, abnormal amounts) triggering automated account freezes and admin-only unblocks.
- **Admin IP Whitelisting**: Restricted access to administrative endpoints strictly based on authorized IP addresses.

### 💼 Comprehensive Banking Operations
- **Multi-Account Management**: Support for Savings, Current, and Fixed Deposit (FD) accounts.
- **Real-time Transactions**: ACID-compliant transactional guarantees for internal transfers and self-deposits.
- **Account Closures**: Lifecycle management with zero-balance enforcement and admin-approval workflows.

### 👨‍⚖️ Advanced Admin Control Center
- **Quick Provisioning**: Atomic, single-step account creation and initial funding for new clients.
- **KYC & Loan Approvals**: Dedicated interfaces for admins to review identity documents and loan applications.
- **Account Freezing & Reversals**: Total control over compromised accounts and fraudulent transactions.

### 💳 Modern Integrations
- **Payment Gateways**: Fully integrated with **Razorpay** and **Stripe** for external funding and premium services.
- **Cloud Storage**: Secure handling of sensitive KYC document uploads.

---

## 🏗️ Technical Architecture

### **Backend (Spring Boot)**
Built on a robust Java ecosystem, emphasizing scalability, maintainability, and clean architecture.
- **Framework**: Java 17+, Spring Boot 3.2.x, Spring Security 6.
- **Database**: H2 (In-memory for Dev/Testing) / PostgreSQL (Production), managed via Spring Data JPA & Hibernate.
- **Design Patterns**: Service Layer, Repository Pattern, DTOs (Data Transfer Objects), and Global Exception Handling.
- **Tools**: Maven, Lombok, Jackson.

### **Frontend (React + Vite)**
A lightning-fast, responsive, and beautiful user interface designed for maximum user engagement.
- **Core**: React 18, TypeScript, Vite.
- **State & Data Fetching**: `@tanstack/react-query` for sophisticated server-state synchronization and caching, `axios` for API calls.
- **Styling**: Tailwind CSS with custom dynamic themes, glassmorphism, and responsive design.

---

## 🚀 Getting Started

### Prerequisites
- **Java 17+**
- **Node.js 18+** & **npm/yarn**
- **Maven 3.8+**

### 1. Running the Backend
Navigate to the `backend` directory and start the Spring Boot application using the `dev` profile.

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev -Dspring-boot.run.jvmArguments="-Dserver.port=8088"
```
*The backend will start on `http://localhost:8088`. H2 database console is available at `/h2-console`.*

### 2. Running the Frontend
Navigate to the `frontend` directory, install dependencies, and start the Vite dev server.

```bash
cd frontend
npm install
npm run dev
```
*The frontend will start on `http://localhost:3003`.*

---

## 🧪 Default Test Accounts
The application automatically seeds the database with the following users on startup:

| Role | Username | Password | Purpose |
|------|----------|----------|---------|
| **Admin** | `admin` | `Admin@1234` | Full access to Admin Panel, KYC, Loans, and Provisioning |
| **Customer**| `testuser` | `Test@1234` | Standard user for testing transfers, deposits, and requests |

---

## 📐 Why This Project Stands Out (For Recruiters)

* **Beyond CRUD**: Implements complex business logic like atomic multi-step transactions, soft-deletes, and asynchronous fraud detection.
* **Security-First Mindset**: Demonstrates understanding of real-world vulnerabilities by implementing IP whitelists, RBAC, and pessimistic database locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) to prevent race conditions during money transfers.
* **Modern Tooling**: Utilizes `React Query` over standard `useEffect` for data fetching, showcasing knowledge of modern frontend performance optimizations and caching strategies.
* **Production-Ready Code**: Features global exception handlers, standardized API responses, environment-based configurations (`application-dev.yml`), and strict TypeScript typing.

---
*Designed & Developed by Madan C S*
