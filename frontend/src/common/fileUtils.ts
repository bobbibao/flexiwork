export async function fetchImage(imagePath: string): Promise<string | null> {
  const url = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

  try {
    const response = await fetch(url);

    if (response.status === 404) {
      return null;
    }

    const base64Data = await response.text();

    // Prefix the base64 data with the proper MIME type
    return `data:image/png;base64,${base64Data}`;
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
}
