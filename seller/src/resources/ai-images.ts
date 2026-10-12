/**
 * Types for AI listing images (BYOK). The methods live on
 * `ListingsResource.generateImage` / `.imagePrompt` and
 * `AIResource.setImageConfig`; the image is made with the caller's OWN image
 * provider key (OpenAI, Google, xAI or Together) and is recorded as
 * AI-generated, so the shop tags the listing.
 */

export type AIImageStyle = 'studio' | 'lifestyle' | 'flatlay' | 'detail';
export type AIImageProvider = 'openai' | 'google' | 'xai' | 'together';

/** Listing fields the prompt is built from. With `listingId`, blanks are filled from that listing. */
export interface ListingImagePromptBody {
  listingId?: string | null;
  title?: string | null;
  brand?: string | null;
  /** Model / style name, e.g. "Air Jordan 1 Retro High OG". */
  model?: string | null;
  color?: string | string[] | null;
  material?: string | null;
  size?: string | null;
  /** Kept true in the image: a used item is never rendered as new. */
  condition?: string | null;
  category?: string | null;
  description?: string | null;
  /** Default `studio`. */
  style?: AIImageStyle | null;
  /** Short seller note (max 300 chars). */
  extra?: string | null;
  /** One of the listing's photos on the Crossly CDN — the model keeps that exact item. Other hosts are refused. */
  referenceImageUrl?: string | null;
}

export interface GenerateListingImageBody extends ListingImagePromptBody {
  /** Use this prompt verbatim instead of building one. */
  prompt?: string | null;
}

export interface ListingImagePrompt {
  prompt: string;
}

export interface GeneratedListingImage {
  /** On the Crossly CDN. Add it to the listing's `images`; when no `listingId` was sent, also send it in `aiMediaUrls` on save. */
  url: string;
  prompt: string;
  provider: AIImageProvider;
  model: string;
  listingId: string | null;
  aiGenerated: true;
}

export interface AIImageConfigBody {
  /** null = automatic (main provider if image-capable, else the first image provider with a key). */
  provider: AIImageProvider | null;
  /** null = the provider's default image model. */
  model?: string | null;
}

export interface AIImageConfigResult {
  success: boolean;
  image: {
    provider: AIImageProvider | null;
    model: string | null;
    resolvedProvider: AIImageProvider | null;
    resolvedModel: string | null;
    supportedProviders: AIImageProvider[];
    error: string | null;
  };
}

/**
 * One of Crossly's AI-image detections on a listing photo. Crossly flags a
 * photo when the file's own metadata says it was generated (Content
 * Credentials / IPTC DigitalSourceType / generator tags) or a hosted detector
 * scores it over the threshold; the shop then shows "AI images · detected by
 * Crossly" (listing `aiMediaDetected`).
 */
export interface AiImageDetection {
  id: string;
  url: string;
  verdict: 'ai' | 'review' | 'clear';
  /** What the shop tag uses: the verdict, unless Crossly review overrode it. */
  flagged: boolean;
  status: 'flagged' | 'review' | 'disputed' | 'cleared' | 'clear';
  /** c2pa | xmp | exif | png_text (metadata) · model | sightengine | hive (hosted) · metadata (nothing found). */
  source: string;
  score: number | null;
  generator: string | null;
  evidence: string[];
  disputedAt: string | null;
  resolvedAt: string | null;
  resolution: 'ai' | 'clear' | null;
  createdAt: string;
}
