import { generateUploadButton } from '@uploadthing/react';
import { uploadRouter } from '../pages/api/uploadthing';

export const UploadButton = generateUploadButton(uploadRouter);
