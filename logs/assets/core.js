/* ==================================================================
   E21CC Log core: the two frameworks, the look across,
   the competency lens and baskets, I can statements and their evidence
   gate, the built in coach, the codec for links, and the v1 to v2
   migration. Shared by index.html (students) and teacher.html so both
   see exactly the same engine. Classic script, no modules, no
   dependencies.
   ================================================================== */
'use strict';

/* ---------- the two frameworks, quoted from the school's slides ---------- */
const GROW = {
  id:'grow', name:'GROW', tagline:'GROW by reflecting', centre:'Believe you can',
  when:'after a lesson', verb:'Reflect on a lesson',
  steps:[
    {k:'g', letter:'G', title:'<em>Gift</em> yourself success', colour:'navy',
      qs:[{id:'g1', q:'What is one thing I understand from the lesson?'},
          {id:'g2', q:'How would I teach/explain this to a friend?'}]},
    {k:'r', letter:'R', title:'<em>Rise</em> above with small steps', colour:'navy',
      qs:[{id:'r1', q:'What is one thing I do not <em>yet</em> understand?'},
          {id:'r2', q:'What will I do to improve?', next:true}]},
    {k:'o', letter:'O', title:'<em>Own</em> your knowledge', colour:'navy',
      qs:[{id:'o1', q:'What is one real-life example?'},
          {id:'o2', q:'How have I taught/shared this with a friend or family?'}]},
    {k:'w', letter:'W', title:'<em>Watch</em> for what comes next', colour:'navy',
      qs:[{id:'w1', q:'What do I already know about the next topic?'},
          {id:'w2', q:'What is coming up at the next lesson?'}]},
  ]
};
const ACT = {
  id:'act', name:'ACT', tagline:'ACT on Feedback', centre:'',
  when:'when you receive feedback', verb:'Act on feedback',
  steps:[
    {k:'a', letter:'A', title:'<em>Acknowledge</em>', colour:'navy',
      qs:[{id:'a1', q:'How do I feel about the feedback?'},
          {id:'a2', q:'How might the feedback help me learn better?'}]},
    {k:'c', letter:'C', title:'<em>Connect</em>', colour:'yellow',
      qs:[{id:'c1', q:'How does this connect with the success criteria and/or my goals?'},
          {id:'c2', q:'How does this connect with previous feedback?'}]},
    {k:'t', letter:'T', title:'<em>Test</em>', colour:'red',
      qs:[{id:'t1', q:'What habit do I need to adjust and what is one thing I will do differently?', next:true},
          {id:'t2', q:'How will I know I am improving?'}]},
  ]
};
/* The third kind: once a term, a student looks across the evidence in one
   basket. Not a school slide; written to mirror GROW's shape. */
const ACROSS = {
  id:'across', name:'Look across', tagline:'Look across', centre:'',
  when:'once a term, for one basket', verb:'Look across a basket',
  steps:[
    {k:'x', letter:'L', title:'<em>Look</em> across your evidence', colour:'navy',
      qs:[{id:'x1', q:'What do my entries this term show I can now do?'},
          {id:'x2', q:'Where am I still stuck, and what gets in the way?'},
          {id:'x3', q:'What will I try next term, and where?', next:true}]}
  ]
};
const FRAMEWORKS = {grow:GROW, act:ACT, across:ACROSS};

/* A coach's follow up for each guiding question, used when that answer is
   the thinnest one in the entry. Written to be read by a Sec 1 to Sec 5. */
const PROBES = {
  g1:'Explain it in your own words, in one sentence a Sec 1 student would understand.',
  g2:'Which example would you use, and where would your friend get stuck first?',
  r1:'Name the exact place it breaks: which step, or which kind of question?',
  r2:'When, where and for how long will you do it? Write down the day and the time.',
  o1:'Where did you actually see this outside class this week? Be specific about the place.',
  o2:'Who did you tell, and what did they ask you back?',
  w1:'What do you already know that the next topic will build on? Name one idea.',
  w2:'Check the scheme of work or ask your teacher: what is the next lesson’s title?',
  a1:'Name the feeling, then say what the feedback is actually pointing at.',
  a2:'Which part of the feedback would change your next attempt the most?',
  c1:'Which success criterion does this feedback sit under? Quote it.',
  c2:'Is this the same note as last time? If so, what has stopped you fixing it?',
  t1:'Name the habit you will change, and say what you will do instead.',
  t2:'What will you look at in two weeks to check? A redo, marks, a friend reading your work?',
  x1:'Point to one entry and quote yourself. What exactly could you do there that you could not before?',
  x2:'When did it go wrong? Was it the skill, the place, or the people you worked with?',
  x3:'Which lesson, CCA session or event next term will you use to try it, and how will you know?'
};

/* ---------- the competency lens: E21CC (MOE, 2023 refresh) in student words ---------- */
const DOMAINS = [
  {id:'cait', name:'Critical, Adaptive and Inventive Thinking', short:'Thinking',
   blurb:'How you reason, adapt what you know, and come up with ideas that work.',
   moe:'enables students to use sound reasoning and metacognitive skills to inform decision-making, generate novel and useful ideas to address issues, and manage complexities and ambiguities to adapt to changing contexts with agility.'},
  {id:'cci', name:'Communication, Collaboration and Information Skills', short:'Working with others',
   blurb:'How you explain, listen, share the work, and handle information honestly.',
   moe:'enable students to communicate information, ideas and feelings clearly, engage in effective collaboration with others, and manage, create and share information thoughtfully, ethically and responsibly.'},
  {id:'cgc', name:'Civic, Global and Cross-Cultural Literacy', label:'Civic, Global and Cross Cultural Literacy', short:'Community and world',
   blurb:'How you connect learning to your community, Singapore, and the wider world.',
   moe:'enables students to contribute constructively to their community and nation, interact respectfully and empathically with others in diverse communities, and act as responsible citizens of Singapore and the world.'},
  {id:'sec', name:'Social-Emotional Competencies', label:'Social and Emotional Competencies', short:'Self and others',
   blurb:'How you know yourself, manage yourself, and relate to others.',
   moe:'competencies necessary for children to develop healthy identities, recognise and manage their emotions, develop a sense of responsibility, care and concern for others, relate to others and develop positive relationships, handle challenges, make responsible decisions, and act for the good of self, others and the society.'},
];
/* The nine Emerging 21CC (MOE, 2023 refresh) and the five Social-Emotional
   Competencies. "moe" is MOE's definition, quoted; "plain" is ours. */
const COMPETENCIES = [
  {id:'critical', d:'cait', name:'Critical Thinking', plain:'I reason carefully with evidence before I decide, and I can say why.',
   moe:'the ability to exercise sound reasoning and metacognitive thinking to interpret and analyse information and evidence, draw conclusions, make decisions, and solve problems.',
   kw:['because','evidence','reason','decide','decision','weigh','compare','conclude','proof','justify','analyse','analyze','interpret','solve','worked out','figured out','checked'],
   probe:'What evidence or reason tipped your decision?'},
  {id:'adaptive', d:'cait', name:'Adaptive Thinking', plain:'I use what I know in a new or changed situation, and I change my approach when the first one is not working.',
   moe:'the ability to apply learnt knowledge and skills strategically and with flexibility in different or new and evolving contexts.',
   kw:['changed','switch','adapt','another way','flexible','plan b','did not work','didn\'t work','tried again','new situation','different context','applied','instead','transfer','same method','used what i'],
   probe:'What did you carry over from somewhere else, and what did you change to make it fit?'},
  {id:'inventive', d:'cait', name:'Inventive Thinking', plain:'I ask my own questions, try ideas that are not in the notes, and test whether they work.',
   moe:'the ability to frame, investigate and explore issues, generate innovative ideas, and evaluate them to form novel and useful responses.',
   kw:['wonder','curious','what if','idea','tried','experiment','invent','my own','question','imagine','design','prototype','alternative','brainstorm','create','made up'],
   probe:'What idea of your own did you try, and how did you test it?'},
  {id:'communication', d:'cci', name:'Communication', plain:'I get ideas across clearly for the person in front of me, and I check they followed.',
   moe:'the ability to convey information and exchange ideas clearly and coherently through multimodal ways for specific purposes, audiences and contexts.',
   kw:['explain','explained','teach','taught','told','presented','listen','clear','in my own words','friend','family','share','shared','wrote','diagram','video','audience'],
   probe:'How did you check the other person understood?'},
  {id:'collaboration', d:'cci', name:'Collaboration', plain:'I share the work and the decisions in a group, and I make room for others.',
   moe:'the ability to work together in a respectful manner to share responsibilities and make collective decisions to meet shared goals.',
   kw:['group','team','partner','together','we ','our ','role','divided','discussion','classmate','pair','agreed','decided together'],
   probe:'What did you contribute, and what did you take from someone else?'},
  {id:'information', d:'cci', name:'Information Skills', plain:'I find, check and combine information, and I use it honestly and say where it came from.',
   moe:'the ability to source for, select, evaluate and synthesise digital and non-digital information with discernment. It also entails ethical and responsible practices when using, sharing and creating information.',
   kw:['source','search','searched','website','article','reliable','verify','fact check','ai ','chatgpt','google','cite','reference','compared sources','which website','trust the'],
   probe:'How did you know the source could be trusted?'},
  {id:'civic', d:'cgc', name:'Civic Literacy', plain:'I understand how Singapore works and I play my part in my community.',
   moe:'the ability to understand the nation\'s values, governance, context and realities, form one\'s civic identity, and constructively engage with and contribute to one\'s community and nation.',
   kw:['singapore','national','community','volunteer','neighbour','neighbor','government','policy','our country','citizen','vote','town council','estate','pledge','national day'],
   probe:'Where does this show up in Singapore life, and what part did you play?'},
  {id:'global', d:'cgc', name:'Global Literacy', plain:'I connect this to what is happening in the wider world, and I deal fairly with people from anywhere.',
   moe:'the ability to understand and think with discernment about world issues and interact responsibly and constructively with people from and beyond Singapore on such issues.',
   kw:['world','global','country','countries','climate','international','news','asean','overseas','planet','war','trade','migration'],
   probe:'What is one place beyond Singapore where this matters, and why?'},
  {id:'crosscultural', d:'cgc', name:'Cross-Cultural Literacy', plain:'I notice how people from different backgrounds might see this differently, and I respect it.',
   moe:'the ability to sensitively understand, appreciate and interact with different social, cultural and religious communities and their perspectives.',
   kw:['different backgrounds','religion','race','culture','perspective','respect','belief','tradition','others might','festival','custom','language'],
   probe:'Whose view might differ from yours here, and why?'},
  {id:'selfaware', d:'sec', name:'Self-Awareness', plain:'I can name what I feel and what I am good and not yet good at.',
   moe:'', kw:['i feel','i felt','nervous','proud','frustrated','confident','anxious','strength','weakness','honest','i tend to'],
   probe:'What does the feeling tell you about what you value?'},
  {id:'selfmanage', d:'sec', name:'Self-Management', plain:'I manage my time, effort and emotions to reach a goal.',
   moe:'', kw:['plan','schedule','time','minutes','routine','discipline','focus','calm','goal','organise','organize','deadline','stayed'],
   probe:'What did you do to stay on track when it got hard?'},
  {id:'socialaware', d:'sec', name:'Social Awareness', plain:'I notice how others feel and see things.',
   moe:'', kw:['they felt','others','empathy','point of view','understand them','noticed that','my friend was','someone else'],
   probe:'What did you notice about how someone else was finding it?'},
  {id:'relationship', d:'sec', name:'Relationship Management', plain:'I build and repair relationships, and I can ask for help.',
   moe:'', kw:['ask for help','asked','apologise','apologize','support','trust','conflict','sorry','thank','helped me'],
   probe:'Who did you turn to, and what did you ask for?'},
  {id:'decisions', d:'sec', name:'Responsible Decision-Making', plain:'I make choices that are good for me and fair to others.',
   moe:'', kw:['right thing','responsible','fair','consequence','integrity','honest','chose','choice'],
   probe:'Who else was affected by your choice?'},
];
/* Display labels never carry hyphens; MOE's exact names stay in .name for the coach prompt. */
DOMAINS.forEach(d => { d.label = d.label || d.name; });
COMPETENCIES.forEach(c => { c.label = c.name.replace(/-/g, ' '); });
const LEVELS = [
  {n:1, label:'Tried it', help:'I did this once, with help or by luck.'},
  {n:2, label:'Getting there', help:'I did this on purpose, and I can say how.'},
  {n:3, label:'Can teach it', help:'I do this reliably and could show a friend.'},
];
const DEPTHS = {
  surface:{label:'Just started', help:'You have written something. Now add details: what happened, when, and why.'},
  working:{label:'Good details', help:'Some answers have details. Add one more example and a next step with a day on it.'},
  deep:{label:'Well thought through', help:'Your answers are detailed and honest, and your next step is clear.'}
};
/* The competency read: how strongly the writing shows a competency, and
   whether the entry is about the task or about how the student worked. */
const STRENGTHS = {
  glimpse:{label:'Glimpse', help:'A word hints at it, but you have not described a moment yet.'},
  clear:{label:'Clear', help:'You describe a specific moment that shows it.'},
  strong:{label:'Strong', help:'You describe a specific moment and say how or why.'}
};
const STANCES = {
  task:{label:'About the task', help:'You wrote about what the task was. Write more about how you worked on it.'},
  mixed:{label:'Some of how you worked', help:'You wrote a little about how you worked. Add one more moment.'},
  competency:{label:'About how you worked', help:'You wrote about how you thought and worked. This is what the wheel looks for.'}
};
const MOODS = [
  {id:'mountain', label:'Mountain', c:'linear-gradient(180deg,#0b1446,#33427f)'},
  {id:'paper', label:'Paper', c:'linear-gradient(180deg,#faf8f2,#ebe7da)'},
  {id:'sunrise', label:'Sunrise', c:'linear-gradient(180deg,#fff7c9,#ffe680)'},
  {id:'night', label:'Night', c:'linear-gradient(180deg,#07091a,#1a2048)'},
];
const ACCENTS = [
  {id:'yellow', c:'#FFE200'},{id:'coral', c:'#FF7A6B'},{id:'mint', c:'#5FD3A8'},{id:'sky', c:'#7CC0FF'},{id:'lilac', c:'#C4ACFF'}
];
const EMOJIS = ['🐝','🌱','⛰️','🌊','🔥','🌙','⭐','🦉','🐢','🦁','🎯','🧭','📚','🎨','🎵','⚽','🧪','🔭','🌈','🍀'];
const MOTTOS = ['Believe you can.','Non Vi Sed Arte.','Small steps, every week.','Not yet is not never.','Write it down, then do it.'];

/* ---------- built in reflective coach (works offline) ---------- */
const VAGUE = ['stuff','things','everything','nothing','idk',"i don't know",'dont know','not sure','ok','okay','fine','good','bad','nice','fun','boring','a lot','study more','practise more','practice more','pay attention','listen more','revise more','try harder','work harder','focus more','do my best','be more careful','do better','improve more'];
const REASONS = ['because','so that','which means','for example','for instance','e.g.','when ','if ','since','therefore','this shows','that is why'];
const TIMES = ['tonight','tomorrow','today','every','daily','each','weekly','before','after school','during','by ','on monday','on tuesday','on wednesday','on thursday','on friday','on saturday','on sunday','this week','next week','weekend','recess','minutes','mins','hour','hours','times a','once a','twice'];
const ACTIONS = ['do ','redo','attempt','practise','practice','write','draw','explain','teach','ask','read','summarise','summarize','make','solve','check','test','time myself','list','review','watch','rewrite','compare','answer','try the','mark','highlight','flashcard','quiz','tutor'];
const TASKWORDS = ['worksheet','homework','test','exam','marks','score','assignment','finish','submit','wa1','wa2','wa3','ca1','ca2','sa1','sa2','paper'];

function tokens(s){ return (s||'').toLowerCase().replace(/[^a-z0-9'\s]/g,' ').split(/\s+/).filter(Boolean); }
function scoreAnswer(q, text){
  const t = (text||'').trim(); const low = t.toLowerCase(); const w = tokens(t);
  const r = {id:q.id, words:w.length, score:0, flags:[]};
  if (!w.length){ r.score = -2; r.flags.push('empty'); return r; }
  if (w.length < 4){ r.score = -2; r.flags.push('thin'); if (VAGUE.some(v => low.includes(v))) r.vague = VAGUE.find(v => low.includes(v)); return r; }
  if (w.length >= 12) r.score += 1; if (w.length >= 28) r.score += 1;
  if (/\d/.test(t) || /"[^"]{3,}"|“[^”]{3,}”/.test(t) || /\b[A-Z][a-z]{2,}\b/.test(t.replace(/^\s*\w/, ''))){ r.score += 1; r.flags.push('specific'); }
  if (REASONS.some(k => low.includes(k))){ r.score += 1; r.flags.push('reasoned'); }
  const vague = VAGUE.filter(v => low.includes(v));
  if (vague.length && w.length < 18){ r.score -= 1; r.flags.push('vague'); r.vague = vague[0]; }
  const qt = new Set(tokens(q.q.replace(/<[^>]+>/g,''))); const overlap = w.filter(x => qt.has(x)).length / Math.max(1, w.length);
  if (overlap > .55 && w.length < 16){ r.score -= 1; r.flags.push('echo'); }
  if (q.next){
    r.hasTime = TIMES.some(k => low.includes(k)); r.hasAction = ACTIONS.some(k => low.includes(k));
    if (r.hasTime) r.score += 1; else r.flags.push('notime');
    if (r.hasAction) r.score += 1; else r.flags.push('noaction');
  }
  return r;
}
function detectCompetencies(text){
  const low = ' ' + (text||'').toLowerCase() + ' ';
  return COMPETENCIES.map(c => ({c, hits:c.kw.filter(k => low.includes(k))})).filter(x => x.hits.length).sort((a,b)=>b.hits.length-a.hits.length);
}
function fragment(text, n=90){ const t=(text||'').trim().replace(/\s+/g,' ').replace(/[.!?]+$/,''); return t.length<=n ? t : t.slice(0,n).replace(/\s\S*$/,'') + '…'; }
function pick(arr, seed){ if (!arr || !arr.length) return null; let h=0; for (const ch of String(seed)) h=(h*31+ch.charCodeAt(0))|0; return arr[Math.abs(h)%arr.length]; }

function builtinCoach(entry, cls){
  const fw = FRAMEWORKS[entry.kind]; const qs = fw.steps.flatMap(s => s.qs);
  const scores = qs.map(q => scoreAnswer(q, entry.answers[q.id]));
  const answered = scores.filter(s => !s.flags.includes('empty'));
  const all = qs.map(q => entry.answers[q.id] || '').join('\n');
  const voice = (cls && cls.voice) || {};
  const phrase = pick(voice.phrases, entry.id);
  const teacher = cls && cls.teacherName ? cls.teacherName : null;
  const out = {source:'builtin', depth:'surface', gift:'', stretch:'', question:'', competency:''};

  if (!answered.length){
    out.gift = 'You have started an entry. Well done for making time for it.';
    out.stretch = 'Nothing is written yet. Start with the easiest question and write two or three sentences.';
    out.question = PROBES[qs[0].id]; out.competency = 'Once you have written something, I can tell you which competency it shows.';
    return out;
  }
  const mean = answered.reduce((a,s)=>a+s.score,0)/answered.length;
  const nextQ = qs.find(q => q.next); const nextS = scores.find(s => s.id === nextQ.id);
  const nextOk = nextS && nextS.hasTime && nextS.hasAction;
  out.depth = (mean >= 1.6 && nextOk && answered.length >= qs.length - 1) ? 'deep' : (mean >= 0.6 ? 'working' : 'surface');

  // gift: the strongest answer, quoted
  const best = answered.slice().sort((a,b)=>b.score-a.score)[0]; const bestQ = qs.find(q=>q.id===best.id);
  const QWHY = {r1:'you said exactly where you got stuck, so you know what to work on', a1:'you said how you felt, then thought about how the feedback can help you', o1:'you linked the idea to real life', o2:'you explained it to someone else', c1:'you linked the feedback to the success criteria', c2:'you compared it with feedback you had before', w1:'you thought ahead to the next topic'};
  const why = QWHY[best.id] || (best.flags.includes('reasoned') ? 'you gave a reason for your answer' : best.flags.includes('specific') ? 'you gave a specific example' : 'you wrote it in your own words');
  out.gift = `${teacher ? teacher + ' would be pleased with this' : 'Well done'}: “${fragment(entry.answers[best.id])}”. This is good because ${why}.`;

  // stretch: the weakest answered question, or the empty one that matters most
  const empties = scores.filter(s => s.flags.includes('empty'));
  let weak = answered.slice().sort((a,b)=>a.score-b.score)[0];
  if (empties.length && (empties.some(e=>e.id===nextQ.id) || weak.score >= 1)) weak = empties.find(e=>e.id===nextQ.id) || empties[0];
  const weakQ = qs.find(q=>q.id===weak.id); const qtext = weakQ.q.replace(/<[^>]+>/g,'');
  let s = '';
  if (weak.flags.includes('empty')) s = `You have not answered “${qtext}” yet.${weak.id===nextQ.id ? ' This answer is your plan, so please fill it in.' : ''}`;
  else if (weak.flags.includes('thin')) s = weak.id===nextQ.id ? `“${entry.answers[weak.id].trim()}” is too general to act on. Write what you will do, on which day, and where.` : `“${entry.answers[weak.id].trim()}” is too short. Write two or three sentences for “${qtext}”.`;
  else if (weak.flags.includes('notime') || weak.flags.includes('noaction')) s = `Your plan (“${fragment(entry.answers[weak.id], 50)}”) needs ${!weak.hasAction ? 'the exact thing you will do' : ''}${!weak.hasAction && !weak.hasTime ? ' and ' : ''}${!weak.hasTime ? 'a day and a time' : ''}. Then you will know exactly when to do it.`;
  else if (weak.flags.includes('vague')) s = `In your answer to “${qtext}”, the word “${weak.vague}” is too general. Replace it with exactly what you mean.`;
  else if (weak.flags.includes('echo')) s = `Your answer to “${qtext}” mostly repeats the question. Explain it as you would to a friend who missed the lesson.`;
  else s = `Your answer to “${qtext}” is the shortest. Add one detail, such as a number, a name or an example.`;
  if (phrase) s = `${phrase} ${s}`;
  out.stretch = s;
  out.question = PROBES[weak.id];

  // competencies: tagged versus evidenced
  const seen = detectCompetencies(all);
  const tagged = (entry.competencies||[]).map(t => COMPETENCIES.find(c=>c.id===t.id)).filter(Boolean);
  const taskHeavy = TASKWORDS.filter(k => all.toLowerCase().includes(k)).length >= 2 && !seen.length;
  if (!tagged.length && seen.length){
    const top = seen[0].c; out.competency = `This shows ${top.label.toLowerCase()}: ${top.plain} If you agree, claim it and add one line on where it shows.`;
  } else if (!tagged.length){
    out.competency = taskHeavy ? 'You have written about what the task was. Now write about how you did it: how you worked it out, what you did when you were stuck, who you explained it to. This is where the competencies show.' : 'Which competency did you use? Pick one and say where your answers show it.';
  } else {
    const evidenced = tagged.filter(c => seen.some(s => s.c.id === c.id));
    if (evidenced.length){ const c = evidenced[0]; const hit = seen.find(s=>s.c.id===c.id).hits[0]; out.competency = `You claimed ${c.label.toLowerCase()}, and your writing shows it (“${hit.trim()}”). ${c.probe}`; }
    else { const c = tagged[0]; out.competency = `You claimed ${c.label.toLowerCase()}, but I cannot find where your writing shows it yet. ${c.probe}`; }
  }
  // success criteria connection for ACT
  if (entry.kind === 'act' && cls && Array.isArray(cls.criteria) && cls.criteria.length){
    const low = all.toLowerCase(); const hit = cls.criteria.find(c => tokens(c).filter(w=>w.length>4).some(w => low.includes(w)));
    out.stretch += hit ? ` Good: this links to the success criterion “${hit}”.` : ` Look at your teacher’s success criteria and quote the one this feedback is about.`;
  }
  return out;
}

/* ---------- AI coach (Claude), only when the student presses the button ---------- */
const COMPETENCY_IDS = COMPETENCIES.map(c => c.id);
const COACH_SCHEMA = {
  type:'object', additionalProperties:false,
  properties:{
    gift:{type:'string', description:'One specific thing done well, quoting the student’s words. Under 60 words.'},
    stretch:{type:'string', description:'One thing to deepen, naming the guiding question it belongs to. Under 70 words.'},
    question:{type:'string', description:'One question for the student to answer now. Under 30 words.'},
    competency:{type:'string', description:'Help the student move from describing the task to describing how they worked: name the E21CC competency the entry shows or could show, and ask for the moment. Under 60 words.'},
    depth:{type:'string', enum:['surface','working','deep']},
    e21cc:{type:'object', additionalProperties:false, description:'The competency read against MOE’s 21st Century Competencies.',
      properties:{
        stance:{type:'string', enum:['task','mixed','competency'], description:'task = describes what was done, marks or finishing, with no how or why; mixed = some how or why; competency = about how the student thought, worked or related, with reasons.'},
        stance_note:{type:'string', description:'One sentence to the student about the stance. Under 30 words.'},
        evidence:{type:'array', description:'Competencies the entry actually shows, strongest first, at most four. Include one only when a specific phrase in the student’s own words shows it.',
          items:{type:'object', additionalProperties:false, properties:{
            id:{type:'string', enum:COMPETENCY_IDS},
            strength:{type:'string', enum:['glimpse','clear','strong']},
            quote:{type:'string', description:'The student’s exact words, copied verbatim from the entry, under 25 words.'},
            why:{type:'string', description:'Why these words show this competency, using its definition, addressed to the student. Under 30 words.'}
          }, required:['id','strength','quote','why']}},
        suggested:{type:'array', description:'Up to two ids from the evidence list that the student should tag.', items:{type:'string', enum:COMPETENCY_IDS}},
        tagged_not_shown:{type:'array', description:'Ids the student tagged that the writing does not evidence.', items:{type:'string', enum:COMPETENCY_IDS}},
        probe:{type:'string', description:'One question that would make one competency visible in writing. Under 30 words.'},
        probe_for:{type:'string', enum:COMPETENCY_IDS}
      }, required:['stance','stance_note','evidence','suggested','tagged_not_shown','probe','probe_for']}
  },
  required:['gift','stretch','question','competency','depth','e21cc']
};
/* The schema the model must fill. With I can statements, e21cc.statements is
   added and limited to the statement ids this student actually has. */
function coachSchema(stmts){
  const s = JSON.parse(JSON.stringify(COACH_SCHEMA));
  if (stmts && stmts.length){
    s.properties.e21cc.properties.statements = {type:'array', description:'I can statements this entry backs, at most three. Include one only when a specific phrase in the student’s own words shows it.',
      items:{type:'object', additionalProperties:false, properties:{
        sid:{type:'string', enum: stmts.map(x => x.id)},
        quote:{type:'string', description:'The student’s exact words, copied verbatim from the entry, under 25 words.'},
        why:{type:'string', description:'Why these words back the statement, addressed to the student. Under 25 words.'}
      }, required:['sid','quote','why']}};
    s.properties.e21cc.required.push('statements');
  }
  return s;
}
/* The student chooses how the coach sounds. Honesty does not change with the tone. */
const TONES = {
  warm:{label:'Warm', help:'Kind and encouraging.', line:'Tone: warm and encouraging, like a coach who believes in the student. Still honest: never praise what is not there.'},
  direct:{label:'Direct', help:'Short and clear. Tells you what to fix.', line:'Tone: direct and brief. Name the gap plainly, with no softening and no filler.'},
  playful:{label:'Playful', help:'Light and cheerful.', line:'Tone: light and playful, with energy. At most one touch of humour; never sarcastic, never at the student’s expense.'}
};
function coachSystem(cls, stmts, tone){
  const v = (cls && cls.voice) || {};
  const lines = [
    'You are a reflective learning coach for a Singapore secondary school student (age 13 to 17) at Beatty Secondary School. The student keeps an E21CC Log, anchored in MOE’s 21st Century Competencies. It holds journals: GROW and ACT entries use the school’s two frameworks after any learning moment: a lesson, a CCA session, a camp, a competition or service. A third kind, Look across, is the student’s termly synthesis of one competency basket; read it for honest patterns across entries and a concrete plan.',
    'GROW by reflecting (after a lesson): G Gift yourself success (What is one thing I understand from the lesson? How would I teach/explain this to a friend?), R Rise above with small steps (What is one thing I do not yet understand? What will I do to improve?), O Own your knowledge (What is one real-life example? How have I taught/shared this with a friend or family?), W Watch for what comes next (What do I already know about the next topic? What is coming up at the next lesson?).',
    'ACT on Feedback: A Acknowledge (How do I feel about the feedback? How might the feedback help me learn better?), C Connect (How does this connect with the success criteria and/or my goals? How does this connect with previous feedback?), T Test (What habit do I need to adjust and what is one thing I will do differently? How will I know I am improving?).',
    'Competency lens (MOE 21st Century Competencies, 2023 refresh). Use these exact names and read the entry against MOE’s definitions.\n' + DOMAINS.map(d => d.name + ': ' + COMPETENCIES.filter(c => c.d === d.id).map(c => `${c.name} [id ${c.id}]: ${c.moe || c.plain}`).join(' | ')).join('\n'),
    'Competency read rules. Evidence must be a verbatim phrase from the student’s answers; never paraphrase, never invent. glimpse = a word or phrase hints at the competency with no specific moment; clear = a specific moment in the student’s words shows it, with a detail; strong = the moment plus how or why, or the competency drives the next step. At most four competencies, strongest first, and none where no phrase supports it. Stance: task = the entry describes what the task or lesson was, marks, or finishing, without how or why; mixed = some how or why; competency = the entry is about how the student thought, worked or related, with reasons. tagged_not_shown lists tags the student chose that the writing does not evidence. suggested lists up to two ids from the evidence the student should tag. The probe asks for the missing moment for one competency.',
    'Your job: help the student reflect more deeply and shift from describing the task to noticing how they learned and which competency they used. Never write the reflection for them. Quote their own words. No praise inflation: one honest gift, one stretch, one question. Plain English, short sentences, no jargon, no emoji. Do not mention marks or grades unless the student did. Do not use hyphens or dashes as punctuation; use commas, semicolons or colons.',
    'Depth: surface = general words, no specifics, no dated next step; working = specific in places; deep = specific, honest, with a next step that has an action, a time and a place.',
    'Write like a caring secondary school teacher marking a reflection in the student’s book: name one thing done well using the student’s own words, one thing to work on next, and one question. Use plain language that a 14 year old reads easily. Say exactly what to do. No slogans, sayings or clever turns of phrase, and never use the pattern “X, not Y”.'
  ];
  if (TONES[tone]) lines.push(TONES[tone].line);
  lines.push('Anchor every part of your feedback in the competencies: say which competency the words show and how, and frame the stretch as what would make a competency more visible.');
  if (stmts && stmts.length) lines.push('I can statements this student is working towards (Beatty’s own, for the student’s band). In e21cc.statements list at most three that this entry backs, each with the student’s verbatim words. Never invent; an empty list is a fine answer.\n' + stmts.map(s => `[${s.id}] (${(compOf(s.comp) || {name:''}).name}${s.strandName ? ', ' + s.strandName : ''}) ${s.text}`).join('\n'));
  if (cls){
    lines.push(`Group context: ${cls.type && cls.type !== 'subject' ? (cls.type === 'cca' ? 'CCA ' : cls.type === 'form' ? 'form class, ' : '') : 'subject '}${cls.subject || 'unspecified'}${cls.level ? ', ' + cls.level : ''}. Teacher: ${cls.teacherName || 'the teacher'}.`);
    if (v.tone) lines.push(`Write in the teacher’s voice. Tone: ${v.tone}.`);
    if (Array.isArray(v.phrases) && v.phrases.length) lines.push('Phrases this teacher actually uses (use at most one, only where it fits): ' + v.phrases.map(p=>`"${p}"`).join('; ') + '.');
    if (Array.isArray(v.avoid) && v.avoid.length) lines.push('Never say: ' + v.avoid.join('; ') + '.');
    if (Array.isArray(cls.criteria) && cls.criteria.length) lines.push('Success criteria for this class (connect feedback to these where relevant): ' + cls.criteria.map((c,i)=>`${i+1}. ${c}`).join(' '));
    if (v.sample) lines.push('Example of feedback in this teacher’s voice: ' + v.sample);
    if (cls.knowledge) lines.push('Teacher’s notes on what good reflection looks like in this subject: ' + cls.knowledge);
  }
  return lines.join('\n\n');
}
function entryForCoach(entry){
  const fw = FRAMEWORKS[entry.kind]; const ctx = entry.context || {type:'subject', name: entry.subject};
  const lines = [entry.kind === 'across'
    ? `Framework: Look across (termly synthesis). Basket: ${(basketOf(entry.basket) || {name: entry.basket}).name}. ${termLabel(entry.term || '')}.`
    : `Framework: ${fw.name}. Context: ${contextTypeOf(ctx.type).label}, ${ctx.name || entry.subject || 'unspecified'}. Topic: ${entry.topic || 'unspecified'}.`];
  if (entry.kind === 'act' && entry.feedbackText) lines.push(`The feedback received (from ${entry.feedbackFrom || 'teacher'}): ${entry.feedbackText}`);
  if (entry.kind === 'across' && Array.isArray(entry.lookedAt) && entry.lookedAt.length) lines.push('Evidence the student looked across this term (quotes from earlier entries): ' + entry.lookedAt.map(x => `"${x.quote}"`).join(' | '));
  for (const s of fw.steps) for (const q of s.qs) lines.push(`${s.letter}: ${q.q.replace(/<[^>]+>/g,'')}\n${entry.answers[q.id] || '(blank)'}`);
  const tags = (entry.competencies||[]).map(t => { const c = COMPETENCIES.find(x=>x.id===t.id); const l = LEVELS.find(x=>x.n===t.level); return c ? `${c.name} [id ${c.id}] (${l ? l.label : ''})${t.where ? ', the student points to: "' + t.where + '"' : ''}` : null; }).filter(Boolean);
  lines.push('Competencies the student claims (check each against the words; a claim the student can point to is still only evidenced if the words show it): ' + (tags.length ? tags.join('; ') : 'none'));
  return lines.join('\n\n');
}

/* ---------- the competency read (E21CC) ---------- */
const PROCESS = ['because','realised','realized','noticed','tried','changed','explained','asked','checked','compared','decided','planned','worked out','figured','instead','next time','i think','i wonder','i felt','so that','which means','i chose','i tested'];
function sentencesOf(text){ return (text||'').split(/(?<=[.!?])\s+|\n+/).map(x => x.trim()).filter(Boolean); }
function entryAnswersText(entry){ const fw = FRAMEWORKS[entry.kind]; return fw.steps.flatMap(st => st.qs).map(q => entry.answers[q.id] || '').filter(t => t.trim()).join('\n'); }
function builtinE21cc(entry, stmts){
  const all = entryAnswersText(entry); const sents = sentencesOf(all); const low = all.toLowerCase();
  const evidence = [];
  for (const c of COMPETENCIES){
    let best = null, hits = 0;
    for (const sen of sents){ const sl = ' ' + sen.toLowerCase() + ' '; const n = c.kw.filter(k => sl.includes(k)).length; if (n){ hits++; if (!best || n > best.n) best = {s:sen, n}; } }
    if (!best) continue;
    const bl = best.s.toLowerCase(); const w = tokens(best.s).length;
    const specific = /\d/.test(best.s) || w >= 12 || /\b[A-Z][a-z]{2,}\b/.test(best.s.slice(1));
    const reasoned = REASONS.some(r => bl.includes(r)) || PROCESS.some(x => bl.includes(x));
    // a bare reason word is a glimpse; a specific moment is clear; both together are strong
    const strength = specific && reasoned ? 'strong' : specific ? 'clear' : 'glimpse';
    const why = (strength === 'strong' ? 'You describe a specific moment and say how or why. This shows ' : strength === 'clear' ? 'You describe a specific moment. This shows ' : 'One word hints at ') + c.label.toLowerCase() + '.';
    evidence.push({id:c.id, strength, quote: fragment(best.s, 140), why, _score: hits*2 + (strength==='strong'?3:strength==='clear'?2:1)});
  }
  evidence.sort((x,y) => y._score - x._score);
  const top = evidence.slice(0,4).map(({_score, ...x}) => x);
  const taskHits = TASKWORDS.filter(k => low.includes(k)).length;
  const processHits = PROCESS.filter(k => low.includes(k)).length + REASONS.filter(k => low.includes(k)).length;
  const stance = !all.trim() ? 'task' : processHits >= 2 ? 'competency' : (taskHits >= 2 && processHits === 0) ? 'task' : 'mixed';
  const tagged = (entry.competencies||[]).map(t => t.id);
  const suggested = top.filter(x => !tagged.includes(x.id) && x.strength !== 'glimpse').slice(0,2).map(x => x.id);
  const tagged_not_shown = tagged.filter(id => !evidence.some(x => x.id === id));
  const probe_for = tagged_not_shown[0] || (top[0] && top[0].id) || 'critical';
  const pc = COMPETENCIES.find(c => c.id === probe_for);
  // statements: one whose competencies the writing shows at clear or strong
  // one per competency, the first rung of its ladder: a starting point, never a claim
  const seenC = new Set();
  const statements = (stmts || []).map(s => { const ev = top.find(v => s.competencies.includes(v.id) && v.strength !== 'glimpse'); if (!ev || seenC.has(ev.id)) return null; seenC.add(ev.id); return {sid:s.id, quote:ev.quote.replace(/…$/,''), why:'Your words show ' + compOf(ev.id).label.toLowerCase() + ', which this statement is about.'}; }).filter(Boolean).slice(0,3);
  return {source:'builtin', at:Date.now(), stance, stance_note: STANCES[stance].help, evidence: top, suggested, tagged_not_shown, probe: pc ? pc.probe : '', probe_for, statements};
}
/* The model's read, checked: ids must exist, quotes must actually appear in the
   student's words (a quote that does not is hidden, the reasoning kept). */
function normaliseE21cc(entry, raw, source, stmts){
  if (!raw || typeof raw !== 'object') return builtinE21cc(entry, stmts);
  const ok = id => COMPETENCIES.some(c => c.id === id);
  const evidence = (Array.isArray(raw.evidence) ? raw.evidence : []).filter(x => x && ok(x.id) && ['glimpse','clear','strong'].includes(x.strength)).slice(0,4).map(x => {
    const q = String(x.quote||'').trim().replace(/[.!?]+$/,''); const found = isVerbatim(entry, q);
    // a claim the model cannot anchor in the student's words counts only as a glimpse
    return {id:x.id, strength: found ? x.strength : 'glimpse', quote: found ? q : '', why: String(x.why||'').slice(0,240), unverified: !found};
  });
  const stance = ['task','mixed','competency'].includes(raw.stance) ? raw.stance : 'mixed';
  const tagged = (entry.competencies||[]).map(t => t.id);
  // statement matches: only known ids, and only where the quote is really the student's
  const known = new Set((stmts || []).map(s => s.id));
  const statements = (Array.isArray(raw.statements) ? raw.statements : []).filter(x => x && known.has(x.sid) && isVerbatim(entry, x.quote)).slice(0,3).map(x => ({sid:x.sid, quote:String(x.quote).trim().replace(/[.!?]+$/,''), why:String(x.why||'').slice(0,200)}));
  return {source, at:Date.now(), stance, stance_note: String(raw.stance_note || STANCES[stance].help).slice(0,240), evidence, statements,
    suggested: (Array.isArray(raw.suggested) ? raw.suggested : []).filter(id => ok(id) && !tagged.includes(id)).slice(0,2),
    tagged_not_shown: (Array.isArray(raw.tagged_not_shown) ? raw.tagged_not_shown : []).filter(id => ok(id) && tagged.includes(id)),
    probe: String(raw.probe||'').slice(0,240), probe_for: ok(raw.probe_for) ? raw.probe_for : (evidence[0] ? evidence[0].id : 'critical')};
}
function e21ccSummary(x){
  if (!x) return '';
  const nameOf = id => (COMPETENCIES.find(c => c.id === id) || {label:id}).label;
  const ev = (x.evidence||[]).map(e => `${nameOf(e.id)} (${e.strength})`).join(', ');
  return `Stance: ${STANCES[x.stance] ? STANCES[x.stance].label : x.stance}. Coach saw: ${ev || 'nothing specific yet'}${x.tagged_not_shown && x.tagged_not_shown.length ? '. Claimed but not shown: ' + x.tagged_not_shown.map(nameOf).join(', ') : ''}.`;
}

/* ==================================================================
   E21CC Log: shared helpers
   ================================================================== */
const APP_NAME = 'E21CC Log';
const BASKET_IDS = DOMAINS.map(d => d.id);
function basketOf(id){ return DOMAINS.find(d => d.id === id) || null; }
function compOf(id){ return COMPETENCIES.find(c => c.id === id) || null; }

/* ---------- school terms: MOE calendar for primary and secondary schools. Update once a year. ---------- */
const TERMS = {
  2026: [['2026-01-02','2026-03-13'],['2026-03-23','2026-05-29'],['2026-06-29','2026-09-04'],['2026-09-14','2026-11-20']],
  2027: [['2027-01-04','2027-03-12'],['2027-03-22','2027-05-28'],['2027-06-28','2027-09-03'],['2027-09-13','2027-11-19']]
};
function termsFor(year){
  const t = TERMS[year] || [[`${year}-01-02`,`${year}-03-14`],[`${year}-03-23`,`${year}-05-30`],[`${year}-06-29`,`${year}-09-05`],[`${year}-09-14`,`${year}-11-20`]];
  return t.map(([a,b], i) => ({n:i+1, start:new Date(a + 'T00:00:00').getTime(), end:new Date(b + 'T23:59:59').getTime()}));
}
/* Where a moment sits in its school year: the term, and a fraction 0..1 across
   four equal term bands. Holidays are squeezed out: a date in a holiday snaps
   to the nearest term edge. */
function termPos(t){
  const y = new Date(t).getFullYear(); const T = termsFor(y);
  for (const k of T) if (t >= k.start && t <= k.end) return {year:y, term:k.n, frac:((k.n - 1) + (t - k.start) / (k.end - k.start)) / 4, inTerm:true, week:Math.floor((t - k.start) / (7*864e5)) + 1};
  let best = null;
  for (const k of T) for (const [edge, f] of [[k.start, (k.n - 1) / 4], [k.end, k.n / 4]]){ const dist = Math.abs(t - edge); if (!best || dist < best.dist) best = {dist, term:k.n, frac:f}; }
  return {year:y, term:best.term, frac:best.frac, inTerm:false, week:null};
}
function termKey(t){ const p = termPos(t); return `${p.year}-T${p.term}`; }
function termLabel(key){ const m = /^(\d{4})-T(\d)$/.exec(key || ''); return m ? `Term ${m[2]}, ${m[1]}` : (key || ''); }

/* ---------- where the learning happened ---------- */
const CONTEXT_TYPES = [
  {id:'subject', label:'Subject', ph:'Which subject?', topic:'Topic or lesson', topicPh:'e.g. Simultaneous equations, lesson 2'},
  {id:'cca', label:'CCA', ph:'e.g. Football, Choir, Robotics', topic:'Session or moment', topicPh:'e.g. Friday training, set pieces'},
  {id:'camp', label:'Camp or trip', ph:'e.g. Sec 2 camp', topic:'Day or activity', topicPh:'e.g. Day 2, raft building'},
  {id:'competition', label:'Competition', ph:'e.g. National Science Challenge', topic:'Round or moment', topicPh:'e.g. Zonal semi final'},
  {id:'service', label:'Service', ph:'e.g. VIA at the void deck', topic:'What you did', topicPh:'e.g. Reading with P2 pupils'},
  {id:'other', label:'Other', ph:'Where did the learning happen?', topic:'What it was', topicPh:'e.g. Leading a class meeting'}
];
const SUBJECTS = ['English','Mathematics','Science','Chemistry','Physics','Biology','Geography','History','Literature','Mother Tongue','Design and Technology','Art','Music','Food and Consumer Education','Computing','PE','CCE','NEXUS'];
function contextTypeOf(id){ return CONTEXT_TYPES.find(c => c.id === id) || (id === 'across' ? {id:'across', label:'Look across'} : CONTEXT_TYPES[0]); }
function inferContextType(name){
  const n = String(name || '').toLowerCase(); if (!n) return 'subject';
  if (/\bcca\b|training|choir|band|football|basketball|netball|volleyball|badminton|scouts|guides|\bncc\b|npcc|ncdcc|sjab|robotics|drama|dance|wushu/.test(n)) return 'cca';
  if (/camp|trip|\bobs\b|learning journey|immersion/.test(n)) return 'camp';
  if (/competition|challenge|olympiad|tournament|championship/.test(n)) return 'competition';
  if (/\bvia\b|service|volunteer/.test(n)) return 'service';
  return 'subject';
}

/* ---------- text checks ---------- */
function normText(t){ return String(t || '').toLowerCase().replace(/[“”"‘’']/g, '').replace(/\s+/g, ' ').trim(); }
/* True when the quote really is the student's own words in this entry. */
function isVerbatim(entry, quote){ const q = normText(String(quote || '').trim().replace(/[.!?…]+$/, '')); return q.length > 2 && normText(entryAnswersText(entry)).includes(q); }

/* ---------- hashes: fast for change detection, SHA-256 for identity tags ---------- */
function fnvHex(s){ s = String(s); let h = 0x811c9dc5; for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); }
async function sha256Hex(s){
  try{ const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s))); return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''); }
  catch{ return fnvHex(s) + fnvHex('1' + s) + fnvHex('2' + s) + fnvHex('3' + s) + fnvHex('4' + s) + fnvHex('5' + s) + fnvHex('6' + s) + fnvHex('7' + s); }
}
/* A short, one way tag for a student email: lets a note link find the right
   profile without carrying the email in the clear. */
async function emailTag(email){ return (await sha256Hex('cdl:' + String(email || '').trim().toLowerCase())).slice(0, 16); }
/* The coach input for an entry: if this has not changed, a second AI read is wasted. */
function inputHash(entry, stmts){ return fnvHex(entryForCoach(entry) + '|' + (stmts || []).map(s => s.id).join(',')); }

/* ---------- link codec: CDL1.<kind>.<deflate raw, base64url>; CDL0 when CompressionStream is missing ----------
   kind i = items a student sends to an adult; n = notes an adult sends back. */
function b64urlFromBytes(bytes){ let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function bytesFromB64url(s){ s = String(s || '').replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const bin = atob(s); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
async function pipeBytes(bytes, stream){ return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }
async function packCDL(kind, obj){
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream !== 'undefined'){ try{ return `CDL1.${kind}.` + b64urlFromBytes(await pipeBytes(raw, new CompressionStream('deflate-raw'))); }catch{} }
  return `CDL0.${kind}.` + b64urlFromBytes(raw);
}
/* Accepts a whole payload, or one split across form answers as "CDL1.i.<a>", "~2.<b>", "~3.<c>". */
function joinCDL(parts){
  const list = (Array.isArray(parts) ? parts : [parts]).map(x => String(x || '').trim()).filter(Boolean);
  const head = list.find(x => /^CDL[01]\.[a-z]\./.test(x)); if (!head) return '';
  const more = [2,3,4,5].map(n => { const p = list.find(x => x.startsWith(`~${n}.`)); return p ? p.slice(String(n).length + 2) : ''; });
  return head + more.join('');
}
async function unpackCDL(text){
  const m = /CDL([01])\.([a-z])\.([A-Za-z0-9_-]+)/.exec(String(text || '')); if (!m) return null;
  let bytes = bytesFromB64url(m[3]);
  if (m[1] === '1'){
    if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot open compressed links. Update it, or use a recent Chrome, Edge or Safari.');
    bytes = await pipeBytes(bytes, new DecompressionStream('deflate-raw'));
  }
  return {kind:m[2], data:JSON.parse(new TextDecoder().decode(bytes))};
}
/* Split a payload into pieces of at most n characters for form answers. */
function splitCDL(payload, n){ const out = [payload.slice(0, n)]; let i = n, k = 2; while (i < payload.length){ const room = n - (String(k).length + 2); out.push(`~${k}.` + payload.slice(i, i + room)); i += room; k++; } return out; }

/* ---------- I can statements ----------
   The school's set is JSON with strands: {id, title, draft?, bands:[{id,label,levels}],
   strands:[{id, comp, n, name, milestone, mvv, lower:[texts], upper:[texts], notes}]}.
   Each strand is a ladder: Lower Sec statements, then Upper Sec. A statement's id is
   the strand id plus its band letter and rung (ct1.l1, ct1.u3); keep ids stable once
   students link to them. An older shape, {baskets:{cait:{statements:[...]}}}, still
   loads for custom sets.
   Embedded copy of statements/beatty-v1.json, so the log works offline. Edit the JSON,
   then paste it here again (the header on one line, one strand per line). */
const DEFAULT_STATEMENTS = {"id": "beatty-v1", "version": 1, "draft": "V1", "title": "Beatty Secondary School: contextualised E21CC framework", "about": "Beatty's I can statements, taken from E21CC_Statements_for_BTYSS_V1.docx. Where the draft held an original and a proposed rewrite, the rewrite is used; deleted text is dropped. Statements are quoted word for word. Each strand is a ladder: Lower Sec (Sec 1 and 2) then Upper Sec (Sec 3 to 5). Statement ids are the strand id plus l1, l2 or u1, u2 and so on; keep them stable once students link entries to them. The notes on each strand list what the draft left open for the school to settle.", "bands": [{"id": "lower", "label": "Lower Sec", "levels": [1, 2]}, {"id": "upper", "label": "Upper Sec", "levels": [3, 4, 5]}], "mvvKey": {"m": "Mission: Adaptive Thinkers, Agile Learners, Active Contributors", "vi": "Vision: Purpose Driven Steward", "va": "DREAM values: Discipline, Resilience, Empathy, Adaptability, Mindfulness"}, "strands":[
  {"id": "ct1", "comp": "critical", "n": 1, "name": "Exercises sound reasoning and decision-making", "milestone": {"lower": "At Lower Sec, students use evidence to explain reasoning (Level 3.1).", "upper": "At Upper Sec, students use evidence and adopt different viewpoints to explain their reasoning and decisions, having considered the implications of the relationship among different viewpoints."}, "mvv": {"m": ["Adaptive Thinkers"], "vi": [], "va": ["Mindfulness", "Discipline"]}, "lower": ["I can explain my thinking and decisions using evidence.", "I can consider viewpoints different from my own and use them, alongside evidence, to explain my reasoning more fully."], "upper": ["I can work out how different viewpoints relate to each other, including where they conflict.", "I can explain what those conflicts mean for my conclusion and make decisions I can defend.", "I can weigh evidence and different viewpoints independently and make decisions I can defend on principle rather than preference."], "notes": ["Reviewer comment on the milestone: \"Need to have this?\" (Level 3.1)."]},
  {"id": "ct2", "comp": "critical", "n": 2, "name": "Uses metacognition to enhance, monitor and regulate thinking", "milestone": {"lower": "At Lower Sec, students can reflect on their thoughts, attitudes, behaviour and actions during their learning experiences, and determine the modifications (changes) required.", "upper": "At Upper Sec, students can plan, organise and evaluate their thinking strategies to monitor their learning, suspend judgement, reassess conclusions and consider alternatives to refine their thoughts, attitudes, behaviour and actions."}, "mvv": {"m": ["Agile Learners"], "vi": [], "va": ["Mindfulness", "Resilience", "Discipline"]}, "lower": ["I can reflect on how I think and learn, and identify changes I can make to improve.", "I can adjust my attitudes, behaviours and strategies to make a difference to my learning."], "upper": ["I can plan and monitor my own thinking strategies, and evaluate the effectiveness for my learning.", "I can reassess my conclusions and consider alternatives before refining my attitudes and actions.", "I can take ownership of my growth as a learner by consistently reflecting on and improving how I think, learn and act."], "notes": ["Reviewer comment: metacognition is called Adaptive Learning in Beatty's own VMV. School leaders to decide which name to use.", "Upper Sec 1 asks \"effectiveness of what?\"; the wording is unresolved."]},
  {"id": "at3", "comp": "adaptive", "n": 3, "name": "Assesses different contexts and situations to make connections and draw new insights", "milestone": {"lower": "At Lower Sec, students can understand the similarities and differences between different contexts or situations and how this might affect their perspective or approach.", "upper": "At Upper Sec, students can draw on the similarities and differences between different contexts or situations to extract new insights to inform their perspective or approach."}, "mvv": {"m": ["Adaptive Thinkers", "Agile Learners"], "vi": [], "va": ["Adaptability", "Mindfulness"]}, "lower": ["I can identify similarities and differences between different situations, and use these connections to understand things in a new way.", "I can use the connections made and apply what I have learnt in another context."], "upper": ["I can identify what is similar and what is different between two situations.", "I can use the insights drawn from different contexts to sharpen my perspective, challenge my assumptions and approach problems in more creative and effective ways."], "notes": ["Upper Sec 1 (the proposed rewrite) reads easier than Lower Sec 1. The ladder needs checking.", "Reviewer comment on Upper Sec 2: would \"creative\" be needed, or \"approach situations differently\"?"]},
  {"id": "at4", "comp": "adaptive", "n": 4, "name": "Manages complexities and ambiguities by adjusting one's perspective and strategies", "milestone": {"lower": "At Lower Sec, students can draw on different perspectives and strategies to adjust their approach when required, applying learnt knowledge and skills in unfamiliar contexts.", "upper": "At Upper Sec, students can draw on different perspectives and strategies to adjust their approach when required, adapting learnt knowledge and skills in new and unexpected contexts to solve complex and unexpected problems."}, "mvv": {"m": ["Adaptive Thinkers", "Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Adaptability", "Resilience"]}, "lower": ["I can engage with different perspectives and adjust my approach when I face unfamiliar situations.", "I can adjust my approach when things do not go as expected, and stay open to trying new strategies."], "upper": ["I can adapt my strategies and mindset when facing complex, ambiguous or unexpected challenges.", "I can draw on diverse perspectives to help me solve new problems.", "I can adapt both my strategies and my mindset in complex, real-world contexts to respond with confidence and integrity."], "notes": []},
  {"id": "it5", "comp": "inventive", "n": 5, "name": "Explores possibilities and generates novel and useful ideas", "milestone": {"lower": "At Lower Sec, students can generate ideas that may involve modifying existing ones and explore different pathways that are appropriate to respond to an issue or challenge.", "upper": "At Upper Sec, students can generate ideas that are unique or modified substantially from existing ones and explore different pathways that lead to solutions."}, "mvv": {"m": ["Adaptive Thinkers", "Active Contributors"], "vi": [], "va": ["Adaptability", "Resilience", "Mindfulness"]}, "lower": ["I can explore different possibilities and generate ideas in response to issues or challenges, including by building on or modifying existing ones.", "I can develop and refine my ideas by testing them against the issue or challenge at hand."], "upper": ["I can generate new ideas by exploring multiple pathways.", "I can take creative risks and use feedback to develop them into solutions that are genuinely useful.", "I can generate and develop original ideas to make a difference to the challenges I encounter."], "notes": ["Reviewer comment on \"creative risks\": unconventional or uncertain?"]},
  {"id": "it6", "comp": "inventive", "n": 6, "name": "Evaluates and refines ideas to formulate novel and useful solutions", "milestone": {"lower": "At Lower Sec, students can evaluate and refine their ideas using relevant strategies and based on a set of criteria that is appropriate for the task or context.", "upper": "At Upper Sec, students can evaluate and refine their ideas iteratively, using relevant strategies and based on a set of criteria that is appropriate for the task or context."}, "mvv": {"m": ["Adaptive Thinkers", "Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Discipline", "Resilience", "Mindfulness"]}, "lower": ["I can evaluate my ideas using relevant criteria to identify what is working and what is not.", "I can refine my thinking and make deliberate improvements to arrive at a better solution."], "upper": ["I can evaluate and refine my ideas using relevant criteria to identify what is working and what is not.", "I can challenge my own ideas and use this to push my thinking towards creative and robust solutions.", "I can develop creative and useful solutions through evaluation, creative risk-taking and a deep awareness of the needs of the issue."], "notes": ["Upper Sec 1 nearly repeats Lower Sec 1.", "Reviewer comment on Upper Sec 2: keep \"useful solutions\" rather than \"robust\"?"]},
  {"id": "co1", "comp": "communication", "n": 1, "name": "Effectively communicates information and co-constructs meaning", "milestone": {"lower": "At Lower Sec, students can convey and evaluate knowledge to co-construct new understandings and ideas coherently, while considering the specific purpose and context of communication.", "upper": "At Upper Sec, students can convey and critically evaluate knowledge to co-construct new understandings and complex ideas persuasively and with impact, while considering the specific purpose and context of communication."}, "mvv": {"m": ["Active Contributors", "Agile Learners"], "vi": [], "va": ["Empathy", "Discipline", "Mindfulness"]}, "lower": ["I can express my ideas clearly and confidently, using appropriate language and tone to suit the purpose, audience and context.", "I can check whether my message is understood and build on others’ ideas to learn together.", "I can process information shared with me and consider how it connects with the information I already have."], "upper": ["I can present complex ideas persuasively, using appropriate language and tone to suit the purpose, audience and context.", "I can critically evaluate what I share and how I share it to ensure my communication is honest, accurate and responsible.", "I can build on what others contribute to work towards shared insight rather than just conveying my own views.", "I can gather feedback from my audience and synthesise different viewpoints to achieve a deeper understanding."], "notes": ["Lower Sec 3 and Upper Sec 4 were proposed additions in the draft.", "Reviewer comments on Upper Sec 2: overlap with adjusting, and \"where did these come from?\""]},
  {"id": "co2", "comp": "communication", "n": 2, "name": "Engages empathetically with diverse perspectives", "milestone": {"lower": "At Lower Sec, students respond with respect and empathy, and are sensitive to the diverse backgrounds that influence different perspectives while interacting with others.", "upper": "At Upper Sec, students respond with respect and empathy, and are sensitive to the diverse backgrounds that influence the context of communication with others."}, "mvv": {"m": ["Active Contributors"], "vi": [], "va": ["Empathy", "Mindfulness", "Adaptability"]}, "lower": ["I can listen actively and acknowledge others' feelings and viewpoints.", "I can ask thoughtful questions with empathy to better understand others’ perspectives."], "upper": ["I can validate others’ feelings and viewpoints, helping everyone feel heard, respected and valued.", "I can adjust how I communicate to build trust, resolve misunderstandings, and encourage open dialogue."], "notes": ["The Upper Sec rewrites merge four earlier statements into two."]},
  {"id": "cl3", "comp": "collaboration", "n": 3, "name": "Interacts and works effectively in group settings to contribute to shared goals", "milestone": {"lower": "At Lower Sec, students can manage disagreements with group members and take in suggestions, while contributing to the completion of a task to meet the shared goals.", "upper": "At Upper Sec, students can mediate conflict and disagreement, reaching compromises or consensus for collective decisions to meet shared goals."}, "mvv": {"m": ["Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Empathy", "Resilience", "Discipline"]}, "lower": ["I can contribute meaningfully to group work, doing my fair share and supporting my teammates to help the group succeed.", "I can manage disagreements and help the group find a way forward to achieve our shared goals."], "upper": ["I can build consensus and lead my team towards shared goals.", "I can help teammates understand each other's perspectives, de-escalate tension and work through disagreements to strengthen relationships."], "notes": []},
  {"id": "cl4", "comp": "collaboration", "n": 4, "name": "Collectively defines and negotiates roles and tasks to achieve group goals", "milestone": {"lower": "At Lower Sec, students can determine and effectively assume the role they will play by considering the dynamics of the group.", "upper": "At Upper Sec, students can reflect on their working relationships with the group and adapt to contribute to the shared goals, as determined collectively by its members."}, "mvv": {"m": ["Active Contributors", "Agile Learners"], "vi": ["Purpose Driven Steward"], "va": ["Discipline", "Adaptability", "Empathy"]}, "lower": ["I can take on a clear role in my group, communicate my responsibilities to my teammates and contribute to a shared work plan.", "I can follow through on my responsibilities and check in with my team to make sure our shared plan is on track."], "upper": ["I can reflect on how I work with others and use this to improve how the group works.", "I can adapt my role to serve the group's needs when the situation calls for it.", "I can help my team define responsibilities collectively and ensure that every member is set up to contribute meaningfully."], "notes": []},
  {"id": "in5", "comp": "information", "n": 5, "name": "Employs effective strategies to locate information and exercises discernment", "milestone": {"lower": "At Lower Sec, students can select, organise and synthesise information from multiple sources and verify the accuracy, credibility and currency of information by cross-referencing multiple sources.", "upper": "At Upper Sec, students can refine search results, organise information systematically and manage information sensitively, and evaluate the accuracy, credibility and relevance of information."}, "mvv": {"m": ["Agile Learners", "Adaptive Thinkers"], "vi": ["Purpose Driven Steward"], "va": ["Mindfulness", "Discipline"]}, "lower": ["I can search for information from multiple sources and check whether it is accurate and credible.", "I can organise the information I find in a way that supports my learning and helps me make better decisions."], "upper": ["I can refine and organise information from diverse sources, assessing its accuracy, credibility and relevance with rigour.", "I can evaluate information by interrogating its assumptions, biases and limitations.", "I can manage information with discernment and sensitivity, and take responsibility for how I apply it in my learning and decision-making."], "notes": ["Reviewer comments: is \"with rigour\" needed; is \"interrogating\" too strong (\"questioning\")?"]},
  {"id": "in6", "comp": "information", "n": 6, "name": "Creates and shares information ethically and maintains a positive online presence", "milestone": {"lower": "At Lower Sec, students can consider the impact of what they share and create, maintain positive relationships with others, and acknowledge sources of information.", "upper": "At Upper Sec, students can contribute to information and perspectives shared in constructive and ethical ways, and manage their online reputation and relationships responsibly."}, "mvv": {"m": ["Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Mindfulness", "Discipline", "Empathy"]}, "lower": ["I can share information responsibly by considering its impact on others, whether online or offline.", "I can exercise self-control in how I behave online and offline, making deliberate choices about what I post, share and say."], "upper": ["I can contribute to conversations and platforms in constructive and ethical ways, and hold myself to a high standard of honesty and care in what I share.", "I can manage a positive online presence by being aware that my digital footprint shapes how others see me and what I stand for, now and in the future."], "notes": ["Reviewer comments: Lower Sec 2 overlaps with Lower Sec 1; \"where did this come from?\" on Upper Sec 1."]},
  {"id": "cv1", "comp": "civic", "n": 1, "name": "Demonstrates understanding of values, ideals and issues of personal, community and national significance", "milestone": {"lower": "At Lower Sec, students can describe and explain issues that affect the culture, social and economic development, governance, future and identity of Singapore, and understand multiple perspectives on them.", "upper": "At Upper Sec, students can explain, analyse, evaluate, and construct new understandings of issues that affect Singapore, and manage tensions among multiple perspectives to work towards a common good."}, "mvv": {"m": ["Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Mindfulness", "Empathy", "Discipline"]}, "lower": ["I can explain issues that affect Singapore's society, culture and future.", "I can understand why people hold different views based on their values and life experiences."], "upper": ["I can analyse issues from multiple perspectives to understand the reasons and values behind each viewpoint.", "I can share thoughtful views on societal issues to contribute positively as a responsible citizen."], "notes": []},
  {"id": "cv2", "comp": "civic", "n": 2, "name": "Plays active and constructive roles to improve the school, community and nation", "milestone": {"lower": "At Lower Sec, students can plan and organise programmes with others that contribute to school and community, with support, and can differentiate the civic roles played by individuals, groups and organisations in contributing to the community and nation.", "upper": "At Upper Sec, students can independently identify appropriate and constructive steps to address issues, and initiate, plan and organise programmes with others that contribute to school, community and/or nation, and evaluate the complementary civic roles played by individuals, groups, organisations and government."}, "mvv": {"m": ["Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Empathy", "Resilience", "Discipline"]}, "lower": ["I can work with others to plan and carry out projects that help my school and community.", "I can take steps to make a positive difference on the people around me.", "I can explain how different people and organisations each play a role in making our community better."], "upper": ["I can identify issues that matter and plan constructive ways to address them.", "I can lead group efforts around a common goal to improve my school and community.", "I can evaluate how individuals, groups and organisations work together to build a better society."], "notes": []},
  {"id": "gl3", "comp": "global", "n": 3, "name": "Aware of global issues, interconnections and trends, and forms informed perspectives", "milestone": {"lower": "At Lower Sec, students can demonstrate awareness of global issues, explain their impact and describe Singapore's role in addressing issues in the global community.", "upper": "At Upper Sec, students can actively find out about global issues, analyse them and discern their implications for individuals, Singapore and other countries."}, "mvv": {"m": ["Adaptive Thinkers", "Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Mindfulness", "Adaptability"]}, "lower": ["I can identify global issues and explain how they affect Singapore and my everyday life.", "I can form my own views on what global events and trends mean for me and my school."], "upper": ["I can research global issues and analyse how these issues impact Singapore and other countries.", "I can develop well-reasoned and responsible views on global events and trends."], "notes": ["The draft notes that another school frames this as considering global issues and trends from multiple perspectives and their relevance to Singapore."]},
  {"id": "gl4", "comp": "global", "n": 4, "name": "Interacts confidently with people from Singapore and beyond on global issues", "milestone": {"lower": "At Lower Sec, students can interact respectfully with people from Singapore and other countries to understand each other better and/or discuss global issues and reach relevant conclusions.", "upper": "At Upper Sec, students can interact respectfully and confidently with people from Singapore and other countries on various platforms to discuss global issues and recommend appropriate actions to address them."}, "mvv": {"m": ["Active Contributors", "Agile Learners"], "vi": ["Purpose Driven Steward"], "va": ["Empathy", "Adaptability"]}, "lower": ["I can interact respectfully with people from different backgrounds and countries.", "I can share my thoughts on global issues with others, listen openly to theirs, and build a common understanding."], "upper": ["I can connect confidently and respectfully with people locally and globally to discuss world issues.", "I can propose realistic, well-informed solutions to global issues while staying sensitive to different needs and perspectives."], "notes": []},
  {"id": "cc5", "comp": "crosscultural", "n": 5, "name": "Aware of and appreciates the cultural background and identity of self and others", "milestone": {"lower": "At Lower Sec, students can appreciate the value of a diversity of cultural and religious communities' heritage, customs, and perspectives, and their contributions to Singapore and the world.", "upper": "At Upper Sec, students can appreciate the value of a diversity of cultural and religious communities' heritage, customs, perspectives, and contributions, and identify commonalities between one's own and other cultures."}, "mvv": {"m": ["Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Empathy", "Mindfulness"]}, "lower": ["I can respect and value the traditions, cultures, and beliefs of different communities in Singapore and around the world.", "I can reflect on how my own culture and background shape how I view the world."], "upper": ["I can understand how different cultural histories and life experiences shape the way people see themselves and society.", "I can find common ground and shared values across different cultural and religious backgrounds.", "I can use my understanding of cultural diversity to build meaningful relationships based on mutual respect."], "notes": []},
  {"id": "cc6", "comp": "crosscultural", "n": 6, "name": "Shows sensitivity and openness in interactions with diverse communities to promote social cohesion", "milestone": {"lower": "At Lower Sec, students can demonstrate empathy, awareness of their own biases, and appropriate behaviour towards the lived experiences of people from different social, cultural and religious backgrounds within and beyond Singapore.", "upper": "At Upper Sec, students can demonstrate appropriate skills and behaviour to work together with people from a diverse range of social, cultural and religious backgrounds within and beyond Singapore, and contribute to promoting social cohesion."}, "mvv": {"m": ["Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Empathy", "Adaptability", "Mindfulness"]}, "lower": ["I can identify my own assumptions and biases and see how they affect how I treat others.", "I can show empathy and respect to people from all backgrounds to help build a united school and community."], "upper": ["I can collaborate effectively with diverse teams by respecting differences and bringing out the best in everyone.", "I can bridge differences and promote social harmony in my school, community, and nation."], "notes": []}
]};
const BAND_LABEL = {lower:'Lower Sec', upper:'Upper Sec'};
function normaliseStatementSet(raw){
  if (!raw || typeof raw !== 'object') return null;
  const base = {id:String(raw.id || 'custom'), version:raw.version || 1, placeholder:!!raw.placeholder, draft:String(raw.draft || ''), title:String(raw.title || 'I can statements'), about:String(raw.about || ''), mvvKey:raw.mvvKey || null};
  if (Array.isArray(raw.strands)){
    const strands = [], list = [], seen = new Set();
    for (const st of raw.strands){
      const c = st && compOf(st.comp); if (!c || !st.id) continue;
      const strand = {id:String(st.id), comp:c.id, basket:c.d, n:Number(st.n) || strands.filter(x => x.comp === c.id).length + 1, name:String(st.name || ''), milestone:st.milestone || {}, mvv:st.mvv || {m:[], vi:[], va:[]}, notes:Array.isArray(st.notes) ? st.notes : [], lower:[], upper:[]};
      for (const band of ['lower', 'upper']) (Array.isArray(st[band]) ? st[band] : []).forEach((text, i) => {
        if (!text) return; const id = `${strand.id}.${band[0]}${i + 1}`; if (seen.has(id)) return; seen.add(id);
        const s = {id, comp:c.id, competencies:[c.id], basket:c.d, band, strand:strand.id, strandName:strand.name, strandN:strand.n, rung:i + 1, level:null, text:String(text).trim(), mvv:strand.mvv};
        strand[band].push(s); list.push(s);
      });
      strands.push(strand);
    }
    const bands = Array.isArray(raw.bands) && raw.bands.length ? raw.bands.map(b => ({id:String(b.id), label:String(b.label || BAND_LABEL[b.id] || b.id), levels:Array.isArray(b.levels) ? b.levels.map(Number) : []})) : [{id:'lower', label:'Lower Sec', levels:[1, 2]}, {id:'upper', label:'Upper Sec', levels:[3, 4, 5]}];
    return {...base, bands, strands, list};
  }
  if (!raw.baskets || typeof raw.baskets !== 'object') return null;
  const bands = Array.isArray(raw.bands) && raw.bands.length ? raw.bands.map(b => ({id:String(b.id), label:String(b.label || b.id)})) : null;
  const list = []; const seen = new Set();
  const push = (basket, band, s, i) => {
    if (!s || !s.text) return;
    const id = String(s.id || `${basket}.${band ? band + '.' : ''}${String(i + 1).padStart(2, '0')}`); if (seen.has(id)) return; seen.add(id);
    const comps = (Array.isArray(s.competencies) ? s.competencies : []).filter(c => compOf(c) && compOf(c).d === basket);
    list.push({id, comp:comps[0] || null, basket, band, level:Number(s.level) || null, text:String(s.text).trim(), competencies:comps});
  };
  for (const d of DOMAINS){
    const b = raw.baskets[d.id]; if (!b) continue;
    if (bands && b.bands && typeof b.bands === 'object') for (const band of bands) (b.bands[band.id] || []).forEach((s, i) => push(d.id, band.id, s, i));
    if (Array.isArray(b.statements)) b.statements.forEach((s, i) => push(d.id, null, s, i));
  }
  return {...base, bands, strands:null, list};
}
/* The student's band. Sec 1 and 2 are Lower Sec; Sec 3 to 5 are Upper Sec. The level
   the student gives wins; then the band their form group names; then Lower Sec. */
function bandFor(set, prof){
  const ids = set && set.bands ? set.bands.map(b => b.id) : ['lower', 'upper'];
  const lv = prof && Number(prof.level);
  if (lv && set && set.bands){ const b = set.bands.find(x => (x.levels || []).includes(lv)); if (b) return b.id; }
  if (lv) return lv <= 2 ? 'lower' : 'upper';
  if (prof && prof.band && ids.includes(prof.band)) return prof.band;
  return ids[0] || null;
}
/* The statements a student works towards: unbanded ones always, banded ones in their band. */
function statementsFor(set, band){ if (!set) return []; if (!set.bands) return set.list.slice(); const b = set.bands.some(x => x.id === band) ? band : set.bands[0].id; return set.list.filter(s => !s.band || s.band === b); }
/* The rest of the ladder: for Lower Sec, Upper Sec as a stretch; for Upper Sec, Lower Sec as earlier ground. */
function otherBandFor(set, band){ if (!set || !set.bands) return []; const b = set.bands.some(x => x.id === band) ? band : set.bands[0].id; return set.list.filter(s => s.band && s.band !== b); }
function strandsOf(set, comp){ return set && set.strands ? set.strands.filter(s => s.comp === comp) : []; }

/* ---------- the evidence gate ----------
   A statement lights only when the student has linked an entry AND that
   entry's own words back it: the coach saw one of the statement's
   competencies at clear or strong with a quote that really is there, or the
   class coach matched this statement to a quote that really is there.
   A coach suggestion alone never lights anything. */
function linkBacked(entry, stmt){
  const x = entry.e21cc || {};
  const byEvidence = (x.evidence || []).some(v => stmt.competencies.includes(v.id) && (v.strength === 'clear' || v.strength === 'strong') && !v.unverified && v.quote && isVerbatim(entry, v.quote));
  const byMatch = x.source === 'ai' && (x.statements || []).some(s => s.sid === stmt.id && isVerbatim(entry, s.quote));
  return byEvidence || byMatch;
}
/* ---------- securing a statement ----------
   One backed entry is a start. A statement is secured when at least two backed
   entries, from two different subjects or CCAs, sit at least two weeks apart:
   the same thing done again, somewhere else, later. */
const SECURE = {entries:2, contexts:2, days:14};
function contextKey(e){ const c = e.context || {}; return String(c.name || e.subject || c.type || e.kind || '').trim().toLowerCase(); }
function contextName(e){ const c = e.context || {}; return String(c.name || e.subject || '').trim(); }
function securedOf(entries, stmt){
  const links = [];
  for (const e of entries) for (const l of (e.links || [])) if (l.sid === stmt.id) links.push({e, l, backed:linkBacked(e, stmt)});
  const backing = links.filter(k => k.backed).sort((a, b) => a.e.created - b.e.created);
  const keys = new Set(backing.map(k => contextKey(k.e)));
  const first = backing.length ? backing[0].e.created : 0, last = backing.length ? backing[backing.length - 1].e.created : 0;
  const spanDays = backing.length ? Math.floor((last - first) / 864e5) : 0;
  // when it was secured: the first moment all three conditions held, by when the links were made
  let securedAt = null;
  for (let i = 1; i < backing.length && !securedAt; i++){
    const part = backing.slice(0, i + 1);
    if (new Set(part.map(k => contextKey(k.e))).size >= SECURE.contexts && (part[i].e.created - part[0].e.created) >= SECURE.days * 864e5) securedAt = Math.max(...part.map(k => k.l.at || k.e.created));
  }
  const secured = !!securedAt;
  // a date already past needs no saying: any new entry is late enough
  const due = first + SECURE.days * 864e5;
  const need = {entries:Math.max(0, SECURE.entries - backing.length), context:keys.size < SECURE.contexts, after:backing.length && (last - first) < SECURE.days * 864e5 && due > Date.now() ? due : 0};
  if (secured) need.entries = 0, need.context = false, need.after = 0;
  let missing = '';
  if (!secured){
    if (!backing.length) missing = links.length ? 'The linked entry does not show it in your words yet. Add a sentence that does.' : 'Link an entry whose words show it.';
    else {
      const bits = []; const from = need.context ? ` from a subject or CCA other than ${[...new Set(backing.map(k => contextName(k.e)).filter(Boolean))].join(' or ') || 'this one'}` : ''; const when = need.after ? `, on or after ${new Date(need.after).toLocaleDateString('en-SG', {day:'numeric', month:'short'})}` : '';
      bits.push(`One more entry${from}${when}.`);
      missing = bits.join(' ');
    }
  }
  const state = secured ? 'secured' : backing.length ? 'started' : links.length ? 'linked' : 'none';
  return {stmt, links, backing, contexts:keys.size, spanDays, secured, securedAt, need, missing, state};
}
function statementStatus(entries, stmt){
  const s = securedOf(entries, stmt);
  const suggested = entries.filter(e => !(e.links || []).some(l => l.sid === stmt.id) && ((e.e21cc && e.e21cc.statements) || []).some(x => x.sid === stmt.id));
  return {...s, suggested, lit:s.backing.length > 0, litAt:s.backing.length ? Math.min(...s.backing.map(k => k.l.at || k.e.created)) : null};
}

/* ---------- levels: earned from secured statements ----------
   A band is met in a strand when at least half its statements, rounded up, are secured.
   Emerging: the competency shows in an entry, or any statement is secured.
   Developing: in every strand, the Lower Sec band is met or an Upper Sec statement is secured.
   Proficient: Developing, and at least one Upper Sec statement secured.
   Leading: the Upper Sec band met in every strand, and a teacher has confirmed it.
   Competencies without statements (the social and emotional ones, for now) have no level. */
const LOG_LEVELS = [
  {id:'emerging', label:'Emerging', help:'It shows in your entries. Now secure its statements.'},
  {id:'developing', label:'Developing', help:'You have secured the Lower Sec ground in each strand.'},
  {id:'proficient', label:'Proficient', help:'You have also secured Upper Sec statements.'},
  {id:'leading', label:'Leading', help:'You have secured the Upper Sec statements in each strand, and a teacher has confirmed it.'}
];
function levelLabel(id){ const l = LOG_LEVELS.find(x => x.id === id); return l ? l.label : 'Not started'; }
function showsComp(e, comp){ return ((e.e21cc && e.e21cc.evidence) || []).some(v => v.id === comp && !v.unverified && (v.strength === 'clear' || v.strength === 'strong')); }
function levelOf(entries, set, comp, confirmed){
  const strands = strandsOf(set, comp);
  if (!strands.length) return {comp, level:null, idx:0, none:true, strands:[], secured:0, total:0, waiting:false, next:'', target:null};
  const half = n => Math.ceil(n / 2);
  const rows = strands.map(st => {
    const lo = st.lower.map(s => statementStatus(entries, s)), up = st.upper.map(s => statementStatus(entries, s));
    const sl = lo.filter(x => x.secured).length, su = up.filter(x => x.secured).length;
    return {strand:st, lower:lo, upper:up, sl, su, lowerMet:sl >= half(lo.length), upperMet:up.length > 0 && su >= half(up.length), needLower:Math.max(0, half(lo.length) - sl), needUpper:Math.max(0, half(up.length) - su)};
  });
  const all = rows.flatMap(r => r.lower.concat(r.upper));
  const secured = all.filter(x => x.secured).length;
  const shows = entries.some(e => e.kind !== 'across' && showsComp(e, comp)) || all.some(x => x.backing.length);
  const developing = rows.every(r => r.lowerMet || r.su > 0);
  const anyUpper = rows.some(r => r.su > 0);
  const upperAll = rows.every(r => r.upperMet);
  const conf = confirmed && confirmed[comp];
  let idx = 0;
  if (shows || secured) idx = 1;
  if (developing) idx = 2;
  if (developing && anyUpper) idx = 3;
  const waiting = idx === 3 && upperAll && !conf;
  if (idx === 3 && upperAll && conf) idx = 4;
  // the next step and the statement to aim for
  const firstOpen = list => (list.find(x => !x.secured && x.backing.length) || list.find(x => !x.secured) || {}).stmt || null;
  let next = '', target = null; const q = s => `“${s}”`;
  const n = (k, w, more) => `${k === 1 ? 'one' : k}${more ? ' more' : ''} ${w}${k === 1 ? '' : 's'}`;
  if (idx === 0){ next = 'Write an entry that shows it, then link it to a statement.'; target = firstOpen(rows[0].lower); }
  else if (idx === 1){ const r = rows.find(x => !(x.lowerMet || x.su > 0)); target = firstOpen(r.lower); next = `For Developing: secure ${n(r.needLower, 'Lower Sec statement', r.sl > 0)} in ${q(r.strand.name)}.`; }
  else if (idx === 2){ const r = rows.slice().sort((a, b) => b.su - a.su || b.sl - a.sl)[0]; target = firstOpen(r.upper); next = 'For Proficient: secure one Upper Sec statement.'; }
  else if (idx === 3 && !waiting){ const r = rows.find(x => !x.upperMet); target = firstOpen(r.upper); next = `For Leading: secure ${n(r.needUpper, 'Upper Sec statement', r.su > 0)} in ${q(r.strand.name)}.`; }
  else if (waiting) next = 'Leading: waiting for a teacher. Share your log with a teacher and ask them to confirm it.';
  return {comp, level:idx ? LOG_LEVELS[idx - 1].id : null, idx, none:false, strands:rows, secured, total:all.length, waiting, confirmed:conf || null, next, target};
}

/* ---------- baskets: computed, never stored, so old entries file themselves ---------- */
function basketsOf(entry){
  if (entry.kind === 'across') return entry.basket ? [entry.basket] : [];
  const s = new Set();
  for (const t of (entry.competencies || [])){ const c = compOf(t.id); if (c) s.add(c.d); }
  for (const v of ((entry.e21cc && entry.e21cc.evidence) || [])){ const c = compOf(v.id); if (c && (v.strength === 'clear' || v.strength === 'strong') && !v.unverified) s.add(c.d); }
  return BASKET_IDS.filter(id => s.has(id));
}
/* How strongly an entry shows a basket: 3 strong, 2 clear, 1 claimed or a glimpse, 0 nothing. */
function strengthIn(entry, basket){
  let best = 0;
  for (const v of ((entry.e21cc && entry.e21cc.evidence) || [])){ const c = compOf(v.id); if (!c || c.d !== basket) continue; best = Math.max(best, v.unverified ? 1 : v.strength === 'strong' ? 3 : v.strength === 'clear' ? 2 : 1); }
  if (!best && (entry.competencies || []).some(t => { const c = compOf(t.id); return c && c.d === basket; })) best = 1;
  return best;
}
/* The best verified quote an entry offers for a basket. */
function quoteFor(entry, basket){
  const ev = ((entry.e21cc && entry.e21cc.evidence) || []).filter(v => { const c = compOf(v.id); return c && c.d === basket && v.quote && !v.unverified; }).sort((a, b) => ({strong:3, clear:2, glimpse:1}[b.strength] - {strong:3, clear:2, glimpse:1}[a.strength]))[0];
  return ev || null;
}

/* ---------- migration: Learning Log v1 to Competency Development Log v2 ---------- */
function migrateEntry(e, primary){
  if (!e || typeof e !== 'object') return e;
  if (!e.answers) e.answers = {};
  if (!e.context){ const name = e.kind === 'across' ? '' : (e.subject || ''); e.context = {type: e.kind === 'across' ? 'across' : inferContextType(name), name}; }
  if (e.kind !== 'across' && e.subject === undefined) e.subject = e.context.name;
  if (e.groupCode === undefined) e.groupCode = e.kind !== 'across' && primary ? primary : '';
  e.links = Array.isArray(e.links) ? e.links : [];
  e.notes = Array.isArray(e.notes) ? e.notes : [];
  if (!e.sent){ e.sent = {}; if (e.pushed && e.pushed.at && primary) e.sent['g:' + primary] = e.pushed.at; }
  return e;
}
function migrateProfile(p){
  if (!p || typeof p !== 'object') return p;
  if (!Array.isArray(p.groups)) p.groups = p.classCode ? [{code:String(p.classCode).trim().toUpperCase(), type:'subject'}] : [];
  delete p.classCode;
  if (p.band === undefined) p.band = null;
  p.shares = p.shares || {}; p.shares.adults = p.shares.adults || {}; p.shares.sections = p.shares.sections || {}; p.shares.scope = p.shares.scope || {};
  for (const k of ['grow','act',...BASKET_IDS]) if (!Array.isArray(p.shares.sections[k])) p.shares.sections[k] = [];
  p.sentBaskets = p.sentBaskets || {};
  p.pendingNotes = Array.isArray(p.pendingNotes) ? p.pendingNotes : [];
  p.coach = Object.assign({mode:'builtin', key:'', relayUrl:'', token:'', model:'claude-opus-5'}, p.coach || {});
  p.coach.allowance = p.coach.allowance || {day:'', used:0};
  p.prefs = Object.assign({mood:'mountain', accent:'yellow', size:'normal', avatar:'🌱', motto:'Believe you can.'}, p.prefs || {});
  // the notebook: cover colour, paper, the coach's tone, the log's title, how journals open
  if (!p.prefs.cover) p.prefs.cover = 'navy';
  if (!p.prefs.paper) p.prefs.paper = p.prefs.mood === 'night' ? 'dark' : 'lined';
  if (!p.prefs.tone) p.prefs.tone = 'warm';
  if (p.prefs.title === undefined) p.prefs.title = '';
  // the four views (a case and notebooks, a clean record, editorial, bright); the cover colour and dark paper carry across
  if (!p.prefs.look) p.prefs.look = 'b';
  if (!p.prefs.colour) p.prefs.colour = p.prefs.cover || 'navy';
  if (!p.prefs.theme) p.prefs.theme = p.prefs.paper === 'dark' ? 'dark' : 'light';
  // the student's year (Sec 1 to 5) sets their band of statements; a teacher's confirmation of Leading, by competency
  if (p.level === undefined) p.level = null;
  if (!p.confirmed || typeof p.confirmed !== 'object') p.confirmed = {};
  p.prefs.journal = Object.assign({pivot:'experience', view:'bookmarks'}, p.prefs.journal || {});
  // the student's own subjects, CCA and other experiences: nothing is assumed
  p.experiences = Object.assign({subjects:[], cca:'', others:[]}, p.experiences || {});
  p.entries = Array.isArray(p.entries) ? p.entries : []; p.drafts = p.drafts || {}; p.done = p.done || {};
  const primary = p.groups[0] ? p.groups[0].code : '';
  for (const e of p.entries) migrateEntry(e, primary);
  return p;
}
function migrateDb(d){
  d = d && typeof d === 'object' ? d : {};
  const out = {schemaVersion:2, profiles:d.profiles || {}, current:d.current || null, groups:d.groups || {}, statementSets:d.statementSets || {}};
  if (d.classes) for (const [code, cfg] of Object.entries(d.classes)) if (!out.groups[code]) out.groups[code] = cfg;
  for (const p of Object.values(out.profiles)) migrateProfile(p);
  return out;
}
