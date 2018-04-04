const http = require('http');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');
const promisify = require('util').promisify;

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const conf = require('./config/config');
const mime = require('./helper/mime');

// 读取模板文件
const tplPath = path.join(__dirname, 'template/dir.tpl');
const source = fs.readFileSync(tplPath);
const template = handlebars.compile(source.toString());

const server = http.createServer((req, res) => {
    const filePath = path.join(conf.root, req.url);
    stat(filePath).then(stats=>{
        if(stats.isFile()){
            const contentType = mime(filePath);
            res.statusCode = 200;
            res.setHeader('Content-Type', contentType);
            fs.createReadStream(filePath).pipe(res);
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