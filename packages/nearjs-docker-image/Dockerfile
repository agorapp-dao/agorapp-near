FROM node:18-slim

WORKDIR /app

RUN npm install -g pnpm@8

# Install dependencies
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/nearjs-docker-image/package.json packages/nearjs-docker-image/
COPY packages/nearjs-mock/package.json packages/nearjs-mock/
COPY packages/runner-common/package.json packages/runner-common/
RUN pnpm install --frozen-lockfile --prod

# Copy the source code
COPY . .

WORKDIR /app/packages/nearjs-docker-image

RUN mkdir userspace && chown -R node:node userspace

USER node

ENV NODE_ENV production
CMD [ "../../node_modules/.bin/ts-node", "src/main.ts" ]

