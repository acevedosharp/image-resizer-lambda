const sharp = require('sharp');
const AWS = require('aws-sdk');

exports.handler = async (event) => {

    const S3 = new AWS.S3({
        signatureVersion: 'v4',
        region: 'us-east-2',
        credentials: {
            accessKeyId: 'AKIA5JKU5W6L3NYMAJJ5',
            secretAccessKey: '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'
        }
    });

    // noinspection JSUnfilteredForInLoop
    for (const record of event.Records) {

        const objectKey = record.s3.object.key

        try {
            const data = await S3.getObject({
                Bucket: 'merca4-raw-images',
                Key: objectKey
            }).promise()

            const buffer = await sharp(data.Body)
                .resize(100, 100, { fit: sharp.fit.contain })
                .webp({ quality: 100 })
                .toBuffer()

            await S3.putObject({
                Key: objectKey,
                Body: buffer,
                Bucket: 'merca4-images',
                ContentType: 'image/webp',
                ACL: 'public-read'
            }).promise()
        } catch (e) {
            console.log('Error!')
            console.log(e)

            return {
                statusCode: 500,
                body: e.message || e.body
            }
        }
    }
    return {
        statusCode: 200,
        body: 'Ok'
    }
};