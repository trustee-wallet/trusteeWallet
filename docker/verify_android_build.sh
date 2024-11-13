#!/usr/bin/env sh

docker build --build-arg BUILD_NUMBER=VERSION_CODE_PLACEHOLDER --build-arg VERSION_NUMBER=VERSION_NUMBER_PLACEHOLDER --build-arg COMMIT_SHA=COMMIT_SHORT_SHA_PLACEHOLDER --build-arg REPOSITORY_BRANCH=REPOSITORY_BRANCH_PLACEHOLDER -t android/verify -f ./docker/Dockerfile.verifyandroidbuild .

