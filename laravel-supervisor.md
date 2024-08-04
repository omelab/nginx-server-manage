## supervisor for laravel Project

``` sudo apt install supervisor``` or ``` sudo apt-get install supervisor```

``` cd /etc/supervisor/conf.d```

create new file inside

``` sudo vim queue-worker.conf```

File Content

```
[program:email-queue]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/html/laravelproject/artisan queue:work
autostart=true
autorestart=true
user=root
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/html/laravelproject/storage/logs/supervisord.log
```


``` sudo supervisorctl reread```

when run this command get output queue-worker:available

```sudo supervisorctl update```

when run this command get output queue-worker:added process group other command

```sudo supervisorctl reload```

when run this command get output Restarted supervisord

```sudo service supervisor restart```



## Que Work using Supervisor

Using Supervisor to manage php artisan queue:work is another reliable method for ensuring your Laravel queue workers are properly managed and always running. Supervisor is a process control system that enables you to monitor and control processes on UNIX-like operating systems.

Here’s a step-by-step guide to using Supervisor with Laravel queue workers:


#### Install Supervisor:
Install Supervisor on your server. The installation method may vary depending on your operating system.

For Ubuntu/Debian: 

```sh 
sudo apt-get update
sudo apt-get install supervisor
```


Create a Supervisor configuration file for your queue worker:
Create a new configuration file in the Supervisor configuration directory, typically located at 
```/etc/supervisor/conf.d/```. Name it something like laravel-worker.conf:

```sh
sudo nano /etc/supervisor/conf.d/laravel-worker.conf
```

#### Add the Supervisor configuration:

Add the following configuration to the file:

```sh
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/your/laravel/project/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
user=your_user
numprocs=1
redirect_stderr=true
stdout_logfile=/path/to/your/laravel/project/storage/logs/worker.log
stopwaitsecs=3600
```

In this configuration:

- process_name: Name format for your processes.
- command: The command to run your Laravel queue worker.
- autostart: Whether to start the process automatically when Supervisor starts.
- autorestart: Whether to restart the process automatically if it exits unexpectedly.
- user: The user to run the process as. Replace your_user with your actual username.
- numprocs: Number of processes to run. You can increase this if you need multiple worker processes.
- redirect_stderr: Redirect stderr to stdout.
- stdout_logfile: Path to the log file for the worker process.
- stopwaitsecs: How long to wait for the process to stop after a stop command before killing it.


#### Update Supervisor to read the new configuration:

After creating the configuration file, update Supervisor to read the new configuration and start the processes:

```sh
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*
```

#### Manage the queue workers with Supervisor:

You can use the following commands to manage your Laravel queue workers with Supervisor:

Check the status of the workers: ``` sudo supervisorctl status ```

Stop the workers: ``` sudo supervisorctl stop laravel-worker:* ```

Start the workers: ``` sudo supervisorctl start laravel-worker:* ```

Restart the workers: ``` sudo supervisorctl restart laravel-worker:* ```

Check logs ( To view the logs of your Laravel queue workers): ``` tail -f /path/to/your/laravel/project/storage/logs/worker.log ```



## Using nohup

Using nohup to run php artisan queue:work is a simpler way to run the command in the background and keep it running after you log out from the terminal. Here's how you can do it:


#### Navigate to your Laravel project directory:
Open a terminal and navigate to the root of your Laravel project:

```cd /path/to/your/laravel/project```


#### Run the queue worker using nohup:

Use nohup to run the queue:work command and send the output to a log file:

```nohup php artisan queue:work --sleep=3 --tries=3 > storage/logs/queue-worker.log 2>&1 &```

Breakdown of the command:


- nohup: Prevents the process from being terminated when the terminal is closed.
- `php artisan queue:work --sleep=3 --tries=3`: The Artisan command to run the queue worker with specified options.
- `> storage/logs/queue-worker.log`: Redirects standard output (stdout) to the specified log file.
- `2>&1`: Redirects standard error (stderr) to the same file as standard output.
- `&`: Runs the command in the background.


#### Check the process:
You can check if the process is running by using the ps command:

``` ps aux | grep 'php artisan queue:work' ```

#### Stopping the process:
If you need to stop the queue worker, find the process ID (PID) and kill it. The ps command from the previous step will show the PID. Use the kill command to stop it:

```sh
kill <PID>
```
Replace <PID> with the actual process ID of the running queue worker.


Check logs:
To view the logs of your queue worker, use the tail command

``` tail -f storage/logs/queue-worker.log ```

Using nohup is a straightforward method for running background processes, but it doesn't provide the advanced management features that tools like Supervisor or PM2 offer. If your application requires more robust process management (such as automatic restarts, detailed monitoring, etc.), consider using Supervisor or PM2.

 


## Also you can use PM2

Here is a step-by-step guide to run php artisan queue:work using PM2:


#### Install PM2:
If you don't have PM2 installed globally, you can install it using npm:

``` npm install pm2 -g ```


#### Create a PM2 configuration file:

It's a good practice to create a configuration file for your PM2 processes. Create a file named ecosystem.config.js in the root of your Laravel project:

```bash
module.exports = {
  apps: [
    {
      name: 'queue-worker',
      script: 'artisan',
      args: 'queue:work --sleep=3 --tries=3',
      interpreter: 'php',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        // Add any environment variables if needed
        APP_ENV: 'production',
        APP_DEBUG: false,
        // Other environment variables...
      }
    }
  ]
};
```


In this configuration:

- name: Name of the process.
- script: The script to execute. For Laravel, it's typically artisan.
- args: Arguments for the script. Here, we're running the queue:work command with some options.
- interpreter: The interpreter to use, which is php for Laravel.
- autorestart: Whether to automatically restart the process if it crashes.
- watch: If true, PM2 will watch for file changes and restart the process. This is typically false for production.
- max_memory_restart: The process will be restarted if it exceeds this memory usage.



#### Start the process with PM2:
Navigate to the root of your Laravel project and run:

```bash
pm2 start ecosystem.config.js
```


#### Manage the process:
You can use PM2 commands to manage your queue worker:

List all processes: ``` pm2 list ```

Stop the queue worker: ``` pm2 stop queue-worker ```

Restart the queue worker: ``` pm2 restart queue-worker ```

View logs: ``` pm2 logs queue-worker ```



#### Save the PM2 process list: 
This ensures that PM2 will automatically start your processes on system reboot:

```pm2 save```


#### Setup PM2 to start on boot:

This command will generate and configure the necessary startup scripts: ``` pm2 startup ```



