import http from 'node:http';
import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp4':'video/mp4'};
http.createServer(async(req,res)=>{try{
const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return}
const info=await stat(file);if(!info.isFile()){res.writeHead(404);res.end();return}
const headers={'Content-Type':types[extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':extname(file)==='.html'?'no-cache':'public, max-age=3600','Accept-Ranges':'bytes'};
let start=0,end=info.size-1,status=200;
if(req.headers.range){const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
if(!m||(!m[1]&&!m[2])){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return}
if(!m[1])start=Math.max(0,info.size-Number(m[2]));else{start=Number(m[1]);if(m[2])end=Math.min(end,Number(m[2]))}
if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return}
status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`}
headers['Content-Length']=Math.max(0,end-start+1);res.writeHead(status,headers);
if(req.method==='HEAD'||!info.size){res.end();return}
const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
}catch{if(!res.headersSent)res.writeHead(404);res.end('Not found')}}).listen(Number(process.env.PORT)||4173,'0.0.0.0',()=>console.log('http://localhost:'+(process.env.PORT||4173)));