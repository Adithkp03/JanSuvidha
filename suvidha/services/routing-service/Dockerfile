# This Dockerfile builds the routing service consumer stub (Node 18).

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
COPY healthcheck.js ./healthcheck.js
CMD ["node", "index.js"]

