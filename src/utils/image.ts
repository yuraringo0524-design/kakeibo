/**
 * レシート写真をそのまま data URL にすると数 MB になり、
 * localStorage の容量上限と Firestore の 1 ドキュメント 1MB 制限に当たって保存が失敗する。
 * 長辺を縮めた JPEG に変換してから保存する。
 */
const MAX_EDGE = 1280;
const MAX_CHARS = 700_000; // data URL の文字数（≒ Firestore の 1MB 制限に対する安全側）

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image-decode-failed'));
    img.src = src;
  });
}

export interface DownscaleResult {
  dataUrl: string | null;
  /** 縮小しても上限に収まらなかった場合のメッセージ */
  warning: string | null;
}

export async function downscaleReceipt(file: File): Promise<DownscaleResult> {
  let original: string;
  try {
    original = await readAsDataUrl(file);
  } catch {
    return { dataUrl: null, warning: '画像を読み込めませんでした。' };
  }

  try {
    const img = await loadImage(original);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no-2d-context');
    ctx.drawImage(img, 0, 0, w, h);

    for (const quality of [0.72, 0.6, 0.45, 0.3]) {
      const out = canvas.toDataURL('image/jpeg', quality);
      if (out.length <= MAX_CHARS) return { dataUrl: out, warning: null };
    }
    return {
      dataUrl: null,
      warning: 'レシート画像が大きすぎるため添付できませんでした。明細は画像なしで保存できます。',
    };
  } catch {
    // canvas が使えない環境では元データのまま。ただし上限は守る。
    if (original.length <= MAX_CHARS) return { dataUrl: original, warning: null };
    return {
      dataUrl: null,
      warning: 'レシート画像が大きすぎるため添付できませんでした。明細は画像なしで保存できます。',
    };
  }
}
