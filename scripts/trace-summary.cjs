/* Inspect saved Lighthouse traces without equating URL attribution with CPU work. */
const fs=require('node:fs');
const file=process.argv[2];if(!file)throw new Error('Usage: node scripts/trace-summary.cjs trace.json');
const events=JSON.parse(fs.readFileSync(file,'utf8')).traceEvents;
const threads=new Map(events.filter(event=>event.name==='thread_name').map(event=>[event.pid+':'+event.tid,event.args.name]));
const main=events.filter(event=>event.name==='RunTask'&&threads.get(event.pid+':'+event.tid)==='CrRendererMain');
const raster=events.filter(event=>event.name==='RasterTask');
const timing=event=>({wallMs:event.dur/1000,cpuMs:typeof event.tdur==='number'?event.tdur/1000:null});
const bodyPaints=events.filter(event=>event.name==='PaintImage'&&event.args.data?.nodeName?.startsWith('BODY')).map(event=>({width:event.args.data.width,height:event.args.data.height}));
const output={file,bodyPaints,longestRendererTasks:main.sort((a,b)=>b.dur-a.dur).slice(0,5).map(timing),longestRasterTasks:raster.sort((a,b)=>b.dur-a.dur).slice(0,5).map(timing)};
console.log(JSON.stringify(output,null,2));
