import { supabaseAdmin } from './supabase';

const BUCKET_NAME = 'produtos';
const BASE_URL = 'https://loswbmthpoldtzisxokl.supabase.co/storage/v1/object/public';

export class StorageService {
  /**
   * Lista todas as imagens de uma pasta no bucket de produtos
   * @param folderPath - Caminho da pasta (ex: "Camisa2")
   * @returns Array de URLs públicas das imagens
   */
  async listImages(folderPath: string): Promise<string[]> {
    console.log('[StorageService] Listing images from folder:', folderPath);

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .list(folderPath, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (error) {
      console.error('[StorageService] Error listing images:', error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log('[StorageService] No images found in folder:', folderPath);
      return [];
    }

    // Filtrar apenas arquivos de imagem e construir URLs públicas
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const imageFiles = data.filter(file => {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      return imageExtensions.includes(ext) && !file.id.includes('/'); // Ignorar subpastas
    });

    // Ordenar para que arquivos com 'placeholder' no nome venham primeiro
    imageFiles.sort((a, b) => {
      const aIsPlaceholder = a.name.toLowerCase().includes('placeholder');
      const bIsPlaceholder = b.name.toLowerCase().includes('placeholder');
      
      if (aIsPlaceholder && !bIsPlaceholder) return -1;
      if (!aIsPlaceholder && bIsPlaceholder) return 1;
      return a.name.localeCompare(b.name); // Ordem alfabética para o resto
    });

    const images = imageFiles.map(file => `${BASE_URL}/${BUCKET_NAME}/${folderPath}/${file.name}`);

    console.log('[StorageService] Found images (placeholder first):', images);
    return images;
  }

  /**
   * Retorna a primeira imagem de uma pasta (para thumbnail)
   */
  async getFirstImage(folderPath: string): Promise<string | null> {
    const images = await this.listImages(folderPath);
    return images.length > 0 ? images[0] : null;
  }

  /**
   * Constrói URL pública de uma imagem específica
   */
  buildImageUrl(folderPath: string, fileName: string): string {
    return `${BASE_URL}/${BUCKET_NAME}/${folderPath}/${fileName}`;
  }
}

export const storageService = new StorageService();
