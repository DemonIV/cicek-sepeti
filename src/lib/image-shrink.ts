/**
 * Tarayıcıda görsel küçültme.
 *
 * Demo'da nesne deposu (S3/Blob) yok: çekilen fotoğraf tarayıcıda küçültülüp
 * veri URL'i olarak veritabanına yazılır. Sunucuda görsel işleme yapılmaz —
 * küçük bir kutuda (Render free plan, 512 MB) ayakta kalabilmesi için
 * bilinçli bir sınır. Gerçek sistemde bu adım nesne deposuna yükleme olur.
 *
 * Hem çiçekçinin hazırlık karesi hem kuryenin teslim karesi buradan geçer;
 * ölçü ve kalite tek yerde dursun.
 */

const MAX_EDGE = 900;
const QUALITY = 0.72;

export async function shrinkToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tarayıcı görseli işleyemedi.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", QUALITY);
}
