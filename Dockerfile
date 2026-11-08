# Multi-stage Production Dockerfile for ApexTrack Enterprise Backend
# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Runtime Container
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Non-root secure application user
RUN addgroup -g 1001 -S nodejs && adduser -S apextrack -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY server.js index.js ./
COPY src/ ./src/
COPY public/ ./public/

USER apextrack

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
