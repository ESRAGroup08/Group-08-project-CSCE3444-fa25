# Stage 1: Build the React frontend
FROM node:18 AS build

WORKDIR /app

# Copy frontend package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend source code
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Create the production image
FROM node:18-alpine

WORKDIR /app

# Copy server package files and install production dependencies
COPY server/package*.json server/
RUN cd server && npm install --production

# Copy the server code
COPY server/server.js server/

# Copy the built frontend from the build stage
COPY --from=build /app/dist dist/

# Expose the port the app runs on
EXPOSE 3000

# Command to run the server
CMD ["node", "server/server.js"]
