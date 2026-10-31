// Mock coach relay: checks the class token and x-student tag, counts calls,
// and answers like Anthropic with a read that quotes the first answer verbatim.
const http = require('http'); const fs = require('fs');
const LOG = require('./shots.js')('relay-calls.json'); let calls = [];
http.createServer((req, res) => {
  const cors = {'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'content-type, x-class-token, x-class-code, x-student', 'Access-Control-Allow-Methods':'POST, OPTIONS'};
  if (req.method === 'OPTIONS'){ res.writeHead(204, cors); return res.end(); }
  if (req.url === '/calls'){ res.writeHead(200, {...cors, 'content-type':'application/json'}); return res.end(JSON.stringify(calls)); }
  if (req.url === '/reset'){ calls = []; res.writeHead(200, cors); return res.end('ok'); }
  let body = ''; req.on('data', c => body += c); req.on('end', () => {
    const tok = req.headers['x-class-token']; const stu = req.headers['x-student'] || '';
    if (tok !== 'bee7'){ res.writeHead(403, {...cors, 'content-type':'application/json'}); return res.end('{"error":"class token not recognised"}'); }
    const b = JSON.parse(body); const content = b.messages[0].content;
    calls.push({at:Date.now(), student:stu, hasStatements:!!(b.output_config.format.schema.properties.e21cc.properties.statements), sysStart:b.system.slice(0,35), max:b.max_tokens});
    const m = content.match(/\n(?:G|A|L): [^\n]+\n([^\n]+)/); const first = m ? m[1].split(/(?<=[.!?])\s/)[0].replace(/[.!?]$/,'') : '';
    const out = {gift:'You named the exact check you made.', stretch:'Say what you will do differently next time.', question:'Which reading would you trust, and why?', competency:'This shows critical thinking.', depth:'working',
      e21cc:{stance:'competency', stance_note:'You wrote about how you worked.', evidence:[{id:'critical', strength:'strong', quote:first, why:'You weighed the readings.'},{id:'inventive', strength:'clear', quote:'an invented sentence the student never wrote', why:'x'}],
        suggested:[], tagged_not_shown:[], probe:'What made you doubt the first reading?', probe_for:'critical', statements:[{sid:'ct1.l1', quote:first, why:'Your words show you weighed evidence.'},{sid:'at3.l1', quote:'made up words', why:'x'}]}};
    res.writeHead(200, {...cors, 'content-type':'application/json'});
    res.end(JSON.stringify({model:'relay-mock', stop_reason:'end_turn', content:[{type:'text', text:JSON.stringify(out)}]}));
  });
}).listen(8124, () => console.log('mock relay on 8124'));
