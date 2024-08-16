## create ssh key

### Step 1: Generate SSH Key on Mac M1:

Open Terminal: Open the Terminal app on your Mac.

Generate SSH Key: Run the following command to generate a new SSH key pair:

```sh
ssh-keygen -t ed25519 -C "your_email@example.com"
```
If you prefer to use RSA, use:

```sh
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

Follow the prompts:

You can press Enter to accept the default file location (/Users/your_username/.ssh/id_ed25519).
Enter a passphrase for added security (optional but recommended).


### Step 2: Add SSH Key to ssh-agent:

```sh
eval "$(ssh-agent -s)"   

# Agent pid 27384

ssh-add -K ~/.ssh/id_ed25519
```


### Step 3: Add SSH Key to DigitalOcean
Copy the Public Key:

```ssh
pbcopy < ~/.ssh/id_ed25519.pub
```

It return :
```txt
ssh-ed25519 ************************************ your_email@example.com
```
This copies the contents of your public key to the clipboard.

Check for Private Key File:

Open Terminal and run the following command to list the files in your ~/.ssh/ directory:

```sh
ls ~/.ssh/
```
You should see id_ed25519 (private key) and id_ed25519.pub (public key) among other files.

View the Private Key (if needed):

To view the contents of your private key, use:

```sh
cat ~/.ssh/id_ed25519
```

Note: Be very careful with your private key. It should be kept secure and never shared.

If You Don’t Have a Private Key

** If you only have the public key and not the private key, you will need to regenerate the key pair: **

Generate a New SSH Key Pair:

```sh 
ssh-keygen -t ed25519 -C "your_email@example.com"
```
Follow the Prompts to save the new private key (e.g., id_ed25519) and public key (e.g., id_ed25519.pub).



### Step 4: Add Key to DigitalOcean:

In the DigitalOcean Droplet creation interface, find the SSH keys section.
Click “New SSH Key” and paste your copied key.
Give your key a name and save it.


### Step 5: Connect to Your Droplet

Find Your Droplet’s IP Address: After the droplet is created, you will get its public IP address.

Connect via SSH:

```sh
ssh root@your_droplet_ip
```
Replace your_droplet_ip with the actual IP address of your droplet.
 


## Step-by-Step Deployment on the Droplet

Since you're already connected to your DigitalOcean droplet via SSH, you can follow these steps to deploy your locally built Next.js project.



 ### 1. Navigate to Your Project Directory
On your server, navigate to the directory where you want to deploy your Next.js project. If this directory doesn't exist yet, you can create it:

```bash
mkdir -p /path/to/your/project
cd /path/to/your/project

```


Replace /path/to/your/project with the actual path where you want your project to reside.


### 2. Upload Your Local Build Files to the Server
Open a new terminal on your local machine (keep the SSH session open), and use scp or rsync to upload the necessary files.


Using `scp`:

```bash
scp -r .next public package.json root@your_droplet_ip:/path/to/your/project
```


Using `rsync`:

```bash
rsync -avz .next public package.json root@your_droplet_ip:/path/to/your/project
```


This command will transfer the .next directory, the public directory, and package.json from your local machine to the droplet.



### 3. Install Production Dependencies
Back in your SSH session, navigate to the project directory:

```bash
cd /path/to/your/project
```

Then, install the production dependencies using npm:

```bsh
npm install --only=production
```

This command will install only the necessary dependencies, which helps save memory and disk space on your server.


### 4. Start Your Next.js Application
Now, you can start your Next.js application in production mode:

```bash
npm run start
```

Alternatively, if you’re using a process manager like pm2, you can run:

```bsh
pm2 start npm --name "your-app-name" -- start
```


This ensures that your application will keep running even if the SSH session is closed or the server restarts.


### 5. Check Your Application

Once your application is running, you can visit your droplet's IP address in a browser to see your Next.js app live.

For example, if your droplet's IP is 192.168.1.100, open:

```bash
http://192.168.1.100
```






