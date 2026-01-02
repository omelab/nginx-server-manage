# Install GitLab on Subdomain `gitlab.easysofts.net`


This guide assumes you're using Ubuntu/Debian and Nginx. Adjust accordingly if you use a different OS/web server.


## Step 1: System Preparation

Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl openssh-server ca-certificates tzdata perl
```

Configure Firewall

```bash
sudo ufw allow http
sudo ufw allow https
sudo ufw allow ssh
sudo ufw enable
```


## Step 2: DNS Configuration

Add an A record in your DNS management panel:

```bash
Type: A
Name: gitlab
Content: 103.189.5.21
TTL: 3600 (or default)
```
This will create gitlab.easysofts.net pointing to your server.


## Step 3: Install GitLab

Add GitLab Repository

```bash
curl -sS https://packages.gitlab.com/install/repositories/gitlab/gitlab-ee/script.deb.sh | sudo bash
```

Install GitLab with Subdomain URL

```bash
sudo EXTERNAL_URL="https://gitlab.easysofts.net" apt-get install gitlab-ee
```


## Step 4: Configure GitLab

Edit GitLab Configuration

```bash
sudo nano /etc/gitlab/gitlab.rb
```

Replace the content with:

```bash
external_url 'https://gitlab.easysofts.net'

# Enable Let's Encrypt
letsencrypt['enable'] = true
letsencrypt['contact_emails'] = ['admin@easysofts.net']  # Replace with your email
letsencrypt['auto_renew'] = true
letsencrypt['auto_renew_hour'] = 0
letsencrypt['auto_renew_minute'] = 30
letsencrypt['auto_renew_day_of_month'] = '*/4'

# If you want to use existing nginx (recommended for coexistence with easysofts.net)
nginx['enable'] = true

# SMTP configuration (recommended for notifications)
gitlab_rails['smtp_enable'] = true
gitlab_rails['smtp_address'] = "smtp.gmail.com"
gitlab_rails['smtp_port'] = 587
gitlab_rails['smtp_user_name'] = "your-email@gmail.com"
gitlab_rails['smtp_password'] = "your-app-password"
gitlab_rails['smtp_domain'] = "gmail.com"
gitlab_rails['smtp_authentication'] = "login"
gitlab_rails['smtp_enable_starttls_auto'] = true
gitlab_rails['smtp_tls'] = false

# Backup configuration
gitlab_rails['backup_path'] = "/var/opt/gitlab/backups"
gitlab_rails['backup_archive_permissions'] = 0644
gitlab_rails['backup_keep_time'] = 604800
````


Apply Configuration

```bash
sudo gitlab-ctl reconfigure
```

This process may take 5-10 minutes. GitLab will automatically obtain SSL certificates from Let's Encrypt.


## Step 5: Configure Nginx for Coexistence

Since you already host easysofts.net, let's check your current nginx configuration:

Check Current Nginx Setup

```bash
sudo nginx -t
sudo ls /etc/nginx/sites-available/
```


Create GitLab Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/gitlab
```
Add this configuration:

```bash
server {
    listen 80;
    server_name gitlab.easysofts.net;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gitlab.easysofts.net;
    
    ssl_certificate /etc/letsencrypt/live/gitlab.easysofts.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gitlab.easysofts.net/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Larger client body size for repositories
    client_max_body_size 0;
}
```


Enable GitLab Site

```bash
sudo ln -s /etc/nginx/sites-available/gitlab /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 6: Configure GitLab for Reverse Proxy


Update GitLab to use different port

```bash
sudo nano /etc/gitlab/gitlab.rb
```

Add/modify:

```bash
nginx['listen_port'] = 8080
nginx['listen_https'] = false
```

Reconfigure GitLab

```bash
sudo gitlab-ctl reconfigure
sudo gitlab-ctl restart
```

## Step 7: Initial GitLab Setup

Get Initial Root Password

```bash
sudo cat /etc/gitlab/initial_root_password
```

Save the password shown in the output.



## Access GitLab
1. Open https://gitlab.easysofts.net in your browser
2. Login with:

    Username: root 
    Password: (from the file above)


## Step 9: Verification

    Test DNS Resolution

    ```bash
    nslookup gitlab.easysofts.net
    dig gitlab.easysofts.net
    ```

Test Website Access

Check Services
```bash
sudo gitlab-ctl status
sudo systemctl status nginx
```

