# syntax=docker/dockerfile:1
FROM node:20-bullseye-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production=false

FROM node:20-bullseye-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:20-bullseye-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY prisma ./prisma
COPY package.json ./package.json
COPY start.sh ./start.sh
RUN chmod +x ./start.sh
EXPOSE 4000
CMD ["./start.sh"]
