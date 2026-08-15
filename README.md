<div align="center">
  
# 🏦 SecureBank
**A Next-Generation Enterprise Banking Platform**

[![CI/CD Pipeline](https://github.com/MADANCS/SecureBank-/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/MADANCS/SecureBank-/actions/workflows/ci-cd.yml)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel&logoColor=white)](https://secure-bank-mazz-git-main-madan21.vercel.app/signin)
[![Render Deployment](https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://securebank-c41z.onrender.com/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

*SecureBank is a full-stack, highly secure, and feature-rich digital banking application designed to demonstrate enterprise-grade software architecture, robust security practices, and modern UI/UX design.*

</div>

---

## 🌐 Live Production Demo

- **Frontend Application (Vercel)**: [https://secure-bank-chi.vercel.app/]
- **Backend Service (Render)**: [https://securebank-c41z.onrender.com/](https://securebank-c41z.onrender.com/)

> ℹ️ **Note on First Access**: Render free tier instances spin down after inactivity. The first API request may take ~30–45 seconds to perform a cold start. Subsequent requests respond instantly (<100ms).

---

## 🔑 Test Credentials for Live Demo

| Role | Username | Password | Purpose & Capabilities |
|------|----------|----------|------------------------|
| **Customer** | `testuser` | `Test@1234` | View accounts, perform money transfers, deposit funds, pay EMIs, upload KYC |
| **Admin** | `admin` | `Admin@1234` | Approve loans, verify KYC documents, manage accounts, freeze/unblock, view audit logs |

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
- **State & Data Fetching**: `@tanstack/react-query` for server-state synchronization, `axios` for API requests.
- **Styling**: Vanilla CSS / Tailwind CSS with custom dynamic themes, glassmorphism, and responsive design.

---

## 🚀 Local Development Setup

### Prerequisites
- **Java 17+**
- **Node.js 20+** & **npm**
- **Maven 3.8+**

### 1. Running the Backend
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev -Dspring-boot.run.jvmArguments="-Dserver.port=8088"
```
*The backend will start on `http://localhost:8088`. H2 database console is available at `/h2-console`.*

### 2. Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
*The frontend will start on `http://localhost:3000`.*

---

## 📐 Why This Project Stands Out (For Recruiters)

* **Beyond CRUD**: Implements complex business logic like atomic multi-step transactions, soft-deletes, and asynchronous fraud detection.
* **Security-First Mindset**: Demonstrates real-world security practices including IP whitelisting, RBAC, and pessimistic database locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) to prevent race conditions during money transfers.
* **Modern Tooling**: Utilizes `React Query` over standard `useEffect` for data fetching, showcasing knowledge of modern frontend performance optimizations and caching strategies.
* **Production-Ready CI/CD**: Fully automated multi-stage GitHub Actions pipeline (`.github/workflows/ci-cd.yml`) with Docker containerization, Vercel frontend hosting, and Render backend deployment.

---
*Designed & Developed by Madan C S*
