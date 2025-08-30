# --- BUILD STAGE ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala todas as dependências
RUN npm install

# Copia código fonte
COPY . .

# Build da aplicação
RUN npm run build

# --- PRODUCTION STAGE ---
FROM nginx:alpine

# Remove configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia nossa configuração
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe porta 3000 (padrão Coolify)
EXPOSE 3000

# Inicia Nginx
CMD ["nginx", "-g", "daemon off;"]