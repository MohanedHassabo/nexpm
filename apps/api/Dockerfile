FROM node:24-alpine AS build
WORKDIR /work
COPY package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm install --workspace @nexpm/api --include-workspace-root
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY apps/api/src ./apps/api/src
RUN npm run build --workspace @nexpm/api
FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /work
COPY --from=build /work/node_modules ./node_modules
COPY --from=build /work/apps/api/dist ./apps/api/dist
COPY apps/api/package.json ./apps/api/package.json
USER node
EXPOSE 4000
CMD ["node","apps/api/dist/server.js"]
