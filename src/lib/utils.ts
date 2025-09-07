import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const convertGoogleDriveLink = (url: string): string => {
  if (!url || !url.includes('drive.google.com')) {
    return url;
  }
  const regex = /drive\.google\.com\/file\/d\/([^/]+)/;
  const match = url.match(regex);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
};
