# --- BUILD STAGE ---
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- PRODUCTION STAGE ---
FROM nginx:alpine

# Copia os arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração mínima do Nginx
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]