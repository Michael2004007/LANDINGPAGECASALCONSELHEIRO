FROM node:22-alpine
WORKDIR /app
COPY package.json server.mjs ./
COPY dist ./dist
ENV NODE_ENV=production
CMD ["node", "server.mjs"]
