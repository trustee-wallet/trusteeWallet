## Trustee Wallet

[Trustee Wallet](https://trustee.deals/) is the secure and simple way to create and manage crypto accounts. Quick and safe buy and sell bitcoin directly with your Visa or MasterCard


### Building for Android 

All building steps are tested with Ubuntu 16.04

#### Build Dependencies

For successful build it's reqired to have build tools installed
```
sudo apt-get install build-essential
```

nodejs version 10.x 
```
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install nodejs
```

and openjdk-8
```
sudo apt-get install openjdk-8-jdk
echo "JAVA_HOME=$(which java)" | sudo tee -a /etc/environment
source /etc/environment
```

#### System preparation
For successful build it's need to increase the number of files that OS can monitor
```
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```
Prepare folder and licence for Android SDK
```
mkdir ~/androidsdk
export ANDROID_HOME=~/androidsdk

mkdir ~/androidsdk/licenses 
echo "24333f8a63b6825ea9c5514f83c2829b004d1fee" >  ~/androidsdk/licenses/android-sdk-license
```
Please note: by creating `~/androidsdk/licenses/android-sdk-license` file you are accepting Android SDK licence. 

#### Android build
Download code from Github
```
git clone https://github.com/trustee-wallet/trusteeWallet.git
```

Build preparation
```
cd ./trusteeWallet
npm install
python ./__hacks__/makeX.py
rm -f shim.js
./node_modules/.bin/rn-nodeify --hack --install
```

Building APK
```
cd ./android
./gradlew assembleRelease
```

After successful build APK file `app-release.apk` can be found in `./app/build/outputs/apk/release/`

### Contacts
For proposals and bug reports feel free to open and issue [HERE](https://github.com/trustee-wallet/trusteeWallet/issues)

If you have any questions please contact us by email <contact@trustee.deals> or join our community in [Telegram](https://t.me/trustee_wallet)

