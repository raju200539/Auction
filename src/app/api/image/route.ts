import { NextRequest } from 'next/server';

const GDRIVE_URL_REGEX = /drive\.google\.com\/file\/d\/([^/]+)/;

function convertGoogleDriveLink(url: string): string | null {
  const match = url.match(GDRIVE_URL_REGEX);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new Response('Image URL is required', { status: 400 });
  }

  let finalUrl = imageUrl;

  if (imageUrl.includes('drive.google.com')) {
    const convertedUrl = convertGoogleDriveLink(imageUrl);
    if (!convertedUrl) {
      return new Response('Invalid Google Drive URL', { status: 400 });
    }
    finalUrl = convertedUrl;
  }
  
  try {
    const imageResponse = await fetch(finalUrl, {
      headers: {
        'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!imageResponse.ok || !imageResponse.body) {
      throw new Error(`Failed to fetch image. Status: ${imageResponse.status}`);
    }
    
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    return new Response(imageResponse.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable', // Cache for 1 week
      },
    });

  } catch (error) {
    console.error('Error fetching image:', error);
    return new Response('Error fetching image', { status: 500 });
  }
}
