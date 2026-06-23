# TalentDash — Next-Generation Compensation Intelligence & Analytics Platform

TalentDash is a high-performance, edge-ready compensation intelligence engine designed to provide transparent, reliable, and granular salary comparisons across the tech industry. It bridges the gap between structured compensation data, leveling standards, and interactive workplace analytics.

---

## 🚀 Key Features

*   **Universal Compensation Search & Filter Matrix (`/compensation`)**: A multi-dimensional exploratory grid filtering salary records by company, title, location, and experience.
*   **Interactive Company Comparison Tool (`/compare`)**: Compare salary bands, base-to-equity splits, and benefits side-by-side between multiple target employers.
*   **Granular Company Explorer Profiles (`/companies/[slug]`)**: Aggregated profiles showing average total compensations, rating breakdowns, and salary distribution matrices.
*   **Normalized Leveling Matrix (`/levels`)**: Standardized career tier mappings across major tech employers (e.g., L5 Google ⇄ ICT4 Apple).
*   **Structured "Give-to-Get" Submission Flow (`/submit`)**: Safe contribution workflow with input normalization and deduplication safeguards to maintain database integrity.
*   **Dynamic Analytics Dashboard (`/overview`)**: Central dashboard containing personal market value benchmarking trackers and a live recent submission ticker.

---

## 🛠️ Technology Stack

*   **Framework**: Next.js 15+ (App Router)
*   **Database ORM**: Prisma with PostgreSQL
*   **Deployment Target**: Cloudflare Pages / Vercel Edge Runtime compatibility
*   **Caching & Queueing**: Upstash Redis & BullMQ
*   **Validation**: Zod (strict API contract boundaries)
*   **Styling**: Vanilla CSS (CSS Modules for isolated layout scopes)

---

## 📐 Architecture & Performance Decisions

### 1. Prisma Schema Design & Indexing
The database schema (`prisma/schema.prisma`) is engineered to support fast search aggregations and prevent duplicate spam:
*   **Optional User Association**: The `userId` column on `compensation_records` is marked optional (`userId String? @map("user_id")`) to support both registered and guest submissions without blocking auth boundaries.
*   **Deduplication Constraint**: A unique index `hash_dedup` is implemented representing a SHA-256 hash of the submission payload. This prevents double-submission of identical data at the database level.
*   **Composite Index Placements**:
    *   `@@index([companyId, level, location])`: Speeds up filtering and median compensation aggregations (`percentile_cont(0.5)`) for company profile pages.
    *   `@@index([totalCompensation])`: Speeds up percentile sorting and range filters on the search grid.
    *   `@@index([submittedAt])`: Speeds up time-based lookups and live dashboard ticker updates.

### 2. Caching Strategy & TTLs
To maintain sub-100ms response speeds and protect database capacity under load, caching is configured at multiple levels:
*   **Median Compensation Cache (TTL: 5 Minutes / 300s)**: Configured on the company intelligence views. This TTL strikes an optimal balance between database performance (avoiding expensive `$queryRaw` median calculations on every refresh) and fresh data visibility.
*   **Salaries Pagination Cache (TTL: 1 Minute / 60s)**: Cache for paginated table feeds.
*   **User Display Currency Cache (TTL: 365 Days)**: Stored in a persistent browser cookie (`currency`). Because display currency is a personal preference, caching it in cookies allows both client-side and server-side components to read the preference instantly without database query overhead.

### 3. Hybrid Prisma Driver Adapter
To guarantee that the application can run in local environments (TCP pools) as well as production edge environments (Cloudflare Pages serverless pools), we implemented a dynamic client generator:
*   **Local (localhost)**: Uses `@prisma/adapter-pg` + standard `pg` pools.
*   **Edge (Cloudflare Pages / Neon)**: Uses `@prisma/adapter-neon` + `@neondatabase/serverless` over WebSockets.

### 4. Data Ingestion & Deduplication Pipeline
*   **Sanitization**: Standardizes and normalizes input names (e.g., trimming whitespace, removing legal suffixes like "Inc." or "Llc").
*   **Zod Validation**: Enforces strict boundaries (positive base salary, valid ranges for experience) and strictly maps input levels to schema enums.
*   **48-Hour Duplication Window**: Queries for similar records (same company, level, location, and base salary within 10%) submitted in the last 48 hours. Returns `409 Conflict` on duplicates.

---

## ⚙️ Getting Started

### Local Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/vansh-shende/Talentdash.git
    cd Talentdash
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    DATABASE_URL="postgresql://username:password@localhost:5420/talentdash"
    DIRECT_URL="postgresql://username:password@localhost:5420/talentdash"
    UPSTASH_REDIS_REST_URL="https://your-upstash-redis-url"
    UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
    ```

4.  **Push the Database Schema**:
    ```bash
    npx prisma db push --accept-data-loss
    ```

5.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

### Seeding Authentic Tech Compensation Data
To seed the database with 36 authentic tech compensation packages (Google, Meta, Amazon, Stripe, Apple, Netflix, Uber) mapped to correct schema levels, navigate to the following endpoint after starting the server:
```
http://localhost:3000/api/seed
```
