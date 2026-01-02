# Self-hosting GitLab 👏

Let’s go step-by-step so you can get GitLab running on your own Ubuntu server (since you mentioned before you’re using Ubuntu + Nginx + static IP).


## 🧩 Overview

You can install GitLab in two main ways:

    1. Omnibus package (recommended) → single command setup with everything (Nginx, Redis, Postgres, etc.)
    2. Docker / Docker Compose → cleaner isolation, easier to update.

Both work great; I’ll show both options below 👇



## 🧱 Prerequisites

    - Ubuntu 22.04 or later
    - At least 4 GB RAM, 2 CPU cores
    - A domain (e.g. gitlab.easysofts.net) pointing to your public IP via Cloudflare or DNS
    - Root (sudo) access


## 🥇 Option 1: Install via Omnibus package (easiest)

    Step 1 — Update your system

    ```bash
    sudo apt update && sudo apt upgrade -y
    ```


### Step 2 — Install required dependencies

```bash
sudo apt install -y curl openssh-server ca-certificates tzdata perl
```

(Optional but recommended)

```bash
sudo apt install -y postfix
```
(choose “Internet Site” when asked)


### Step 3 — Add GitLab repository and install

```bash
curl https://packages.gitlab.com/install/repositories/gitlab/gitlab-ee/script.deb.sh | sudo bash
```

### Step 4 — Install GitLab

Replace gitlab.easysofts.net with your domain:

```bash
sudo EXTERNAL_URL="https://gitlab.easysofts.net" apt install -y gitlab-ee
```

This will automatically:

    - Set up Nginx reverse proxy
    - Configure HTTPS (you can use Let’s Encrypt)
    - Start GitLab services

Step 5 — Enable HTTPS (Let’s Encrypt)

```bash
Edit /etc/gitlab/gitlab.rb:
```

Find and set:

```bash
external_url "https://gitlab.easysofts.net"
letsencrypt['enable'] = true
```

Then reconfigure:

```bash 
sudo gitlab-ctl reconfigure
```

## 🥈 Option 2: Docker Compose Setup

Step 1 — Create a directory

```bash
mkdir -p /srv/gitlab && cd /srv/gitlab
```


Step 2 — Create docker-compose.yml

```bash
version: '3.6'
services:
  web:
    image: 'gitlab/gitlab-ee:latest'
    restart: always
    hostname: 'gitlab.easysofts.net'
    environment:
      GITLAB_OMNIBUS_CONFIG: |
        external_url 'https://gitlab.easysofts.net'
        letsencrypt['enable'] = true
    ports:
      - '80:80'
      - '443:443'
      - '22:22'
    volumes:
      - './config:/etc/gitlab'
      - './logs:/var/log/gitlab'
      - './data:/var/opt/gitlab'
```


Step 3 — Run it

```bash
docker compose up -d
```

🧠 After Installation

Find root password:

```bash
sudo cat /etc/gitlab/initial_root_password
```
Access your GitLab:

➡️ https://gitlab.easysofts.net
Login as:

```bash
Username: root
Password: (from above)
```


#### 🛠 Nginx Reverse Proxy (optional)

If you’re already using Nginx for other sites and want to reverse proxy to GitLab (on port 8080 internally), I can give you a clean Nginx config like this:

```bash
server {
    listen 80;
    server_name gitlab.easysofts.net;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name gitlab.easysofts.net;

    ssl_certificate /etc/letsencrypt/live/gitlab.easysofts.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gitlab.easysofts.net/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```


⚙️ Optional: Configure GitLab for CI/CD

Once GitLab is up:

- Go to Admin → Runners → New Instance Runner
- Install the GitLab Runner on your local server:

```bash
sudo apt install gitlab-runner -y
```

Register it:

```bash
sudo gitlab-runner register
```

Then enter:

    - URL: https://gitlab.easysofts.net
    - Token: from your GitLab UI
    - Executor: shell or docker



