FROM node:22.16.0-slim AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

FROM node:22.16.0-slim
RUN npm install pm2 -g
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --silent && \
    npm cache clean --force
COPY --from=builder /app/dist ./
COPY --from=builder /app/public ./public
RUN mkdir -p upload/image upload/document upload/video public && \
    chown -R node:node /app && \
    chmod -R 755 /app/upload /app/public
USER node
EXPOSE 3200
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3200/health || exit 1

CMD ["pm2-runtime", "start", "index.js", "--name", "filer-service", "--max-memory-restart", "400M"]