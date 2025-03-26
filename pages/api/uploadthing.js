export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body;
  console.log("Dummy Upload body:", body);

  return res.status(200).json({
    url: "https://uploadthing.com/dummy/" + encodeURIComponent(body.name),
    name: body.name,
    type: body.type,
  });
}
