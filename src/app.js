const http = require('http');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');
// promise
const promisify = require('util').promisify;

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const conf = require('./config/config');
const mime = require('./helper/mime');
const compress = require('./helper/compress');
const range = require('./helper/range');
const isFresh = require('./helper/cache');

// 读取模板文件
const tplPath = path.join(__dirname, 'template/dir.tpl');
const source = fs.readFileSync(tplPath);
const template = handlebars.compile(source.toString());

const server = http.createServer((req, res) => {
    const filePath = path.join(conf.root, req.url);
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

    // fs.stat(filePath, (err, stats) => {
    //     if(err){
    //         res.statusCode = 404;
    //         res.setHeader('Content-Type', 'text/plain');
    //         res.end(`${filePath} is not a directory or file`);
    //         return;
    //     }
    //     if(stats.isFile()){
    //         res.statusCode = 200;
    //         res.setHeader('Content-Type', 'text/plain');
    //         fs.createReadStream(filePath).pipe(res);
    //     }else if(stats.isDirectory()){
    //         fs.readdir(filePath, (err, files) => {
    //             res.statusCode = 200;
    //             res.setHeader('Content-Type', 'text/plain');
    //             res.end(files.join(','));
    //         });
    //     }
    // });
    // res.statusCode = 200;
    // res.setHeader('Content-Type', 'text/html');
    // res.end(filePath);
});

server.listen(conf.port, conf.hostname, ()=>{
    const addr = `http://${conf.hostname}:${conf.port}`;
    console.log(`Server running at ${chalk.green(addr)}`);
})