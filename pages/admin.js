<main>
  <h1>Admin Panel</h1>
  <input type="text" placeholder="Request ID" onChange={...} />
  <input type="file" onChange={...} />
  <button onClick={uploadFile}>Upload</button>
  {uploadUrl && <button onClick={sendFile}>Send File</button>}
</main>
