FROM node:22.13-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
ARG VITE_CONVEX_URL
ARG GIT_SHA=unknown
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL
ENV GIT_SHA=$GIT_SHA
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["npm", "run", "start"]
