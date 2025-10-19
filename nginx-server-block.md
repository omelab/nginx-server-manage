
## Server Block configuration

```bash
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.easysofts.net;

    # Redirect all HTTP traffic to HTTPS
    return 301 https://$host$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name api.easysofts.net;

    # SSL certificates from Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/api.easysofts.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.easysofts.net/privkey.pem;

    # Optional: SSL optimizations
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';

    # Main location for your NestJS API
    location / {
        proxy_pass http://127.0.0.1:5001;  # your NestJS app
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable buffering for faster responses
        proxy_buffering off;
        proxy_request_buffering off;

        # Optional: WebSocket support if needed
        # proxy_set_header Upgrade $http_upgrade;
        # proxy_set_header Connection "upgrade";
    }

    # Optional: increase timeouts if needed
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

```

Optimize

```bash

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.easysofts.net;

    # Redirect all HTTP requests to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.easysofts.net;

    # SSL certificate
    ssl_certificate /etc/letsencrypt/live/api.easysofts.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.easysofts.net/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'HIGH:!aNULL:!MD5';
    ssl_prefer_server_ciphers on;

    # Optional: HTTP/2
    http2_push_preload on;

    # Optimize buffer for JSON APIs
    client_max_body_size 50M;
    proxy_buffers 16 16k;
    proxy_buffer_size 32k;

    location / {
        # Forward to NestJS backend
        proxy_pass http://127.0.0.1:5001;

        # HTTP/1.1 for keep-alive
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Forward headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable buffering for faster API responses
        proxy_buffering off;
        proxy_request_buffering off;

        # WebSocket support (optional)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Optional: enable gzip compression
    gzip on;
    gzip_types application/json text/plain text/css application/javascript;
    gzip_min_length 256;
}

```