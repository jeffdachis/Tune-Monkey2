export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, type } = req.body;
  const apiKey = process.env.UPLOADTHING_SECRET;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing UploadThing API Key" });
  }

  const response = await fetch("https://uploadthing.com/api/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-uploadthing-api-key": apiKey
    },
    body: JSON.stringify({ name, type })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("UploadThing error:", errorData);
    return res.status(response.status).json({ error: errorData });
  }

  const { url } = await response.json();
  res.status(200).json({ url });
}
