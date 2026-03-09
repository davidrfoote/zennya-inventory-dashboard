FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG INVENTORY_API_TOKEN=82mt8gieli78lk8o53neehiicb30cmqo
ARG INVENTORY_API_BASE=https://api-inventory.zennya.com
ENV INVENTORY_API_TOKEN=$INVENTORY_API_TOKEN
ENV INVENTORY_API_BASE=$INVENTORY_API_BASE
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV INVENTORY_API_TOKEN=82mt8gieli78lk8o53neehiicb30cmqo
ENV INVENTORY_API_BASE=https://api-inventory.zennya.com
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN mkdir -p ./public
EXPOSE 3001
CMD ["node", "server.js"]
