/**
 * cloud.nnpp.vip API 签名算法
 * 逆向自: m1-z2.cloud.nnpp.vip:2223/static/js/main.9c13c607.js
 * 
 * z  = MD5(MD5(String((dayOfMonth + 18) ^ 10)).substring(0, 10))
 * s1ig = dayOfWeek + 11397 (0=Sun, 6=Sat)
 */

// 轻量 MD5 实现 (不依赖外部库，支持中文字符)
function md5(input) {
  function rotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX, lY) {
    var lX4, lY4, lX8, lY8, lResult;
    lX8 = (lX & 0x80000000);
    lY8 = (lY & 0x80000000);
    lX4 = (lX & 0x40000000);
    lY4 = (lY & 0x40000000);
    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xC0000000 ^ lX8 ^ lY8;
      else return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    } else return lResult ^ lX8 ^ lY8;
  }
  function F(x, y, z) { return (x & y) | ((~x) & z); }
  function G(x, y, z) { return (x & z) | (y & (~z)); }
  function H(x, y, z) { return (x ^ y ^ z); }
  function I(x, y, z) { return (y ^ (x | (~z))); }
  function FF(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function GG(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function HH(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function II(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function stringToUtf8Array(str) {
    var utf8 = [];
    for (var i = 0; i < str.length; i++) {
      var charcode = str.charCodeAt(i);
      if (charcode < 0x80) utf8.push(charcode);
      else if (charcode < 0x800) {
        utf8.push(0xc0 | (charcode >> 6));
        utf8.push(0x80 | (charcode & 0x3f));
      } else if (charcode < 0xd800 || charcode >= 0xe000) {
        utf8.push(0xe0 | (charcode >> 12));
        utf8.push(0x80 | ((charcode >> 6) & 0x3f));
        utf8.push(0x80 | (charcode & 0x3f));
      } else {
        i++;
        charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
        utf8.push(0xf0 | (charcode >> 18));
        utf8.push(0x80 | ((charcode >> 12) & 0x3f));
        utf8.push(0x80 | ((charcode >> 6) & 0x3f));
        utf8.push(0x80 | (charcode & 0x3f));
      }
    }
    return utf8;
  }

  var x = [];
  var utf8 = stringToUtf8Array(input);
  var len = utf8.length;
  var i, j;
  x[len >> 2] = undefined;
  for (i = 0; i < len; i++) {
    j = i >> 2;
    if (!x[j]) x[j] = 0;
    x[j] |= utf8[i] << ((i % 4) * 8);
  }
  x[len >> 2] |= 0x80 << ((len % 4) * 8);
  x[(((len + 8) >>> 6) << 4) + 14] = len * 8;

  var a = 0x67452301,
    b = 0xEFCDAB89,
    c = 0x98BADCFE,
    d = 0x10325476,
    olda, oldb, oldc, oldd;

  for (i = 0; i < x.length; i += 16) {
    olda = a;
    oldb = b;
    oldc = c;
    oldd = d;
    a = FF(a, b, c, d, x[i + 0] || 0, 7, 0xD76AA478);
    d = FF(d, a, b, c, x[i + 1] || 0, 12, 0xE8C7B756);
    c = FF(c, d, a, b, x[i + 2] || 0, 17, 0x242070DB);
    b = FF(b, c, d, a, x[i + 3] || 0, 22, 0xC1BDCEEE);
    a = FF(a, b, c, d, x[i + 4] || 0, 7, 0xF57C0FAF);
    d = FF(d, a, b, c, x[i + 5] || 0, 12, 0x4787C62A);
    c = FF(c, d, a, b, x[i + 6] || 0, 17, 0xA8304613);
    b = FF(b, c, d, a, x[i + 7] || 0, 22, 0xFD469501);
    a = FF(a, b, c, d, x[i + 8] || 0, 7, 0x698098D8);
    d = FF(d, a, b, c, x[i + 9] || 0, 12, 0x8B44F7AF);
    c = FF(c, d, a, b, x[i + 10] || 0, 17, 0xFFFF5BB1);
    b = FF(b, c, d, a, x[i + 11] || 0, 22, 0x895CD7BE);
    a = FF(a, b, c, d, x[i + 12] || 0, 7, 0x6B901122);
    d = FF(d, a, b, c, x[i + 13] || 0, 12, 0xFD987193);
    c = FF(c, d, a, b, x[i + 14] || 0, 17, 0xA679438E);
    b = FF(b, c, d, a, x[i + 15] || 0, 22, 0x49B40821);
    a = GG(a, b, c, d, x[i + 1] || 0, 5, 0xF61E2562);
    d = GG(d, a, b, c, x[i + 6] || 0, 9, 0xC040B340);
    c = GG(c, d, a, b, x[i + 11] || 0, 14, 0x265E5A51);
    b = GG(b, c, d, a, x[i + 0] || 0, 20, 0xE9B6C7AA);
    a = GG(a, b, c, d, x[i + 5] || 0, 5, 0xD62F105D);
    d = GG(d, a, b, c, x[i + 10] || 0, 9, 0x2441453);
    c = GG(c, d, a, b, x[i + 15] || 0, 14, 0xD8A1E681);
    b = GG(b, c, d, a, x[i + 4] || 0, 20, 0xE7D3FBC8);
    a = GG(a, b, c, d, x[i + 9] || 0, 5, 0x21E1CDE6);
    d = GG(d, a, b, c, x[i + 14] || 0, 9, 0xC33707D6);
    c = GG(c, d, a, b, x[i + 3] || 0, 14, 0xF4D50D87);
    b = GG(b, c, d, a, x[i + 8] || 0, 20, 0x455A14ED);
    a = GG(a, b, c, d, x[i + 13] || 0, 5, 0xA9E3E905);
    d = GG(d, a, b, c, x[i + 2] || 0, 9, 0xFCEFA3F8);
    c = GG(c, d, a, b, x[i + 7] || 0, 14, 0x676F02D9);
    b = GG(b, c, d, a, x[i + 12] || 0, 20, 0x8D2A4C8A);
    a = HH(a, b, c, d, x[i + 5] || 0, 4, 0xFFFA3942);
    d = HH(d, a, b, c, x[i + 8] || 0, 11, 0x8771F681);
    c = HH(c, d, a, b, x[i + 11] || 0, 16, 0x6D9D6122);
    b = HH(b, c, d, a, x[i + 14] || 0, 23, 0xFDE5380C);
    a = HH(a, b, c, d, x[i + 1] || 0, 4, 0xA4BEEA44);
    d = HH(d, a, b, c, x[i + 4] || 0, 11, 0x4BDECFA9);
    c = HH(c, d, a, b, x[i + 7] || 0, 16, 0xF6BB4B60);
    b = HH(b, c, d, a, x[i + 10] || 0, 23, 0xBEBFBC70);
    a = HH(a, b, c, d, x[i + 13] || 0, 4, 0x289B7EC6);
    d = HH(d, a, b, c, x[i + 0] || 0, 11, 0xEAA127FA);
    c = HH(c, d, a, b, x[i + 3] || 0, 16, 0xD4EF3085);
    b = HH(b, c, d, a, x[i + 6] || 0, 23, 0x4881D05);
    a = HH(a, b, c, d, x[i + 9] || 0, 4, 0xD9D4D039);
    d = HH(d, a, b, c, x[i + 12] || 0, 11, 0xE6DB99E5);
    c = HH(c, d, a, b, x[i + 15] || 0, 16, 0x1FA27CF8);
    b = HH(b, c, d, a, x[i + 2] || 0, 23, 0xC4AC5665);
    a = II(a, b, c, d, x[i + 0] || 0, 6, 0xF4292244);
    d = II(d, a, b, c, x[i + 7] || 0, 10, 0x432AFF97);
    c = II(c, d, a, b, x[i + 14] || 0, 15, 0xAB9423A7);
    b = II(b, c, d, a, x[i + 5] || 0, 21, 0xFC93A039);
    a = II(a, b, c, d, x[i + 12] || 0, 6, 0x655B59C3);
    d = II(d, a, b, c, x[i + 3] || 0, 10, 0x8F0CCC92);
    c = II(c, d, a, b, x[i + 10] || 0, 15, 0xFFEFF47D);
    b = II(b, c, d, a, x[i + 1] || 0, 21, 0x85845DD1);
    a = II(a, b, c, d, x[i + 8] || 0, 6, 0x6FA87E4F);
    d = II(d, a, b, c, x[i + 15] || 0, 10, 0xFE2CE6E0);
    c = II(c, d, a, b, x[i + 6] || 0, 15, 0xA3014314);
    b = II(b, c, d, a, x[i + 13] || 0, 21, 0x4E0811A1);
    a = II(a, b, c, d, x[i + 4] || 0, 6, 0xF7537E82);
    d = II(d, a, b, c, x[i + 11] || 0, 10, 0xBD3AF235);
    c = II(c, d, a, b, x[i + 2] || 0, 15, 0x2AD7D2BB);
    b = II(b, c, d, a, x[i + 9] || 0, 21, 0xEB86D391);
    a = addUnsigned(a, olda);
    b = addUnsigned(b, oldb);
    c = addUnsigned(c, oldc);
    d = addUnsigned(d, oldd);
  }
  function wordToHex(w) {
    var hex = '';
    for (var i = 0; i < 4; i++) {
      hex += ((w >> (i * 8 + 4)) & 0xf).toString(16);
      hex += ((w >> (i * 8)) & 0xf).toString(16);
    }
    return hex;
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

/**
 * 计算 nnpp API 签名参数
 * 日期使用 UTC+8（中国时区）
 * @returns {{ z: string, s1ig: number }}
 */
export function computeNnppSign() {
  const now = new Date();
  // UTC+8 调整：当前时间 + 时区偏移 + 8小时
  const localTime = new Date(now.getTime() + 60000 * now.getTimezoneOffset() + 3600000 * 8);
  const dayOfMonth = localTime.getDate();
  const dayOfWeek = localTime.getDay(); // 0=Sun, 6=Sat

  const raw = (dayOfMonth + 18) ^ 10;
  const hash1 = md5(String(raw));
  const hash1_10 = hash1.substring(0, 10);
  const z = md5(hash1_10);
  const s1ig = dayOfWeek + 11397;

  return { z, s1ig };
}
