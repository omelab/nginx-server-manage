## Remove Navicat Registry
```bash
#!/bin/bash 
set -e

file=$(defaults read /Applications/Navicat\ Premium.app/Contents/Info.plist)

regex="CFBundleShortVersionString = \"([^\.]+)"
[[ $file =~ $regex ]]

version=${BASH_REMATCH[1]}

echo "Detected Navicat Premium version $version"

case $version in
    "16")
        file=~/Library/Preferences/com.navicat.NavicatPremium.plist
        ;;
    "15")
        file=~/Library/Preferences/com.prect.NavicatPremium16.plist
        ;;
    *)
        echo "Version '$version' not handled"
        exit 1
       ;;
esac

echo "Reseting trial time..."

regex="([0-9A-Z]{32}) = "
[[ $(defaults read $file) =~ $regex ]]

hash=${BASH_REMATCH[1]}

if [ ! -z $hash ]; then
    echo "deleting $hash array..."
    defaults delete $file $hash
fi

regex="\.([0-9A-Z]{32})"
[[ $(ls -a ~/Library/Application\ Support/PremiumSoft\ CyberTech/Navicat\ CC/Navicat\ Premium/ | grep '^\.') =~ $regex ]]

hash2=${BASH_REMATCH[1]}

if [ ! -z $hash2 ]; then
    echo "deleting $hash2 folder..."
    rm ~/Library/Application\ Support/PremiumSoft\ CyberTech/Navicat\ CC/Navicat\ Premium/.$hash2
fi

echo "Done"
```

if this is not working you can use the following command

```bash
#!/bin/bash

# Delete Navicat Premium preferences

# Specify the path to Navicat Premium preferences plist file
navicatPlist="$HOME/Library/Preferences/com.prect.NavicatPremium.plist"

# Remove the preferences file
if [ -f "$navicatPlist" ]; then
    rm "$navicatPlist"
fi

# You may need to delete additional files or directories depending on the application
# For example, you can use 'rm -rf' to remove a directory and its contents:
# rm -rf "$HOME/Library/Application Support/NavicatPremium"

# Optionally, restart the application or log out/restart the system to apply changes
# Uncomment the following line if needed:
# killall NavicatPremium

# when you get error like zsh: permission denied: ./navicat.sh
# just run this command to get approval 
# chmod +x navicat.sh


# This command grants execute permissions to the script. After running this command, try executing your script again:
# ./navicat.sh

echo "Finish"
```

