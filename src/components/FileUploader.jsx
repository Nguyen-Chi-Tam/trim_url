import React, { useState } from "react";
import { uploadFile, deleteFile } from "../lib/tebiActions";

function FileUploader() {
  const [file, setFile] = useState(null);
  const [bucket, setBucket] = useState("profilepic");

  const handleUpload = async () => {
    if (!file) return;
    try {
      await uploadFile(bucket, file, file.name);
      alert("Upload successful!");
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  };

  const handleDelete = async () => {
    if (!file) return;
    try {
      await deleteFile(bucket, file.name);
      alert("Delete successful!");
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <div>
      <input type="file" onChange={e => setFile(e.target.files[0])} />
      <input type="text" value={bucket} onChange={e => setBucket(e.target.value)} placeholder="Bucket name" />
      <button onClick={handleUpload}>Upload</button>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}

export default FileUploader;
