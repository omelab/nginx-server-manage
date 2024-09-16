```bash
# Redirect all HTTP traffic to HTTPS
server {
    listen 80;
    server_name yourdomain.test;

    # Redirect to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# SSL Configuration for yourdomain.test
server {
    listen 443 ssl;
    server_name yourdomain.test;

    # SSL Certificate and Key
    ssl_certificate /opt/homebrew/etc/nginx/ssl/yourdomain.crt;
    ssl_certificate_key /opt/homebrew/etc/nginx/ssl/yourdomain.key;

    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5; 

    # Root to Laravel public directory 
    root  "/Users/abubakar/Workspace/yourdomain/public";
    index index.php index.html;

    # Handle Laravel requests
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Handle PHP files
    location ~ \.php(.*)$ {
     fastcgi_pass  127.0.0.1:9000;
     fastcgi_index index.php;
     fastcgi_split_path_info ^((?U).+\.php)(/?.+)$;
     fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
     fastcgi_param PATH_INFO $fastcgi_path_info;
     fastcgi_param PATH_TRANSLATED $document_root$fastcgi_path_info;
     include    fastcgi_params;
    }
  
    # Static assets caching
    location ~* \.(jpg|jpeg|gif|png|css|js|ico|svg)$ {
        expires max;
        log_not_found off;
    }

    # Deny access to .htaccess (optional, as Nginx doesn't use .htaccess)
    location ~ /\.ht {
        deny all;
    }
}


```
