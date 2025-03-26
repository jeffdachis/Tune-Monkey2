import { createUploadthing, type FileRouter } from 'uploadthing/server';
import { uploadthingMiddleware } from 'uploadthing/server';

const f = createUploadthing();

export const uploadRouter = {
  uploadTune: f({ json: { maxFileSize: '1MB' } })
    .onUploadComplete(({ file }) => {
      console.log('Upload complete:', file.url);
      return { url: file.url, name: file.name, type: file.type };
    }),
};

export const handler = uploadthingMiddleware({ router: uploadRouter });
export default handler;
