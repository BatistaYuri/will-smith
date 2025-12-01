FROM node:18-alpine

# Instala ffmpeg para áudio
RUN apk add --no-cache ffmpeg

WORKDIR /usr/app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências de produção
RUN npm ci --only=production

# Copia o resto do código
COPY . .

# Expõe a porta para o Render
EXPOSE 10000

# Comando para iniciar o bot
CMD ["npm", "start"]
