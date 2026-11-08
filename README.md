# ApexTrack Enterprise — Feature Complete (Sprint 15)

[![Automated CI/CD Pipeline](https://github.com/TimeLineOfficial/sprint-15/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/TimeLineOfficial/sprint-15/actions/workflows/ci-cd.yml)
[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-blue)](https://nodejs.org/)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-6_Services-2496ED)](https://www.docker.com/)
[![NGINX Load Balancer](https://img.shields.io/badge/NGINX-least__conn-009639)](https://nginx.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

> **Engineering Directive: Sprint 15: Capstone Phase — Feature Complete**  
> **Associate Software Engineer:** Himesh Singh (`PDIT-FTE-11462`)  
> **Organization:** Prodesk IT  

---

## Executive Overview

**ApexTrack Enterprise** enters the **Feature Complete** stage. Following the architecture blueprint (Sprint 13) and walking skeleton (Sprint 14), Sprint 15 delivers:
1. **Phase 1: Core CRUD Execution (P0)**: Full interactive Create, Read, Update, and Delete operations for shipments and live telemetry streams.
2. **Phase 2: Role-Based Access Control (RBAC) (P0)**: Strict 3-tier authorization matrix (`ADMIN`, `DISPATCHER`, `VIEWER`) with violent 403 Forbidden rejections on unauthorized mutations.
3. **Phase 3: Advanced Load Balancing & Containerization (P0)**: Multi-instance containerization orchestrated via Docker Compose with an NGINX reverse proxy balancing traffic via `least_conn` across 3 backend nodes, PostgreSQL 16 database, and Redis 7 stream buffer.

---

## Production Deployment & Repository Links

* **GitHub Repository:** [https://github.com/TimeLineOfficial/sprint-15](https://github.com/TimeLineOfficial/sprint-15)
* **Live Production Edge Deployment:** [https://timelineofficial.github.io/sprint-15/](https://timelineofficial.github.io/sprint-15/)
* **Technical QA Walkthrough Video:** [https://youtu.be/vdJoz7cA2Sg](https://youtu.be/vdJoz7cA2Sg)

---

## Architecture Blueprint

```text
[ Client Web Portal (SPA) ]
            │
            ▼ (HTTP / Port 80)
┌────────────────────────────────────────────────────────┐
│           NGINX Reverse Proxy & Load Balancer          │
│            Algorithm: least_conn · Rate: 100 r/s       │
└────────────────────────────────────────────────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  backend-1   │     │  backend-2   │     │  backend-3   │
│  Port: 3001  │     │  Port: 3002  │     │  Port: 3003  │
│ Node 20 / API│     │ Node 20 / API│     │ Node 20 / API│
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       ├────────────────────┴────────────────────┤
       ▼                                         ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│  PostgreSQL 16 Database      │   │  Redis 7 Cache Cluster       │
│  Port: 5432 (3NF Relational) │   │  Port: 6379 (Ring Buffer)    │
└──────────────────────────────┘   └──────────────────────────────┘
```

---

## Role-Based Access Control (RBAC) Authorization Matrix

| Action / Capability | ADMIN (`admin_marcus`) | DISPATCHER (`dispatcher_elena`) | VIEWER (`auditor_guest`) |
| :--- | :---: | :---: | :---: |
| **`GET /api/shipments`** (Read Fleet) | <span style="color:green">✓ ALLOWED</span> | <span style="color:green">✓ ALLOWED</span> | <span style="color:green">✓ ALLOWED</span> |
| **`POST /api/shipments`** (Create/Dispatch) | <span style="color:green">✓ ALLOWED</span> | <span style="color:green">✓ ALLOWED</span> | <span style="color:red">✗ 403 FORBIDDEN</span> |
| **`PUT /api/shipments/:id`** (Edit Details) | <span style="color:green">✓ ALLOWED</span> | <span style="color:green">✓ ALLOWED</span> | <span style="color:red">✗ 403 FORBIDDEN</span> |
| **`PATCH /api/shipments/:id/status`** | <span style="color:green">✓ ALLOWED</span> | <span style="color:green">✓ ALLOWED</span> | <span style="color:red">✗ 403 FORBIDDEN</span> |
| **`DELETE /api/shipments/:id`** (Decommission) | <span style="color:green">✓ ELEVATED</span> | <span style="color:red">🔒 403 LOCKED</span> | <span style="color:red">✗ 403 FORBIDDEN</span> |
| **`POST /api/telemetry/ingest`** | <span style="color:green">✓ ALLOWED</span> | <span style="color:green">✓ ALLOWED</span> | <span style="color:red">✗ 403 FORBIDDEN</span> |
| **`DELETE /api/telemetry/buffer`** (Purge) | <span style="color:green">✓ ELEVATED</span> | <span style="color:red">🔒 403 LOCKED</span> | <span style="color:red">✗ 403 FORBIDDEN</span> |
| **`GET /api/audit/logs`** (Security Ledger) | <span style="color:green">✓ ELEVATED</span> | <span style="color:red">🔒 403 LOCKED</span> | <span style="color:red">✗ 403 FORBIDDEN</span> |

---

## Pre-Seeded Demonstration Identities

| Username | Password | Role | Description |
| :--- | :--- | :---: | :--- |
| `admin_marcus` | `admin123` | `ADMIN` | Chief Systems Admin (Full elevated mutations) |
| `fleet_director` | `director2026` | `ADMIN` | Executive Fleet Director |
| `dispatcher_elena` | `dispatch123` | `DISPATCHER` | Lead Dispatcher (Standard operational mutations) |
| `operator_sarah` | `operator123` | `DISPATCHER` | Desk Operator |
| `auditor_guest` | `guest123` | `VIEWER` | Third-party compliance auditor (Read-only) |

---

## Local Setup & Container Execution

### Option 1: Native Node.js Execution
```bash
# Install dependencies
npm install

# Run static quality audit
npm run lint

# Execute 16-test automated verification suite
npm test

# Start local server on port 3000
npm start
```

### Option 2: Full Docker Compose Mesh Execution
```bash
# Build and launch all 6 cluster containers in background
docker compose up -d --build

# View container cluster status
docker compose ps

# Follow NGINX and load-balanced backend logs
docker compose logs -f nginx-lb backend-1 backend-2 backend-3
```

---

## Automated CI/CD Pipeline

The `.github/workflows/ci-cd.yml` pipeline runs automatically on every push:
1. **Stage 1 (Lint)**: Static syntax and code quality checks across all JavaScript sources.
2. **Stage 2 (Test Gate)**: 16 unit tests verifying Phase 1 CRUD, Phase 2 RBAC matrices, and Phase 3 cluster health.
3. **Stage 3 (Package)**: Automated artifact packaging and production deployment.
