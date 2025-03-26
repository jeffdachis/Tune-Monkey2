import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const uploadRouter = {
  uploadTune: f({ json: { maxFileSize: "4MB" } })
    .onUploadComplete(async ({ file }) => {
      return {
        url: file.url,
        name: file.name,
        type: file.type,
      };
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;