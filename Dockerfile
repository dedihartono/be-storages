# Use the official Node.js 22 Alpine image as the base
FROM node:22-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Create the necessary directories for logs and uploads
RUN mkdir -p /app/storages/logs /app/storages/uploads

# Create a symbolic link 'public' that points to 'storages/uploads'
# RUN ln -s /app/storages/uploads /app/public/storages/uploads

# Build the TypeScript code
RUN npm run build

# Expose the port on which the app will run
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
