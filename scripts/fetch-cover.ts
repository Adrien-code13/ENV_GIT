import https from "https";
import fs from "fs";
import path from "path";

/**
 * Fetch album cover art from Deezer API (no auth required)
 * Usage: npx ts-node scripts/fetch-cover.ts "Bande Organisée" "13 Organisé"
 *   or:  npx ts-node scripts/fetch-cover.ts "Flying Blue" "SCH"
 *
 * Optional 3rd arg: output filename (default: cover.jpg)
 */

const PUBLIC_DIR = path.resolve(__dirname, "../public");

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpsGet(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

async function fetchCover(title: string, artist: string, outputName = "cover.jpg") {
  const query = encodeURIComponent(`${artist} ${title}`);
  const apiUrl = `https://api.deezer.com/search?q=${query}&limit=5`;

  console.log(`Searching Deezer: "${artist} - ${title}"...`);
  const raw = await httpsGet(apiUrl);
  const data = JSON.parse(raw);

  if (!data.data || data.data.length === 0) {
    // Fallback: search with title only
    console.log("No results, trying title only...");
    const fallbackUrl = `https://api.deezer.com/search?q=${encodeURIComponent(title)}&limit=5`;
    const fallbackRaw = await httpsGet(fallbackUrl);
    const fallbackData = JSON.parse(fallbackRaw);
    if (!fallbackData.data || fallbackData.data.length === 0) {
      console.error("No results found on Deezer.");
      process.exit(1);
    }
    data.data = fallbackData.data;
  }

  // Get the best match
  const track = data.data[0];
  const albumId = track.album?.id;
  const coverSmall = track.album?.cover_xl || track.album?.cover_big || track.album?.cover_medium;

  console.log(`Found: "${track.title}" by ${track.artist?.name}`);
  console.log(`Album: ${track.album?.title}`);

  // Try to get the highest resolution cover from album endpoint
  let coverUrl = coverSmall;
  if (albumId) {
    try {
      const albumRaw = await httpsGet(`https://api.deezer.com/album/${albumId}`);
      const albumData = JSON.parse(albumRaw);
      coverUrl = albumData.cover_xl || albumData.cover_big || coverUrl;
    } catch {
      // Use track cover as fallback
    }
  }

  if (!coverUrl) {
    console.error("No cover image found.");
    process.exit(1);
  }

  // Ensure public/ exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  const outputPath = path.join(PUBLIC_DIR, outputName);
  console.log(`Downloading cover to ${outputPath}...`);
  await downloadFile(coverUrl, outputPath);
  console.log(`Cover saved: ${outputPath} (${fs.statSync(outputPath).size} bytes)`);

  return { coverUrl, outputPath, outputName };
}

// CLI entry point
const [, , titleArg, artistArg, outputArg] = process.argv;

if (!titleArg || !artistArg) {
  console.log("Usage: npx ts-node scripts/fetch-cover.ts <title> <artist> [output-filename]");
  console.log('Example: npx ts-node scripts/fetch-cover.ts "Bande Organisée" "13 Organisé"');
  process.exit(1);
}

fetchCover(titleArg, artistArg, outputArg).catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

export { fetchCover };
