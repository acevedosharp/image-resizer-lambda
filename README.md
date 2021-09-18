# Environment Variables
- ORIGIN_BUCKET
- TARGET_BUCKET
- PRODUCT_WIDTH
- PRODUCT_HEIGHT
- CATEGORY_WIDTH
- CATEGORY_HEIGHT
- PROMOTION_WIDTH
- PROMOTION_HEIGHT
- BANNER_WIDTH
- BANNER_HEIGHT
- ACCESS_KEY
- SECRET_KEY

# Sharp instructions
https://sharp.pixelplumbing.com/install#aws-lambda

Run the following commands 

`rmdir /s /q node_modules/sharp`

`npm install --arch=x64 --platform=linux sharp`

`aws lambda update-function-code --function-name image-resizer --zip-file fileb://~/WebstormProjects/image-resizer-lambda/image-resizer-lambda.zip`