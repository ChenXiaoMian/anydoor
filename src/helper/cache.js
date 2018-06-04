const {cache} = require('../config/config')

function refreshRes(stats, res){
  const {maxAge, expires, cacheControl, lastModified, etag} = cache;
  
  if(expires){
    res.setHeader('Expires', (new Date(Date.now() + maxAge * 1000)).toUTCString());
  }
  if(cacheControl){
    res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
  }
  if(lastModified){
    // 表示文件最后一次被修改的时间。
    res.setHeader('Last-Modified', stats.mtime.toUTCString());
  }
  if(etag){
    // 报错：无效字符
    // res.setHeader('ETag',`${stats.size}-${stats.mtime}`);
    res.setHeader('ETag', `${stats.size}`);
  }
}

module.exports = function isFresh(stats, req, res){
  refreshRes(stats, res);

  const lastModified = req.headers['if-modified-since'];
  const etag = req.headers['if-none-match'];
  if(!lastModified && !etag){
    return false;
  }
  if(lastModified && lastModified !== res.getHeader('Last-Modified')){
    return false;
  }
  if(etag && etag !== res.getHeader('ETag')){
    return false;
  }
  return true;
}