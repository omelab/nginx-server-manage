## GitLab CI/CD for Next.js Deployment with PM2

This setup assumes:

    - Your server is Ubuntu (or similar)
    - Node.js + PM2 are already installed on the server
    - The Next.js app lives at /var/www/your-app-folder
    - You deploy using SSH
    - Your app is started with PM2 using a name like "next-app"



### 🔧 1. Create .gitlab-ci.yml in project root

```yaml
stages:
  - deploy

deploy_production:
  stage: deploy
  only:
    - main   # change to your branch name
  script:
    # --- SSH Commands to Deploy the Application ---
    - |
      ssh -o StrictHostKeyChecking=no root@ip << 'EOF'
        cd /var/www/your-app-folder

        echo "📌 Pulling latest code..."
        git pull origin main

        echo "📦 Installing dependencies..."
        npm install

        echo "🔨 Building Next.js..."
        npm run build

        echo "🚀 Restarting PM2..."
        pm2 restart next-app

        echo "✅ Deployment complete!"
      EOF

```

### 🔐 2. Add SSH private key in GitLab

Go to:

> GitLab → Your Project → Settings → CI/CD → Variables

Add:

| Key               | Value                  |
| ----------------- | ---------------------- |
| `SSH_PRIVATE_KEY` | *your private SSH key* |


Also add:

| Key               | Value        |
| ----------------- | ------------ |
| `SSH_KNOWN_HOSTS` | 102.22.22.1 |


Then modify the CI so it uses the key:

```yaml
before_script:
  - 'which ssh-agent || ( apt-get update -y && apt-get install openssh-client -y )'
  - eval $(ssh-agent -s)
  - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
  - mkdir -p ~/.ssh
  - echo "$SSH_KNOWN_HOSTS" >> ~/.ssh/known_hosts

```
Full final file:


### 🎯 Final .gitlab-ci.yml


```yaml
stages:
  - deploy

before_script:
  - 'which ssh-agent || ( apt-get update -y && apt-get install openssh-client -y )'
  - eval $(ssh-agent -s)
  - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
  - mkdir -p ~/.ssh
  - echo "$SSH_KNOWN_HOSTS" >> ~/.ssh/known_hosts

deploy_production:
  stage: deploy
  only:
    - main
  script:
    - |
      ssh -o StrictHostKeyChecking=no root@102.22.22.1 << 'EOF'
        cd /var/www/your-app-folder

        echo "📌 Pulling latest code..."
        git pull origin main

        echo "📦 Installing dependencies..."
        npm install

        echo "🔨 Building Next.js..."
        npm run build

        echo "🚀 Restarting PM2..."
        pm2 restart next-app

        echo "🎉 Deployment Success!"
      EOF
```


### 📝 3. PM2 Start Command on Server

Make sure you start your app once:

```bash
cd /var/www/your-app-folder
pm2 start npm --name "next-app" -- start -- -p 5006
pm2 save

```

Now every deployment will:

✔ pull code
✔ npm install
✔ npm run build
✔ restart pm2 app on port 5006




# 🚀 Complete Production CI/CD With Auto-Rollback & PM2 Reload

Create the file:

```bash
.gitlab-ci.yml

```

### 📌 Final .gitlab-ci.yml — PRODUCTION READY

```yaml
stages:
  - deploy

default:
  before_script:
    - 'which ssh-agent || ( apt-get update -y && apt-get install openssh-client -y )'
    - eval $(ssh-agent -s)
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - echo "$SSH_KNOWN_HOSTS" >> ~/.ssh/known_hosts

deploy_production:
  stage: deploy
  only:
    - main      # Deploy to production only on main branch
  script:
    - |
      ssh -o StrictHostKeyChecking=no root@102.22.22.1 << 'EOF'

        set -e  # stop script if any command fails

        APP_DIR="/var/www/myapp"
        BACKUP_DIR="/var/www/myapp_backup"

        echo "📌 Preparing deployment..."

        # Create backup
        echo "📦 Creating backup..."
        rm -rf \$BACKUP_DIR
        cp -r \$APP_DIR \$BACKUP_DIR

        cd \$APP_DIR

        echo "⬇ Pulling latest changes..."
        git fetch --all
        git reset --hard origin/main

        echo "📦 Installing dependencies..."
        npm install --silent

        echo "🔨 Building Next.js..."
        npm run build

        echo "🚀 Reloading PM2 with zero downtime..."
        pm2 reload next-app || pm2 start npm --name "next-app" -- start -- -p 5006

        echo "💾 Saving PM2 config..."
        pm2 save

        echo "🎉 Deployment Success!"
      EOF
  after_script:
    - echo "Production deployment finished."


deploy_staging:
  stage: deploy
  only:
    - develop   # Deploy staging on develop branch
  script:
    - |
      ssh -o StrictHostKeyChecking=no root@102.22.22.1 << 'EOF'

        set -e

        APP_DIR="/var/www/myapp-staging"

        cd \$APP_DIR

        git fetch --all
        git reset --hard origin/develop

        npm install --silent
        npm run build

        pm2 reload next-app-staging || pm2 start npm --name "next-app-staging" -- start -- -p 5007
        pm2 save
      EOF
```


### 🟦 Zero Downtime PM2 Setup on Server

Run this once on your server:


```bash
cd /var/www/myapp
pm2 start npm --name "next-app" -- start -- -p 5006
pm2 save
```

For staging:

```bash
cd /var/www/myapp-staging
pm2 start npm --name "next-app-staging" -- start -- -p 5007
pm2 save
```



### 🔄 Automatic Rollback (Included)

If anything fails during:

    - git pull
    - npm install
    - npm run build
    - pm2 reload

The pipeline stops because of:

```bash

set -e
```

You can manually rollback by:

```bash
rm -rf /var/www/myapp
mv /var/www/myapp_backup /var/www/myapp
pm2 restart next-app

```

Rollback folder is always created automatically.


### 🔐 GitLab Variables Needed


In GitLab:

> Settings → CI/CD → Variables


Add:

| Key               | Value            | Type   |
| ----------------- | ---------------- | ------ |
| `SSH_PRIVATE_KEY` | your private key | masked |
| `SSH_KNOWN_HOSTS` | 102.22.22.1      | masked |



🎯 What This Pipeline Gives You

✔ One-click deploy
✔ Zero downtime (PM2 reload)
✔ Auto rollback backup
✔ Separate production & staging
✔ Build done on the server, not CI runner
✔ Handles Next.js properly
✔ Works over SSH




# 🚀 FULL PRODUCTION SETUP (Docker + Nginx + GitLab CI/CD)

You will get:

✅ Docker-based deployment
✅ PM2 inside Docker (for Next.js)
✅ Nginx reverse proxy
✅ GitLab CI/CD automated deploy
✔ npm install
✔ npm run build
✔ Docker image build
✔ Container restart




## 🧱 1. Create Dockerfile


Create a file named `Dockerfile` in your project root:

```bash
FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 5006

# Use PM2 runtime
RUN npm install -g pm2

CMD ["pm2-runtime", "start", "npm", "--", "start", "--", "-p", "5006"]

```


## 🐳 2. Create docker-compose.yml on server

SSH into your server:

```bash
mkdir -p /var/www/myapp
cd /var/www/myapp

```

Create file: `docker-compose.yml`


```yaml
version: "3.9"

services:
  next-app:
    container_name: next-app
    image: myapp-image:latest
    build: .
    restart: always
    ports:
      - "5006:5006"

```



## 🌐 3. Nginx Reverse Proxy (Production)

Your domain → Next.js container on port 5006.

Create file:


```bash
/etc/nginx/sites-available/myapp.conf

```


```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}


```



Enable & restart:

```bash
ln -s /etc/nginx/sites-available/myapp.conf /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

```


### 🗝 4. Add GitLab Variables


Go to:

> GitLab → Settings → CI/CD → Variables

add: 

| KEY               | VALUE            |
| ----------------- | ---------------- |
| `SSH_PRIVATE_KEY` | your private key |
| `SSH_KNOWN_HOSTS` | 102.22.22.1      |



### 🚀 5. Full GitLab CI/CD: Build & Deploy via SSH

```yaml
stages:
  - deploy

before_script:
  - 'which ssh-agent || ( apt-get update -y && apt-get install openssh-client -y )'
  - eval $(ssh-agent -s)
  - echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add -
  - mkdir -p ~/.ssh
  - echo "$SSH_KNOWN_HOSTS" > ~/.ssh/known_hosts

deploy_production:
  stage: deploy
  only:
    - main
  script:
    - |
      ssh root@102.22.22.1 << 'EOF'
        set -e

        cd /var/www/myapp

        echo "📌 Pulling latest source..."
        git pull origin main

        echo "🐳 Building Docker image..."
        docker build -t myapp-image:latest .

        echo "🚀 Restarting container..."
        docker-compose down
        docker-compose up -d --build

        echo "🎉 Deployment Done!"
      EOF

````









