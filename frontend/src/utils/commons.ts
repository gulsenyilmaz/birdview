// utils/commons.ts
function extractCommonsFilename(input: string): string | null {
  // URL verildiyse, Special:FilePath veya wiki/File:... içinden dosya adını çıkar
  try {
    const u = new URL(input);
    const p = decodeURIComponent(u.pathname);

    const fp = "/Special:FilePath/";
    const idx1 = p.indexOf(fp);
    if (idx1 >= 0) {
      return p.slice(idx1 + fp.length); // "Edvard Munch 1933-2.jpg"
    }

    const wp = "/wiki/File:";
    const idx2 = p.indexOf(wp);
    if (idx2 >= 0) {
      return p.slice(idx2 + wp.length); // "Edvard_Munch_1933-2.jpg" veya boşluklu
    }

    // URL ama beklenen formatta değilse:
    return null;
  } catch {
    // URL değilse zaten bir dosya adı verilmiş demektir
    return input;
  }
}

export async function resolveCommonsThumb(
  input: string,     // "Edvard Munch 1933-2.jpg" veya tam URL
  width = 256
): Promise<string | null> {
  // 1) Dosya adını çıkar
  let filename = extractCommonsFilename(input);
  if (!filename) return null;

  // Bazen en-dash (–) / em-dash (—) sorun çıkarabiliyor; normalize et
  filename = filename.replace(/\u2013|\u2014/g, "-");

  // 2) API çağrısı (redirect ve formatversion=2 ile basitleştirilmiş)
  const title = `File:${filename}`;
  const api =
    "https://commons.wikimedia.org/w/api.php" +
    `?action=query&redirects=1&format=json&formatversion=2&origin=*` +
    `&prop=imageinfo&iiprop=url&iiurlwidth=${width}` +
    `&titles=${encodeURIComponent(title)}`;

  const res = await fetch(api);
  if (!res.ok) return null;

  const json = await res.json();
  const pages = json?.query?.pages;
  if (!Array.isArray(pages) || pages.length === 0) return null;

  const page = pages[0];
  // missing sayfalar: { missing: true } gelir
  const info = page?.imageinfo?.[0];
  return info?.thumburl || info?.url || null;
}
