# Stage 1: The Builder
FROM node:18 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN ls -l src
RUN npm run build

# Stage 2: The Runner
FROM node:18-slim
WORKDIR /app
COPY server/package.json server/package-lock.json ./server/
WORKDIR /app/server
RUN npm ci --only=production
WORKDIR /app
COPY server/ ./server/
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server/server.js"]
