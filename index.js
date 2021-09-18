const sharp = require('sharp');
const AWS = require('aws-sdk');

exports.handler = async (event) => {
    const originBucket = process.env.ORIGIN_BUCKET
    const targetbucket = process.env.TARGET_BUCKET

    const perFolderSizeMappings = {
        "products": {
            width: parseInt(process.env.PRODUCT_WIDTH),
            height: parseInt(process.env.PRODUCT_HEIGHT)
        },
        "categories": {
            width: parseInt(process.env.CATEGORY_WIDTH),
            height: parseInt(process.env.CATEGORY_HEIGHT)
        },
        "promotions": {
            width: parseInt(process.env.PROMOTION_WIDTH),
            height: parseInt(process.env.PROMOTION_HEIGHT)
        },
        "banner": {
            width: parseInt(process.env.BANNER_WIDTH),
            height: parseInt(process.env.BANNER_HEIGHT)
        }
    }

    const S3 = new AWS.S3({
        signatureVersion: 'v4',
        region: 'us-east-2',
        credentials: {
            accessKeyId: process.env.ACCESS_KEY,
            secretAccessKey: process.env.SECRET_KEY
        }
    });

    // noinspection JSUnfilteredForInLoop
    for (const record of event.Records) {

        const objectKey = record.s3.object.key
        console.log(`objectKey: ${objectKey}`)

        const targetFolder = objectKey.split('/')[0]

        try {
            const data = await S3.getObject({
                Bucket: originBucket,
                Key: objectKey
            }).promise()

            const objectExtension = data.ContentType.replace('image/', '')
            // USE <picture> in front-end to fallback to jpeg if webp is not supported
            const targetExtension = 'jpeg' //['jpeg', 'jpg'].includes(objectExtension) ? 'jpeg' : 'webp'

            let buffer
            if (targetExtension === 'jpeg') {
                buffer = await sharp(data.Body)
                    .resize({
                        width: perFolderSizeMappings[targetFolder].width,
                        height: perFolderSizeMappings[targetFolder].height,
                        fit: sharp.fit.cover
                    })
                    .jpeg({ quality: 100, mozjpeg: true })
                    .toBuffer()
            } else {
                buffer = await sharp(data.Body)
                    .resize({
                        width: perFolderSizeMappings[targetFolder].width,
                        height: perFolderSizeMappings[targetFolder].height,
                        fit: sharp.fit.cover
                    })
                    .webp(targetFolder === 'banner' ? { quality: 100, lossless: true } : { quality: 80 })
                    .toBuffer()
            }

            await S3.putObject({
                Key: objectKey,
                Body: buffer,
                Bucket: targetbucket,
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