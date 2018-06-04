module.exports = {
    root: process.cwd(),
    hostname: '127.0.0.1',
    port: '9527',
    compress: /\.(html|js|css|md)/,
    // 首部字段 Cache-Control 能够控制缓存的行为
    cache: {
        maxAge: 600,        //10分钟
        expires: true,      //实体主体过期的日期时间
        cacheControl: true,
        lastModified: true, //资源的最后修改日期时间
        etag: true
    }
};