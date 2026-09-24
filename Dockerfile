FROM oven/bun:1.4.2 AS bun
FROM node:25-bookworm AS build

COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

# Bun installs the lockfile; Node runs Nuxt with a bounded build heap.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN NODE_OPTIONS=--max-old-space-size=1536 bun run generate

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.output/public /usr/share/nginx/html
RUN printf 'ok\n' > /usr/share/nginx/html/up

# Grid admits only an image whose revision label equals the source commit it
# built. Declared last so it never invalidates the build layers above.
ARG SOURCE_REVISION
LABEL org.opencontainers.image.revision="${SOURCE_REVISION}"

EXPOSE 80
