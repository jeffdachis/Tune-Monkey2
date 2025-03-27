export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, type } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: "Missing name or type" });
  }

  const apiKey = process.env.UPLOADTHING_API_KEY;

  if (!apiKey) {
    console.error("Missing UPLOADTHING_API_KEY in environment");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  try {
    // Step 1: Request signed URL from UploadThing
    const response = await fetch("https://uploadthing.com/api/uploadFiles", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: [{ name, type }],
        input: {},
        routeConfig: {
          endpoint: "uploadTune", // must match the UploadThing dashboard
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("UploadThing error:", result);
      return res.status(response.status).json(result);
    }

    const { url, key } = result[0];
    res.status(200).json({ url, key });
  } catch (err) {
    console.error("Unexpected error from UploadThing:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
