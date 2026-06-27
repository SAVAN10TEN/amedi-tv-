import fetch from "node-fetch";

async function test() {
  const videoUrl = "https://macdn.aoneroom.com/media/vone/2024/05/27/eaf038972c7975d5bcd59dcf4929fc83-sd.mp4";
  console.log("Fetching direct video URL:", videoUrl);
  
  // Test with no headers (like standard direct request or redirected browser load)
  const resNoHeaders = await fetch(videoUrl, { method: 'HEAD' });
  console.log("No headers response status:", resNoHeaders.status);
  console.log("No headers response headers:", resNoHeaders.headers.raw());

  // Test with Referer from moviebox
  const resWithReferer = await fetch(videoUrl, {
    method: 'HEAD',
    headers: {
      "Referer": "https://v.moviebox.ph/"
    }
  });
  console.log("With Moviebox referer status:", resWithReferer.status);
  console.log("With Moviebox referer headers:", resWithReferer.headers.raw());
}

test().catch(err => console.error(err));
