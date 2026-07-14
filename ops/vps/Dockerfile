FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_APP_URL=https://mcbuleli.org
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
# NEXT_PUBLIC_* must be present at build time (inlined into the client bundle)
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY=
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL=https://live.mcbuleli.org
ENV NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL=$NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL
ARG NEXT_PUBLIC_ACADEMY_LIVE_EMBED=false
ENV NEXT_PUBLIC_ACADEMY_LIVE_EMBED=$NEXT_PUBLIC_ACADEMY_LIVE_EMBED
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
