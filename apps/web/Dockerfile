FROM node:24-alpine AS build
WORKDIR /work
COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm install --workspace @nexpm/web --include-workspace-root
COPY apps/web ./apps/web
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace @nexpm/web
FROM nginx:1.27-alpine
COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /work/apps/web/dist /usr/share/nginx/html
EXPOSE 80
