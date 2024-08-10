# Use an official Node runtime as a parent image
FROM node:22-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Ensure storages directory exists with correct permissions
RUN mkdir -p /src/app/storages/uploads && \
    mkdir -p /src/app/storages/logs && \
    chmod -R 777 /src/app/storages/uploads && \
    chmod -R 777 /src/app/storages/logs

# Create the public directory and symlink
RUN mkdir -p public && ln -s ../storages/uploads public/uploads

# Copy the rest of the application code
COPY . .

# Change ownership of the application directory to the node user
RUN chown -R 1000:1000 /usr/src/app

# Build TypeScript code
RUN npm run build

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
