# This Dockerfile builds the Auth service stub (Node 18 + Fastify).

FROM node:18-slim AS deps
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --omit=dev

FROM node:18-slim AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package.json ./package.json
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY index.js ./index.js
EXPOSE 3001
CMD ["node", "index.js"]

