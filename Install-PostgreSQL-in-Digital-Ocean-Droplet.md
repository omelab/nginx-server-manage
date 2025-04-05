# Install PostgreSQL in Digital Ocean Droplet

First, make sure your droplet’s package lists are up to date. Run the following command:

```bash
sudo apt update
```

Then, install PostgreSQL:

```bash
sudo apt install postgresql postgresql-contrib

```

This will install PostgreSQL along with some additional utilities.

## Start and Enable PostgreSQL Service

After installation, ensure that PostgreSQL is running:

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql

```
 

##  Switch to the PostgreSQL User

PostgreSQL sets up a default user called postgres. To interact with the database, switch to this user:

```bash
sudo -i -u postgres
```
You’ll now be logged in as the postgres user.

## Access the PostgreSQL Shell

Once you’re the `postgres user`, access the PostgreSQL shell by typing:

```bash
psql

```
You should now be in the PostgreSQL command-line interface.

## Create a New Database

To create a new database, use the following SQL command:

```bash
CREATE DATABASE your_database_name;

```
You can also create a user and assign privileges to the database. For example, to create a new user:

```bash
CREATE USER your_username WITH PASSWORD 'your_password';

```

Grant the new user privileges on the database:

```bash
GRANT ALL PRIVILEGES ON DATABASE your_database_name TO your_username;

```



### Exit the PostgreSQL Shell

To exit the PostgreSQL shell, type:

```bsh
\q
```

### Configure Remote Access (Optional)

If you need to access the PostgreSQL database from outside the droplet (e.g., from your local machine or another server), you'll need to allow external connections.

Edit the PostgreSQL configuration file to allow remote connections:

Open the `postgresql.conf` file:

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```



Find the line that says listen_addresses and modify it to allow all addresses (or specify an IP):

```bash
listen_addresses = '*'
```
 

Modify the pg_hba.conf file to allow remote connections from specific IPs:

Open the file:

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf

```
Add this line at the end of the file to allow connections from a specific IP (replace your_ip_address):


```bash
host    all             all             your_ip_address/32            md5

```
If you want to allow all IPs, you can use 0.0.0.0/0, but this is less secure.

Restart PostgreSQL for the changes to take effect:

```bash
sudo systemctl restart postgresql
```

### Access the Database Remotely


Now, you can connect to your PostgreSQL database from a remote machine using a tool like psql or a GUI client like pgAdmin. You’ll need the droplet’s IP address, the PostgreSQL port (usually 5432), and the database credentials you set up.

For example:

```bash
psql -h your_droplet_ip -U your_username -d your_database_name -W
```

This will prompt you for the password and allow you to connect remotely.





