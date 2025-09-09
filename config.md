
## its working on mac local
```bash
server {
    listen 80;
    server_name watanabe.test;

    root  "/Users/abubakar/Workspace/watanabe/public";
    index index.php index.html index.htm;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php(.*)$ {
      fastcgi_pass  127.0.0.1:9000;
      fastcgi_index index.php;
      fastcgi_split_path_info ^((?U).+\.php)(/?.+)$;
      fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
      fastcgi_param PATH_INFO $fastcgi_path_info;
      fastcgi_param PATH_TRANSLATED $document_root$fastcgi_path_info;
      include    fastcgi_params;
    }

    #location ~ \.php$ {
    #    fastcgi_pass unix:/var/run/php/php8.3-fpm.sock; # Ensure this matches your PHP version and setup
    #    fastcgi_index index.php;
    #    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    #    include fastcgi_params;
    #}

    location ~ /\.ht {
        deny all;
    }
}
```



## its for aws server
```
server {
    listen 80;
    server_name 68.183.234.185;
    root /var/www/millennium/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
```


##  server config for api Node project
```bash
server {
    server_name vmsapi.jetliatl.com;

    # Serve static uploads directly
    location /uploads/ {
        alias /usr/share/nginx/jetliatl/vms_api/public/uploads/;
        autoindex off; # remove if you want directory listing
    }

    # Proxy API and other requests
    location / {
        proxy_pass http://localhost:3011;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/vmsapi.jetliatl.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/vmsapi.jetliatl.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = vmsapi.jetliatl.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name vmsapi.jetliatl.com;
    return 404; # managed by Certbot
}
```