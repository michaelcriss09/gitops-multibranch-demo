# BUILDER
FROM node:20-alpine AS BUILDER
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# RUNTIME
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=BUILDER /app/dist ./dist


# SECURITY
RUN adduser -D -H runner && \
    chown -R runner:runner /app 

USER runner

EXPOSE 3000

CMD ["node", "dist/index.js"]

