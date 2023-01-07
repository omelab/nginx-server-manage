## Implementation of Mac M1 Nginx Configuration Multisite

Description: nginx installed through brew

Website Root:/opt/homebrew/var/www

nginx configuration directory:/opt/homebrew/etc/nginx/

Assumption: There is a project name TestProject and a domain name bd. testproject. com

### Step 1: Set IP to domain name mapping (that is, add hosts)

```bash
#  Terminal
vim /etc/hosts

#  Add Save
127.0.0.1  bd.testproject.com
```

### Step 2: Create a new site profile directory

```bash
#  Terminal
mkdir /opt/homebrew/etc/nginx/vhosts
```

### Step 3: Create a new site profile

Create a new configuration file named bd. testproject. com_80.conf in the /opt/homebrew/etc/nginx/vhosts directory with the following configuration file contents (you can change the configuration contents as needed):

```bash
server {
    listen    80;
    server_name bd.testproject.com;
    root  "/opt/homebrew/var/www/bd.testproject.com";
    location / {
      index index.php index.html error/index.html;

      autoindex off;
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
}
```

### Step 4: Introduce site configuration in the nginx default configuration file

```bash
#  Terminal
vim /opt/homebrew/etc/nginx/nginx.conf

#  In a file  http{}  Add in
server_names_hash_bucket_size 64; #  Modify the server name length , Only for  32  Multiple of
include /opt/homebrew/etc/nginx/vhosts/*; #  Introducing site configuration
```

### Step 5: Restart nginx

```bash
#  Terminal
nginx -s reload
```

Ignore me and start fastcgi

```bash
/usr/local/php/bin/php-cgi -b 9000
```
