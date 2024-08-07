# Use an official Node runtime as a parent image
FROM node:22-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Ensure storages directory exists with correct permissions
RUN mkdir -p storages/uploads storages/logs && chmod -R 777 storages

# Create the symlink for uploads
RUN ln -s ../storages/uploads public/uploads

# Copy the rest of the application code
COPY . .

# Build TypeScript code
RUN npm run build

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
