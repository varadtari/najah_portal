# Builds the portal and serves it as static files. The device setup address shown in
# Settings → Devices is fixed at build time.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_ADMS_SERVER=""
ARG VITE_ADMS_PORT="8081"
ENV VITE_ADMS_SERVER=$VITE_ADMS_SERVER VITE_ADMS_PORT=$VITE_ADMS_PORT
RUN npm run build

FROM caddy:2.10-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
