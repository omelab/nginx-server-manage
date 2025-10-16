## Backup project folder Using zip command (Most Common)


Install zip if not available:

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install zip unzip

# CentOS/RHEL
sudo yum install zip unzip
```

Create zip file:

```bash
# Basic zip (includes folder structure)
zip -r project_name.zip /path/to/your/project/folder/

# Example:
zip -r my_project.zip /home/username/myproject/

# Exclude certain files/folders
zip -r my_project.zip /home/username/myproject/ -x "*/node_modules/*" "*.log" "*.tmp"

#Create zip with password:
zip -r -P yourpassword project_name.zip /path/to/project/folder/
```

Method 2: Using tar command (Alternative)

```bash
# Create compressed tar archive
tar -czvf project_name.tar.gz /path/to/your/project/folder/

# Example:
tar -czvf my_project.tar.gz /home/username/myproject/

# Exclude patterns
tar -czvf my_project.tar.gz --exclude='node_modules' --exclude='*.log' /home/username/myproject/
```
Verify your zip file:
```bash
# List contents
unzip -l project_name.zip

# Test integrity
unzip -t project_name.zip
```
 

SCP (Secure Copy):

```bash
# From your local machine
scp username@your_server_ip:/path/to/project_name.zip ./local_destination/
```

SFTP:

```bash
sftp username@your_server_ip
get /path/to/project_name.zip
```

Complete Workflow:

```bash
# 1. Navigate to your project
cd /home/username/

# 2. Create zip (excluding large/unnecessary folders)
zip -r myproject_backup.zip myproject/ -x "*/node_modules/*" "*/vendor/*" "*.git/*"

# 3. Verify
unzip -l myproject_backup.zip

# 4. Download to local machine
scp username@your_server_ip:/home/username/myproject_backup.zip ./
```







### Database

#### MySQL/MariaDB:

```bash
mysqldump -u username -p database_name > database_name.sql
```


Export all databases:

```bash
mysqldump -u username -p --all-databases > all_databases.sql
```


With compression:

```bash
mysqldump -u username -p database_name | gzip > database_name.sql.gz

```
MySQL/MariaDB Complete Backup:


```bash
#!/bin/bash
# Backup all MySQL databases with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p --all-databases | gzip > /backups/all_databases_$TIMESTAMP.sql.gz
```





#### PostgreSQL


Export single database:

```bash
pg_dump -U username database_name > database_name.sql
```


Export all databases:

```bash
pg_dumpall -U username > all_databases.sql
```



With custom format (compressed):

```bash
pg_dump -U username -Fc database_name > database_name.dump
```

PostgreSQL Complete Backup:

```bash

#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dumpall -U postgres | gzip > /backups/all_postgres_$TIMESTAMP.sql.gz
```


Download Database Files Using SCP:
```bash
# Download MySQL backup
scp username@your_server_ip:/path/to/database_backup.sql ./

# Download compressed backup
scp username@your_server_ip:/path/to/database_backup.sql.gz ./
```
 


#### MongoDB


Export single database:

```bash
mongodump --db database_name --out ./backup/
```


Export all databases:

```bash
mongodump --out ./backup/
```

With authentication:

```bash
mongodump --uri "mongodb://username:password@localhost:27017/database_name" --out ./backup/
```



#### Redis

Save and export:

```bash
# First, save current data
redis-cli SAVE

# Then copy the dump file
cp /var/lib/redis/dump.rdb ./redis_backup.rdb
```


Alternative method:

```bash
redis-cli --rdb ./redis_dump.rdb
```











