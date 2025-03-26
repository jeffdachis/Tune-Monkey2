// pages/api/uploadthing.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Missing name or type" });
    }

    // Simulate a successful upload response (since UploadThing client isn't used here directly)
    const dummyUrl = `https://uploadthing.com/dummy/${encodeURIComponent(name)}`;
    return res.status(200).json({
      url: dummyUrl,
      key: name,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
