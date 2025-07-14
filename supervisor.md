## Setup for Laravel Queues on Nginx

#### 🔹 Step 1: Set Queue Driver in .env

```bash
QUEUE_CONNECTION=database
```

If you're using database, ensure queue tables exist:

```bash
php artisan queue:table
php artisan migrate

```


You can also use redis if preferred (let me know if you want that setup too).

#### 🔹 Step 2: Install supervisord

Supervisor is a Linux tool to ensure Laravel queue workers keep running even after reboot or failure.

```bash
sudo apt update
sudo apt install supervisor -y

```


#### 🔹 Step 3: Create Supervisor Config for Laravel Queue

🔹 1. laravel-worker.conf

```bash
sudo nano /etc/supervisor/conf.d/laravel-worker.conf 
```

Paste this:

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/your-laravel-project/artisan queue:work --timeout=1800 --sleep=3 --tries=3
autostart=true
autorestart=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/your-laravel-project/storage/logs/laravel-worker.log

```

🔹 2. laravel-scheduler.conf


```bash 
sudo nano /etc/supervisor/conf.d/laravel-scheduler.conf
```

```ini
[program:laravel-scheduler]
process_name=%(program_name)s
command=/bin/bash -c "while true; do /usr/bin/php /var/www/your-laravel-project/artisan schedule:run; sleep 60; done"
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/hrms/storage/logs/scheduler.log

```



🔁 Replace /var/www/your-laravel-project with your actual Laravel project path.

#### 🔹 Step 4: Start Supervisor

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*
sudo supervisorctl start laravel-scheduler

```


heck if it’s running:

```bash
sudo supervisorctl status

```


Expected output: 

```bash
laravel-worker:laravel-worker_00   RUNNING
laravel-scheduler                  RUNNING
```


#### 🔹 Step 5: Auto Start on Reboot


Supervisor handles this automatically if autostart=true is set (you already did this).


#### 🔹 Step 6: View Logs

Queue logs:

```bash
tail -f /var/www/your-app-name/storage/logs/laravel-worker.log
tail -f /var/www/your-app-name/storage/logs/scheduler.log

```


Laravel error logs:

```bash
tail -f /var/www/your-laravel-project/storage/logs/laravel.log

```


### ✅  Restart Worker After Deploy


If you deploy new Laravel code, restart the worker so it picks up code changes:

```bash
php artisan queue:restart

```


Or via Supervisor:

```bash
sudo supervisorctl restart laravel-worker:*
sudo supervisorctl start laravel-scheduler

```


## Job Status Frontend Page (using Blade)

🔹 Step 1: Route

Add a route in routes/web.php:

```php
use App\Http\Controllers\JobHistoryController;

Route::middleware(['auth'])->group(function () {
    Route::get('/job-history', [JobHistoryController::class, 'index'])->name('job.history.index');
});
```




🔹 Step 2: Controller


Create a controller:

```bash
php artisan make:controller JobHistoryController

```


Then update app/Http/Controllers/JobHistoryController.php:

```php
namespace App\Http\Controllers;

use App\Models\JobHistory;
use Illuminate\Http\Request;

class JobHistoryController extends Controller
{
    public function index(Request $request)
    {
        $jobs = JobHistory::with('creator')
            ->orderByDesc('created_at')
            ->paginate(15);

        return view('job-history.index', compact('jobs'));
    }
}

```




🔹 Step 3: Blade View
Create this file: resources/views/job-history/index.blade.php

```blade
@extends('layouts.app')

@section('content')
<div class="container">
    <h4 class="mb-4">Job History</h4>

    <table class="table table-bordered table-hover">
        <thead class="thead-light">
            <tr>
                <th>ID</th>
                <th>Job Type</th>
                <th>Status</th>
                <th>Requested By</th>
                <th>Parameters</th>
                <th>Message</th>
                <th>Created At</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($jobs as $job)
                <tr>
                    <td>{{ $job->id }}</td>
                    <td>{{ ucfirst(str_replace('_', ' ', $job->job_type)) }}</td>
                    <td>
                        @php
                            $badge = [
                                'waiting' => 'secondary',
                                'started' => 'info',
                                'completed' => 'success',
                                'failed' => 'danger',
                            ][$job->status];
                        @endphp
                        <span class="badge badge-{{ $badge }}">{{ ucfirst($job->status) }}</span>
                    </td>
                    <td>{{ $job->creator->name ?? 'System' }}</td>
                    <td><pre>{{ json_encode($job->parameters, JSON_PRETTY_PRINT) }}</pre></td>
                    <td>{{ $job->message ?? '-' }}</td>
                    <td>{{ $job->created_at->format('Y-m-d H:i') }}</td>
                </tr>
            @empty
                <tr><td colspan="7" class="text-center">No job history found.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div>
        {{ $jobs->links() }}
    </div>
</div>
@endsection

```

🔹 Step 4: Add Relationship in JobHistory Model

If you want to display the user's name:

```php
// app/Models/JobHistory.php
public function creator()
{
    return $this->belongsTo(User::class, 'created_by');
}

```



🔹 Step 5: Add a Link in Your UI 

Wherever you show admin tools: `<a href="{{ route('job.history.index') }}" class="btn btn-outline-primary">Job History</a>`




## Failed Job Retry System (For Any Queue Driver)


🔹 1. Enable Failed Job Tracking

If you're using the database driver:

```bash
php artisan queue:failed-table
php artisan migrate

```
This creates a failed_jobs table.

🔹 2. Retry a Failed Job

To retry a specific job:

```bash
php artisan queue:retry {id}

```

To retry all failed jobs:

```bash
php artisan queue:retry all
```


To delete failed jobs:

```bash
php artisan queue:flush

```



🔹 3. Show Failed Jobs in the UI (Optional)

You can use Laravel’s DB:

```php
DB::table('failed_jobs')->orderByDesc('failed_at')->paginate(15);

```


Or use the Eloquent FailedJob model (create one manually):


```php
// app/Models/FailedJob.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FailedJob extends Model
{
    protected $table = 'failed_jobs';
    public $timestamps = false;
}

```


🔹 4. Auto Retry (Optional)

You could set up a scheduled task to auto-retry jobs:

```php
$schedule->command('queue:retry all')->everyFiveMinutes();

```



## ✅ Horizon + Redis = Real-time Dashboard

Laravel Horizon gives you a beautiful dashboard for job status, retries, queues, failed jobs, and worker monitoring — in real-time.


🔹 1. Install Redis & Horizon

Install Redis on your DigitalOcean server:


```bash
sudo apt update
sudo apt install redis-server -y
sudo systemctl enable redis
sudo systemctl start redis

```


Test Redis:

```bash
redis-cli ping
```


✅ Install Redis PHP extension:

```bsh
sudo apt install php-redis
sudo systemctl restart php8.x-fpm  # Replace 8.x with your PHP version

```



✅ Install Horizon:

```bash
composer require laravel/horizon
php artisan horizon:install
php artisan migrate

```


🔹 2. Set Redis as Queue Driver

Update .env:

```env
QUEUE_CONNECTION=redis

```



🔹 3. Start Horizon

```bsh
 php artisan horizon
 ```


 This gives you real-time output. To keep it running, use Supervisor (see below).


🔹 4. Access the Horizon Dashboard

Add route in routes/web.php:

```php
use Laravel\Horizon\Horizon;

Route::middleware(['auth', 'can:viewHorizon'])->group(function () {
    Horizon::routeMailNotificationsTo('your@email.com');
    Horizon::auth(function ($request) {
        return Auth::check() && Auth::user()->is_admin;
    });
});

```


Visit: `http://your-domain.com/horizon`


🔹 5. Run Horizon via Supervisor (Persistent)

Create supervisor config:

```bash
sudo nano /etc/supervisor/conf.d/horizon.conf

```


```ini
[program:horizon]
process_name=%(program_name)s
command=php /var/www/your-laravel-project/artisan horizon
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/your-laravel-project/storage/logs/horizon.log

```

Restart Supervisor:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start horizon

```

🔹 6. Optional: Schedule Horizon Snapshot (metrics)

In App\Console\Kernel.php:

```php
$schedule->command('horizon:snapshot')->everyFiveMinutes();

```
