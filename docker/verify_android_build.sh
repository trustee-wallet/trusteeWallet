#!/usr/bin/env sh

docker build --build-arg BUILD_NUMBER=VERSION_CODE_PLACEHOLDER --build-arg COMMIT_SHA=COMMIT_SHORT_SHA_PLACEHOLDER -t android/verify -f ./docker/Dockerfile.verifyandroidbuild .

