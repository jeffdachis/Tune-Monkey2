import { createUploadthing, createRouteHandler } from "uploadthing/next";

const f = createUploadthing();

export const uploadRouter = {
  uploadTune: f({ json: { maxFileSize: "4MB" } })
    .onUploadComplete(async ({ file }) => {
      console.log("✅ Upload complete:", file);
      return {
        url: file.url,
        name: file.name,
        type: file.type,
      };
    }),
};

// Export handler for UploadThing to work
export const { GET, POST } = createRouteHandler({ router: uploadRouter });
