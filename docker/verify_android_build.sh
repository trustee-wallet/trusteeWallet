#!/usr/bin/env sh

docker build --build-arg BUILD_NUMBER=653 --build-arg COMMIT_SHA=5ffa155a -t android/verify -f ./docker/Dockerfile.verifyandroidbuild .

