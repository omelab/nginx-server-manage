
## its working on mac local
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




## its for aws server
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

