## Create Own Certificate for SSL

A complete step-by-step guide to creating your own SSL certificate for local development on Nginx for your Mac M1, using /opt/homebrew/etc/nginx as the path for Nginx configuration.


### Step 1: Create the SSL Directory
You need a directory to store your SSL certificate and key. Since your Nginx is installed via Homebrew, we'll use /opt/homebrew/etc/nginx/ssl.

1. Open the terminal and create the directory:

```bash
sudo mkdir -p /opt/homebrew/etc/nginx/ssl
```

2. Set the correct permissions so that your user can write to this directory:

```bash
sudo chown -R $(whoami):admin /opt/homebrew/etc/nginx/ssl
```


### Step 2: Generate a Self-Signed SSL Certificate

Next, you will use OpenSSL to generate a self-signed certificate and a private key.

1. Run the following command to generate both the certificate and the key:

```bash 
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /opt/homebrew/etc/nginx/ssl/localhost.key -out /opt/homebrew/etc/nginx/ssl/localhost.crt
```

if you want to write for custom domain

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /opt/homebrew/etc/nginx/ssl/larapay.key -out /opt/homebrew/etc/nginx/ssl/larapay.crt
```



2. You will be prompted to enter details like Country, State, City, Organization, etc. For `Common Name`, make sure to enter `localhost`, as this is important for local development.


Example input: for localhost

```bash
Country Name (2 letter code) [AU]:US
State or Province Name (full name) [Some-State]:California
Locality Name (eg, city) []:San Francisco
Organization Name (eg, company) [Internet Widgits Pty Ltd]:My Local Dev
Organizational Unit Name (eg, section) []:
Common Name (eg, YOUR name) []:localhost
Email Address []:
```


Example input: for larapay.test
```bash
Country Name (2 letter code) [AU]:US
State or Province Name (full name) [Some-State]:California
Locality Name (eg, city) []:San Francisco
Organization Name (eg, company) [Internet Widgits Pty Ltd]:My Local Dev
Organizational Unit Name (eg, section) []:
Common Name (eg, YOUR name) []:larapay.test
Email Address []:
```


### Step 3: Configure Nginx for SSL

Now, you need to update your Nginx configuration to use the newly created certificate and key.

1. Open your Nginx configuration file. It should be located at `/opt/homebrew/etc/nginx/nginx.conf` or a site-specific configuration file under `/opt/homebrew/etc/nginx/servers/`.


Edit the configuration with your preferred editor (e.g., nano):

2. Find your server block for localhost and modify it to enable SSL. Here’s an example configuration:


```bash
server {
    listen 443 ssl;
    server_name localhost;

    ssl_certificate /opt/homebrew/etc/nginx/ssl/localhost.crt;
    ssl_certificate_key /opt/homebrew/etc/nginx/ssl/localhost.key;

    root /path/to/your/laravel/public;  # Adjust this to point to your Laravel app
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php-fpm.sock;  # Adjust if you're using a different PHP version
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```



3. Optionally, you can also redirect HTTP traffic to HTTPS by adding a server block like this: 

```bash
server {
    listen 80;
    server_name localhost;

    location / {
        return 301 https://$host$request_uri;
    }
}
```


### Step 4: Restart Nginx

After modifying the Nginx configuration, restart Nginx to apply the changes:

```bash
sudo nginx -s reload
```

### Server setup for larapay.test

1. Serves your Laravel application.
2. Redirects HTTP traffic to HTTPS.
3. Configures SSL using the self-signed certificate you've generated.


Nginx Configuration for `larapay.test` Domain:
First, ensure that your `larapay.test` domain is correctly added to your /etc/hosts file so that it points to localhost.

#### Step 1: Edit `/etc/hosts`


Add the following line to your `/etc/hosts` file to resolve larapay.test to localhost:

```bash
sudo nano /etc/hosts
```

Add the following line:

```bash
127.0.0.1 larapay.test
```

Save and exit.

#### Step 2: Create the Nginx Configuration File

Now, create a new Nginx configuration file for `larapay.test`.

1. Create the config file at `/opt/homebrew/etc/nginx/servers/larapay.test.conf` (or whatever path you have for your Nginx configurations)


```bash
sudo nano /opt/homebrew/etc/nginx/servers/larapay.test.conf
```

2. Add the following configuration:


```bash
# Redirect all HTTP traffic to HTTPS
server {
    listen 80;
    server_name larapay.test;

    # Redirect to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# SSL Configuration for larapay.test
server {
    listen 443 ssl;
    server_name larapay.test;

    # SSL Certificate and Key
    ssl_certificate /opt/homebrew/etc/nginx/ssl/larapay.test.crt;
    ssl_certificate_key /opt/homebrew/etc/nginx/ssl/larapay.test.key;

    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Root to Laravel public directory
    root /path/to/your/laravel/public;
    index index.php index.html;

    # Handle Laravel requests
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Handle PHP files
    location ~ \.php$ {
        fastcgi_pass unix:/opt/homebrew/var/run/php-fpm.sock; # Adjust if necessary
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
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


Update paths:
- Replace `/path/to/your/laravel/public` with the actual path to your Laravel app's public directory.
- Adjust the fastcgi_pass to the correct PHP socket or port. For M1 Macs, it's usually `/opt/homebrew/var/run/php-fpm.sock`.



#### Step 3: Restart Nginx

After configuring Nginx, restart the Nginx service to apply the new configuration:

```bash
sudo nginx -s reload
```


#### Step 4: Testing

1. Open your browser and visit `http://larapay.test`. It should automatically redirect to `https://larapay.test`.
If everything is set up correctly, you'll see your Laravel app being served over HTTPS.


2. If everything is set up correctly, you'll see your Laravel app being served over HTTPS.


#### Key Parts of the Configuration:

- HTTP to HTTPS redirection: The first server block listens on port 80 (HTTP) and redirects all traffic to HTTPS using a 301 redirect:

```bash
server {
    listen 80;
    server_name larapay.test;
    location / {
        return 301 https://$host$request_uri;
    }
}
```

- SSL Configuration: The second server block listens on port 443 (HTTPS) and uses the SSL certificate and key:

```bsh
server {
    listen 443 ssl;
    server_name larapay.test;
    ssl_certificate /opt/homebrew/etc/nginx/ssl/localhost.crt;
    ssl_certificate_key /opt/homebrew/etc/nginx/ssl/localhost.key;
}
```





