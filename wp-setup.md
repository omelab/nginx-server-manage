## Deploy WordPress on DigitalOcean Using Nginx (Ubuntu)


🔧 Prerequisites

- A fresh Ubuntu 22.04 droplet on DigitalOcean
- A registered domain name (e.g. yourdomain.com)
- You’ve pointed your domain to your droplet's IP via A record


🪛 Step-by-Step Setup

1️⃣ Update and install required packages

```bash
 sudo apt update && sudo apt upgrade -y
```

 
2️⃣ Install Nginx
 
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```



3️⃣ Install MySQL and create a DB for WordPress

```bash
sudo apt install mysql-server -y
sudo mysql_secure_installation
```



Then create the database:

```bash
sudo mysql -u root -p

CREATE DATABASE wordpress_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER 'wp_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON wordpress_db.* TO 'wp_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

```


4️⃣ Install PHP + necessary extensions


```bash
sudo apt install php-fpm php-mysql php-curl php-gd php-mbstring php-xml php-xmlrpc php-soap php-intl php-zip unzip -y

```

5️⃣ Download and configure WordPress

```bash
cd /var/www
sudo wget https://wordpress.org/latest.tar.gz
sudo tar -xvzf latest.tar.gz
sudo mv wordpress yourdomain.com
sudo chown -R www-data:www-data /var/www/yourdomain.com
sudo chmod -R 755 /var/www/yourdomain.com

```



6️⃣ Configure Nginx for WordPress

```bash
sudo nano /etc/nginx/sites-available/yourdomain.com

```

Paste this:

```bash
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/yourdomain.com;
    index index.php index.html index.htm;

    access_log /var/log/nginx/yourdomain.access.log;
    error_log /var/log/nginx/yourdomain.error.log;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock; # Change version if needed
    }

    location ~ /\.ht {
        deny all;
    }
}

```



Enable the config:

```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

```

7️⃣ Optional: Add SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

```

Certbot will automatically configure HTTPS and redirect.


8️⃣ Complete WordPress Setup in Browser


Go to:

http://yourdomain.com (or https:// if SSL is enabled)

Fill in:

Database Name: wordpress_db 
Username: wp_user 
Password: your_secure_password

Click Install, and you're done 




🔒 Enable HTTPS (SSL) on WordPress + Nginx via Let's Encrypt


Prerequisites:
- Domain already pointed to your droplet (via A record) 
- Nginx installed and running 
- WordPress site already accessible via http://yourdomain.com




🧰 1. Install Certbot (Let's Encrypt)

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

```



🌐 2. Request and Install SSL Certificate

Run this command, replacing your domain:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

```

Certbot will:

    - Automatically obtain the SSL certificate

    - Update your Nginx config with HTTPS support

    - Add a 301 redirect from HTTP to HTTPS (if you agree)

Follow the interactive prompts (choose to redirect all traffic to HTTPS)



🔁 3. Verify Auto-Renewal (Important!)

Certbot installs a cron job automatically. You can test it with:

```bash
sudo certbot renew --dry-run
```




📂 4. Nginx Config After HTTPS (for reference)

Your updated config (/etc/nginx/sites-available/yourdomain.com) will look like this:

```bash
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/yourdomain.com;
    index index.php index.html index.htm;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}

```



🌐 5. Test

Visit: https://yourdomain.com

✅ You should see the lock icon indicating the site is secure.



📁 Open Your Nginx Site Config

Edit your WordPress site config (replace with your actual domain name):

```bash
sudo nano /etc/nginx/sites-available/yourdomain.com
```



🔧 Example of Correct HTTPS Nginx Configuration:

```bash
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

# HTTPS Server Block
server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/yourdomain.com;
    index index.php index.html index.htm;

    # SSL certificate from Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Recommended SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    access_log /var/log/nginx/yourdomain.access.log;
    error_log /var/log/nginx/yourdomain.error.log;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;  # Update to match your PHP version
    }

    location ~ /\.ht {
        deny all;
    }
}

```



✅ Enable the Config (If Not Already)

```bash
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/

```



🔍 Test & Reload Nginx

```bash
sudo nginx -t

```

If you see:

```bash
nginx: configuration file /etc/nginx/nginx.conf test is successful

```

Then reload:

```bash
sudo systemctl reload nginx
```



🔁 Test HTTPS in Browser

Go to:
https://yourdomain.com

Make sure:

- The site loads over HTTPS 
- A padlock appears in the browser 
- No certificate errors show






