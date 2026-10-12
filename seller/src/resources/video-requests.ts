import type { HttpClient } from './_shared.js';

export interface SellerVideoRequest { id: string; slug: string | null; title: string; imageUrl: string | null; buyerName: string; note: string | null; status: 'open' | 'answered' | 'declined'; videoUrl: string | null; sellerNote: string | null; answeredAt: string | null; createdAt: string }
export interface VideoUploadUrl { uploadUrl: string; publicUrl: string }

/** Buyers asking for a video of your items. Reading needs `inbox:read`; answering `inbox:write`. */
export class VideoRequestsResource {
  constructor(private readonly http: HttpClient) {}
  list(status: 'open' | 'answered' | 'declined' | 'all' = 'open') { return this.http.request<{ data: SellerVideoRequest[] }>({ method: 'GET', path: '/v1/video-requests', query: { status } }); }
  /** A presigned upload: PUT the file to uploadUrl (same Content-Type, exact Content-Length), then answer with publicUrl. */
  uploadUrl(input: { fileName: string; contentType: string; contentLength: number }) { return this.http.request<{ data: VideoUploadUrl }>({ method: 'POST', path: '/v1/video-requests/upload-url', body: input }); }
  answer(id: string, input: { videoUrl: string; note?: string }) { return this.http.request<{ data: SellerVideoRequest }>({ method: 'POST', path: `/v1/video-requests/${encodeURIComponent(id)}/answer`, body: input }); }
  decline(id: string, note?: string) { return this.http.request<{ data: SellerVideoRequest }>({ method: 'POST', path: `/v1/video-requests/${encodeURIComponent(id)}/decline`, body: { note } }); }
}
