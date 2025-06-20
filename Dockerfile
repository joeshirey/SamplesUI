# --- Build Stage ---
# Use a full Node.js image to build the application
FROM node:20 AS build

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# --- Production Stage ---
# Use a minimal, more secure base image for the final container
FROM node:20-slim

# Set the working directory
WORKDIR /usr/src/app

# Create a non-root user to run the application
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Copy built artifacts and dependencies from the build stage
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/server.js ./server.js
COPY --from=build /usr/src/app/web ./web

# Switch to the non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 8080

# Define the command to run your app
CMD [ "node", "server.js" ]
