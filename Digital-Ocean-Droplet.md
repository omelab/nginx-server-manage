# Initial Protection for New Droplet (Anti‑Hack Setup)

This will secure your server so hackers cannot attack or enter easily.


## 🔒 1. Update the system immediately

```bash
sudo apt update && sudo apt upgrade -y

```
## 👤 2. Create a new admin user (don’t use root)

```bash

usermod -aG sudo newuser

```

## 🔑 3. Set up SSH Key authentication (MOST IMPORTANT)

On your local machine:

```bash

ssh-keygen -t ed25519 -C "newuser@172.168.100.1"

```
Press Enter to accept default paths, optionally set a passphrase.


Copy the public key to your droplet:

```bash

cat ~/.ssh/id_ed25519.pub

```

Then log in to your droplet via DigitalOcean console (web UI) and add it to ~/.ssh/authorized_keys for the new user:

```bash
mkdir -p ~/.ssh
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

```


Log in using Termux:

```bash
ssh newuser@172.168.100.1
```

It should log you in without needing a password.


## 🚫 4. Disable password login in SSH (prevents brute-force attacks)

Edit SSH config:


```bash

sudo nano /etc/ssh/sshd_config

```

Set:

```bash
Port 2222
PasswordAuthentication no
PermitRootLogin no

```
Save → restart SSH:

```bash
sudo systemctl restart ssh
```


🔥 5. Enable UFW Firewall

1. Allow only required ports:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 2222/tcp
sudo ufw reload
sudo ufw enable
```

If iptables:

```bash
sudo iptables -A INPUT -p tcp --dport 2222 -j ACCEPT
```

Test the new port before restarting

Open a new terminal session and try connecting:

```bash
ssh -p 2222 newuser@172.168.100.1

```

***⚠️Do not close your existing SSH session yet — this ensures you don’t lock yourself out.***


Restart SSH service:

```bash
sudo systemctl restart ssh
```


2. Check SSH configuration

Run on your server:


```bash
sudo grep -i ^Port /etc/ssh/sshd_config

```

You should see:

```bash
Port 2222
```

If not, edit the file again:

```bash
sudo nano /etc/ssh/sshd_config
```

and set `Port 2222`, then save.

Check for syntax errors

```bash
sudo sshd -t
```

* If it returns nothing, syntax is okay.
* If it shows an error, fix it before restarting.


Check if SSH is listening on the new port

```bash
sudo ss -tlnp | grep ssh
```

You should see something like:

```bash
LISTEN 0 128 0.0.0.0:2222 0.0.0.0:* users:(("sshd",pid,fd))
```

If you only see port 22, SSH hasn’t restarted or the config has errors.


3. Restart SSH service

```bash
sudo systemctl restart ssh
sudo systemctl status ssh
```

Make sure it says active (running) with no errors.

Verify listening port:
```bash
sudo ss -tlnp | grep ssh
```

You should now see 0.0.0.0:2222 and [::]:2222.


4. Allow port 2222 in firewall

```bash
sudo ufw allow 2222/tcp
sudo ufw delete allow 22/tcp   # optional, after confirming 2222 works
sudo ufw status

```


If iptables, check rules:

```bash
sudo iptables -L -n | grep 2222
```
Reload systemd and restart SSH properly

```bash
sudo systemctl daemon-reload
sudo systemctl restart sshd
sudo systemctl restart ssh.socket
```



You should now see something like:

```bash
LISTEN 0 4096 0.0.0.0:2222 0.0.0.0:* users:(("sshd",pid=...,fd=3))
LISTEN 0 4096 [::]:2222 [::]:* users:(("sshd",pid=...,fd=4))
```

*Disable socket activation (so sshd listens on ports defined in sshd_config):*

```bash
sudo systemctl stop ssh.socket
sudo systemctl disable ssh.socket
```

Restart SSH service:

```bash
sudo systemctl restart ssh
sudo systemctl status ssh
```

Verify SSH is listening on 2222

```bash
sudo ss -tlnp | grep ssh
```

You should now see 0.0.0.0:2222 and [::]:2222.


Test locally on the server

```bash
ssh -p 2222 abubakar@172.168.100.1
```



## 📦 6. Install Fail2Ban (protects against repeated SSH attempts)


```bash
sudo apt install fail2ban -y
```

Enable:

```bash
sudo systemctl enable fail2ban --now
```

Check Fail2Ban SSH jail for your custom port

Edit the jail configuration to ensure Fail2Ban watches port 2222:

```bash
sudo nano /etc/fail2ban/jail.local
```

Example configuration:

```bash
[sshd]
enabled = true
port = 2222
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
```

Restart Fail2Ban after changes:

```bash
sudo systemctl restart fail2ban
```


Check status and banned IPs:

```bash
sudo fail2ban-client status sshd
```


## 🧹 7. Remove unused services and packages

List active services:

```bash
systemctl list-units --type=service
```

Disable ones you don’t need:

```bash
sudo systemctl disable --now SERVICE_NAME
```

Remove unnecessary packages:

```bash
sudo apt autoremove -y
```



## 🛑 8. Install malware/crypto-miner protection

```bash
sudo apt install rkhunter chkrootkit -y
sudo rkhunter --update
sudo rkhunter --check
sudo chkrootkit
```
Install real-time malware scanner:

```bash
sudo apt install clamav clamav-daemon -y
sudo systemctl enable clamav-freshclam --now

```

## 🛡️ 10. Enable automatic security updates

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure unattended-upgrades
```


## 🧭 11. Monitor login attempts

```bash
sudo journalctl -u ssh --since "1 hour ago"
sudo cat /var/log/auth.log
```
You will see hackers trying — but they won't enter.




## ✅ STEP 1 — Install PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
```

Start and enable:

```bash
sudo systemctl enable --now postgresql
```

Check running:


```bash
sudo systemctl status postgresql
```


## ✅ STEP 2 — Set PostgreSQL password

Switch to postgres user:

```bash
sudo -i -u postgres
```

Open psql:

```bash
psql
```

Set password:

```bash
ALTER USER postgres WITH PASSWORD 'YOUR_PASSWORD';
```

Create a new PostgreSQL user

```bash
CREATE USER myuser WITH PASSWORD 'mypassword';
```

Give the user permission to create DB

```bash
ALTER USER myuser CREATEDB;
```
If you want SUPERUSER access (full power):

```bash
ALTER USER myuser WITH SUPERUSER;
```

Grant permissions on a specific database

```bash
GRANT ALL PRIVILEGES ON DATABASE mydb TO myuser;
```

Grant access to all tables inside the database
Switch to the database:

```bash
\c mydb

```


Give full access to tables:

```bash
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO myuser;
```

Give access to sequences:

```bash
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO myuser;
```


Allow creating new objects:

```bash
ALTER SCHEMA public OWNER TO myuser;
```


Exit:

```bash
\q
exit
```


***Restore Backup***

Step 1: Switch to the PostgreSQL superuser

```bash
sudo -i -u postgres
```

* sudo -i → runs a login shell as another user
* -u postgres → switches to the Linux user postgres, which is the PostgreSQL superuser
* After this, any commands you run are executed as postgres
* You can verify this with:

```bash
whoami
# Output: postgres
```

✅ You are now the postgres Linux user and can manage databases without needing passwords.


Create a backup directory

```bash
mkdir -p /tmp/postgresql/backups
```

* mkdir -p → creates directories, including parent directories if they don’t exist
* /tmp/postgresql/backups → chosen location for backups
* Using /tmp ensures easy read/write access without permission issues

*Backup the database*

```bash
pg_dump database_name > /tmp/postgresql/backups/database_name.sql
```

* pg_dump database_name → creates a logical SQL backup of the database database_name
* > → redirects the output to a file
* /tmp/postgresql/backups/database_name.sql → file where the backup is saved
* This file contains all CREATE TABLE, INSERT, and other SQL statements to recreate your database

*Set proper ownership*

```bash
sudo chown postgres:postgres /tmp/postgresql/backups/database_name.sql
```
* chown postgres:postgres → changes the owner and group of the file to postgres
* This ensures that the postgres user can read/write the file

*Set file permissions*

```bash
sudo chmod 600 /tmp/postgresql/backups/database_name.sql
```
* chmod 600 → sets read/write permissions only for the owner
* Prevents other users from reading or modifying the backup file
* Security best practice for database backups

*Restore the backup to a new database*

```bash
sudo -u postgres psql -d new_db -f /tmp/postgresql/backups/database_name.sql
```

* sudo -u postgres → ensures the command runs as postgres user
* psql -d new_db → connect to the target database new_db
* -f /tmp/postgresql/backups/database_name.sql → tells PostgreSQL to execute all SQL statements in the backup file
* This will insert all tables, sequences, data, and types from the backup into new_db


*Verify the restore*

```bash
sudo -u postgres psql -d new_db
\dt   # lists all tables in the database
\q    # exit psql

```
This confirms that your database has been restored successfully.
 


🔐 STEP 3 — Allow PostgreSQL to listen on localhost

(Do NOT open for public — you will use SSH tunnel only)

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

find
```bash
#listen_addresses = 'localhost'
```
Make sure it is:

```bash
listen_addresses = 'localhost'
```




***Fix File Permissions:***

```bash
# Check current permissions
ls -la vms_data.sql

# Change permissions so postgres can read it
chmod 644 vms_data.sql

# Also change ownership to postgres
chown postgres:postgres vms_data.sql

# Now try again
sudo -u postgres psql -d vms_db -f vms_data.sql
```
 Copy to Accessible Location


 ```bash
 # Copy to /tmp and set permissions
cp vms_data.sql /tmp/vms_restore.sql
chmod 644 /tmp/vms_restore.sql
chown postgres:postgres /tmp/vms_restore.sql

# Restore from /tmp
sudo -u postgres psql -d vms_db -f /tmp/vms_restore.sql
```
