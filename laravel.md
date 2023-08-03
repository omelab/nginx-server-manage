# Create a Laravel project using Docker with a MySQL Database

in this tutorials you will learn how to create laravel project using dockear and mysql database

### Docker installed 

Make sure you have Docker installed on your system. If not, download and install Docker from the official Docker website (https://www.docker.com/).

### Create Directory

Open a terminal or command prompt and navigate to the directory where you want to create your Laravel project.

### Laravel project

Create a new Laravel project using the Composer create-project command. Run the following command to create a new Laravel project named "myapp":

```bash
docker run --rm -v $(pwd):/app composer create-project --prefer-dist laravel/laravel myapp
```

Change into the project directory:
```bash
cd myapp
```

### Docker Compose File Create

Create a new Docker Compose file named "docker-compose.yml" in the project directory and add the following configuration:

```bash
version: '3'
services:
  web:
    image: nginx:latest
    ports:
      - 8000:80
    volumes:
      - ./src:/var/www/html
    depends_on:
      - app
  app:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - ./src:/var/www/html
    environment:
      - DB_CONNECTION=mysql
      - DB_HOST=db
      - DB_PORT=3306
      - DB_DATABASE=myapp
      - DB_USERNAME=root
      - DB_PASSWORD=secret
  db:
    image: mysql:latest
    environment:
      - MYSQL_ROOT_PASSWORD=secret
      - MYSQL_DATABASE=myapp
```

This configuration sets up three services: web for Nginx, app for the Laravel application, and db for MySQL. It also maps port 8000 on your host to port 80 in the Nginx container.

### Dockerfile 
Create a new Dockerfile in the project directory with the following content:

```dockerfile
FROM php:7.4-fpm

RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /var/www/html

EXPOSE 9000
```

This Dockerfile sets up the PHP environment and installs the necessary extensions for Laravel.

Build and start the Docker containers by running the following command in the project directory:

```bash
docker-compose up -d
```

This command will build the Docker containers defined in the docker-compose.yml file and start them in the background.


### Install Dependencies

To install laravel dependencies by running the following command in the project directory:

```bash
docker-compose exec app composer install
```

Generate a Laravel application key by running the following command:

```bash
docker-compose exec app php artisan key:generate
```

Access your Laravel application by opening a web browser and visiting http://localhost:8000.

That's it! You have successfully created a Laravel project using Docker with a MySQL database. You can now develop your Laravel application within the project directory, and any changes you make will be reflected in the Docker containers.