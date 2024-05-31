# nearjs-docker-image

This package produces Docker image that is then used by `docker-runner` to run user-submitted code.

To test this locally do the following:

```bash
# Build the image
cd packages/nearjs-docker-image
pnpm docker-build

# Start the docker-runner
cd ../docker-runner
pnpm dev

# Start dev-editor and navigate to the course
```
