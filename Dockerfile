# Stage 1: The Builder
FROM node:18 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: The Runner
FROM node:18-slim
WORKDIR /app
COPY server/package.json server/package-lock.json ./server/
WORKDIR /app/server
RUN npm install --production
COPY server/server.js ./
WORKDIR /app
COPY --from=builder /app/dist ./dist
CMD ["node", "server/server.js"]
