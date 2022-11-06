# Nginx Server Setup

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

Nginx is one of the most popular web servers in the world and is responsible for hosting some of the largest and highest-traffic sites on the internet.

## Install Nginx

#### Step 1 update and install

```
  sudo apt update
  sudo apt install nginx
```

#### Step 2 – Adjusting the Firewall

```
  sudo ufw app list
```

You should get a listing of the application profiles:

```
Output
Available applications:
  Nginx Full
  Nginx HTTP
  Nginx HTTPS
  OpenSSH
```

You can enable this by typing:

```
sudo ufw allow 'Nginx HTTP'
```

You can verify the change by typing:

```
sudo ufw status
```

The output will indicated which HTTP traffic is allowed:

```
Output
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx HTTP                 ALLOW       Anywhere
OpenSSH (v6)               ALLOW       Anywhere (v6)
Nginx HTTP (v6)            ALLOW       Anywhere (v6)
```

if output will
`Status: inactive` just run `ufw enable`

now you will check status by `sudo ufw status` output

```
Status: active

To                         Action      From
--                         ------      ----
Nginx HTTP                 ALLOW       Anywhere
Nginx HTTP (v6)            ALLOW       Anywhere (v6)
```

#### Step 3 – Checking your Web Server

We can check with the systemd init system to make sure the service is running by typing:
`systemctl status nginx`

```
output
● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; preset: enabled)
     Active: active (running) since Sun 2022-11-06 11:57:54 UTC; 11min ago
       Docs: man:nginx(8)
    Process: 2611 ExecStartPre=/usr/sbin/nginx -t -q -g daemon on; master_process on; (code=exited, status=0/SUCCESS)
    Process: 2612 ExecStart=/usr/sbin/nginx -g daemon on; master_process on; (code=exited, status=0/SUCCESS)
   Main PID: 2711 (nginx)
      Tasks: 2 (limit: 2323)
     Memory: 3.3M
        CPU: 28ms
     CGroup: /system.slice/nginx.service
             ├─2711 "nginx: master process /usr/sbin/nginx -g daemon on; master_process on;"
             └─2714 "nginx: worker process"
```

As confirmed by this out, the service has started successfully. However, the best way to test this is to actually request a page from Nginx.
You can access the default Nginx landing page to confirm that the software is running properly by navigating to your server’s IP address.

`curl -4 bdrentz.com`

When you have your server’s IP address, enter it into your browser’s address bar:

```
http://your_server_ip
```

#### Step 4 – Managing the Nginx Process

To stop your web server, type:
`sudo systemctl stop nginx`

To start the web server when it is stopped, type:
`sudo systemctl start nginx`

To stop and then start the service again, type:
`sudo systemctl restart nginx`

If you are only making configuration changes, Nginx can often reload without dropping
connections. To do this, type:
`sudo systemctl reload nginx`

By default, Nginx is configured to start automatically when the server boots.
If this is not what you want, you can disable this behavior by typing:
`sudo systemctl disable nginx`

To re-enable the service to start up at boot, you can type:
`sudo systemctl enable nginx`

#### Step 5 – Setting Up Server Blocks (Recommended)

Create the directory for your_domain as follows, using the -p flag to create any necessary parent directories:

`sudo mkdir -p /var/www/your_domain/html`

Next, assign ownership of the directory with the $USER environment variable:

`sudo chown -R $USER:$USER /var/www/your_domain/html`

The permissions of your web roots should be correct if you haven’t modified your umask value, which sets default file permissions. To ensure that your permissions are correct and allow the owner to read, write, and execute the files while granting only read and execute permissions to groups and others, you can input the following command:

`sudo chmod -R 755 /var/www/your_domain`

Next, create a sample index.html page using nano or your favorite editor:

`sudo nano /var/www/your_domain/html/index.html`

Inside, add the following sample HTML:

```
<html>
    <head>
        <title>Welcome to your_domain!</title>
    </head>
    <body>
        <h1>Success!  The your_domain server block is working!</h1>
    </body>
</html>
```

Save and close the file by pressing Ctrl+X to exit, then when prompted to save, Y and then Enter.

In order for Nginx to serve this content, it’s necessary to create a server block with the
correct directives. Instead of modifying the default configuration file directly,
let’s make a new one at /etc/nginx/sites-available/your_domain

`sudo nano /etc/nginx/sites-available/your_domain`

Paste in the following configuration block, which is similar to the default,
but updated for our new directory and domain name:

```
server {
        listen 80;
        listen [::]:80;

        root /var/www/your_domain/html;
        index index.html index.htm index.nginx-debian.html;

        server_name your_domain www.your_domain;

        location / {
                try_files $uri $uri/ =404;
        }
}
```

Notice that we’ve updated the root configuration to our new directory, and the server_name to our domain name.

`sudo ln -s /etc/nginx/sites-available/your_domain /etc/nginx/sites-enabled/`

To avoid a possible hash bucket memory problem that can arise from adding additional server names, it is necessary to adjust a single value in the /etc/nginx/nginx.conf file. Open the file:

`sudo nano /etc/nginx/nginx.conf`

Find the server_names_hash_bucket_size directive and remove the # symbol to uncomment the line. If you are using nano, you can quickly search for words in the file by pressing CTRL and w.

```
...
http {
    ...
    server_names_hash_bucket_size 64;
    ...
}
...
```

Save and close the file when you are finished.

Next, test to make sure that there are no syntax errors in any of your Nginx files:

`sudo nginx -t`

If there aren’t any problems, restart Nginx to enable your changes:

`sudo systemctl restart nginx`

#### Step 6 – Getting Familiar with Important Nginx Files and Directories

Content

`/var/www/html:` The actual web content, which by default only consists of the default Nginx page you saw earlier, is served out of the `/var/www/html` directory. This can be changed by altering Nginx configuration files.

Server Configuration

`/etc/nginx:` The Nginx configuration directory. All of the Nginx configuration files reside here.

`/etc/nginx/nginx.conf:`

The main Nginx configuration file. This can be modified to make changes to the Nginx global configuration.

`/etc/nginx/sites-available/: `

The directory where per-site server blocks can be stored. Nginx will not use the configuration files found in this directory unless they are linked to the sites-enabled directory. Typically, all server block configuration is done in this directory, and then enabled by linking to the other directory.

`/etc/nginx/sites-enabled/:`

The directory where enabled per-site server blocks are stored. Typically, these are created by linking to configuration files found in the sites-available directory.

`/etc/nginx/snippets:`

This directory contains configuration fragments that can be included elsewhere in the Nginx configuration. Potentially repeatable configuration segments are good candidates for refactoring into snippets.

Server Logs
` /var/log/nginx/access.log:`

Every request to your web server is recorded in this log file unless Nginx is configured to do otherwise.

`/var/log/nginx/error.log:`

Any Nginx errors will be recorded in this log.

## Step 2 — Installing MySQL

Again, use apt to acquire and install this software:

`sudo apt install mysql-server`

When prompted, confirm installation by typing Y, and then ENTER.

When the installation is finished, it’s recommended that you run a security script that comes pre-installed with MySQL. This script will remove some insecure default settings and lock down access to your database system. Start the interactive script by running:

Terminate the mysql_secure_installation from another terminal using the killall command:

```
sudo killall -9 mysql_secure_installation
```

Start the mysql client:

```
sudo mysql
```

Run the following SQL query:

```
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'SetRootPasswordHere';
```

```
exit
```

Then run the following command to secure it:

```
sudo mysql_secure_installation
```

When promoted for the password enter the SetRootPasswordHere (or whatever you set when you ran the above SQL query)

###

## Help resources

- [LEMP stack](https://www.digitalocean.com/community/tutorials/how-to-install-linux-nginx-mysql-php-lemp-stack-on-ubuntu-20-04)
- [ufw Enable](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-firewall-with-ufw-on-ubuntu-22-04)
- [nstall and Configure Laravel 8](https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-laravel-with-lemp-on-ubuntu-18-04)
- [install php7.2 on ubuntu 20.4](https://www.rosehosting.com/blog/how-to-install-php-7-4-with-nginx-on-ubuntu-20-04/)
- [Enother help for php 7.4](https://www.cloudbooklet.com/install-nginx-php-7-4-lemp-stack-on-ubuntu-18-04-google-cloud/)
- [Docker Compose with laravel](https://www.digitalocean.com/community/tutorials/how-to-set-up-laravel-nginx-and-mysql-with-docker-compose-on-ubuntu-20-04)

## Authors

- [@Abu Bakar Siddique](https://github.com/omelab)
