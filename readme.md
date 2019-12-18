# How to

(but first install - its after run as should be done once)

## Run Android

START /MIN emulator @Pixel_2_API_Q 

(if problems - do not load current state)

START /MIN emulator @Pixel_2_API_Q -no-snapshot-load

react-native run-android

react-native log-android

## Run IOS

react-native run-ios

react-native log-ios


## How to install to check application and start develop

After first download / git clone, please do Preinstall, 
if any problem with current instance that couldnt be solved - 
remove node_modules and do again

### Preinstall

#### Step 0

npm install

#### Step 1

rn-nodeify --hack --install

or

./node_modules/.bin/rn-nodeify --hack --install

#### Step 2

python ./__hacks__/makeX.py

do step2 any time when some AndroidX errors (classes not found etc)

if not solves - call Ksu - and we will add needed lib to the list

### Add your own google services settings (for Firebase etc)

here is file

./android/app/google-services.json

here is docs

https://developers.google.com/android/guides/google-services-plugin





