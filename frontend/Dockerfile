# Multi-stage build for production
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Install openssl for certificate generation
RUN apk add --no-cache openssl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy certificate generation script
COPY generate-certs.sh /usr/local/bin/generate-certs.sh
RUN chmod +x /usr/local/bin/generate-certs.sh

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Set proper permissions for nginx
RUN chown -R nginx:nginx /usr/share/nginx/html

# Generate self-signed certificate
RUN /usr/local/bin/generate-certs.sh

# Expose ports
EXPOSE 80 443

# Health check (using HTTPS)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-check-certificate --no-verbose --tries=1 --spider https://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
