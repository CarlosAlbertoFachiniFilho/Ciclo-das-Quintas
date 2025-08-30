# --- BUILD STAGE ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala todas as dependências (dev + prod)
RUN npm install

# Copia código fonte
COPY . .

# Build da aplicação
RUN npm run build

# --- PRODUCTION STAGE ---
FROM nginx:alpine

# Copia configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe porta
EXPOSE 80

# Inicia Nginx
CMD ["nginx", "-g", "daemon off;"]