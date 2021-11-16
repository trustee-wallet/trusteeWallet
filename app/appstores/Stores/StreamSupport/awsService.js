/**
 * https://github.com/aws/aws-sdk-js
 * if needed - test also https://stackoverflow.com/questions/7511321/uploading-base64-encoded-image-to-amazon-s3-via-node-js
 */
import config from '@app/config/config';
import * as AWS from 'aws-sdk'
import Log from '@app/services/Log/Log'

const awsConfig = require('./awsConfig.json')

AWS.config.update(awsConfig)
const S3 = new AWS.S3();

export async function awsS3(cashbackToken, fileName, fileContent) {
    let res
    let ContentType = 'image/jpeg'
    try {
        if (fileName.indexOf('.zip') !== -1) {
            ContentType = 'application/zip'
        }
        // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
        res = await S3.upload({
            Bucket: config.aws.bucket,
            Key: config.aws.folder + '/' + cashbackToken + '/' + fileName,
            Body: fileContent,
            ContentEncoding: 'base64',
            ContentType
        }).promise();

    } catch (e) {
        if (config.debug.appErrors) {
            console.log('SRC/aws upload error ' + e.message)
        }
        Log.log('SRC/aws upload error ' + e.message)
    }
    return res

}
