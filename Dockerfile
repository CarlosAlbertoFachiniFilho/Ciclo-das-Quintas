# Dockerfile

# --- ETAPA 1: Construir o Aplicativo (Build Stage) ---
# Usamos uma imagem leve do Node.js para a etapa de construção
FROM node:18-alpine AS builder

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia o package.json e instala as dependências
# Isso é feito primeiro para aproveitar o cache do Docker
COPY package.json ./
RUN npm install

# Copia todo o resto do código do nosso projeto
COPY . .

# Executa o script de build do Vite
RUN npm run build

# O resultado será uma pasta /app/dist com os arquivos estáticos

# --- ETAPA 2: Servir o Aplicativo (Serve Stage) ---
# Usamos uma imagem oficial e super leve do Nginx para servir os arquivos
FROM nginx:alpine

# Copia a configuração personalizada do Nginx que criamos
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos estáticos construídos na Etapa 1 para a pasta pública do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe a porta 80, que é a porta padrão do Nginx
EXPOSE 80

# Comando para iniciar o servidor Nginx quando o contêiner for executado
CMD ["nginx", "-g", "daemon off;"]