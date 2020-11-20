#!/usr/bin/env sh

docker build --build-arg BUILD_NUMBER=640 --build-arg COMMIT_SHA=978caef7 -t android/verify -f ./docker/Dockerfile.verifyandroidbuild .

