FROM node:22-alpine

ENV NODE_ENV=production
ENV PORT=3001
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node . .

USER node
EXPOSE 3001

CMD ["npm", "start"]