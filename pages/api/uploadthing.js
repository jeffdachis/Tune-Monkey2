export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.UPLOADTHING_SECRET;
  if (!apiKey) return res.status(500).json({ error: "Missing UploadThing API Key" });

  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ error: "Missing file name/type" });

  const response = await fetch("https://uploadthing.com/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-uploadthing-api-key": apiKey
    },
    body: JSON.stringify({
      files: [{ name, type }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("UploadThing error:", errorData);
    return res.status(response.status).json({ error: errorData?.error || 'UploadThing failed' });
  }

  const data = await response.json();
  const url = data?.[0]?.url;
  if (!url) return res.status(500).json({ error: "No URL returned" });

  res.status(200).json({ url });
}
