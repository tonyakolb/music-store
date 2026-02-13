const express = require('express');
const cors = require('cors');
const { faker } = require('@faker-js/faker');
const seedrandom = require('seedrandom');

const app = express();
app.use(cors());

function escapeXML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

app.get('/api/items', (req, res) => {
  let { region, seed, page, limit, likes } = req.query;

  // безопасные значения по умолчанию
  region = region || 'en';
  seed = seed || '1';
  page = Number(page) || 1;
  limit = Number(limit) || 20;
  likes = likes === undefined || likes === '' ? 1 : Number(likes);

  // устанавливаем локаль faker
  faker.locale = region;

  const items = [];

  for (let i = 0; i < limit; i++) {
    // детерминированный seed для каждого элемента
    const itemSeed = `${seed}-${region}-${page}-${i}`;
    const rng = seedrandom(itemSeed);

    faker.seed(Math.floor(rng() * 100000));

    const artist = faker.person.fullName();
    const title = faker.music.songName();

    // лайки (меняются только они)
    const baseLikes = Math.floor(rng() * 1000);
    const finalLikes = Math.floor(baseLikes * likes);

    // случайный цвет
    const bgColor = `hsl(${Math.floor(rng() * 360)},60%,50%)`;

    const safeTitle = escapeXML(title);
    const safeArtist = escapeXML(artist);

    // SVG cover
    const svg = `
      <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgColor}" />
        <text x="50%" y="40%" text-anchor="middle" fill="white" font-size="18" font-family="Arial">
          ${safeTitle}
        </text>
        <text x="50%" y="60%" text-anchor="middle" fill="white" font-size="14" font-family="Arial">
          ${safeArtist}
        </text>
      </svg>
    `;

    const cover = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

    // простая мелодия (8 нот)
    const notes = Array.from({ length: 8 }, () =>
      60 + Math.floor(rng() * 12)
    );

    items.push({
      id: `${seed}-${region}-${page}-${i}`,
      artist,
      title,
      likes: finalLikes,
      cover,
      notes
    });
  }

  res.json({ items });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});