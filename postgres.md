# End tTo End PostgreSQL Guide

Below is a complete, end-to-end PostgreSQL guide written for Linux servers (Ubuntu/Debian).
You can follow it top to bottom and you’ll have:

✅ PostgreSQL installed
✅ Secure users & passwords
✅ Database created
✅ Dump restored
✅ Backups created
✅ PostgreSQL secured
✅ Automatic backups to Google Drive



## 🔹 1. Install PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
```

Check status:

```bash
sudo systemctl status postgresql
```

## 🔹 2. Access PostgreSQL as Admin

```bash
sudo -u postgres psql
```
You should see the PostgreSQL prompt:

```sql
postgres=# 
```

## 🔹 3. Reset postgres default password

```bash
ALTER USER postgres WITH PASSWORD 'StrongPasswordHere';
```
Exit:

```bash
\q
```

## 🔹 4. Create a New Database and User

Access PostgreSQL again:

```bash
sudo -u postgres psql
```

Create User

```sql
CREATE USER myuser WITH ENCRYPTED PASSWORD 'UserStrongPasswordHere'; 
ALTER USER myuser CREATEDB;
```

Create New User:

```sql
CREATE DATABASE myuser OWNER easy_user;
```

Grant all privileges on the database to the user:

```sql
GRANT ALL PRIVILEGES ON DATABASE mydatabase TO myuser;

\q
exit;
```

## 🔹 6. Configure Authentication (IMPORTANT)

Edit config:

```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

Change:

```sql
local   all   postgres   peer
local   all   all        peer
```

To: 
```sql
local   all   postgres   md5
local   all   all        md5
```

Restart:

```bash
sudo systemctl restart postgresql
```

## 🔹 7. Take Database Backup (Manual)

Custom format (.dump)

```bash
sudo -u postgres pg_dump -d myuser -F c -f /tmp/my_db_$(date +%F).dump
```
SQL format :

```bash
sudo -u postgres pg_dump -d myuser -F p -f /tmp/my_db_$(date +%F).sql
```
 

## 🔹 8. Restore Your Dump File

(Recommended location)

```bash
sudo cp my_db.dump /tmp/
sudo chown postgres:postgres /tmp/my_db.dump
```

Restore:

```bash
sudo -u postgres pg_restore -d myuser --clean --if-exists /tmp/my_db.dump
```



## 🔹 9. Secure PostgreSQL (CRITICAL)

1️⃣ Listen only locally

Edit:

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Set:

```ini
listen_addresses = 'localhost'
```

Restart:

```bash
sudo systemctl restart postgresql
```

2️⃣ Firewall (UFW)

```bash
sudo ufw allow from 127.0.0.1 to any port 5432
sudo ufw enable
```

3️⃣ Disable remote root access

Never allow:

```nginx
host all postgres 0.0.0.0/0 md5
```

## 🔹 10. Install Google Drive Sync (rclone)

```bash
sudo apt install -y rclone
```

Configure:

```bash
rclone config
```

Choose:

```bash
n → new remote
name → gdrive
storage → Google Drive
scope → full
```

Login in browser when prompted.

Test:

```bash
rclone ls gdrive:
```

## 🔹 11. Auto Backup Script (Daily)

Create backup directory

```bash
sudo mkdir /var/backups/postgres
sudo chown postgres:postgres /var/backups/postgres
```

Create script

```bash
sudo nano /usr/local/bin/pg_backup.sh
```

Paste:

```bash
#!/bin/bash

DATE=$(date +%F)
BACKUP_DIR="/var/backups/postgres"
DB_NAME="easy_dev"

sudo -u postgres pg_dump -d $DB_NAME -F c -f $BACKUP_DIR/$DB_NAME-$DATE.dump

rclone copy $BACKUP_DIR gdrive:postgres-backups --log-file=/var/log/rclone.log
```

Make executable:

```bash
sudo chmod +x /usr/local/bin/pg_backup.sh
```

## 🔹 12. Schedule Auto Backup (CRON)

```bash
sudo crontab -e
```

Add:

```bash
0 2 * * * /usr/local/bin/pg_backup.sh
```

✔ Runs daily at 2 AM

## 🔹 13. Restore From Google Drive Backup

```bash
rclone copy gdrive:postgres-backups /tmp
sudo -u postgres pg_restore -d easy_dev --clean --if-exists /tmp/easy_dev-YYYY-MM-DD.dump
```

Replace `YYYY-MM-DD` with the desired date.

## 🎉 Conclusion

✅ Strong passwords
✅ md5 auth only
✅ Backups outside web root
✅ Firewall enabled
✅ Least privilege users
✅ Auto backups off-server

✔ Secure PostgreSQL
✔ Backup + Restore
✔ Auto backups to Google Drive
✔ Disaster recovery ready