🧩 1. Project Overview

We’ll create a simple Node.js Express API and deploy it using Docker.

The pipeline will:

    1. Install dependencies
    2. Run tests
    3. Build a lightweight Alpine Docker image
    4. Push the image to GitLab’s Container Registry
    5. Deploy it (e.g., to your home server)



📁 2. Project Structure

```bash
nodejs-ci-demo/
├── src/
│   └── index.js
├── package.json
├── Dockerfile
├── .gitlab-ci.yml
└── .dockerignore
```

🧠 3. Example Code `src/index.js`

```js
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({ message: "Hello from Node.js CI/CD (Docker Alpine)!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

```

`package.json`

```js
{
  "name": "nodejs-ci-demo",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "test": "echo \"Running tests...\" && exit 0"
  },
  "dependencies": {
    "express": "^4.19.2"
  }
}

```


🐋 4. Dockerfile (Alpine-based)

This uses Alpine for a lightweight production image.

```Dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 3000
CMD ["node", "src/index.js"]
```


.dockerignore

```bash
node_modules
npm-debug.log
.git
.gitlab-ci.yml
Dockerfile
.dockerignore
```


⚙️ 5. GitLab CI/CD Configuration

Create `.gitlab-ci.yml` in the root:


```yml

stages:
  - test
  - build
  - deploy

variables:
  IMAGE_NAME: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA

before_script:
  - echo "Starting CI pipeline..."
  - echo "Using image: $IMAGE_NAME"

test:
  stage: test
  image: node:20-alpine
  script:
    - npm ci
    - npm test

build:
  stage: build
  image: docker:24.0.2
  services:
    - docker:dind
  variables:
    DOCKER_DRIVER: overlay2
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $IMAGE_NAME .
    - docker push $IMAGE_NAME
  only:
    - main
    - develop

deploy:
  stage: deploy
  image: alpine:latest
  script:
    - echo "Deploying to server..."
    - apk add --no-cache openssh-client
    - mkdir -p ~/.ssh
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - ssh -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "docker pull $IMAGE_NAME && docker stop nodejs-ci-demo || true && docker rm nodejs-ci-demo || true && docker run -d -p 3000:3000 --name nodejs-ci-demo $IMAGE_NAME"
  only:
    - main
```



🔐 6. Environment Variables in GitLab

Go to
GitLab → Settings → CI/CD → Variables
Add:

| Variable               | Description                              |
| ---------------------- | ---------------------------------------- |
| `SSH_PRIVATE_KEY`      | Your private SSH key (for server deploy) |
| `DEPLOY_USER`          | e.g., `ubuntu`                           |
| `DEPLOY_HOST`          | e.g., `172.168.2.1`                      |
| `CI_REGISTRY_USER`     | GitLab registry username                 |
| `CI_REGISTRY_PASSWORD` | GitLab registry password (token)         |


🧰 7. Run Locally (optional)

You can run locally to test:

```bash
docker build -t nodejs-ci-demo .
docker run -p 3000:3000 nodejs-ci-demo
```

Then visit:
👉 http://localhost:3000


🌐 8. Deploy on Your Home Server

On your home server (Ubuntu):

```bash
sudo apt update
sudo apt install docker.io -y
sudo systemctl enable docker
sudo systemctl start docker
```

Ensure your server allows SSH access and GitLab can connect (port 22 open).
Once the pipeline runs, it will automatically deploy the Docker container on your server.


✅ 9. Verify Deployment

On your home server `docker ps`


You should see a running container like:

```bash
CONTAINER ID   IMAGE                                      COMMAND                  STATUS         PORTS
2f0c1b2e1234   registry.gitlab.com/nodejs-ci-demo:abcd123   "node src/index.js"   Up 2 minutes   0.0.0.0:3000->3000/tcp
```

Now visit:

```bash
http://172.168.2.1:3000

🎉 You’ll see: {"message":"Hello from Node.js CI/CD (Docker Alpine)!"}

```

🚀 10. Optional: Nginx Reverse Proxy

If you’re using Nginx to serve multiple services:

```bash
server {
  listen 80;
  server_name api.domain.net;

  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
```


Then reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx

```