import { genUploader } from "uploadthing/client";
import { uploadRouter } from "../pages/api/uploadthing";

export const { uploadFiles } = genUploader();