
## Crontab in digital ocean droplet

#### Find your Laravel project path
    This is the path where your Laravel app lives, e.g.:

 ```bash
 /home/your_user/your_project_name
 ```

You can confirm this by running:


```bash
ls
```

Look for `artisan` file to confirm you're in the Laravel root.


#### Open the Crontab Editor

Run:

```bash
crontab -e
```
If it asks for an editor, select nano (easy to use).


#### Add the Laravel Scheduler Cron Entry

At the bottom of the file, add:

```bash
* * * * * cd /full/path/to/your/laravel/project && php artisan schedule:run >> /dev/null 2>&1
```

Replace /full/path/to/your/laravel/project with the actual full path, e.g.:

```bash
* * * * * cd /var/www/html/hrms && php artisan schedule:run >> /dev/null 2>&1

```

#### Save and Exit

If using nano:

- Press CTRL + X
- Then Y to save
- Then Enter


#### Make Sure php Points to Correct Version

Run this to confirm which PHP version is used by CLI:

```bash
php -v
```
If it’s not the version you want (e.g. PHP 8.3), you may need to use full path like:


```bash
/usr/bin/php8.3 artisan schedule:run
```


You can find the PHP path using:

```bash
which php
```

