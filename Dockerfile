FROM oven/bun:1 AS build

WORKDIR /app

# @nuxt/content v3 pulls in better-sqlite3 (a native module) for its build-time
# content DB; oven/bun has no C/C++ toolchain, so install one to compile it.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run generate

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.output/public /usr/share/nginx/html
RUN printf 'ok\n' > /usr/share/nginx/html/up

EXPOSE 80

