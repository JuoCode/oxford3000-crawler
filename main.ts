import Crawler, { CrawlerRequestResponse } from 'crawler';
import * as fs from 'fs';

const wordSet = new Set();
const c = new Crawler({});

c.on('drain', () => {
  const wordlist = Array.from(wordSet).sort();
  console.log(`${wordlist.length} words downloaded`);
  fs.writeFileSync('oxford3000', wordlist.join('\n'));
});

c.queue({
  uri: 'https://www.oxfordlearnersdictionaries.com/us/wordlist/american_english/oxford3000/Oxford3000_A-B/',
  callback: parseEntries,
});

function parseEntries(err: Error, resp: Crawler.CrawlerRequestResponse, done: () => void) {
  if (err) {
    console.error(err);
    return;
  }
  const $ = resp.$;
  const entries = $('#entries-selector ul a').toArray().map(link => $(link).attr('href'));
  entries.forEach(entry => {
    c.queue({
      uri: entry,
      callback: parseWordlist,
    });
  });
  parseWordlist(err, resp, done);
}

function parseWordlist(err: Error, resp: CrawlerRequestResponse, done: () => void) {
  if (err) {
    console.error(err);
    return;
  }
  const $ = resp.$;
  const words = $('.wordlist-oxford3000 li a').toArray().map(link => $(link).text());
  words.map(w => wordSet.add(w));

  const nextURI = getNextPageURI($);
  if (nextURI) {
    c.queue({
      uri: nextURI,
      callback: parseWordlist,
    });
  }
  done();
}

function getNextPageURI($: cheerio.CheerioAPI): string | undefined {
  const last = $('ul.paging_links a').eq(-1);
  if ($(last).text() === '>') {
    return $(last).attr('href');
  }
  return undefined;
}
