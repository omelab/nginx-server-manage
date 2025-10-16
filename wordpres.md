## comprehensive nginx configuration for your WordPress site

`http://requisition.abc.com/`

```bash
server {
    listen 80;
    listen [::]:80;
    
    server_name requisition.abc.com;
    root /var/www/requisition.abc.com;
    index index.php index.html index.htm;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # WordPress permalinks
    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    # Handle PHP files
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        
        # Security
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_param PATH_INFO $fastcgi_path_info;
        fastcgi_param PATH_TRANSLATED $document_root$fastcgi_path_info;
    }

    # Deny access to sensitive files
    location ~ /\.ht {
        deny all;
    }

    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ /(readme\.html|license\.txt|wp-config\.php|wp-config-sample\.php|wp-includes/version\.php) {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Cache static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        application/atom+xml
        application/geo+json
        application/javascript
        application/x-javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rdf+xml
        application/rss+xml
        application/xhtml+xml
        application/xml
        font/eot
        font/otf
        font/ttf
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;

    # WordPress REST API and admin area
    location ~* /wp-json/ {
        rewrite ^ /index.php?rest_route= last;
    }

    location /wp-admin/ {
        index index.php;
        try_files $uri $uri/ /wp-admin/index.php?$args;
    }

    # File upload size limit
    client_max_body_size 64M;

    # Logging
    access_log /var/log/nginx/requisition.abc.com.access.log;
    error_log /var/log/nginx/requisition.abc.com.error.log;
}

# Redirect www to non-www (optional - remove if you need www)
server {
    listen 80;
    listen [::]:80;
    server_name www.requisition.abc.com;
    return 301 http://requisition.abc.com$request_uri;
}
```

### Additional Setup Requirements:

1. Create the web directory:

```bash
sudo mkdir -p /var/www/requisition.abc.com
sudo chown -R www-data:www-data /var/www/requisition.abc.com
```


### 2. WordPress Installation:
1. Method 1: Using wget (Recommended)

```bash
# Navigate to the web directory
cd /var/www/requisition.jetliatl.com

# Download the latest WordPress
sudo wget https://wordpress.org/latest.tar.gz

# Extract WordPress
sudo tar -xzvf latest.tar.gz

# Move all WordPress files to the current directory
sudo mv wordpress/* ./
sudo mv wordpress/.* ./

# Remove the empty wordpress directory and tar file
sudo rmdir wordpress
sudo rm latest.tar.gz

# Set proper ownership
sudo chown -R www-data:www-data /var/www/requisition.jetliatl.com

# Set proper permissions
sudo find /var/www/requisition.jetliatl.com -type d -exec chmod 755 {} \;
sudo find /var/www/requisition.jetliatl.com -type f -exec chmod 644 {} \;
```


### Method 2: Using curl

```bash
# Navigate to the web directory
cd /var/www/requisition.jetliatl.com

# Download and extract WordPress in one command
sudo curl -O https://wordpress.org/latest.tar.gz
sudo tar -xzvf latest.tar.gz
sudo mv wordpress/* ./
sudo mv wordpress/.* ./
sudo rmdir wordpress
sudo rm latest.tar.gz

# Set permissions
sudo chown -R www-data:www-data /var/www/requisition.jetliatl.com
sudo find /var/www/requisition.jetliatl.com -type d -exec chmod 755 {} \;
sudo find /var/www/requisition.jetliatl.com -type f -exec chmod 644 {} \;
```


### Method 3: Manual Download and Upload

If you prefer a graphical interface:

    - Go to https://wordpress.org/download/
    - Download the latest WordPress zip file
    - Extract it on your local machine
    - Upload all files to /var/www/requisition.jetliatl.com using SFTP/FTP
    - Set permissions as shown above


### Complete Setup Script
Here's a complete script that handles the entire process:

```bash
#!/bin/bash

# Define variables
SITE_DIR="/var/www/requisition.jetliatl.com"
SITE_URL="http://requisition.jetliatl.com"

# Create directory if it doesn't exist
sudo mkdir -p $SITE_DIR
cd $SITE_DIR

# Download and extract WordPress
echo "Downloading WordPress..."
sudo wget -q https://wordpress.org/latest.tar.gz

echo "Extracting WordPress..."
sudo tar -xzf latest.tar.gz

echo "Moving files..."
sudo mv wordpress/* ./
sudo mv wordpress/.* ./

echo "Cleaning up..."
sudo rmdir wordpress
sudo rm latest.tar.gz

# Set permissions
echo "Setting permissions..."
sudo chown -R www-data:www-data $SITE_DIR
sudo find $SITE_DIR -type d -exec chmod 755 {} \;
sudo find $SITE_DIR -type f -exec chmod 644 {} \;

# Set special permissions for wp-content
sudo chmod -R 775 $SITE_DIR/wp-content/

echo "WordPress downloaded successfully to $SITE_DIR"
echo "Files and directories are ready for installation"
```


Post-Installation Steps:

1. Create WordPress Configuration:

```bash
# Copy the sample config file
cd /var/www/requisition.jetliatl.com
sudo cp wp-config-sample.php wp-config.php

# Set secure permissions for wp-config.php
sudo chmod 640 wp-config.php

```



2. Create Database:

```bash
-- Login to MySQL as root
mysql -u root -p

-- Create database and user
CREATE DATABASE requisition_db;
CREATE USER 'requisition_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON requisition_db.* TO 'requisition_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

```


3. Edit wp-config.php:

Update the following lines in wp-config.php

```bash
// ** Database settings - You can get this info from your web host ** //
define( 'DB_NAME', 'requisition_db' );
define( 'DB_USER', 'requisition_user' );
define( 'DB_PASSWORD', 'strong_password' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

// Set site URLs
define( 'WP_HOME', 'http://requisition.jetliatl.com' );
define( 'WP_SITEURL', 'http://requisition.jetliatl.com' );

// Generate authentication keys from: https://api.wordpress.org/secret-key/1.1/salt/
```


### 4. Set proper permissions::

```bash
# Verify ownership and permissions
sudo ls -la /var/www/requisition.jetliatl.com/

# The output should show www-data as owner and proper permissions
sudo find /var/www/requisition.jetliatl.com -type d -exec chmod 755 {} \;
sudo find /var/www/requisition.jetliatl.com -type f -exec chmod 644 {} \;
sudo chmod -R 775 /var/www/requisition.jetliatl.com/wp-content/

```

Final Permission Check:
```bash
# Verify ownership and permissions
sudo ls -la /var/www/requisition.jetliatl.com/

# The output should show www-data as owner and proper permissions
```

### 5. PHP-FPM Configuration:

Make sure PHP-FPM is installed and running. Adjust the PHP version in the config (php8.1-fpm.sock) to match your installed version.

4. Enable the site:

```bash
# Move config to sites-available
sudo cp your-config-file /etc/nginx/sites-available/requisition.jetliatl.com

# Create symlink to sites-enabled
sudo ln -s /etc/nginx/sites-available/requisition.jetliatl.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 6. WordPress wp-config.php:

Make sure your wp-config.php has the correct database settings and:

```bash
define('WP_HOME', 'http://requisition.jetliatl.com');
define('WP_SITEURL', 'http://requisition.jetliatl.com');
```


