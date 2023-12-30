```php
server{
    listen 80;
    server_name news-portal-api.24onbd.com;
    client_max_body_size 50M;

    ######## enable gzip ########
    # To enable gzip include the following block (recommended)

    gzip on;
    gzip_vary on;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_buffers 16 8k;
    gzip_comp_level 6;
    gzip_http_version 1.1;
    gzip_types
    text/xml application/xml application/atom+xml application/rss+xml application/xhtml+xml image/svg+xml
    text/javascript application/javascript application/x-javascript
    text/x-json application/json application/x-web-app-manifest+json
    text/css text/plain text/x-component
    font/opentype application/x-font-ttf application/vnd.ms-fontobject
    image/x-icon;
    gzip_disable "MSIE [1-6]\.";
    ################################################################

    access_log  off;
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    location / {
        proxy_http_version 1.1; 
        proxy_headers_hash_max_size 1024;
        proxy_headers_hash_bucket_size 228; 
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass $http_upgrade;
        proxy_pass http://localhost:6001;
    } 
}
```

