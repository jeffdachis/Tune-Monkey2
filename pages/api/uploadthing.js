import { createUploadthing, type FileRouter } from "uploadthing/next";
import { NextRequest } from "next/server";

const f = createUploadthing();

export const uploadRouter = {
  uploadTune: f({ json: { maxFileSize: "4MB" } })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        url: file.url,
        name: file.name,
        type: file.type,
      };
    }),
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (req.method === "POST" || req.method === "GET") {
    return createUploadthing({ router: uploadRouter })(req, res);
  }
  res.status(405).end();
}
