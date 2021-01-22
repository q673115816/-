const http = require('http')
const fs = require('fs')
const path = require('path')

let list = []
let local = ['D:/limit', 'E:/SteamLibrary/steamapps/workshop/content']

let ext = ['.mp4', '.mkv']
function read(dir) {
    let files = fs.readdirSync(dir)
    files.forEach(file => {
        let fullcurr = path.join(dir, file)
        let resolvePath = path.join(dir, file)
        let stats = fs.statSync(fullcurr)
        if (stats.isFile()) {
            if (path.extname(file) === '.mp4') {
                list.push(encodeURIComponent(resolvePath))
            }
        } else if (stats.isDirectory()) {
            read(resolvePath)
        }
    })
}

for(let f of local) {
    read(f)
}

const server = http.createServer((req, res, next) => {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'))
    if (req.url === '/') {
        res.end(html)
    } else if (req.url === '/list') {
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(list))
    } else if (/^\/mmd/.test(req.url)) {
        res.setHeader('Content-Type', 'application/octet-stream');
        let realpath = decodeURIComponent(req.url.replace(/\/mmd\//, ''))
        console.log(realpath);
        fs.stat(realpath, (err, stats) => {
            if (err) console.log(err);
            let range = req.headers.range;
            if (range) {
                let positions = range.replace(/bytes=/, "").split("-");
                let start = parseInt(positions[0], 10);
                let total = stats.size;
                let end = positions[1] ? parseInt(positions[1], 10) : total - 1;
                let chunksize = (end - start) + 1;

                res.writeHead(206, {
                    "Content-Range": "bytes " + start + "-" + end + "/" + total,
                    "Accept-Ranges": "bytes",
                    "Content-Length": chunksize,
                    "Content-Type": "video/mp4"
                });
                fs.createReadStream(decodeURI(realpath), { start, end }).pipe(res)
            } else {
                return fs.createReadStream(realpath).pipe(res)
            }
        })
    }
})

server.listen(88, () => {
    console.log('work in 88');
})