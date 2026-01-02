# CI/CD Pipline

Prerequisites:
    - GitLab instance (self-hosted or GitLab.com)
    - Server/VPS with real IP
    - Docker installed on your homelab machine

✅ Set up a CI/CD pipeline (Continuous Integration & Deployment)
✅ Use Docker (Alpine-based images)
✅ Use Jenkins and Dozzle (for log viewing)
✅ Deploy a NestJS project on that server

Let’s go step-by-step.

🧩 Overview

We’ll achieve this setup:

```bash
+--------------------------+
|   Developer Laptop       |
|--------------------------|
| git push to GitLab/GitHub|
+------------+-------------+
             |
             v
+-----------------------------+
|  Home Server (172.168.2.1) |
|-----------------------------|
| Ubuntu 22.04 (example)      |
| Docker + Docker Compose     |
| Jenkins (CI/CD)             |
| Dozzle (Logs Viewer)        |
| NestJS App (in container)   |
| Nginx Reverse Proxy         |
+-----------------------------+

```

## ⚙️ 1. Basic Prerequisites

Run these once on your Ubuntu server:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install git curl ufw -y
```

Set the timezone (optional):

```bash
sudo timedatectl set-timezone Asia/Dhaka

```

## 🐳 2. Install Docker & Docker Compose

```bash
sudo apt install ca-certificates curl gnupg lsb-release -y
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y


```

Enable Docker to start automatically:

```bash
sudo systemctl enable docker
sudo systemctl start docker

```

Check version:

```bash
docker --version
docker compose version
```


## 🔐 3. Set Up Firewall (UFW)

Allow SSH, HTTP, HTTPS, Jenkins (8080), and Dozzle (9999):

```bash
sudo ufw allow OpenSSH     # ssh
sudo ufw allow 80/tcp      # web
sudo ufw allow 443/tcp     # SSL
sudo ufw allow 8080/tcp    #Jenkin
sudo ufw allow 9999/tcp    # Dozzl

sudo ufw allow 5432/tcp    # PostgreSQL
sudo ufw allow 5001/tcp    # API Gateway
sudo ufw allow 5002/tcp    # Engine Service
sudo ufw allow 5003/tcp    # POS Service
sudo ufw enable

```



## 🧱 4. Create Project Folder Structure

Example:

```bash
/srv/
 └── ci-cd/
     ├── jenkins/
     ├── dozzle/
     ├── nestjs-app/
     └── docker-compose.yml

```


## 🐋 5. Create docker-compose.yml

Here’s a ready-to-use Docker Compose setup:

```bash
version: '3.8'

services:
  jenkins:
    image: jenkins/jenkins:lts-alpine
    container_name: jenkins
    user: root
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - ./jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - JAVA_OPTS=-Djenkins.install.runSetupWizard=false
    restart: unless-stopped

  dozzle:
    image: amir20/dozzle:latest
    container_name: dozzle
    ports:
      - "9999:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped

  nestjs:
    build: ./nestjs-app
    container_name: nestjs
    ports:
      - "5001:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped

```

## 🚀 6. NestJS Dockerfile (Inside /srv/ci-cd/nestjs-app)


```dockerfile
# Stage 1 - Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2 - Run
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev
EXPOSE 3000
CMD ["node", "dist/main.js"]

```


## ⚡ 7. Bring Everything Up

```bash
cd /srv/ci-cd
sudo docker compose up -d
```

Check status:

```bash
sudo docker ps

```
## 🧠 8. Access Services

| Service    | URL                                                  | Notes               |
| ---------- | ---------------------------------------------------- | ------------------- |
| Jenkins    | [http://172.168.2.1:8080](http://172.168.2.1:8080) | CI/CD Server        |
| Dozzle     | [http://172.168.2.1:9999](http://172.168.2.1:9999) | Live container logs |
| NestJS App | [http://172.168.2.1:5001](http://172.168.2.1:5001) | Your API            |


## 🔑 9. Jenkins Initial Setup

Get the password:

```bash
sudo docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

```

Then visit `http://172.168.2.1:8080`

    → Install recommended plugins
    → Create an admin user

## 🔧 10. Jenkins Docker Integration

To allow Jenkins to run Docker builds, make sure it can access the Docker socket (already mapped).
In Jenkins Dashboard:

* Install “Docker Pipeline” plugin
* Install “Git” plugin


## 🧩 11. Jenkins Pipeline (for NestJS)

Create a file in your NestJS project root:

`Jenkinsfile`

```groovy
pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        git branch: 'main', url: 'https://your-repo-url.git'
      }
    }

    stage('Build Docker Image') {
      steps {
        sh 'docker build -t nestjs-app:latest .'
      }
    }

    stage('Deploy') {
      steps {
        sh '''
          docker stop nestjs || true
          docker rm nestjs || true
          docker run -d --name nestjs -p 5001:3000 nestjs-app:latest
        '''
      }
    }
  }
}

```

This pipeline will:

    * Pull your code
    * Build the Docker image
    * Redeploy your container


## 🔁 12. Optional: Auto Deploy from Git Push

You can connect Jenkins with your `GitHub/GitLab` Webhook:

    * Go to your repo → Settings → Webhooks → Add Webhook
    * Payload URL: http://172.168.2.1:8080/github-webhook/
    * Content type: application/json
    * Trigger: “Just the push event”

Then Jenkins will trigger automatically on every push.


📜 13. Add Reverse Proxy (Optional but Recommended)

If you want to access via domain (e.g., `api.domain.net`):

Create `/etc/nginx/sites-available/api.domain.net`:


```nginx
server {
    listen 80;
    server_name api.domain.net;

    location / {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
Enable and restart:


```bash
sudo ln -s /etc/nginx/sites-available/api.domain.net /etc/nginx/sites-enabled/
sudo systemctl restart nginx

```
Then configure Cloudflare to point `api.domain.net` → your public IP `172.168.2.1`.


## 🔎 14. View Logs via Dozzle

Go to →
👉 `http://172.168.2.1:9999`
and you’ll see all your container logs live.


## ✅ Final Summary

| Component | Purpose               | Port     |
| --------- | --------------------- | -------- |
| Jenkins   | CI/CD automation      | 8080     |
| NestJS    | App service           | 5001     |
| Dozzle    | Container logs viewer | 9999     |
| Nginx     | Reverse proxy         | 80 / 443 |


________________________________________________________________________________________________________________________


## 🧩 1. Projects Explanitation

Each project should have:

    * Its own Docker container
    * Its own Jenkins pipeline
    * Its own port or Nginx domain

That means your docker-compose.yml (or Jenkins pipeline) only deals with that one project.
You’ll have multiple containers running side-by-side — Docker isolates them.

✅ Example running all together:

```bash
nestjs-api       → port 5001
api-gateway      → port 5002
frontend         → port 5003
```

Each one runs independently.

## ⚙️ 2. Recommended Folder Structure

Organize your projects like this:

```bash
/srv/ci-cd/
├── jenkins/
├── dozzle/
├── api-gateway/
│   ├── Dockerfile
│   ├── Jenkinsfile
│   └── ...
├── nestjs-api/
│   ├── Dockerfile
│   ├── Jenkinsfile
│   └── ...
├── frontend/
│   ├── Dockerfile
│   ├── Jenkinsfile
│   └── ...
└── docker-compose.yml   ← optional for infra only (jenkins + dozzle)
```
This way, Jenkins runs pipelines per project, not globally.

## 🚀 3. Each Project Gets Its Own Jenkins Pipeline

In Jenkins:

    * Create a separate job for each repo.
    * Each repo has its own Jenkinsfile and its own build instructions.

Example for `api-gateway` Jenkinsfile:

```bash
pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        git branch: 'main', url: 'https://gitlab.com/dev.domain/api-gateway.git'
      }
    }

    stage('Build Docker Image') {
      steps {
        sh 'docker build -t api-gateway:latest .'
      }
    }

    stage('Deploy') {
      steps {
        sh '''
          docker stop api-gateway || true
          docker rm api-gateway || true
          docker run -d --name api-gateway -p 5002:3000 api-gateway:latest
        '''
      }
    }
  }
}
```

✅ That deploys only the API Gateway container.

Your other projects (nestjs-api, frontend, etc.) keep running.


## 🧠 4. Auto-deploy per Repository

Set up individual Git webhooks for each repository.

| Repo        | Webhook URL                                | Trigger      | Jenkins Job |
| ----------- | ------------------------------------------ | ------------ | ----------- |
| api-gateway | `http://172.168.2.1:8080/gitlab-webhook/` | Push to main | API Gateway |
| nestjs-api  | `http://172.168.2.1:8080/gitlab-webhook/` | Push to main | NestJS API  |
| frontend    | `http://172.168.2.1:8080/gitlab-webhook/` | Push to main | Frontend    |

Each push will trigger only its own pipeline.



## 🐳 5. Use Different Containers / Ports

Each project runs as its own container with unique ports:

```bash
docker run -d --name api-gateway -p 5002:3000 api-gateway:latest
docker run -d --name nestjs-api  -p 5001:3000 nestjs-api:latest
docker run -d --name frontend    -p 5003:3000 frontend:latest
```

They coexist perfectly.
You can verify with:

```bash
sudo docker ps
```

## 🌐 6. Add Nginx Reverse Proxy (Per Project)

Example for api.domain.net:

```bash
server {
  listen 80;
  server_name api.domain.net;

  location / {
    proxy_pass http://localhost:5001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}

```


Example for `gateway.domain.net`:

```bash
server {
  listen 80;
  server_name gateway.domain.net;

  location / {
    proxy_pass http://localhost:5002;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}

```

You can repeat that pattern for as many apps as you need.

## 🪄 7. (Optional) Use Shared Docker Network

If you want to use internal service communication:

```bash
docker network create domain-net

```

Then when you run containers:

```bash
docker run -d --name nestjs-api --network domain-net -p 5001:3000 nestjs-api:latest
docker run -d --name api-gateway --network domain-net -p 5002:3000 api-gateway:latest
```

Then api-gateway can call `http://nestjs-api:3000` internally.

## ✅ 8. Final CI/CD Behavior Summary

| Action                     | What Happens                                                      |
| -------------------------- | ----------------------------------------------------------------- |
| Push to `nestjs-api` main  | Jenkins rebuilds and redeploys **only** the NestJS API container  |
| Push to `api-gateway` main | Jenkins rebuilds and redeploys **only** the API Gateway container |
| Push to `frontend` main    | Jenkins rebuilds and redeploys **only** the Frontend container    |
| Restart server             | Jenkins, Dozzle, and all containers start automatically           |
| View logs                  | Go to `http://172.168.2.1:9999` (Dozzle)                         |


***________________  Complete CI/CD Environment ___________________***

on your homelab with Jenkins + Dozzle + NestJS + Docker Compose — step by step.


```bash
/srv/
 └── ci-cd/
     ├── jenkins/
     ├── dozzle/
     ├── nestjs-app/
     └── docker-compose.yml
```
We’ll go from empty folders → fully working CI/CD pipeline.


### 🧩 Step 1: Prepare the directory

```bash
sudo mkdir -p /srv/ci-cd/{jenkins,dozzle,nestjs-app}
cd /srv/ci-cd
```


### 🐋 Step 2: Create docker-compose.yml

```yml
version: '3.8'

services:
  jenkins:
    build: ./jenkins
    container_name: jenkins
    user: root
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - ./jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped

  dozzle:
    image: amir20/dozzle:latest
    container_name: dozzle
    ports:
      - "9999:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped

  nestjs:
    build: ./nestjs-app
    container_name: nestjs
    ports:
      - "5001:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```


### 🧱 Step 3: Configure Jenkins

Move into Jenkins folder:


```bash
cd /srv/ci-cd/jenkins
```
3.1 Create a Dockerfile

```bash
FROM jenkins/jenkins:lts-alpine

USER root

# Install Docker CLI, Git, Node.js, etc.
RUN apk add --no-cache docker-cli git nodejs npm bash

# Optional: Copy plugins list (see below)
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli -f /usr/share/jenkins/ref/plugins.txt || true

USER jenkins

```


***3.2 Optional: Add plugins.txt***

Create /srv/ci-cd/jenkins/plugins.txt with these common plugins:

```bash
git
docker-plugin
workflow-aggregator
blueocean
docker-workflow
pipeline-stage-view
pipeline-utility-steps
credentials-binding
ssh-agent
```

When Jenkins builds for the first time, it will automatically install them.

***3.3 Jenkins Home***

When you run Jenkins later, it will auto-create: `/srv/ci-cd/jenkins_home/`

This folder stores jobs, pipelines, plugin data, etc.

✅ Make sure it’s writable: `sudo chmod -R 777 /srv/ci-cd/jenkins_home`


### 📜 Step 4: Configure Dozzle

Move into Dozzle folder: `cd /srv/ci-cd/dozzle`

Create an optional config file:

config.yml (optional) 

```bash
auth:
  basic:
    username: admin
    password: mypassword
```

If you use this, mount it in docker-compose.yml under dozzle service:

```bash
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
    - ./dozzle/config.yml:/data/config.yml
```


Dozzle is now ready. It will show live logs of all containers at:
👉 http://your-server-ip:9999



⚙️ Step 5: Configure NestJS App

Move into NestJS folder:

```bash
cd /srv/ci-cd/nestjs-app

```

Example project structure:

```bash
nestjs-app/
 ├── Dockerfile
 ├── package.json
 ├── src/
 └── ...
```


Example `Dockerfile`

```Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000
CMD ["npm", "run", "start:prod"]

```



Example package.json

```json
{
  "name": "nestjs-app",
  "version": "1.0.0",
  "scripts": {
    "start": "nest start",
    "start:prod": "node dist/main.js",
    "build": "nest build"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "typescript": "^5.0.4"
  }
}
```

🚀 Step 6: Start your Docker environment

Go to /srv/ci-cd and run:

```bash
sudo docker compose up -d

```
Check containers:

```bash
sudo docker ps

```


You should see:

- Jenkins → http://your-server-ip:8080
- Dozzle → http://your-server-ip:9999
- NestJS → http://your-server-ip:5001



🧰 Step 7: Configure Jenkins Web UI

1. Visit: http://your-server-ip:8080

2. Jenkins will ask for the initial admin password:

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

3. Copy that and log in.
4. Create your first admin user.
5. Skip the plugin installation if you already preloaded via plugins.txt.


🧠 Step 8: Create Jenkins Pipeline (CI/CD)

Now create a Jenkins pipeline job to automate NestJS build & deploy.

***Example `Jenkinsfile`***

Put this file in `/srv/ci-cd/nestjs-app/Jenkinsfile:`

```groovy
pipeline {
  agent any

  environment {
    DOCKER_IMAGE = 'nestjs-app'
    CONTAINER_NAME = 'nestjs'
  }

  stages {
    stage('Checkout') {
      steps {
        git branch: 'main', url: 'https://gitlab.com/your-repo/nestjs-app.git'
      }
    }

    stage('Build Docker Image') {
      steps {
        sh 'docker build -t ${DOCKER_IMAGE}:latest .'
      }
    }

    stage('Stop old container') {
      steps {
        sh 'docker rm -f ${CONTAINER_NAME} || true'
      }
    }

    stage('Run new container') {
      steps {
        sh 'docker run -d --name ${CONTAINER_NAME} -p 5001:3000 ${DOCKER_IMAGE}:latest'
      }
    }

    stage('Cleanup') {
      steps {
        sh 'docker image prune -f'
      }
    }
  }
}

```


Add pipeline to Jenkins:

  * In Jenkins dashboard → New Item → choose Pipeline
  * Name it nestjs-ci-cd
  * Under Pipeline script from SCM, choose Git
  * Set your repo URL & branch

Save and click Build Now


✅ Jenkins will:

  1. Clone your repo
  2. Build your NestJS Docker image
  3. Stop any old container
  4. Deploy new container automatically

🧾 Step 9: Check Logs in Dozzle

Open Dozzle: `http://your-server-ip:9999`

You’ll see live logs for:

  * jenkins 
  * nestjs 
  * Any other container

🎉 Final Overview

| Component     | Port                   | Description                                   |
| ------------- | ---------------------- | --------------------------------------------- |
| Jenkins       | `8080`                 | CI/CD automation server                       |
| Dozzle        | `9999`                 | Real-time Docker log viewer                   |
| NestJS App    | `5001`                 | Your running app                              |
| Docker socket | `/var/run/docker.sock` | Enables Jenkins & Dozzle to manage containers |
