export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // In a real system, you'd parse req.body and do something with the file
  // For now, we just return a fixed dummy URL
  const body = await req.json();
  console.log("Dummy /api/uploadthing request body:", body);

  // Return a fake URL
  return res.status(200).json({
    url: "https://uploadthing.com/dummy/dummy-tune.json"
  });
}
