FROM node:22-alpine

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with npm
RUN npm ci --omit=dev

# Copy the rest of the application
COPY server.js server_transport.js evaluator.js pte_scoring.js site_access.js ./
COPY database ./database
COPY content ./content
COPY public ./public

# A clean question bank is bundled with the image. Candidate data is never
# copied into the image; the template is copied to /data on first boot.
RUN node database/seed.js \
    && node database/generate_mock_bank.js \
    && node database/generate_mock_bank.js --verify-media \
    && mkdir -p bootstrap \
    && mv database/practice.db bootstrap/practice.db

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
