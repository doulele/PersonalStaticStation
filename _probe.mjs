const H = { 'User-Agent': 'Mozilla/5.0' };
const r = await fetch('https://zh.wikisource.org/w/api.php?action=parse&page=%E7%B4%85%E6%A8%93%E5%A4%A2%2F%E7%AC%AC001%E5%9B%9E&prop=text&variant=zh-cn&format=json&formatversion=2', { signal: AbortSignal.timeout(12000), headers: H });
const j = await r.json();
const html = j.parse.text;
console.log('html len', html.length);
// 提取正文 p 标签
const ps = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].slice(0, 4).map(m => m[1].replace(/<[^>]+>/g, '').slice(0, 80));
console.log('p samples:', JSON.stringify(ps, null, 1));
// 检查是否简体
console.log('contains 隱:', html.includes('隱'), '| contains 隐:', html.includes('隐'));
console.log('contains 夢:', html.includes('夢'), '| contains 梦:', html.includes('梦'));
