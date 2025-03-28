export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, type } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: "Missing file name or type" });
  }

  // 🔥 PASTE your actual UploadThing REST API key here:
  const apiKey = "QUxMIFPV..."; // Must be your real x-uploadthing-api-key

  try {
    const uploadRes = await fetch("https://uploadthing.com/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-uploadthing-api-key": apiKey
      },
      body: JSON.stringify({
        files: [{ name, type }]
      })
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      console.error("UploadThing rejected the request:", err);
      return res.status(uploadRes.status).json({ error: err?.error || "UploadThing error" });
    }

    const data = await uploadRes.json();
    const { url, key } = data[0] || {};
    if (!url) {
      return res.status(500).json({ error: "No URL returned by UploadThing" });
    }

    return res.status(200).json({ url, key });
  } catch (err) {
    console.error("Internal Server Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
