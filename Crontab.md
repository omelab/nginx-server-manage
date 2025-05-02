
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


#### Did you schedule your job correctly in `App\Console\Kernel.php`?

In `app/Console/Kernel.php`, you should have something like this:

```php
protected function schedule(Schedule $schedule)
{
    $schedule->job(new \App\Jobs\GenerateMonthlyAttendance)
             ->monthlyOn(1, '01:00'); // Runs at 1 AM on the 1st day of each month
}
```
You can test it by temporarily changing it to:

```php
$schedule->job(new \App\Jobs\GenerateMonthlyAttendance)->everyMinute();
```

Then run: `php artisan schedule:run`

If the job runs, you're all set — just switch it back to monthlyOn(1, '01:00').



#### Is your job class properly created?

Make sure the job exists at:

```bash
app/Jobs/GenerateMonthlyAttendance.php
```

It should implement `ShouldQueue` and use `Dispatchable`.


#### Do you see logs?

If the job runs but you want to confirm it executed, you can log something inside `handle()` method:

```bash
public function handle()
{
    \Log::info('GenerateMonthlyAttendance job ran!');
    // your logic here
}
```


Then check your log:


```bash
tail -f storage/logs/laravel.log
```




