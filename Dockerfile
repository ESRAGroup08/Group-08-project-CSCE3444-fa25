# Stage 1: The Builder
FROM node:18 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
# We can remove this ls command, it's not needed for the build
# RUN ls -l src 
RUN npm run build

# Stage 2: The Runner
FROM node:18-slim
WORKDIR /app
# Copy the server's package files first
COPY server/package.json server/package-lock.json ./server/
WORKDIR /app/server
# Install server dependencies
RUN npm install --production
# --- THIS IS THE FIX ---
# Copy ALL files from the local 'server' directory into the container's '/app/server' directory
COPY server/ ./ 
# --- END OF FIX ---
WORKDIR /app
# Copy the built React app from the builder stage
COPY --from=builder /app/dist ./dist
# Set the command to run the server
CMD ["node", "server/server.js"]