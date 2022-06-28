import { fromImage } from 'imtool';
import { ImageType } from 'imtool/lib/Utils';

/**
 * 画像をリサイズする。
 * リサイズ結果は、HTML上にすぐ表示するためのDataUrl形式と、
 * ストレージに保存する用のBlob形式の双方で返却する。
 *
 * なお使用しているライブラリは、imtoolを使用している。
 * - https://github.com/mat-sz/imtool
 */
export const resize = async (file: ImageType) => {
  const tool = await fromImage(file);
  const thumbnail = tool.thumbnail(1000, true);
  const resizedDataUrl = await thumbnail.toDataURL();
  return { resizedDataUrl };
};
