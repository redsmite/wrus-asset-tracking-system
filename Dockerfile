# Use Node.js Alpine image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy everything else
COPY . .

# Expose port and start server
EXPOSE 3000
CMD ["node", "server.js"]
