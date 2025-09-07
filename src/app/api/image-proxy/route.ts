import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse('URL parameter is required', { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    const dataUrl = `data:${blob.type};base64,${buffer.toString('base64')}`;

    return NextResponse.json({ dataUrl });
  } catch (error) {
    console.error('Error in image proxy:', error);
    return new NextResponse('Failed to proxy image', { status: 500 });
  }
}
