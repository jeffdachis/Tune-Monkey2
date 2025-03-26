export type UploadRouter = {
   uploadTune: {
     output: { url: string; name: string; type: string }[];
   };
 };
 export default async function handler(req, res) {
   if (req.method !== "POST") {
     return res.status(405).json({ error: "Method not allowed" });
   }
 
 export const uploadTune = async (input, files) => {
   // This dummy implementation returns a fake URL for each file.
   return files.map(file => ({
     url: `https://uploadthing.com/dummy/${encodeURIComponent(file.name)}`,
     name: file.name,
     type: file.type,
   }));
 };
   // In a real system, you'd parse req.body and do something with the file
   // For now, we just return a fixed dummy URL
   const body = await req.json();
   console.log("Dummy /api/uploadthing request body:", body);
 
 export default function handler(req, res) {
   res.status(200).json({ status: "UploadThing proxy active" });
   // Return a fake URL
   return res.status(200).json({
     url: "https://uploadthing.com/dummy/dummy-tune.json"
   });
 }
