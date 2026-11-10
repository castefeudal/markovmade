const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('one contact event never contains free text, URLs or health measurements',()=>{
 const handlers={},rootHandlers={},window={gtag(){throw Error('external tracking is not enabled');}};
 const document={documentElement:{lang:'ru',dataset:{theme:'aurum-noir'}},getElementById(){return {addEventListener(name,fn){rootHandlers[name]=fn;}}},addEventListener(name,fn){handlers[name]=fn;}};
 vm.runInNewContext(fs.readFileSync('assets/js/analytics.js','utf8'),{window,document});
 const link={href:'https://t.me/markovmade?text=private',matches(selector){return selector.includes('a[href');}};
 handlers.click({target:{closest(){return link;}}});
 assert.equal(window.dataLayer.length,1);assert.equal(window.dataLayer[0].event,'contact_open');
 assert.deepEqual(JSON.parse(JSON.stringify(window.dataLayer[0].markovmade)),{language:'ru',theme:'aurum-noir',channel:'telegram'});
 window.mmTrack('calculation_complete',{tool:'nutrition',weight:106.5,calories:2400,text:'private',href:'https://example.com'});
 assert.deepEqual(Object.keys(window.dataLayer[1].markovmade).sort(),['language','theme','tool']);
 rootHandlers['mm:toolkit-result']({detail:{id:'caffeine',result:{dose:200}}});
 assert.equal(window.dataLayer.length,3);assert.equal(window.dataLayer[2].markovmade.tool,'caffeine');
 assert.equal(JSON.stringify(window.dataLayer).includes('dose'),false);
});
