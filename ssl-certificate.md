# Secure Nginx with Let's Encrypt on Ubuntu 20.04

Let’s Encrypt is a Certificate Authority (CA) that provides an easy way to obtain and install free TLS/SSL certificates, thereby enabling encrypted HTTPS on web servers. It simplifies the process by providing a software client, Certbot, that attempts to automate most (if not all) of the required steps. Currently, the entire process of obtaining and installing a certificate is fully automated on both Apache and Nginx.

### Step 1 — Installing Certbot

he first step to using Let’s Encrypt to obtain an SSL certificate is to install the Certbot software on your server.

Install Certbot and it’s Nginx plugin with apt

```bash
$ sudo apt install certbot python3-certbot-nginx
```

Certbot is now ready to use, but in order for it to automatically configure SSL for Nginx, we need to verify some of Nginx’s configuration.

### Step 2 — Confirming Nginx’s Configuration

Certbot needs to be able to find the correct server block in your Nginx configuration for it to be able to automatically configure SSL. Specifically, it does this by looking for a server_name directive that matches the domain you request a certificate for.

If you followed the [server block set up step in the Nginx installation tutorial](https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-20-04), you should have a server block for your domain at /etc/nginx/sites-available/example.com with the server_name directive already set appropriately.

To check, open the configuration file for your domain using nano or your favorite text editor:

```bash
$ sudo nano /etc/nginx/sites-available/example.com
```

```bash
...
server_name example.com www.example.com;
...
```

If it does, exit your editor and move on to the next step.

If it doesn’t, update it to match. Then save the file, quit your editor, and verify the syntax of your configuration edits:

```bash
$ sudo nginx -t
```

If you get an error, reopen the server block file and check for any typos or missing characters. Once your configuration file’s syntax is correct, reload Nginx to load the new configuration:

```bash
$ sudo systemctl reload nginx
```

Certbot can now find the correct server block and update it automatically.

Next, let’s update the firewall to allow HTTPS traffic.

### Step 3 — Allowing HTTPS Through the Firewall

If you have the ufw firewall enabled, as recommended by the prerequisite guides, you’ll need to adjust the settings to allow for HTTPS traffic. Luckily, Nginx registers a few profiles with ufw upon installation.

You can see the current setting by typing:

```bash
$ sudo ufw status
```

It will probably look like this, meaning that only HTTP traffic is allowed to the web server:

```bash
Output
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx HTTP                 ALLOW       Anywhere
OpenSSH (v6)               ALLOW       Anywhere (v6)
Nginx HTTP (v6)            ALLOW       Anywhere (v6)
```

To additionally let in HTTPS traffic, allow the Nginx Full profile and delete the redundant Nginx HTTP profile allowance:

```bash
$ sudo ufw allow 'Nginx Full'
$ sudo ufw delete allow 'Nginx HTTP'
```

Your status should now look like this:

```bash
$ sudo ufw status
```

```bash
Output
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
OpenSSH (v6)               ALLOW       Anywhere (v6)
Nginx Full (v6)            ALLOW       Anywhere (v6)
```

Next, let’s run Certbot and fetch our certificates.

### Step 4 — Obtaining an SSL Certificate

Certbot provides a variety of ways to obtain SSL certificates through plugins. The Nginx plugin will take care of reconfiguring Nginx and reloading the config whenever necessary. To use this plugin, type the following:

```bash
$ sudo certbot --nginx -d example.com -d www.example.com
```

### Step 5 — Verifying Certbot Auto-Renewal

```bash
$ sudo systemctl status certbot.timer
```

To test the renewal process, you can do a dry run with certbot:

```bash
$ sudo certbot renew --dry-run
```
