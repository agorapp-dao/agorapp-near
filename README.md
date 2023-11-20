# AgorApp Near

This is a monorepo containing packages that add support for Near Blockchain to [agorapp.dev](https://agorapp.dev/)

## Quick Start

```bash
# Install dependencies
pnpm install

# Start dev-editor
cd dev-editor
pnpm run dev

# Build docker image for Near runner
cd packages/nearjs-docker-runner
pnpm run docker-build

# Run docker runner to use the image built in the previous step
cd packages/docker-runner
pnpm run dev
```
