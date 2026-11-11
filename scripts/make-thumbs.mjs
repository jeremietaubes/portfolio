// Genere la cover servie et ses vignettes 16:9.
// Source prioritaire : _masters/<nom>.webp (haute qualite, hors public/).
// A defaut : public/images/<nom>.webp, deja compresse -> resultat plus mou.
// Usage : node scripts/make-thumbs.mjs
import sharp from 'sharp';
import { readdirSync, mkdirSync, existsSync } from 'node:fs';

const MASTERS = '_masters';
const IMAGES = 'public/images';
const THUMBS = 'public/images/thumbs';
const WIDTHS = [640, 1280];

mkdirSync(THUMBS, { recursive: true });

const covers = readdirSync(IMAGES).filter((f) => f.endsWith('-cover.webp'));

for (const file of covers) {
  const name = file.replace(/\.webp$/, '');
  const master = [`${MASTERS}/${name}.png`, `${MASTERS}/${name}.webp`].find(existsSync);
  const hasMaster = Boolean(master);
  const src = hasMaster ? master : `${IMAGES}/${file}`;

  if (hasMaster) {
    await sharp(src)
      .resize(1600, 900, { fit: 'cover', kernel: 'lanczos3' })
      .webp({ quality: 88, effort: 6 })
      .toFile(`${IMAGES}/${name}.webp`);
  }

  for (const w of WIDTHS) {
    await sharp(src)
      .resize(w, Math.round((w * 9) / 16), { fit: 'cover', kernel: 'lanczos3' })
      .sharpen({ sigma: 0.8, m1: 1, m2: 2.5 })
      .webp({ quality: 92, effort: 6 })
      .toFile(`${THUMBS}/${name}-${w}.webp`);
  }
  console.log(hasMaster ? `master  ${name}` : `SANS MASTER  ${name}  (vignette plus molle)`);
}
console.log(`${covers.length} covers traitees`);
