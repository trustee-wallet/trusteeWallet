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
npx jetifier
rm -f shim.js
./node_modules/.bin/rn-nodeify --hack --install
```

Building APK
```
cd ./android
./gradlew assembleRelease
```

After successful build APK file `app-release.apk` can be found in `./app/build/outputs/apk/release/`

### Android verifiable builds

Using these steps anyone can verify the latest release of application TrusteeWallet that we distribute via Google Play built from code in this repository. Does not contain any hidden functions or any malicious code.

**Please Note:** Google Play after deploying built packages making modifications with it.
Adding own metadata, digital signs to code etc. Also there is some data that is changing from build-to-build and can't be the same: like build id. As a result builds can't be 100% fully identical. Files always will have minor differences that are not affecting application functionality.  

The script `verify_android_build.sh` starting build of the Docker container from `./docker/Dockerfile.verifyandroidbuild` file.  
Building steps getting TrusteeWallet code from this repository, configuring it with parameters from `verify_android_build.sh` script and starting build of universal APK file.   
After successful build it's downloading from Google Play a similar universal APK file.  
On the next step we decoding both APK files by `apktool`. File downloaded from Google Play to folder `fromGoogle` and file just built from sources to folder `fromBuild`.  
Finally on the last step using simple `diff` command we checking both folders for differences.  

```bash 
git clone https://github.com/trustee-wallet/trusteeWallet.git
cd ./trusteeWallet
./docker/verify_android_build.sh
```

There is an example how result may look like and how to analyze the result.


```diff
Step 10/10 : RUN diff --recursive --brief fromBuild fromGoogle
 ---> Running in a3154b35a34f
+Files fromBuild/AndroidManifest.xml and fromGoogle/AndroidManifest.xml differ
+Files fromBuild/apktool.yml and fromGoogle/apktool.yml differ
!Files fromBuild/assets/crashlytics-build.properties and fromGoogle/assets/crashlytics-build.properties differ
!Files fromBuild/assets/index.android.bundle and fromGoogle/assets/index.android.bundle differ
+Files fromBuild/original/AndroidManifest.xml and fromGoogle/original/AndroidManifest.xml differ
+Only in fromGoogle/original/META-INF: BNDLTOOL.RSA
+Only in fromGoogle/original/META-INF: BNDLTOOL.SF
+Files fromBuild/original/META-INF/MANIFEST.MF and fromGoogle/original/META-INF/MANIFEST.MF differ
!Files fromBuild/res/values/strings.xml and fromGoogle/res/values/strings.xml differ
!Files fromBuild/smali_classes2/com/koushikdutta/async/http/body/MultipartFormDataBody$6.smali and fromGoogle/smali_classes2/com/koushikdutta/async/http/body/MultipartFormDataBody$6.smali differ
!Files fromBuild/smali_classes3/okhttp3/RealCall$AsyncCall.smali and fromGoogle/smali_classes3/okhttp3/RealCall$AsyncCall.smali differ
!Files fromBuild/smali_classes3/okhttp3/internal/cache/DiskLruCache$2.smali and fromGoogle/smali_classes3/okhttp3/internal/cache/DiskLruCache$2.smali differ
+Only in fromGoogle/unknown: stamp-cert-sha256
The command '/bin/sh -c diff --recursive --brief fromBuild fromGoogle' returned a non-zero code: 1
```

We can ignore differences in files marked by green color they have metadata changes made by Google, digital signs etc. which are not affecting the application itself.   
File `apktool.yml` contains metadata from `apktool` from the previous step used to decode APK files and is not related to builds in any way.

Files marked by orange may require more detailed analysis to make sure there are no changes in binaries.  
To do it, let's find just built docker image id and run container with it.

```bash
docker images
docker run -i -t <ID>
```
To get detailed data about what exactly is different in files just run inside the container `diff` command with the path to files that we want to compare.

```bash
diff <path to file1> <path to file2>
```

In this example in both files differences related to changed build ID.

```diff
root@37c6000f7ee9:/trustee# diff fromBuild/assets/crashlytics-build.properties fromGoogle/assets/crashlytics-build.properties
6c6
< #Tue Oct 27 14:57:43 GMT 2020
---
> #Tue Oct 27 07:20:06 GMT 2020
9c9
< build_id=ec2f73f5-d473-4cb0-94fe-701f996ce221
---
> build_id=743f6302-4068-4a5a-9e5d-014d02bd6693
```

```diff
root@37c6000f7ee9:/trustee# diff fromBuild/res/values/strings.xml fromGoogle/res/values/strings.xml
70c70
<     <string name="com.crashlytics.android.build_id">ec2f73f5-d473-4cb0-94fe-701f996ce221</string>
---
>     <string name="com.crashlytics.android.build_id">743f6302-4068-4a5a-9e5d-014d02bd6693</string>
```

The rest of files referring to `smali_classes*` seems have some sort of decompilation artefacts.

```diff
root@37c6000f7ee9:/trustee# diff 'fromBuild/smali_classes3/okhttp3/RealCall$AsyncCall.smali' 'fromGoogle/smali_classes3/okhttp3/RealCall$AsyncCall.smali'
29,32c29
<     .locals 1
<
<     .line 154
<     const-class v0, Lokhttp3/RealCall;
---
>     .locals 0
```

```diff
root@37c6000f7ee9:/trustee# diff 'fromBuild/smali_classes3/okhttp3/internal/cache/DiskLruCache$2.smali' 'fromGoogle/smali_classes3/okhttp3/internal/cache/DiskLruCach$2.smali'
27,30c27
<     .locals 1
<
<     .line 316
<     const-class v0, Lokhttp3/internal/cache/DiskLruCache;
---
>     .locals 0
```

As we can see there are no significant differences between APK file downloaded from Google Play and file built from source code. So we can say there are no hidden functions that may harm users.   

**Please note:** This verification method can be used only for the latest TrusteeWallet release. Because most of the third part packages that we use are also in active development and if we try to build some of the previous releases with latest packages versions there will be significant differences in APK files.  


### Contacts
For proposals and bug reports feel free to open and issue [HERE](https://github.com/trustee-wallet/trusteeWallet/issues)

If you have any questions please contact us by email <contact@trustee.deals> or join our community in [Telegram](https://t.me/trustee_wallet)

