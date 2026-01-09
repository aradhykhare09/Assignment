# Product Data Explorer - Full Stack Assignment

A production-minded product exploration platform that scrapes data from **World of Books** on-demand. Built with **NestJS**, **Next.js**, **MongoDB**, and **Playwright/Crawlee**.

## 🚀 Repositories
- **Github Repo:** [Your Repo Link Here]
- **Frontend URL:** http://localhost:3001 (Locally)
- **Backend URL:** http://localhost:3000 (Locally)

---

## 🛠 Tech Stack

### **Frontend**
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4)
- **Icons:** Lucide React

### **Backend**
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Scraping Engine:** Crawlee + Playwright (Headless Chromium)

---

## 🏃‍♂️ How to Run Locally

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally on port 27017)

### 1. Setup Backend
Open a terminal and run:
```bash
cd backend
npm install
npm run start:dev
```
The backend will start at `http://localhost:3000`.

### 2. Setup Frontend
Open a **new** terminal and run:
```bash
cd frontend
npm install
npm run dev -- -p 3001
```
The frontend will start at `http://localhost:3001`.

---

## 🕷️ How to Use (Scraping)
1. Open the frontend at `http://localhost:3001`.
2. Click **"Refresh Categories"** on the home page.
   - This triggers the backend to visit World of Books and scrape the menu.
3. Click on any **Category**.
4. Click **"Refresh Books"** on the category page.
   - This triggers a live scrape of products for that category.
   - You will see books appearing with Title, Price, and Image.

---

## 📂 Project Structure

```
/Assignment
  ├── backend/          # NestJS Server
  │   ├── src/
  │   │   ├── categories/  # Category Logic & Schema
  │   │   ├── products/    # Product Logic & Schema
  │   │   ├── scraping/    # Playwright Scraping Engine
  │   └── ...
  │
  ├── frontend/         # Next.js Client
  │   ├── app/
  │   │   ├── page.tsx          # Home Page
  │   │   ├── category/[slug]/  # Category Detail Page
  │   └── component/    # Shared UI Components
```

## 📝 API Endpoints

- `GET /categories`: List all categories
- `GET /products?category=slug`: List products by category
- `POST /scraping/categories`: Trigger category scraping
- `POST /scraping/products/:slug`: Trigger product scraping for a category

## ✅ Features Implemented
- [x] Full Stack Architecture (NestJS + Next.js)
- [x] MongoDB Database Integration
- [x] Live Scraping with Playwright (Crawlee)
- [x] On-Demand Data Refresh
- [x] Responsive UI with Tailwind CSS
- [x] "Premium" Design Aesthetics

---
*Created by Aradhy*
