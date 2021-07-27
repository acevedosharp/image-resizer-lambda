const sharp = require('sharp');
const AWS = require('aws-sdk');

exports.handler = async (event) => {

    const perFolderSizeMappings = {
        "product-images": { width: 210, height: 210 },
        "category-images": { width: 80, height: 80 },
        "promotion-images": { width: 477, height: 267 },
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
        const dotIndex = objectKey.lastIndexOf('.')
        const objectKeyWithoutExtension = objectKey.substring(0, dotIndex)
        const objectExtension = objectKey.substring(dotIndex+1, objectKey.lenth)
        const targetExtension = ['jpeg', 'jpg'].includes(objectExtension) ? 'jpeg' : 'webp'

        const targetFolder = objectKey.split['/']

        try {
            const data = await S3.getObject({
                Bucket: 'merca4-raw-images',
                Key: objectKey
            }).promise()

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
                Key: `${objectKeyWithoutExtension}.${targetExtension}`,
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