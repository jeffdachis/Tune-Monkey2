export type UploadRouter = {
  uploadTune: {
    output: { url: string; name: string; type: string }[];
  };
};

export const uploadTune = async (input, files) => {
  // This dummy implementation returns a fake URL for each file.
  return files.map(file => ({
    url: `https://uploadthing.com/dummy/${encodeURIComponent(file.name)}`,
    name: file.name,
    type: file.type,
  }));
};

export default function handler(req, res) {
  res.status(200).json({ status: "UploadThing proxy active" });
}
