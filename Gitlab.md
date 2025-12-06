# GitLab CE on your home-lab server

Below is 100% complete, step-by-step, copy-paste ready guide to install GitLab CE on your home-lab server, using:


- ✅ Docker
- ✅ docker-compose
- ✅ Nginx reverse proxy
- ✅ Domain: gitlab.easysofts.com
- ✅ Free HTTPS (Let’s Encrypt)
- ✅ Gmail SMTP or Local Postfix
- ✅ Router Port forwarding
- ✅ SSH clone support

This is the best production-grade setup for a HomeLab.

### PART 1 — Install Docker (Already Done)

You already installed Docker 29.1.2 ✔
No need to do anything here.


### PART 2 — Create GitLab Directory Structure

```bash
sudo mkdir -p /srv/gitlab
sudo mkdir -p /srv/gitlab/config /srv/gitlab/logs /srv/gitlab/data
```


### PART 3 — Create Docker Compose File
Go to GitLab directory:

```bash
cd /srv/gitlab

```

Create the file:

```bash
sudo nano docker-compose.yml

```

wrhite this code

```yaml
version: '3.6'
services:
  gitlab:
    image: gitlab/gitlab-ce:latest
    container_name: gitlab
    restart: always
    hostname: gitlab.easysofts.com

    ports:
      - "8080:80"
      - "8443:443"
      - "2224:22"

    volumes:
      - /srv/gitlab/config:/etc/gitlab
      - /srv/gitlab/logs:/var/log/gitlab
      - /srv/gitlab/data:/var/opt/gitlab

    environment:
      GITLAB_OMNIBUS_CONFIG: |
        external_url 'https://gitlab.easysofts.com'
        gitlab_rails['gitlab_shell_ssh_port'] = 2224

```
Save: CTRL + O
Exit: CTRL + X


### PART 4 — Start GitLab

```bash
sudo docker compose up -d

```

GitLab takes 5–10 minutes to fully start.

Check progress:


```bash
docker logs -f gitlab
```


### PART 5 — Get Initial root Password

After GitLab finishes setup:

```bash
sudo cat /srv/gitlab/config/initial_root_password


#GITLAB_ROOT_PASSWORD
#Password: JjoNN8LVRWlJvwiTIkksvmCdo37p8O++J+Ah9hSM8vI=

```
Login here: 👉 https://gitlab.easysofts.com


*Access the GitLab container*
If you are using Docker:

```bash
docker exec -it gitlab bash
```

*Set the root password*
Inside the container, run:

```bash
gitlab-rails console -e production
```

Then in the Rails console:

```ruby
user = User.find_by(username: 'root')
user.password = 'YourStrongPasswordHere'
user.password_confirmation = 'YourStrongPasswordHere'
user.save!

```
Replace 'YourStrongPasswordHere' with a secure password you choose.

>After saving, you can log in as root with that password.

*Exit the container*

```bash
exit
```

4️⃣ Login

Go to: https://gitlab.easysofts.net/users/sign_in 
Username: root 
Password: the one you set above.


### ⚡ Alternative: Using gitlab-rails reset password command

From host (Docker):

```bash
docker exec -it gitlab gitlab-rails runner "u = User.find_by(username: 'root'); u.password = 'YourStrongPassword'; u.password_confirmation = 'YourStrongPassword'; u.save!"
```

Make sure your GitLab container is running:

```bash
docker ps
```


### PART 6 — DNS Configuration

Go to your domain DNS panel.

| Type | Name   | Points To      |
| ---- | ------ | -------------- |
| A    | gitlab | YOUR_PUBLIC_IP |


Example:

```bash
gitlab.easysofts.com → 103.xxx.xxx.xxx

```


### PART 7 — Install Nginx Reverse Proxy

Install:

```bash
sudo apt update
sudo apt install nginx -y
```

### PART 8 — Create Nginx Config for GitLab

Create config: 

```bash
sudo nano /etc/nginx/sites-available/gitlab
```


Paste:

```bash
server {
    listen 80;
    server_name gitlab.easysofts.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/gitlab /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```


### PART 9 — Enable FREE HTTPS (Let’s Encrypt)

Install certbot:


```bash
sudo apt install certbot python3-certbot-nginx -y
```
Run:

```bash
sudo certbot --nginx -d gitlab.easysofts.com

```

This will:

✔ Install SSL
✔ Auto-renew
✔ Update Nginx automatically

Now open the site:

👉 https://gitlab.easysofts.com


### PART 10 — Home Router Port Forwarding

Log in to router.

Forward these ports to your server’s LAN IP (example: 192.168.0.150):

| External Port | LAN IP        | Internal Port | Required             |
| ------------- | ------------- | ------------- | -------------------- |
| 80            | 192.168.0.150 | 80            | YES                  |
| 443           | 192.168.0.150 | 443           | YES                  |
| 2224          | 192.168.0.150 | 2224          | Optional (SSH clone) |



### PART 11 — Ubuntu UFW Firewall Rules

Allow necessary ports:

```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 2224
```

Check:

```bash
sudo ufw status
```


### PART 12 — SMTP Email Setup (Optional But Recommended)

GitLab needs SMTP for:

✔ Password reset
✔ CI notifications
✔ New user email



#### OPTION A — Gmail SMTP

Edit GitLab config:

```bash
sudo nano /srv/gitlab/config/gitlab.rb
```

add:

```bash
gitlab_rails['smtp_enable'] = true
gitlab_rails['smtp_address'] = "smtp.gmail.com"
gitlab_rails['smtp_port'] = 587
gitlab_rails['smtp_user_name'] = "your@gmail.com"
gitlab_rails['smtp_password'] = "your-app-password"
gitlab_rails['smtp_domain'] = "gmail.com"
gitlab_rails['smtp_authentication'] = "login"
gitlab_rails['smtp_enable_starttls_auto'] = true

gitlab_rails['gitlab_email_from'] = 'your@gmail.com'
```

Apply config:

```bash
docker exec gitlab gitlab-ctl reconfigure
docker restart gitlab
```


#### OPTION B — Local Postfix Mail Server (HomeLab)

install:

```bash
sudo apt install postfix -y
```

Select → Internet Site

Set hostname:
`easysofts.com`

Then configure GitLab:

```ruby
gitlab_rails['smtp_address'] = "127.0.0.1"
gitlab_rails['smtp_port'] = 25
gitlab_rails['smtp_domain'] = "easysofts.com"
```


#### PART 13 — Test GitLab


Open browser:

👉 https://gitlab.easysofts.com

Login as:

```bash
Username: root
Password: (from initial_root_password)
```


#### ART 14 — Optional GitLab Runner Installation

Install runner on same server:

```bash
sudo apt install gitlab-runner -y
```

Register:

```bash
sudo gitlab-runner register
```

#### 🎉 COMPLETE HOME-LAB GITLAB READY

What you have now:

✔ GitLab CE (latest)
✔ Docker + docker-compose
✔ Nginx reverse proxy
✔ HTTPS + auto renewal
✔ SSH clone via port 2224
✔ Router port forwarding
✔ SMTP email working
✔ Production-ready setup

### GitLab Runner — install & register (quick)

On the machine that will run CI jobs (can be same server or separate runner host):

```bash
# Debian/Ubuntu
sudo apt update
sudo apt install -y gitlab-runner

# Register runner (replace with values from your GitLab project / Admin > Runners)
sudo gitlab-runner register \
  --non-interactive \
  --url "https://gitlab.easysofts.com/" \
  --registration-token "PROJECT_OR_INSTANCE_REGISTRATION_TOKEN" \
  --executor "docker" \
  --description "home-lab-docker-runner" \
  --tag-list "docker,linux" \
  --docker-image "docker:24.0.5" \
  --docker-volumes /var/run/docker.sock:/var/run/docker.sock

```

Notes:

- Use instance token if you want runner available for all projects (Admin Area → Runners).

- For Docker builds, mount /var/run/docker.sock so runner can build images (DinD approach). For more secure approach use docker-in-docker service or privileged runner.


### Generic .gitlab-ci.yml patterns

A — React (Next.js) — build & deploy to remote server with rsync (no docker)

Create `.gitlab-ci.yml` in your repo:


```yml
stages:
  - build
  - deploy

cache:
  paths:
    - node_modules/

variables:
  NODE_ENV: production

image: node:20

before_script:
  - npm ci

build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - .next
      - public
      - node_modules
    expire_in: 1 hour

deploy:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh rsync
  script:
    - mkdir -p ~/.ssh
    - echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - ssh-keyscan -H "$DEPLOY_HOST" >> ~/.ssh/known_hosts
    - rsync -avz --delete .next public package.json $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH
  only:
    - main

```

Environment variables to set in GitLab CI/CD > Settings > CI/CD > Variables

- SSH_PRIVATE_KEY — private key for deploy user (id_rsa)
- DEPLOY_HOST — gitlab.easysofts.com or server IP
- DEPLOY_USER — e.g., deploy
- DEPLOY_PATH — e.g., /var/www/next-app

On server, deploy user should pm2/systemd-run the Next.js or serve via nginx reverse proxy to the build output.


### Laravel — build, migrate, and deploy (via SSH)

`.gitlab-ci.yml:`


```yml
stages:
  - build
  - deploy

image: php:8.2

variables:
  COMPOSER_CACHE_DIR: "$CI_PROJECT_DIR/.composer"

before_script:
  - apt-get update && apt-get install -y git unzip ssh
  - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
  - composer install --no-dev --no-interaction --prefer-dist

build:
  stage: build
  script:
    - php artisan config:cache
    - php artisan route:cache
  artifacts:
    paths:
      - vendor
      - bootstrap/cache
    expire_in: 1 hour

deploy:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache openssh rsync
    - mkdir -p ~/.ssh && echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_rsa && chmod 600 ~/.ssh/id_rsa
    - ssh-keyscan -H "$DEPLOY_HOST" >> ~/.ssh/known_hosts
    - rsync -a --delete --exclude='.git' --exclude='node_modules' ./ $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH
    - ssh $DEPLOY_USER@$DEPLOY_HOST "cd $DEPLOY_PATH && composer install --no-dev --no-interaction && php artisan migrate --force && php artisan cache:clear"
  only:
    - main

```


Set variables:

`SSH_PRIVATE_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`.

If you use Docker for Laravel, see the NestJS Docker example below.


### NestJS (build Docker image and deploy to server, using docker over SSH)

This builds an image and pushes to the server (server must have Docker and allow docker load or use private registry). Simpler: build image → save → SCP to server → load → restart container.


`.gitlab-ci.yml`

```yml
stages:
  - build
  - deploy

image: docker:24.0.5

variables:
  DOCKER_DRIVER: overlay2

services:
  - docker:24.0.5-dind

before_script:
  - echo "$SSH_PRIVATE_KEY" > id_rsa && chmod 600 id_rsa
  - export IMAGE_NAME="registry.local:5000/$CI_PROJECT_PATH:$CI_COMMIT_SHORT_SHA"

build:
  stage: build
  script:
    - docker build -t $IMAGE_NAME .
    - docker save $IMAGE_NAME -o image.tar
  artifacts:
    paths:
      - image.tar
    expire_in: 1 hour

deploy:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache openssh
    - scp -o StrictHostKeyChecking=no -i id_rsa image.tar $DEPLOY_USER@$DEPLOY_HOST:/tmp/image.tar
    - ssh -i id_rsa $DEPLOY_USER@$DEPLOY_HOST "docker load -i /tmp/image.tar && docker rm -f my-nest-app || true && docker run -d --name my-nest-app -p 3000:3000 --env-file /home/$DEPLOY_USER/env.list $IMAGE_NAME"
  only:
    - main

```

Variables:  `SSH_PRIVATE_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`.



### Auto-backup script for GitLab (Docker/Omnibus)

For Docker omnibus container, GitLab provides backup rake tasks that write to /var/opt/gitlab/backups inside the container (which is /srv/gitlab/data in our volume mapping). We'll create a wrapper that runs inside host, then optionally SCP to remote storage.

Create `/usr/local/bin/gitlab_backup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
TIMESTAMP=$(date +"%F_%H-%M")
BACKUP_DIR="/srv/gitlab/data/backups"
CONTAINER_NAME="gitlab"

# Ensure backup folder exists
sudo mkdir -p "$BACKUP_DIR"
sudo chown 1000:1000 "$BACKUP_DIR" || true

echo "Creating GitLab backup at $TIMESTAMP"
docker exec -t $CONTAINER_NAME gitlab-backup create STRATEGY=copy

echo "Backup created. Moving/renaming latest backup"
# Find the latest tar in gitlab's backup dir inside container mount
LATEST=$(ls -1t /srv/gitlab/data/backups/*.tar | head -n1)
if [ -n "$LATEST" ]; then
  DEST="/var/backups/gitlab_backup_$TIMESTAMP.tar"
  sudo cp "$LATEST" "$DEST"
  sudo chown $(whoami):$(whoami) "$DEST"
  echo "Copied $LATEST -> $DEST"
fi

# Optional: SCP upload (configure below)
REMOTE_USER="backupuser"
REMOTE_HOST="backup.example.com"
REMOTE_PATH="/backups/gitlab/"

# Only upload if REMOTE_HOST reachable and variables set
if ping -c1 -W1 "$REMOTE_HOST" &>/dev/null; then
  echo "Uploading $DEST to $REMOTE_HOST"
  scp -o StrictHostKeyChecking=no "$DEST" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
fi

# Prune local backups older than 30 days
find /var/backups -type f -name "gitlab_backup_*.tar" -mtime +30 -delete

```

Make executable:

```bash
sudo chmod +x /usr/local/bin/gitlab_backup.sh
```

Crontab entry to run daily at 2am:

```bash
# edit crontab as root (so permissions OK)
sudo crontab -e
# add:
0 2 * * * /usr/local/bin/gitlab_backup.sh >> /var/log/gitlab_backup.log 2>&1
```


Restore: copy backup .tar into /srv/gitlab/data/backups/ and run:


```bash
docker exec -it gitlab gitlab-backup restore BACKUP=timestamp_of_backup
# then reconfigure:
docker exec -it gitlab gitlab-ctl reconfigure
docker restart gitlab
```

Replace `timestamp_of_backup` with the timestamp string inside the backup filename (the default backup filename contains timestamp).



### Monitoring — Prometheus + Node Exporter + Grafana (docker-compose)

Create `/srv/monitoring/docker-compose.yml:`


```bash
version: "3.8"
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  node-exporter:
    image: prom/node-exporter:latest
    pid: "host"
    network_mode: "host"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  prometheus_data:
  grafana_data:

```

Create  `/srv/monitoring/prometheus.yml:`


```yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'gitlab'
    metrics_path: /-/metrics
    static_configs:
      - targets: ['127.0.0.1:8080']

```

Notes:

- GitLab Omnibus exposes Prometheus metrics at /-/metrics when enabled. If not available on the Docker container port 8080, configure GitLab to expose metrics or install gitlab-exporter. If scrape fails, you can monitor host-level metrics via node-exporter.

- Start monitoring stack:


```bash
cd /srv/monitoring
sudo docker compose up -d

```

### Docker Compose — GitLab Runner (docker executor) — secure defaults

File: `/srv/gitlab-runner/docker-compose.yml`

```yml
version: "3.8"
services:
  gitlab-runner:
    image: gitlab/gitlab-runner:alpine
    container_name: gitlab-runner
    restart: unless-stopped
    environment:
      # Use your GitLab URL and registration token (or register interactively)
      - CI_SERVER_URL=https://gitlab.easysofts.com/
      # if you pre-register a runner and use token, put it here (optional)
      # - REGISTRATION_TOKEN=REPLACE_WITH_TOKEN
    volumes:
      - ./config:/etc/gitlab-runner:rw     # runner config and tokens
      - /var/run/docker.sock:/var/run/docker.sock:ro  # allow docker executor
      - /cache/gitlab-runner:/cache:rw
    security_opt:
      - no-new-privileges:true
    tmpfs: /tmp:rw,nosuid,nodev,mode=1777
    networks:
      - runner_net
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 2048M

networks:
  runner_net:
    driver: bridge
```

Recommended directory layout:


```bash
/srv/gitlab-runner/
 ├─ docker-compose.yml
 └─ config/                  # created after registration
```


Register a runner (one-time). You can do this interactively from inside the container or from host:


```bash
# interactive registration (runs inside container)
sudo docker run --rm -it -v /srv/gitlab-runner/config:/etc/gitlab-runner gitlab/gitlab-runner:alpine register
```

Register with recommended security flags for docker executor (example interactive answers):

- Executor: docker 
- Default Docker image: docker:24.0.5 (or docker:stable) 
- Mount /var/run/docker.sock (we do in compose) 
- Set volumes = ["/cache"] and pull_policy = "if-not-present" if you edit config. 

Security recommendations included in compose:

- no-new-privileges:true prevents escalations inside container. 
- tmpfs for /tmp reduces disk persistence of sensitive temp files. 
- Do not run untrusted jobs on this runner if you mount Docker socket; treat it as privileged (consider separate runners for untrusted repos).

If you want to pre-register via token and configure config.toml templating, let me know and I’ll produce an example config/config.toml.


## systemd service for Next.js / Node (deployments as systemd units)

Approach: create a small start script in the app directory and a systemd unit that runs the app as a dedicated deploy user. This keeps things simple and gives reliable restart & logs via journalctl.

#### 2A — Steps (one-time)

```bash
# create deploy user (no-login)
sudo useradd -m -s /usr/sbin/nologin deploy

# create app directory and place your built app there (example)
sudo mkdir -p /var/www/my-next-app
sudo chown deploy:deploy /var/www/my-next-app
```

#### 2B — Example start script (app uses npm start or node ./server.js)

Create `/var/www/my-next-app/start_app.sh:`

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/my-next-app"
ENV_FILE="/etc/my-next-app.env"    # system-wide env file (managed by deploy process)
LOG_DIR="/var/log/my-next-app"
PIDFILE="/run/my-next-app.pid"

mkdir -p "$LOG_DIR"
chown deploy:deploy "$LOG_DIR" || true

cd "$APP_DIR"

# load environment variables if file exists
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

# Ensure node_modules present (optional)
if [ ! -d "node_modules" ]; then
  npm ci --production
fi

# Start the app; use 'node' or 'npm start' depending on your setup.
# We exec so the process maps to systemd child PID for proper monitoring.
exec /usr/bin/node server.js >>"$LOG_DIR/out.log" 2>>"$LOG_DIR/err.log"

```

Make it executable:


```bash
sudo chown deploy:deploy /var/www/my-next-app/start_app.sh
sudo chmod +x /var/www/my-next-app/start_app.sh
```

> If you prefer PM2, replace exec /usr/bin/node ... with exec /usr/bin/pm2-runtime start ecosystem.config.js --env production and install pm2 globally for deploy.


## 2C — systemd unit file

Create `/etc/systemd/system/my-next-app.service:`

```ini
[Unit]
Description=My Next.js App (systemd)
After=network.target

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/var/www/my-next-app

# Keep the environment variables separate
EnvironmentFile=/etc/my-next-app.env

# If you want to run a pre-deploy pull/build step, use ExecStartPre
# ExecStartPre=/usr/bin/git -C /var/www/my-next-app pull origin main
# ExecStartPre=/usr/bin/npm ci --production

# The start script runs the node process directly (exec)
ExecStart=/var/www/my-next-app/start_app.sh
Restart=on-failure
RestartSec=5
KillMode=control-group
LimitNOFILE=65536

# Security hardening
ProtectSystem=full
ProtectHome=yes
PrivateTmp=yes
NoNewPrivileges=yes
ProtectKernelTunables=yes
ProtectKernelModules=yes
ProtectControlGroups=yes
SystemCallFilter=@system-service

[Install]
WantedBy=multi-user.target

```

Reload systemd and enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now my-next-app.service
```

Logs:

```bash
sudo journalctl -u my-next-app.service -f
```


## Multi-environment (staging / production) with manual approval for production

.gitlab-ci.yml snippet:


```yml
stages:
  - build
  - deploy_staging
  - promote_to_prod
  - deploy_production

build:
  stage: build
  image: node:20
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - .next
    expire_in: 1h

deploy_staging:
  stage: deploy_staging
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh rsync
  script:
    - mkdir -p ~/.ssh
    - echo "$SSH_PRIVATE_KEY_STAGING" > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - rsync -avz --delete .next public $STAGING_USER@$STAGING_HOST:$STAGING_PATH
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - develop

promote_to_prod:
  stage: promote_to_prod
  image: alpine:latest
  script:
    - echo "Manual approval job - will trigger deploy_production pipeline"
  when: manual
  allow_failure: false
  only:
    - main

deploy_production:
  stage: deploy_production
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh rsync
  script:
    - mkdir -p ~/.ssh
    - echo "$SSH_PRIVATE_KEY_PROD" > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - rsync -avz --delete .next public $PROD_USER@$PROD_HOST:$PROD_PATH
  environment:
    name: production
    url: https://example.com
    on_stop: stop_production
  only:
    - main
  when: manual  # can be manual after promote_to_prod or automated if you remove when: manual

```
 

 ```bash
 server {
    server_name server_name gitlab.easysofts.net;
    root /var/www/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/gitlab.easysofts.net/fullchain.pem; # manage>
    ssl_certificate_key /etc/letsencrypt/live/gitlab.easysofts.net/privkey.pem; # mana>
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}
server {
    if ($host = gitlab.easysofts.net) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    server_name server_name gitlab.easysofts.net;
    return 404; # managed by Certbot


}

```

Steps to apply this config and Save the file:

```bash
sudo nano /etc/nginx/sites-available/gitlab.easysofts.net.conf

```

```bash

# Redirect all HTTP traffic to HTTPS
server {
    listen 80;
    server_name gitlab.easysofts.net;

    # Redirect to HTTPS
    return 301 https://$host$request_uri;
}

# HTTPS server block
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 443 ssl http2;
    server_name gitlab.easysofts.net;

    # SSL configuration (Certbot)
    ssl_certificate /etc/letsencrypt/live/gitlab.easysofts.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gitlab.easysofts.net/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # GitLab reverse proxy
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support for Live Terminal / Web IDE
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        proxy_read_timeout 300;
        proxy_send_timeout 300;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/gitlab.easysofts.net.conf /etc/nginx/sites-enabled/
```

Test Nginx config:

```bash
sudo nginx -t

```

Reload Nginx:

```bash
sudo systemctl reload nginx

```

### Step 1: Centralize SSL options

Edit `/etc/nginx/snippets/ssl-params.conf`(or create it):

```bash
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;

````
This file will be included in each site instead of repeating `options-ssl-nginx.conf` or `ssl_dhparam`.


### Step 2: GitLab vhost

Create `/etc/nginx/sites-available/gitlab.easysofts.net.conf:`

```bash
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name gitlab.easysofts.net;
    return 301 https://$host$request_uri;
}

# WebSocket mapping
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 443 ssl http2;
    server_name gitlab.easysofts.net;

    ssl_certificate /etc/letsencrypt/live/gitlab.easysofts.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gitlab.easysofts.net/privkey.pem;
    include /etc/nginx/snippets/ssl-params.conf;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 300;
        proxy_send_timeout 300;
    }
}
```



### Step 3: POS vhost example

`/etc/nginx/sites-available/pos.easysofts.net.conf`

```bash
server {
    listen 80;
    server_name pos.easysofts.net;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pos.easysofts.net;

    ssl_certificate /etc/letsencrypt/live/pos.easysofts.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pos.easysofts.net/privkey.pem;
    include /etc/nginx/snippets/ssl-params.conf;

    location / {
        proxy_pass http://127.0.0.1:8081;  # Change port to your POS container
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

```

### Step 4: S3Admin vhost example

`/etc/nginx/sites-available/s3admin.easysofts.net.conf:`


```bash
server {
    listen 80;
    server_name s3admin.easysofts.net;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name s3admin.easysofts.net;

    ssl_certificate /etc/letsencrypt/live/s3admin.easysofts.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/s3admin.easysofts.net/privkey.pem;
    include /etc/nginx/snippets/ssl-params.conf;

    location / {
        proxy_pass http://127.0.0.1:8082;  # Change port to your S3Admin container
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 5: Enable sites

```bash
sudo ln -s /etc/nginx/sites-available/gitlab.easysofts.net.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/pos.easysofts.net.conf /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/s3admin.easysofts.net.conf /etc/nginx/sites-enabled/

```

### Step 6: Test & reload

```bash
sudo nginx -t
sudo systemctl reload nginx
```
