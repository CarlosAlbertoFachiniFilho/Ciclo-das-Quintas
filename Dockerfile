# --- ETAPA 1: Build Stage ---
FROM node:18-alpine AS builder

# Instala dependências necessárias
RUN apk add --no-cache git

# Define o diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências primeiro (melhor cache)
COPY package*.json ./

# Limpa cache do npm e instala dependências
RUN npm ci --only=production --silent

# Copia código fonte
COPY . .

# Build da aplicação
RUN npm run build

# --- ETAPA 2: Production Stage ---
FROM nginx:alpine

# Instala curl para health checks
RUN apk add --no-cache curl

# Copia configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Cria usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Ajusta permissões
RUN chown -R nextjs:nodejs /usr/share/nginx/html && \
    chown -R nextjs:nodejs /var/cache/nginx && \
    chown -R nextjs:nodejs /var/log/nginx && \
    chown -R nextjs:nodejs /etc/nginx/conf.d

# Cria diretórios necessários
RUN touch /var/run/nginx.pid && \
    chown -R nextjs:nodejs /var/run/nginx.pid

# Muda para usuário não-root
USER nextjs

# Expõe porta
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# Comando de inicialização
CMD ["nginx", "-g", "daemon off;"]