FROM node:22-bullseye-slim

# Set environment to production
ENV NODE_ENV=production

# Install necessary system dependencies for PDF and Image processing
RUN apt-get update && apt-get install -y \
    ghostscript \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

# Fix ImageMagick policy to allow PDF processing
RUN sed -i 's/rights="none" pattern="PDF"/rights="read|write" pattern="PDF"/' /etc/ImageMagick-6/policy.xml

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --production=false

# Copy application files
COPY . .

# Build the Vite frontend and Express server
RUN npm run build

# Expose the required port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
