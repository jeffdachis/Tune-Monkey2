const uploadFile = async () => {
  if (!file || !requestId) {
    alert("Missing file or request ID");
    return;
  }

  try {
    console.log("Initiating file upload for request:", requestId);
    const res = await fetch("https://uploadthing.com/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UT_API_KEY}`,
        "Content-Type": "application/json",
      },
      // Updated payload keys:
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`UploadThing POST failed: ${res.status} ${errText}`);
    }

    const json = await res.json();
    console.log("UploadThing response:", json);

    if (!json.url) {
      throw new Error("UploadThing response did not contain a URL");
    }

    // PUT the file to the provided URL
    const putRes = await fetch(json.url, { method: "PUT", body: file });
    if (!putRes.ok) {
      const putErr = await putRes.text();
      throw new Error(`PUT failed: ${putRes.status} ${putErr}`);
    }
    
    const fileUrl = json.url.split("?")[0];
    console.log("File uploaded, final URL:", fileUrl);
    setUploadUrl(fileUrl);
  } catch (error) {
    console.error("❌ Error during file upload:", error);
    setErrorMsg(error.message);
  }
};
