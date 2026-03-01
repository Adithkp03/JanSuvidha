# Multi-stage production build for JanSuvidha Portal
# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies purely based on package files
COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# Build Vite application for production
RUN npm run build

# Serve Stage
FROM nginx:alpine

# Copy custom nginx config if needed (e.g. for SPA routing fallback)
RUN echo "server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files \$uri \$uri/ /index.html; \
    } \
    }" > /etc/nginx/conf.d/default.conf

# Copy build artifacts to nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
