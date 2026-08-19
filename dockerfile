FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package.json package-lock.json* yarn.lock* ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:20-alpine AS production

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package.json package-lock.json* yarn.lock* ./
RUN npm install --legacy-peer-deps --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /usr/src/app

USER nestjs

EXPOSE 3000
CMD ["node", "dist/main.js"]
