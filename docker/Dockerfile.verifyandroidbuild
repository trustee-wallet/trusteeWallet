FROM trusteewallet/androidprebuild

ARG BUILD_NUMBER=1
ARG COMMIT_SHA=12345678

RUN cd ./src && \
    git clone https://github.com/trustee-wallet/trusteeWallet.git . && \
    sed -i "s/android.builder.sdkDownload=true/android.builder.sdkDownload=false/g" ./android/gradle.properties && \
    sed -i "s/versionCode 1/versionCode $BUILD_NUMBER/g" ./android/app/build.gradle && \
    sed -i "s/VERSION_CODE_PLACEHOLDER/$BUILD_NUMBER/g" ./app/config/config.js && \
    sed -i "s/COMMIT_SHORT_SHA_PLACEHOLDER/$COMMIT_SHA/g" ./app/config/config.js && \
    sed -i "s/VERSION_CODE_PLACEHOLDER/$BUILD_NUMBER/g" ./app/config/changeable.prod.js && \
    sed -i "s/COMMIT_SHORT_SHA_PLACEHOLDER/$COMMIT_SHA/g" ./app/config/changeable.prod.js && \
    sed -i "s/VERSION_CODE_PLACEHOLDER/$BUILD_NUMBER/g" ./app/config/changeable.tester.js && \
    sed -i "s/COMMIT_SHORT_SHA_PLACEHOLDER/$COMMIT_SHA/g" ./app/config/changeable.tester.js

RUN sdkmanager --install "build-tools;30.0.3" && \
    sdkmanager --install "platform-tools" && \
    sdkmanager --install "platforms;android-30" && \
    sdkmanager --install "ndk-bundle" "ndk;21.4.7075529" && \
    sdkmanager --install "cmake;3.6.4111459"

RUN cd ./src/android && \
    touch local.properties && \
    echo sdk.dir=/${WDIR}/androidsdk/ >> ./local.properties && \
    echo ndk.dir=/${WDIR}/androidsdk/ndk/21.4.7075529 >> ./local.properties

RUN cd ./npm && tar -xf node_modules.tar.gz && \
    mv --force -v ./${WDIR}/src/node_modules ../src/ && \
    rm -f ./node_modules.tar.gz

RUN cd ./src/android && printenv && ./gradlew --parallel bundleRelease

RUN gplaycli -av -p -y -v -d com.trusteewallet && \
    ls -la com.trusteewallet*apk && \
    sha256sum com.trusteewallet*apk && \
    apktool d -o fromGoogle com.trusteewallet*apk && \
    ls fromGoogle/lib/

RUN java -jar bundletool.jar build-apks --mode=universal --bundle=./src/android/app/build/outputs/bundle/release/app.aab --output-format=directory --output=./built_apk && \
    sha256sum ./built_apk/universal.apk && \
    apktool d -o fromBuild ./built_apk/universal.apk && \
    ls fromBuild/lib/

RUN diff --recursive --brief fromBuild fromGoogle