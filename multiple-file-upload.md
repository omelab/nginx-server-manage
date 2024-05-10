To upload multiple files (all with different field name keys), use the FileFieldsInterceptor() decorator. This decorator takes two arguments:

uploadedFields: an array of objects, where each object specifies a required name property with a string value specifying a field name, as described above, and an optional maxCount property.

options: optional MulterOptions object, as [described](https://medium.com/@abir71.hosen/multipart-multiple-files-upload-in-nestjs-framework-8b73eac2c1da#:~:text=options%3A%20optional%20MulterOptions%20object%2C%20as%20described)


When using FileFieldsInterceptor(), extract files from the request with the @UploadedFiles() decorator.

```js
@Post('upload')
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(@UploadedFiles() files: { avatar?: Express.Multer.File[], background?: Express.Multer.File[] }) {
  console.log(files);
}
```



To upload all fields with arbitrary field name keys, use the AnyFilesInterceptor() decorator. This decorator can accept an optional options object as described.



When using AnyFilesInterceptor(), extract files from the request with the @UploadedFiles() decorator.


```js
@Post('upload')
@UseInterceptors(AnyFilesInterceptor())
uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
  console.log(files);
}
```

```ts
@Post('test')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'testFile', maxCount: 1 },
      { name: 'files', maxCount: 2 },
    ]),
  )
  async test(
    @Body() createAdminDto: CreateTestAdminDto,
    @UploadedFiles()
    data: { files?: Express.Multer.File[]; testFile?: Express.Multer.File[] },
  ) {
    if (data.files && data.files.length > 0) {
      const uploadedFilePaths = await Promise.all(
        data.files.map(async (item) => {
          return await fileUpload(item, 'users');
        }),
      );
      createAdminDto.files = uploadedFilePaths; // Assuming you want to assign file paths to a property in the DTO
    }

    if (data.testFile && data.testFile.length > 0) {
      const testPath = await Promise.all(
        data.testFile.map(async (item) => {
          return await fileUpload(item, 'users');
        }),
      );
      createAdminDto.testFile = testPath[0]; // Assuming you want to assign file paths to a property in the DTO
    }

    return createAdminDto; // Issue 3: This returns the DTO without updating identityFiles property even if files are uploaded.
  }
  ```


https://medium.com/@abir71.hosen/multipart-file-upload-in-nestjs-framework-5bf93157c328
https://medium.com/@abir71.hosen/multipart-array-of-files-upload-in-nestjs-framework-5dad63a038de
https://docs.nestjs.com/techniques/file-upload
https://medium.com/@abir71.hosen/multipart-file-upload-in-nestjs-framework-5bf93157c328