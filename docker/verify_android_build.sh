#!/usr/bin/env sh

docker build --build-arg BUILD_NUMBER=631 --build-arg COMMIT_SHA=b684f368 -t android/verify -f ./docker/Dockerfile.verifyandroidbuild .

