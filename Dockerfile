# Stage 1: The Builder
# --- UPDATED to use Node.js v20 ---
FROM node:20 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: The Runner
# --- UPDATED to use Node.js v20 ---
FROM node:20-slim
WORKDIR /app
# Copy the server's package files first
COPY server/package.json server/package-lock.json ./server/
WORKDIR /app/server
# Install server dependencies
RUN npm install --production
# Copy ALL files from the local 'server' directory into the container's '/app/server' directory
COPY server/ ./ 
WORKDIR /app
# Copy the built React app from the builder stage
COPY --from=builder /app/dist ./dist
# Set the command to run the server
CMD ["node", "server/server.js"]