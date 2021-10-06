import config from '@app/config/config';
import * as AWS from 'aws-sdk'

const awsConfig = require('./awsConfig.json')

AWS.config.update(awsConfig)
const S3 = new AWS.S3();

export async function awsS3(cashbackToken, fileName, fileContent) {
    let res
    try {
        res = await S3.upload({
            Bucket: config.aws.bucket,
            Key: config.aws.folder + '/' + cashbackToken + '/' + fileName,
            Body: fileContent
        }).promise();

    } catch (error) {
        console.log(error)
    }
    return res

}
