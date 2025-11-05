FROM node:20-alpine

RUN apk add --no-cache \
    chromium nss freetype harfbuzz ca-certificates ttf-freefont nodejs

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /usr/src/app

COPY package*.json ./
RUN apk add --no-cache curl
RUN npm install --legacy-peer-deps

COPY . .

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /usr/src/app
USER nestjs

RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:dev"]
