// makefun-x-reposts-02 entry: hands in the X posts that answer make.fun's newest posts.
//
// This program reads POSTS.json from the repository root, checks every address in it,
// and copies the file to the output directory where the house reads it.
//
// The list must hold 1 to 15 addresses, each one a post of ours on X:
//   https://x.com/ceplokegg78/status/<digits>
// No address may repeat, and every address must name the same account, ceplokegg78,
// the public X account this entry posts from. Anything else is refused here, before
// the house ever sees it, so a bad list fails loudly instead of passing silently.
//
// The posts themselves are the entry: each one quotes, or replies directly to, a
// different one of make.fun's newest posts on x.com/makefunai, its own words carrying
// make.fun or @makefunai and our play code. The house reads their reposts, quotes
// and likes from X; nothing this program writes about them is scored.
//
// Run it the way the kit says:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The one X account this entry's posts come from.
const HANDLE = 'ceplokegg78';
// A post address is the handle, /status/, and the post id, digits only.
const POST_RE = /^https:\/\/x\.com\/ceplokegg78\/status\/(\d+)$/;

const postsPath = join(BOT_DIR, 'POSTS.json');
let raw: string;
try {
  raw = readFileSync(postsPath, 'utf8');
} catch (err) {
  console.error(`POSTS.json could not be read from ${BOT_DIR}: ${(err as Error).message}`);
  process.exit(1);
}

let data: unknown;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error(`POSTS.json is not valid JSON: ${(err as Error).message}`);
  process.exit(1);
}

// The house refuses a POSTS.json over 16384 bytes, so refuse it here too.
if (Buffer.byteLength(raw, 'utf8') > 16384) {
  console.error(`POSTS.json is ${Buffer.byteLength(raw, 'utf8')} bytes, over the 16384-byte cap.`);
  process.exit(1);
}

if (typeof data !== 'object' || data === null || Array.isArray(data)) {
  console.error('POSTS.json must be a JSON object of the form {"posts": [...]}.');
  process.exit(1);
}

const posts = (data as { posts?: unknown }).posts;
if (!Array.isArray(posts)) {
  console.error('POSTS.json must hold a "posts" array.');
  process.exit(1);
}
if (posts.length < 1 || posts.length > 15) {
  console.error(`POSTS.json must name 1 to 15 posts, found ${posts.length}.`);
  process.exit(1);
}

const seen = new Set<string>();
for (const [i, post] of posts.entries()) {
  if (typeof post !== 'string') {
    console.error(`posts[${i}] is not a string: ${String(post)}`);
    process.exit(1);
  }
  const m = POST_RE.exec(post);
  if (!m) {
    console.error(`posts[${i}] is not one of our X posts: ${post}`);
    console.error(`Each address must be https://x.com/${HANDLE}/status/<digits>.`);
    process.exit(1);
  }
  if (seen.has(m[1])) {
    console.error(`posts[${i}] repeats post ${m[1]}, already named above.`);
    process.exit(1);
  }
  seen.add(m[1]);
}

mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  copyFileSync(postsPath, join(OUTPUT_DIR, 'POSTS.json'));
} catch (err) {
  console.error(`POSTS.json could not be copied to ${OUTPUT_DIR}: ${(err as Error).message}`);
  process.exit(1);
}

console.log(`Handed in ${posts.length} post(s) from @${HANDLE} to ${join(OUTPUT_DIR, 'POSTS.json')}.`);
