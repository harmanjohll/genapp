/* ==================================================================
   Learning Log core: the two frameworks, the competency lens, and the
   built in coach. Shared by index.html (students) and teacher.html
   (class set up and review) so both see exactly the same engine.
   Classic script, no modules, no dependencies.
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
const FRAMEWORKS = {grow:GROW, act:ACT};

/* A coach's follow up for each guiding question, used when that answer is
   the thinnest one in the entry. Written to be read by a Sec 1 to Sec 5. */
const PROBES = {
  g1:'Say it without the textbook’s words. What is it, in one sentence a Sec 1 would follow?',
  g2:'Which example would you use, and where would your friend get stuck first?',
  r1:'Name the exact place it breaks: which step, or which kind of question?',
  r2:'When, where, and for how long? A plan without a time is only a wish.',
  o1:'Where did you actually see this outside class this week? Be specific about the place.',
  o2:'Who did you tell, and what did they ask you back?',
  w1:'What do you already know that the next topic will build on? Name one idea.',
  w2:'Check the scheme of work or ask your teacher: what is the next lesson’s title?',
  a1:'Name the feeling, then say what the feedback is actually pointing at.',
  a2:'Which part of the feedback would change your next attempt the most?',
  c1:'Which success criterion does this feedback sit under? Quote it.',
  c2:'Is this the same note as last time? If so, what has stopped you fixing it?',
  t1:'Name the habit and its replacement: instead of X, I will Y.',
  t2:'What will you look at in two weeks to check? A redo, marks, a friend reading your work?'
};

/* ---------- the competency lens: E21CC (MOE, 2023 refresh) in student words ---------- */
const DOMAINS = [
  {id:'cait', name:'Critical, Adaptive and Inventive Thinking', short:'Thinking',
   blurb:'How you reason, adapt what you know, and come up with ideas that work.',
   moe:'enables students to use sound reasoning and metacognitive skills to inform decision-making, generate novel and useful ideas to address issues, and manage complexities and ambiguities to adapt to changing contexts with agility.'},
  {id:'cci', name:'Communication, Collaboration and Information Skills', short:'Working with others',
   blurb:'How you explain, listen, share the work, and handle information honestly.',
   moe:'enable students to communicate information, ideas and feelings clearly, engage in effective collaboration with others, and manage, create and share information thoughtfully, ethically and responsibly.'},
  {id:'cgc', name:'Civic, Global and Cross-Cultural Literacy', short:'Community and world',
   blurb:'How you connect learning to your community, Singapore, and the wider world.',
   moe:'enables students to contribute constructively to their community and nation, interact respectfully and empathically with others in diverse communities, and act as responsible citizens of Singapore and the world.'},
  {id:'sec', name:'Social-Emotional Competencies', short:'Self and others',
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
const LEVELS = [
  {n:1, label:'Tried it', help:'I did this once, with help or by luck.'},
  {n:2, label:'Getting there', help:'I did this on purpose, and I can say how.'},
  {n:3, label:'Can teach it', help:'I do this reliably and could show a friend.'},
];
const DEPTHS = {
  surface:{label:'Base camp', help:'The words are here, but the details are still at the bottom of the hill.'},
  working:{label:'On the climb', help:'Specific in places. One more concrete detail and a dated next step would take you higher.'},
  deep:{label:'Ridge view', help:'Specific, honest and with a real next step. This is what reflection looks like.'}
};
/* The competency read: how strongly the writing shows a competency, and
   whether the entry is about the task or about how the student worked. */
const STRENGTHS = {
  glimpse:{label:'Glimpse', help:'A word points here, but there is no moment yet.'},
  clear:{label:'Clear', help:'A specific moment in your own words shows it.'},
  strong:{label:'Strong', help:'A specific moment, and you say how or why.'}
};
const STANCES = {
  task:{label:'Task talk', help:'This describes what the task was. The competencies live in how you worked it.'},
  mixed:{label:'Getting there', help:'Some of the how is here. One more moment would tip it.'},
  competency:{label:'Competency talk', help:'You are writing about how you thought and worked, not only what you did.'}
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
const MOTTOS = ['Believe you can.','Non Vi Sed Arte.','Small steps, every week.','Not yet is not never.','Write it down, then climb.'];

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
    out.gift = 'You opened the log. That is the first step, and most people never take it.';
    out.stretch = 'Nothing is written yet. Pick the question that feels easiest and write three honest sentences.';
    out.question = PROBES[qs[0].id]; out.competency = 'Once there are words on the page, we can look at which competency they show.';
    return out;
  }
  const mean = answered.reduce((a,s)=>a+s.score,0)/answered.length;
  const nextQ = qs.find(q => q.next); const nextS = scores.find(s => s.id === nextQ.id);
  const nextOk = nextS && nextS.hasTime && nextS.hasAction;
  out.depth = (mean >= 1.6 && nextOk && answered.length >= qs.length - 1) ? 'deep' : (mean >= 0.6 ? 'working' : 'surface');

  // gift: the strongest answer, quoted
  const best = answered.slice().sort((a,b)=>b.score-a.score)[0]; const bestQ = qs.find(q=>q.id===best.id);
  const QWHY = {r1:'you named the exact place it breaks, which is the honest start of any plan', a1:'you named the feeling and then looked past it to what the feedback is for', o1:'you found the idea outside the classroom', o2:'you tested the idea on a real person', c1:'you tied the feedback to a criterion instead of a mood', c2:'you noticed the pattern across pieces of feedback', w1:'you are reaching forward, not only looking back'};
  const why = QWHY[best.id] || (best.flags.includes('reasoned') ? 'you gave a reason, not only a claim' : best.flags.includes('specific') ? 'it names something real instead of staying general' : 'you wrote it in your own words');
  out.gift = `${teacher ? teacher + ' would notice this' : 'This'}: “${fragment(entry.answers[best.id])}”. It works because ${why}.`;

  // stretch: the weakest answered question, or the empty one that matters most
  const empties = scores.filter(s => s.flags.includes('empty'));
  let weak = answered.slice().sort((a,b)=>a.score-b.score)[0];
  if (empties.length && (empties.some(e=>e.id===nextQ.id) || weak.score >= 1)) weak = empties.find(e=>e.id===nextQ.id) || empties[0];
  const weakQ = qs.find(q=>q.id===weak.id); const qtext = weakQ.q.replace(/<[^>]+>/g,'');
  let s = '';
  if (weak.flags.includes('empty')) s = `“${qtext}” is still blank${weak.id===nextQ.id ? ', and that is the one that turns a reflection into a plan' : ''}.`;
  else if (weak.flags.includes('thin')) s = weak.id===nextQ.id ? `“${entry.answers[weak.id].trim()}” is a wish, not a step. A step has a doing verb, a day and a place.` : `“${entry.answers[weak.id].trim()}” is too short to act on. Give “${qtext}” three honest sentences.`;
  else if (weak.flags.includes('notime') || weak.flags.includes('noaction')) s = `Your plan (“${fragment(entry.answers[weak.id], 50)}”) needs ${!weak.hasAction ? 'a doing verb' : ''}${!weak.hasAction && !weak.hasTime ? ' and ' : ''}${!weak.hasTime ? 'a time and place' : ''}. Small steps only count when they are dated.`;
  else if (weak.flags.includes('vague')) s = `“${weak.vague}” is doing a lot of work in your answer to “${qtext}”. Swap it for the exact thing.`;
  else if (weak.flags.includes('echo')) s = `Your answer to “${qtext}” mostly repeats the question. Say it as if to a friend who was absent.`;
  else s = `Your answer to “${qtext}” is the thinnest. One concrete detail (a number, a name, an example) would lift it.`;
  if (phrase) s = `${phrase} ${s}`;
  out.stretch = s;
  out.question = PROBES[weak.id];

  // competencies: tagged versus evidenced
  const seen = detectCompetencies(all);
  const tagged = (entry.competencies||[]).map(t => COMPETENCIES.find(c=>c.id===t.id)).filter(Boolean);
  const taskHeavy = TASKWORDS.filter(k => all.toLowerCase().includes(k)).length >= 2 && !seen.length;
  if (!tagged.length && seen.length){
    const top = seen[0].c; out.competency = `This reads like ${top.name.toLowerCase()}: ${top.plain} Tag it if you agree, and add one line on how it showed.`;
  } else if (!tagged.length){
    out.competency = taskHeavy ? 'You have told me what the task was. Now tell me what you did with your mind: how you worked it out, how you got unstuck, who you explained it to. That is where the competencies live.' : 'Which competency did this stretch? Pick one and say where in your answers it shows.';
  } else {
    const evidenced = tagged.filter(c => seen.some(s => s.c.id === c.id));
    if (evidenced.length){ const c = evidenced[0]; const hit = seen.find(s=>s.c.id===c.id).hits[0]; out.competency = `You named ${c.name.toLowerCase()} and your writing shows it (“${hit.trim()}”). ${c.probe}`; }
    else { const c = tagged[0]; out.competency = `You tagged ${c.name.toLowerCase()}, but I cannot yet see the moment it happened. ${c.probe}`; }
  }
  // success criteria connection for ACT
  if (entry.kind === 'act' && cls && Array.isArray(cls.criteria) && cls.criteria.length){
    const low = all.toLowerCase(); const hit = cls.criteria.find(c => tokens(c).filter(w=>w.length>4).some(w => low.includes(w)));
    out.stretch += hit ? ` Good: this links to the success criterion “${hit}”.` : ` Your teacher’s success criteria are listed in this class; quote the one this feedback sits under.`;
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
    competency:{type:'string', description:'Nudge from task talk to competency talk: name the E21CC competency the entry shows or could show, and ask for the moment. Under 60 words.'},
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
            why:{type:'string', description:'Why these words show this competency, using MOE’s definition, addressed to the student. Under 30 words.'}
          }, required:['id','strength','quote','why']}},
        suggested:{type:'array', description:'Up to two ids from the evidence list that the student should tag.', items:{type:'string', enum:COMPETENCY_IDS}},
        tagged_not_shown:{type:'array', description:'Ids the student tagged that the writing does not evidence.', items:{type:'string', enum:COMPETENCY_IDS}},
        probe:{type:'string', description:'One question that would make one competency visible in writing. Under 30 words.'},
        probe_for:{type:'string', enum:COMPETENCY_IDS}
      }, required:['stance','stance_note','evidence','suggested','tagged_not_shown','probe','probe_for']}
  },
  required:['gift','stretch','question','competency','depth','e21cc']
};
function coachSystem(cls){
  const v = (cls && cls.voice) || {};
  const lines = [
    'You are a reflective learning coach for a Singapore secondary school student (age 13 to 17) at Beatty Secondary School. The student has written a learning log entry using one of two school frameworks.',
    'GROW by reflecting (after a lesson): G Gift yourself success (What is one thing I understand from the lesson? How would I teach/explain this to a friend?), R Rise above with small steps (What is one thing I do not yet understand? What will I do to improve?), O Own your knowledge (What is one real-life example? How have I taught/shared this with a friend or family?), W Watch for what comes next (What do I already know about the next topic? What is coming up at the next lesson?).',
    'ACT on Feedback: A Acknowledge (How do I feel about the feedback? How might the feedback help me learn better?), C Connect (How does this connect with the success criteria and/or my goals? How does this connect with previous feedback?), T Test (What habit do I need to adjust and what is one thing I will do differently? How will I know I am improving?).',
    'Competency lens (MOE 21st Century Competencies, 2023 refresh). Use these exact names and read the entry against MOE’s definitions.\n' + DOMAINS.map(d => d.name + ': ' + COMPETENCIES.filter(c => c.d === d.id).map(c => `${c.name} [id ${c.id}]: ${c.moe || c.plain}`).join(' | ')).join('\n'),
    'Competency read rules. Evidence must be a verbatim phrase from the student’s answers; never paraphrase, never invent. glimpse = a word or phrase hints at the competency with no specific moment; clear = a specific moment in the student’s words shows it, with a detail; strong = the moment plus how or why, or the competency drives the next step. At most four competencies, strongest first, and none where no phrase supports it. Stance: task = the entry describes what the task or lesson was, marks, or finishing, without how or why; mixed = some how or why; competency = the entry is about how the student thought, worked or related, with reasons. tagged_not_shown lists tags the student chose that the writing does not evidence. suggested lists up to two ids from the evidence the student should tag. The probe asks for the missing moment for one competency.',
    'Your job: help the student reflect more deeply and shift from describing the task to noticing how they learned and which competency they used. Never write the reflection for them. Quote their own words. No praise inflation: one honest gift, one stretch, one question. Plain English, short sentences, no jargon, no emoji. Do not mention marks or grades unless the student did. Do not use hyphens or dashes as punctuation; use commas, semicolons or colons.',
    'Depth: surface = general words, no specifics, no dated next step; working = specific in places; deep = specific, honest, with a next step that has an action, a time and a place.'
  ];
  if (cls){
    lines.push(`Class context: subject ${cls.subject || 'unspecified'}${cls.level ? ', ' + cls.level : ''}. Teacher: ${cls.teacherName || 'the teacher'}.`);
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
  const fw = FRAMEWORKS[entry.kind];
  const lines = [`Framework: ${fw.name}. Subject: ${entry.subject || 'unspecified'}. Topic: ${entry.topic || 'unspecified'}.`];
  if (entry.kind === 'act' && entry.feedbackText) lines.push(`The feedback received (from ${entry.feedbackFrom || 'teacher'}): ${entry.feedbackText}`);
  for (const s of fw.steps) for (const q of s.qs) lines.push(`${s.letter}: ${q.q.replace(/<[^>]+>/g,'')}\n${entry.answers[q.id] || '(blank)'}`);
  const tags = (entry.competencies||[]).map(t => { const c = COMPETENCIES.find(x=>x.id===t.id); const l = LEVELS.find(x=>x.n===t.level); return c ? `${c.name} (${l ? l.label : ''})` : null; }).filter(Boolean);
  lines.push('Competencies the student tagged: ' + (tags.length ? tags.join('; ') : 'none'));
  return lines.join('\n\n');
}

/* ---------- the competency read (E21CC) ---------- */
const PROCESS = ['because','realised','realized','noticed','tried','changed','explained','asked','checked','compared','decided','planned','worked out','figured','instead','next time','i think','i wonder','i felt','so that','which means','i chose','i tested'];
function sentencesOf(text){ return (text||'').split(/(?<=[.!?])\s+|\n+/).map(x => x.trim()).filter(Boolean); }
function entryAnswersText(entry){ const fw = FRAMEWORKS[entry.kind]; return fw.steps.flatMap(st => st.qs).map(q => entry.answers[q.id] || '').filter(t => t.trim()).join('\n'); }
function builtinE21cc(entry){
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
    const why = (strength === 'strong' ? 'A specific moment, and you say how or why: that is ' : strength === 'clear' ? 'A specific moment in your words shows ' : 'A word points at ') + c.name.toLowerCase() + ', as MOE describes it.';
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
  return {source:'builtin', at:Date.now(), stance, stance_note: STANCES[stance].help, evidence: top, suggested, tagged_not_shown, probe: pc ? pc.probe : '', probe_for};
}
/* The model's read, checked: ids must exist, quotes must actually appear in the
   student's words (a quote that does not is hidden, the reasoning kept). */
function normaliseE21cc(entry, raw, source){
  if (!raw || typeof raw !== 'object') return builtinE21cc(entry);
  const norm = t => String(t||'').toLowerCase().replace(/[“”"]/g,'').replace(/\s+/g,' ').trim();
  const all = norm(entryAnswersText(entry));
  const ok = id => COMPETENCIES.some(c => c.id === id);
  const evidence = (Array.isArray(raw.evidence) ? raw.evidence : []).filter(x => x && ok(x.id) && ['glimpse','clear','strong'].includes(x.strength)).slice(0,4).map(x => {
    const q = String(x.quote||'').trim().replace(/[.!?]+$/,''); const found = q.length > 2 && all.includes(norm(q));
    // a claim the model cannot anchor in the student's words counts only as a glimpse
    return {id:x.id, strength: found ? x.strength : 'glimpse', quote: found ? q : '', why: String(x.why||'').slice(0,240), unverified: !found};
  });
  const stance = ['task','mixed','competency'].includes(raw.stance) ? raw.stance : 'mixed';
  const tagged = (entry.competencies||[]).map(t => t.id);
  return {source, at:Date.now(), stance, stance_note: String(raw.stance_note || STANCES[stance].help).slice(0,240), evidence,
    suggested: (Array.isArray(raw.suggested) ? raw.suggested : []).filter(id => ok(id) && !tagged.includes(id)).slice(0,2),
    tagged_not_shown: (Array.isArray(raw.tagged_not_shown) ? raw.tagged_not_shown : []).filter(id => ok(id) && tagged.includes(id)),
    probe: String(raw.probe||'').slice(0,240), probe_for: ok(raw.probe_for) ? raw.probe_for : (evidence[0] ? evidence[0].id : 'critical')};
}
function e21ccSummary(x){
  if (!x) return '';
  const nameOf = id => (COMPETENCIES.find(c => c.id === id) || {name:id}).name;
  const ev = (x.evidence||[]).map(e => `${nameOf(e.id)} (${e.strength})`).join(', ');
  return `Stance: ${STANCES[x.stance] ? STANCES[x.stance].label : x.stance}. Coach saw: ${ev || 'nothing specific yet'}${x.tagged_not_shown && x.tagged_not_shown.length ? '. Tagged but not shown: ' + x.tagged_not_shown.map(nameOf).join(', ') : ''}.`;
}
