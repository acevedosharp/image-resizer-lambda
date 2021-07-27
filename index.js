const sharp = require('sharp');
const AWS = require('aws-sdk');

exports.handler = async (event) => {

    console.log('One lambda invocation')

    const perFolderSizeMappings = {
        "products": { width: 210, height: 210 },
        "categories": { width: 80, height: 80 },
        "promotions": { width: 477, height: 267 },
        "banner": { width: 1624, height: 400 }
    }

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
        console.log(`objectKey: ${objectKey}`)

        const targetFolder = objectKey.split('/')[0]

        try {
            const data = await S3.getObject({
                Bucket: 'merca4-raw-images',
                Key: objectKey
            }).promise()

            const objectExtension = data.ContentType.replace('image/', '')
            const targetExtension = ['jpeg', 'jpg'].includes(objectExtension) ? 'jpeg' : 'webp'

            let buffer
            if (targetExtension === 'jpeg') {
                buffer = await sharp(data.Body)
                    .resize({
                        width: perFolderSizeMappings[targetFolder].width,
                        height: perFolderSizeMappings[targetFolder].height,
                        fit: sharp.fit.cover
                    })
                    .jpeg({ quality: 80, mozjpeg: true })
                    .toBuffer()
            } else {
                buffer = await sharp(data.Body)
                    .resize({
                        width: perFolderSizeMappings[targetFolder].width,
                        height: perFolderSizeMappings[targetFolder].height,
                        fit: sharp.fit.cover
                    })
                    .webp(targetFolder === 'banner' ? { quality: 100, lossless: true } : { quality: 75 })
                    .toBuffer()
            }

            await S3.putObject({
                Key: objectKey,
                Body: buffer,
                Bucket: 'merca4-images',
                ContentType: `image/${targetExtension}`,
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