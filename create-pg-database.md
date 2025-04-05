## create a PostgreSQL database and user

create a PostgreSQL database and user following the connection string, you can run the following SQL commands in your PostgreSQL environment. The commands assume you have administrative access to the database (e.g., via the postgres user).

### Connect to PostgreSQL: Open a terminal and run:

```bash
 sudo -i -u postgres
```


### Create the User:

```bash
CREATE USER user_name WITH PASSWORD '*********';

```


### Create the Database:

```
CREATE DATABASE database_name OWNER user_name;
```


### Grant Privileges:

```bash
GRANT ALL PRIVILEGES ON DATABASE database_name TO user_name;
```



### Set Default Schema (if public isn't the default schema):

```bash
ALTER ROLE olympia SET search_path TO public;
```

 
### Verify the Connection

```bash
 psql postgresql://user:password@localhost:5432/olympia
 ````


