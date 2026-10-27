import { useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:4000";

const MAX_IMAGES = 4;
const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];



function App() {
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  function handleImageChange(event) {
  const files = Array.from(event.target.files || []);

  setError("");
  setUploadProgress(0);

  if (files.length === 0) {
    return;
  }

  if (files.length > MAX_IMAGES) {
    setError("You can select a maximum of 4 images.");
    event.target.value = "";
    return;
  }

  const invalidType = files.find((file) => !ALLOWED_TYPES.includes(file.type));

  if (invalidType) {
    setError("Only JPEG, PNG, and WebP images are allowed.");
    event.target.value = "";
    return;
  }

  const oversizedFile = files.find((file) => file.size >= MAX_FILE_SIZE);

  if (oversizedFile) {
    setError("Every image must be smaller than 2 MB.");
    event.target.value = "";
    return;
  }

  const imagesWithPreviews = files.map((file) => ({
    file,
    preview: URL.createObjectURL(file),
  }));

  setSelectedImages(imagesWithPreviews);
}

  async function handleUpload() {
    if (selectedImages.length === 0) {
      setError("Please select at least one image.");
      return;
    }

    const formData = new FormData();

    selectedImages.forEach((image) => {
      formData.append("images", image.file);
    });

    setIsUploading(true);
    setError("");
    setUploadProgress(0);

    try {
      const response = await axios.post(
        `${API_URL}/api/images/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentage = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100,
              );

              setUploadProgress(percentage);
            }
          },
        },
      );

      setUploadedImages((previousImages) => [
        ...previousImages,
        ...response.data.images,
      ]);

      setSelectedImages([]);
      setUploadProgress(100);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong while uploading images.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="gallery-container">
      <h1>My Image Gallery</h1>
      <p>Select up to four images to upload.</p>

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleImageChange}
        disabled={isUploading}
      />

      {error && <p className="error-message">{error}</p>}

      {selectedImages.length > 0 && (
        <section>
          <h2>Image Previews</h2>

          <div className="image-grid">
            {selectedImages.map((image) => (
              <div key={image.preview} className="image-card">
                <img src={image.preview} alt={image.file.name} />
                <p>{image.file.name}</p>
                <small>{(image.file.size / 1024).toFixed(1)} KB</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedImages.length > 0 && (
        <button type="button" onClick={handleUpload} disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload Images"}
        </button>
      )}

      {isUploading && (
        <section className="progress-section">
          <p>Uploading: {uploadProgress}%</p>

          <progress value={uploadProgress} max="100" />
        </section>
      )}

      {uploadedImages.length > 0 && (
        <section>
          <h2>Uploaded Gallery</h2>

          <div className="image-grid">
            {uploadedImages.map((image) => (
              <div key={image.filename} className="image-card">
                <img src={image.url} alt={image.filename} />
                <p>{image.filename}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default App;
