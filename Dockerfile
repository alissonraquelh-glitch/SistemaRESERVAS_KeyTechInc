FROM node:22-bookworm-slim

WORKDIR /app

COPY src/package*.json ./src/
RUN npm ci --prefix src --omit=dev

COPY frontend/package*.json ./frontend/
RUN npm ci --prefix frontend --include=dev

COPY src/ ./src/
COPY frontend/ ./frontend/

RUN npm run build --prefix frontend

ENV NODE_ENV=production

CMD ["node", "src/app.js"]