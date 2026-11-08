# Engineering Prompts Log: Sprint 15 (Feature Complete)

**Associate Software Engineer:** Himesh Singh (PDIT-FTE-11462)  
**Track:** Full-Time Associate Software Engineering (Portal FTEWSVE)  
**Project:** ApexTrack Enterprise — Feature Complete (Sprint 15)  

---

## 1. Directive Breakdown & Architecture Prompt
```text
Role: Principal Systems Architect & Lead Backend Engineer
Context: Prodesk IT Capstone Phase - Sprint 15: Feature Complete
Directives:
1. Phase 1: Core CRUD Execution - Connect frontend routes to backend controllers with real-time state mutations (Create, Read, Update, Delete for shipments and IoT telemetry frames).
2. Phase 2: Role-Based Access Control (RBAC) - Implement strict authorization matrices. Elevated mutation privileges for 'Admin', violent 403 Forbidden rejections for unauthorized 'Dispatcher' and 'Viewer' callers.
3. Phase 3: Advanced Load Balancing & Containerization - Wrap application in Docker containers, orchestrate frontend, 3 backend nodes, Postgres DB, and Redis cache via Docker Compose. Implement NGINX reverse proxy with least_conn load balancing.
4. Edge Deployment: Zero-config Express serverless on Vercel and GitHub Pages.
```

## 2. Core CRUD & Model Layer Prompt
```text
Task: Author Enterprise Database Model (src/models/db.js) with 3NF relational normalization protocols.
Requirements:
- Shipments store: Create, Read (multi-filter search), Update (field & status transitions), Delete (Admin only).
- Telemetry store: Real-time sensor frame ingestion, cold-chain thermal breach detection, and admin buffer purge.
- Audit ledger: Chronological recording of every mutation, security breach, and status change.
```

## 3. RBAC & Security Perimeter Prompt
```text
Task: Author RBAC middleware (src/middleware/authMiddleware.js) and Auth Controller (src/controllers/authController.js).
Requirements:
- Validate signed JWT Bearer tokens with HMAC-SHA256.
- Violent HTTP 401 rejection for missing or malformed tokens.
- Violent HTTP 403 rejection for tampered tokens or role authorization failures.
- Enforce requireRole(['ADMIN']) on deletion, telemetry buffer purging, and audit log access.
```

## 4. NGINX & Docker Compose Orchestration Prompt
```text
Task: Write Dockerfile and docker-compose.yml orchestrating:
- NGINX 1.25 Alpine reverse proxy with least_conn load balancing across 3 backend replicas.
- Backend cluster instances (node-backend-1, node-backend-2, node-backend-3).
- PostgreSQL 16 database container with volume persistence and healthcheck.
- Redis 7 cache container for telemetry buffering.
- Dedicated bridge network 'apextrack-mesh'.
```

## 5. Automated CI/CD & Test Gate Prompt
```text
Task: Author .github/workflows/ci-cd.yml and node:test suites (16 tests).
Requirements:
- 100% pass rate in <250ms with zero flaky dependencies.
- Lint stage (lint.js) -> Test stage (tests/*.test.js) -> Production packaging stage.
```
