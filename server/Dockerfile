# Use the official Node.js 20 slim image for a smaller footprint
FROM node:20-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy the rest of the server source code
# This includes the 'dist' folder which you specified is already present
COPY . .

# Cloud Run automatically sets the PORT environment variable
ENV PORT=8080
EXPOSE 8080

# Start the server using the start script defined in server/package.json
CMD [ "npm", "start" ]