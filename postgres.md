Based on [this blogpost](https://www.codementor.io/@engineerapart/getting-started-with-postgresql-on-mac-osx-are8jcopb).

Install with Homebrew:

```bash
$ brew install postgresql
```

Run server:

```bash
$ brew services start postgresql@14
```

for background run:

```bash
$ pg_ctl -D /opt/homebrew/var/postgres start
```

Note: if you’re on Intel, the `/opt/homebrew` probably is `/usr/local`.

Start psql and open database `postgres`, which is the database postgres uses itself to store roles, permissions, and structure:

```bash
$ psql postgres
```

Create role for application, give login and `CREATEDB` permissions:

```postgres
postgres-# CREATE ROLE myuser WITH LOGIN;
postgres-# ALTER ROLE myuser CREATEDB;
```

Note that the user has no password. Listing users `\du` should look like this:

```postgres
postgres-# \du
                                    List of roles
  Role name  |                         Attributes                         | Member of
-------------+------------------------------------------------------------+-----------
 <root user> | Superuser, Create role, Create DB, Replication, Bypass RLS | {}
 myuser      | Create DB                                                  | {}
```

Quit psql, because we will login with the new role (=user) to create a database:

```postgres
postgres-# \q
```

On shell, open psql with `postgres` database with user `myuser`:

```bash
$ psql postgres -U myuser
```

Note that the postgres prompt looks different, because we’re not logged in as a root user anymore. We’ll create a database and grant all privileges to our user:

```postgres
postgres-> CREATE DATABASE mydatabase;
postgres-> GRANT ALL PRIVILEGES ON DATABASE mydatabase TO myuser;
```

List databases to verify:

```postgres
postgres-> \list
```

If you want to connect to a database and list all tables:

```postgres
postgres-> \c mydatabase
mydatabase-> \dt
```

...should print `Did not find any relations.` for an empty database. To quit the postgres CLI:

```
mydatabase-> \q
```

Finally, in a `.env` file for Node.js software development, your database connection string should look like this:

```
PG_CONNECTION_STRING=postgres://myuser@localhost/mydatabase
```
