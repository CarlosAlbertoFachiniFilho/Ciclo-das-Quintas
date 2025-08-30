# Dockerfile

# Passo 1: Use uma imagem oficial e leve do Nginx como base.
# Nginx é um servidor web de alta performance, perfeito para servir arquivos estáticos.
FROM nginx:alpine

# Passo 2: Copie todos os arquivos do seu projeto local para a pasta pública do Nginx dentro do contêiner.
COPY . /usr/share/nginx/html

# Passo 3: Informe ao Docker que o contêiner escutará na porta 80.
EXPOSE 80

# Passo 4: O comando para iniciar o servidor Nginx quando o contêiner for executado.
CMD ["nginx", "-g", "daemon off;"]