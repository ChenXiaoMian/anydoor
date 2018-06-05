const fs = require('fs');
const path = require('path');
// promise
const promisify = require('util').promisify;
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const mime = require('./mime');
const compress = require('./compress');
const range = require('./range');
const isFresh = require('./cache');

// 读取模板文件
const handlebars = require('handlebars');
const tplPath = path.join(__dirname, '../template/dir.tpl');
const source = fs.readFileSync(tplPath);
const template = handlebars.compile(source.toString());


module.exports = (req, res, filePath, conf) => {
  stat(filePath).then(stats=>{
      if(stats.isFile()){
          const contentType = mime(filePath);
          res.setHeader('Content-Type', contentType);
          if(isFresh(stats, req, res)){
              res.statusCode = 304;
              res.end();
              return;
          }
          let rs;
          const {code, start, end} = range(stats.size, req, res);
          if(code === 200){
              res.statusCode = 200;
              rs = fs.createReadStream(filePath);
          }else{
              res.statusCode = 206;
              rs = fs.createReadStream(filePath, {start, end});
          }                
          // gzip压缩
          if(filePath.match(conf.compress)){
              rs = compress(rs, req, res);
          }
          rs.pipe(res);
      }else if(stats.isDirectory()){
          readdir(filePath).then(files =>{
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/html');
              var dir = path.relative(conf.root, filePath);
              const data = {
                  files,
                  title: path.basename(filePath),
                  dir: dir ? `/${dir}` : ''
              };
              res.end(template(data));
          });
      }
  }).catch(err => {
      console.error(err);
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain');
      res.end(`${filePath} is not a directory or file`);
  });
}