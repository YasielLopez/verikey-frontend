import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'react-native';

export interface ImageProcessingOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio?: boolean;
}

const getImageDimensions = (uri: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
};

const calculateOptimalDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  const aspectRatio = originalWidth / originalHeight;
  
  let newWidth = originalWidth;
  let newHeight = originalHeight;
  
  if (originalWidth > maxWidth || originalHeight > maxHeight) {
    if (originalWidth / maxWidth > originalHeight / maxHeight) {
      newWidth = maxWidth;
      newHeight = Math.round(maxWidth / aspectRatio);
    } else {
      newHeight = maxHeight;
      newWidth = Math.round(maxHeight * aspectRatio);
    }
  }
  
  return { width: newWidth, height: newHeight };
};

export const processImageForUpload = async (
  uri: string,
  options: ImageProcessingOptions = {}
): Promise<string> => {
  const {
    quality = 0.92, 
    maxWidth = 1920,
    maxHeight = 1920,
    maintainAspectRatio = true
  } = options;

  try {
    console.log('🖼 Processing image:', uri);
    
    const dimensions = await getImageDimensions(uri);
    console.log('📐 Original dimensions:', dimensions);
    
    const optimalSize = maintainAspectRatio
      ? calculateOptimalDimensions(dimensions.width, dimensions.height, maxWidth, maxHeight)
      : { width: maxWidth, height: maxHeight };
    
    console.log('📏 Target dimensions:', optimalSize);
    
    const actions = [];
    
    if (optimalSize.width !== dimensions.width || optimalSize.height !== dimensions.height) {
      actions.push({ 
        resize: optimalSize
      });
    }
    
    const manipResult = await manipulateAsync(
      uri,
      actions,
      {
        compress: quality,
        format: SaveFormat.JPEG,
        base64: false
      }
    );

    const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const photoBase64 = `data:image/jpeg;base64,${base64}`;
    const sizeKB = (photoBase64.length / 1024).toFixed(2);
    console.log('✅ Image processed, size:', sizeKB, 'KB');
    
    if (parseFloat(sizeKB) > 500) {
      console.warn('⚠️ Large image size:', sizeKB, 'KB - Consider reducing quality');
    }
    
    return photoBase64;
  } catch (error) {
    console.error('❌ Image processing failed:', error);
    throw error;
  }
};

export const processSelfieForUpload = async (uri: string): Promise<string> => {
  return processImageForUpload(uri, {
    quality: 0.9,
    maxWidth: 1080,
    maxHeight: 1080,
    maintainAspectRatio: true
  });
};

export const processProfilePhotoForUpload = async (uri: string): Promise<string> => {
  return processImageForUpload(uri, {
    quality: 0.85,
    maxWidth: 512, 
    maxHeight: 512,
    maintainAspectRatio: true
  });
};