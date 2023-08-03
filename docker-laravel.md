# Laravel 10 project with Docker, Nginx, MySQL, and PHP 8.2 on Mac M1
Hi, now we're going to create a new project with the following steps: 

### Install Docker Desktop for Mac M1:
- Visit the Docker website (https://www.docker.com/products/docker-desktop) and download Docker Desktop for Mac M1.
- Follow the installation instructions provided by Docker to complete the installation process.


### Set up a new Laravel project:

- Open Terminal (or any other preferred command-line interface) on your Mac.
- Navigate to the directory where you want to create your Laravel project.
- Run the following command to create a new Laravel project:

```bash
docker run --rm -v $(pwd):/app composer create-project --prefer-dist laravel/laravel myproject
```

Replace myproject with the desired name for your project. This command will create a new Laravel project in a folder named myproject.

### Create the Docker environment:
- Navigate into your Laravel project directory:

```bash 
cd myproject
```
- create new directory name of .docker

```bash
mkdir .docker
```

- Create a new file named Dockerfile under .docker directory (without any file extension) using your preferred text editor and add the following contents:

```dockerfile
FROM php:8.2.5-fpm

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    build-essential \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    git \
    curl \
    nano

RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

COPY . .

RUN composer install

RUN chown -R www-data:www-data \
    /var/www/html/storage \
    /var/www/html/bootstrap/cache

RUN chmod -R 775 \
    /var/www/html/storage \
    /var/www/html/bootstrap/cache

CMD php artisan serve --host=0.0.0.0 --port=8000
```


### Create another file named docker-compose.yml and add the following contents:

```yml
version: '3'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    image: laravel-app
    container_name: laravel-app
    restart: unless-stopped
    tty: true
    environment:
      - APP_NAME=Laravel
      - APP_ENV=local
      - APP_KEY=
      - APP_DEBUG=true
      - APP_URL=http://localhost
      - DB_CONNECTION=mysql
      - DB_HOST=db
      - DB_PORT=3306
      - DB_DATABASE=laravel
      - DB_USERNAME=root
      - DB_PASSWORD=
    volumes:
      - .:/var/www/html
    ports:
      - '8000:8000'
    depends_on:
      - db
    networks:
      - laravel

  db:
    image: mysql:8.0
    container_name: laravel-db
    restart: unless-stopped
    tty: true
    environment:
      - MYSQL_DATABASE=laravel
      - MYSQL_ROOT_PASSWORD=
      - MYSQL_USER=root
      - MYSQL_PASSWORD=
    volumes:
      - ./mysql:/var/lib/mysql
    ports:
      - '3306:3306'
    networks:
      - laravel

networks:
  laravel:
    driver: bridge
```

### Build and run the Docker containers:

- In the terminal, navigate to your Laravel project directory (if not already there).
- Run the following command to build and start the Docker containers:

```bash
docker-compose up -d
```

- This command will pull the necessary Docker images, build the custom image for your Laravel project, and start the containers in detached mode.

### Configure Laravel:
- In your terminal, navigate to your Laravel project directory (if not already there).
- Copy the .env.example file to create a new .env file:

```bash
cp .env.example .env
```

- Generate an application key:

```bash
docker-compose exec app php artisan key:generate
```

### Update Laravel database configuration:

- Open the .env file in your preferred text editor.
- Set the following values for the database connection:

```makefile
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=
```

### Access the Laravel application:

- Open your web browser and visit http://localhost:8080.
- You should see the Laravel welcome page, indicating that your setup is successful.

That's it! You have successfully created a Laravel 10 project with Docker, Nginx, MySQL, and PHP 8.2 on your Mac M1.


### Change port

If you want to open another port for your Laravel project, you can modify the docker-compose.yml file to expose an additional port. Here's how you can do it:
1. Open the docker-compose.yml file in your preferred text editor.
2. Locate the ports section under the app service. By default, it should be set to:

```yaml 
ports:
  - 8080:80
```

Add an additional port mapping to expose the desired port. For example, let's say you want to expose port 8000, you can modify the ports section as follows:

```yaml 
ports:
  - 8080:80
  - 8000:80
```

or change 8080:80 to 8000:80

```yml
ports: 
  - 8000:80
```

4. Save the docker-compose.yml file.

5. Restart the Docker containers to apply the changes:
- In the terminal, navigate to your Laravel project directory.
- Run the following command to restart the Docker containers:
```bash
docker-compose down
docker-compose up -d
```


## enter root path on docker
```bash
docker exec -t -i container_name /bin/bash
```


Now you should be able to access your Laravel application on both ports 8080 and 8000. 
For example, you can visit http://localhost:8000 in your web browser to access the application on the new port.

[help](https://www.digitalocean.com/community/tutorials/how-to-containerize-a-laravel-application-for-development-with-docker-compose-on-ubuntu-18-04)
[tutorials](https://www.youtube.com/watch?v=Ra1CetTcSeo)
[https](https://dev.to/vishalraj82/using-https-in-docker-for-local-development-nc7)