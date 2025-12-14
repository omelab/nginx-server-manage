
## its working on mac local
```bash
server {
    listen 80;
    server_name test.test;

    root  "/Users/test/Workspace/test/public";
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
    server_name 13.32.332.33;
    root /var/www/test/public;
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
    server_name test.com;

    # Serve static uploads directly
    location /uploads/ {
        alias /uploads/;
        autoindex off; # remove if you want directory listing
    }

    # Proxy API and other requests
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = test.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name test.com;
    return 404; # managed by Certbot
}
```