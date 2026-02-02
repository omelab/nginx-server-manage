# Minio Server Config for Nginx
```nginx
# /etc/nginx/sites-available/minio
upstream minio_s3 {
    server 127.0.0.1:9000;
    keepalive 64;
}

upstream minio_console {
    server 127.0.0.1:9001;
    keepalive 64;
}

# ========== S3 API (s3client.com) ==========
server {
    listen 80;
    server_name s3client.com;
    
    # Allow unlimited file uploads for S3
    client_max_body_size 0;
    
    # Timeouts for large operations
    proxy_connect_timeout  300s;
    proxy_send_timeout     300s;
    proxy_read_timeout     300s;
    
    # Disable buffering for better performance
    proxy_buffering off;
    proxy_request_buffering off;
    
    location / {
        proxy_http_version 1.1;
        
        # Important: Preserve original host header for S3 signatures
        proxy_set_header Host              $http_host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection        "";
        
        proxy_pass http://minio_s3;
    }
}

# ========== MinIO Console (console.s3client.com) ==========
server {
    listen 80;
    server_name console.s3client.com;
    
    # WebSocket support for Console
    proxy_http_version 1.1;
    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection "upgrade";
    
    location / {
        proxy_set_header Host              $http_host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host  $host;
        
        proxy_pass http://minio_console;
    }
}
```


## 2. Setup Commands

### Create the config file
sudo nano /etc/nginx/sites-available/minio

### Copy-paste the above configuration, then:

### Enable the site
sudo ln -s /etc/nginx/sites-available/minio /etc/nginx/sites-enabled/

### Remove default site if exists
sudo rm -f /etc/nginx/sites-enabled/default

### Test configuration
sudo nginx -t

### Restart Nginx
sudo systemctl restart nginx



## 3. Verify HTTP is Working
```bash
# Test both endpoints
curl -I http://s3client.com
curl -I http://console.s3client.com

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
```

## 4. Now Get SSL Certificates with Certbot

```bash
# Install Certbot if not already installed
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate for both domains
sudo certbot --nginx -d s3client.com -d console.s3client.com
```

## 5. Check the Updated Configuration

```bash
# HTTP to HTTPS redirect (added by Certbot)
server {
    server_name s3client.com console.s3client.com;
    listen 80;
    return 301 https://$server_name$request_uri;
}

# HTTPS configuration with SSL (modified by Certbot)
server {
    server_name s3client.com;
    listen 443 ssl http2;
    
    ssl_certificate /etc/letsencrypt/live/s3client.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/s3client.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Your original S3 configuration here...
    client_max_body_size 0;
    # ... rest of your S3 config
}

server {
    server_name console.s3client.com;
    listen 443 ssl http2;
    
    ssl_certificate /etc/letsencrypt/live/s3client.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/s3client.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Your original Console configuration here...
    proxy_http_version 1.1;
    # ... rest of your Console config
}
```



## 8. Verify SSL is Working


```bash
# Test HTTPS endpoints
curl -I https://s3client.com
curl -I https://console.s3client.com

# Check SSL certificate
openssl s_client -connect s3client.com:443 -servername s3client.com | openssl x509 -noout -dates

# Check auto-renewal setup
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```


## 9. Troubleshooting
Issue 1: DNS not pointing to server

```bash
# Check if DNS resolves
nslookup s3client.com
nslookup console.s3client.com
```


Issue 2: Port 80 blocked

```bash
# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```
Issue 3: Nginx not running
```bash
sudo systemctl status nginx
sudo nginx -t
```

Issue 4: Manual certificate request
```bash
# If automatic fails, try standalone mode
sudo systemctl stop nginx
sudo certbot certonly --standalone -d s3client.com -d console.s3client.com
sudo systemctl start nginx

# Then manually configure Nginx with SSL
````


## 10. Final Verification Script

```bash
#!/bin/bash
echo "=== Testing MinIO Setup ==="
echo ""
echo "1. Testing HTTP redirects:"
curl -I http://s3client.com 2>/dev/null | grep -i "location\|http"
echo ""
echo "2. Testing HTTPS S3 API:"
curl -I https://s3client.com 2>/dev/null | head -1
echo ""
echo "3. Testing HTTPS Console:"
curl -I https://console.s3client.com 2>/dev/null | head -1
echo ""
echo "4. SSL Certificate Info:"
sudo certbot certificates
echo ""
echo "5. Nginx status:"
sudo systemctl status nginx --no-pager -l | grep -A 3 "Active:"
echo ""
echo "=== Setup Complete! ==="
echo "Access:"
echo "  S3 API:      https://s3client.com"
echo "  Console:     https://console.s3client.com"
````


## Summary
- Start with HTTP-only config - Get basic routing working
- Test both endpoints - Ensure s3client.com and console.s3client.com work
- Run Certbot - sudo certbot --nginx -d s3client.com -d console.s3client.com
- Verify SSL - Check both HTTPS endpoints work
- Setup auto-renewal - Certbot does this automatically
