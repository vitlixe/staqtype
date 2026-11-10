# Stage 1: build the static bundle. It is the same for every CPU, so it
# runs on the builder's own platform even for multi-arch images.
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Files must be world-readable: nginx below does not run as root.
RUN npm run build && chmod -R a+rX dist

# Stage 2: serve it with nginx as a non-root user.
FROM nginxinc/nginx-unprivileged:1.27-alpine
# Replace the base image's labels; CI adds version, revision and date.
LABEL org.opencontainers.image.title="staqtype" \
      org.opencontainers.image.description="Self-hosted typing trainer for real code" \
      org.opencontainers.image.source="https://github.com/vitlixe/staqtype" \
      org.opencontainers.image.url="https://github.com/vitlixe/staqtype" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="" \
      org.opencontainers.image.revision="" \
      org.opencontainers.image.created="" \
      maintainer=""
COPY --chmod=644 nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --chmod=644 VERSION /usr/share/nginx/html/VERSION
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --start-interval=2s \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
