Based on [Switching PHP versions on macOS](https://www.markhesketh.com/switching-multiple-php-versions-on-macos/).

I recently needed to switch between PHP versions on my macOS environment to work on a legacy project.
The instructions below are for use with macOS 10.15 Catalina, and allow installation of PHP 7.0, 7.1, 7.2, 7.3 & 7.4., 8.1

```bash
$ brew list | grep php

php
php@7.4
```

### 1. Prerequisites

You’ll need both Xcode Command Line Tools and Homebrew installed.

####1.1 Install XCode Command Line Tools

```bash
xcode-select --install
```

#### 1.2 Install Homebrew

Homebrew is a package manager for macOS. It’s like apt on Ubuntu.

```bash
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

Check that brew has installed:

```bash
$ brew --version
Homebrew 2.2.5
```

You can also run brew doctor to check everything is good to go.

#### 2. Install Multiple PHP Versions

As of writing, only PHP 7.2, and 8.1 are maintained and supported by Homebrew.

To install PHP 7.2, 8.1 we’ll need to ‘tap’ a repository for deprecated packages:

```bash
brew tap exolnet/homebrew-deprecated
```

Now, we can install all the available PHP versions:

```bash
brew install php@8.1
brew install php@7.2
```

This may take a little time to install. Go make yourself a brew ☕️.

### 3. Switching between PHP versions

Once installed, you can switch between PHP versions by ‘linking’ and ‘unlinking’ in brew:

```bash
# Switch from 7.2 to 8.1
brew unlink php@7.2
brew link php@8.1 --force
```

### Check which php version open on service

```bash
$ brew services list
```

In more modern versions, simply doing

```bash
    brew services stop php@7.2
    brew services start php@8.1
    brew services restart php@8.1
```

You can combine brew unlink and brew link to swap between any installed version.

###Open Source Alternatives
There are a few open source projects that aim to automate this for you, if you prefer:

phpbrew/phpbrew
philcook/brew-php-switcher
