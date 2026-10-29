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
  when:'after a learning experience', verb:'Reflect on a learning experience',
  steps:[
    {k:'g', letter:'G', title:'<em>Gift</em> yourself success', colour:'navy',
      qs:[{id:'g1', q:'What is one thing I understand from this learning experience?'},
          {id:'g2', q:'How would I teach/explain this to a friend?'}]},
    {k:'r', letter:'R', title:'<em>Rise</em> above with small steps', colour:'navy',
      qs:[{id:'r1', q:'What is one thing I do not <em>yet</em> understand?'},
          {id:'r2', q:'What will I do to improve?', next:true}]},
    {k:'o', letter:'O', title:'<em>Own</em> your knowledge', colour:'navy',
      qs:[{id:'o1', q:'What is one real-life example or application?'},
          {id:'o2', q:'How have I taught/shared this with a friend or family?'}]},
    {k:'w', letter:'W', title:'<em>Watch</em> for what comes next', colour:'navy',
      // v3 asks what is coming first, then what the student knows or expects of it.
      // The ids keep their meaning, so earlier entries read the same: w2 is what comes next, w1 what I know.
      qs:[{id:'w2', q:'What is coming up next?'},
          {id:'w1', q:'What do I already know about it, or expect from it?'}]},
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
  o1:'Where did you actually see this, or where could you use it, outside class? Be specific about the place.',
  o2:'Who did you tell, and what did they ask you back?',
  w1:'What do you already know that will help? If nothing yet, what do you expect it to be? Name one idea.',
  w2:'Check your timetable, the scheme of work or your CCA schedule: what exactly is coming up next?',
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

/* Help beside each guiding question, opened from its (i): what the question is asking,
   what a strong answer has, and three short examples from other places, so a student
   sees the shape of an answer without anything to copy. */
const QHELP = {
  g1:{asks:'Name one thing that now makes sense to you, and say it in your own words.',
    strong:['One idea, not a list of topics', 'Your own words, not the slides’', 'A reason or a detail that shows you get it'],
    ex:[['Mathematics', 'I understand that I can make one letter disappear in simultaneous equations by adding or subtracting the two equations.'],
      ['Football', 'I understand why we pass back to the defender: it keeps the ball safe while the others move into space.'],
      ['Sec 1 camp', 'I understand that a team moves faster when one person reads the map and the others carry, because no one does two jobs.']]},
  g2:{asks:'Show how you would help someone else understand it.',
    strong:['Who you would explain it to', 'What you would say or show first', 'An example, a drawing or a step they could try'],
    ex:[['Science', 'I would ask my friend to rub a balloon on their hair and hold it near bits of paper, then explain that the charges pull the paper up.'],
      ['Choir', 'I would show my friend where to breathe by marking a tick on the score after every second line.'],
      ['English', 'I would give my friend two openings for a story, ask which one makes them want to read on, then explain why.']]},
  r1:{asks:'Point to the exact place where it stops making sense.',
    strong:['One specific thing, not “everything”', 'Where it goes wrong: which step, word or kind of question', 'The word yet: you will get there'],
    ex:[['Mathematics', 'I do not yet understand when to use the sine rule instead of the cosine rule. I mix them up when the angle is not between the two sides.'],
      ['Basketball', 'I do not yet understand when to cut to the basket. I wait too long and the defender closes the gap.'],
      ['History', 'I do not yet understand how to judge if a source is reliable. I keep saying it is reliable just because it is a primary source.']]},
  r2:{asks:'Make a small plan you can really carry out.',
    strong:['One action, not “study harder”', 'When and where you will do it', 'How long, or how you will know it is done'],
    ex:[['Chemistry', 'On Monday after school, in the library, I will redo the three equations I balanced wrongly, for 20 minutes.'],
      ['Drama club', 'Before Thursday’s rehearsal, I will say my lines aloud twice at home, standing up, the way I will on stage.'],
      ['Geography fieldwork', 'Tonight I will copy my rainfall readings into a table and circle the two days that look odd.']]},
  o1:{asks:'Connect the idea to something real: where you have seen it, or how it could be used.',
    strong:['A real place, thing or person, not “in daily life”', 'How the idea shows up there', 'Something you saw, or a way it could be used'],
    ex:[['Physics', 'The MRT slows down gradually before the platform. That is deceleration, and it stops passengers from falling forward.'],
      ['Food and Consumer Education', 'My mother soaks beans overnight so they cook faster, because the water has already soaked in.'],
      ['Mathematics', 'A phone plan that costs $20 plus 10 cents a minute is a straight line graph. I could use it to show my family which plan is cheaper.']]},
  o2:{asks:'Tell about a real time you shared it, and what happened.',
    strong:['Who you shared it with', 'What you said or showed', 'What they asked or said back'],
    ex:[['Biology', 'I told my younger brother why he should finish his antibiotics, and he asked why the bacteria come back.'],
      ['Robotics', 'I showed a teammate how to fix the sensor reading, and they asked me to write the steps down for the juniors.'],
      ['Literature', 'I read a poem to my grandmother and explained the metaphor. She told me a pantun with the same idea.']]},
  w2:{asks:'Name what is coming next, as exactly as you can.',
    strong:['The real title, topic or event, not “the next chapter”', 'When it is, if you know', 'Where you found out: timetable, scheme of work or teacher'],
    ex:[['Geography', 'Next Tuesday we start the topic on tectonic plates. I saw it on the scheme of work.'],
      ['Netball', 'On Friday we play a friendly match against another school, our first game with the new positions.'],
      ['Art', 'Next week we start lino printing for our coursework.']]},
  w1:{asks:'Say what you already know that will help, or make a prediction. A guess counts.',
    strong:['One thing you know, or one prediction', 'Why you think so', 'What you will look out for to check'],
    ex:[['Geography', 'I already know Japan has many earthquakes, so I expect two plates to meet there. I will look out for a map of plate edges.'],
      ['Netball', 'I expect their centre to be fast, because they won last year. I will watch where their centre runs in the first quarter.'],
      ['Art', 'I have not printed before. I expect the hard part to be cutting in the right direction, so I will ask how to hold the tool.']]},
  a1:{asks:'Name the feeling honestly, then say what in the feedback caused it.',
    strong:['A feeling word: proud, annoyed, confused, relieved', 'What in the feedback made you feel it', 'Feeling bad is fine; say it, then look at what the feedback points to'],
    ex:[['Mathematics', 'I felt frustrated, because I lost marks for the same careless mistake as last time.'],
      ['Dance', 'I felt proud when my instructor said my timing was clean, because I had practised the counts at home.'],
      ['English', 'I felt confused, because the comment said “develop your ideas” and I was not sure what that meant.']]},
  a2:{asks:'Say what the feedback could change in how you learn or work.',
    strong:['The part of the feedback that matters most', 'What it could help you do better', 'Where you will use it next'],
    ex:[['Science', 'The comment about labelling axes will help me in every graph question, not just this practical.'],
      ['Debate', 'Being told to answer the other side first will help me plan my rebuttal before I write my own case.'],
      ['Art', 'The note about tone will make my drawings look less flat, because I will add darker shadows on one side.']]},
  c1:{asks:'Link the feedback to what good work looks like, or to a goal you set.',
    strong:['The criterion or goal, quoted if you can', 'How the feedback fits it', 'Whether you are closer to it, or not yet'],
    ex:[['Literature', 'The criterion says “explain the effect on the reader”. The comment shows I only explained what the quote means.'],
      ['Track and field', 'My goal is to run 2.4 km in under 12 minutes. My coach said I start too fast, which is why I slow down in the last lap.'],
      ['Mother Tongue', 'The rubric asks for a clear opening. The feedback said my opening had no topic sentence, so I have not met it yet.']]},
  c2:{asks:'Compare this feedback with what you were told before.',
    strong:['What you were told before, and when', 'Whether this is the same point, a new one, or progress', 'If it keeps coming back, what gets in the way'],
    ex:[['Mathematics', 'Last term I was told to show my working. This time I did, and the comment was about units instead, so that is progress.'],
      ['Band', 'My section leader told me again that I rush the rests. It is the third time, so counting in my head is not working.'],
      ['History', 'Last essay I was told to use more evidence. This time I had evidence but did not explain it, which is a new point.']]},
  t1:{asks:'Name one habit to change, and the new thing you will do instead.',
    strong:['One habit, named honestly', 'What you will do instead, and when you will start', 'Small enough to do this week'],
    ex:[['Physics', 'I rush the last questions. In the next test I will check the clock halfway and move on from any question after two minutes.'],
      ['Badminton', 'I stand still after each shot. At Wednesday’s training I will move back to the centre after every return.'],
      ['Chinese', 'I skip words I do not know. This week I will write each new word in my notebook with one sentence.']]},
  t2:{asks:'Say what you will look at to check that the change is working.',
    strong:['Something you can see or count', 'When you will check', 'What would count as better'],
    ex:[['Mathematics', 'In two weeks I will count the careless mistakes in my next worksheet and compare them with this one.'],
      ['Swimming', 'At the end of the month I will time my 50 m and see if it drops below 40 seconds.'],
      ['English', 'I will ask a friend to read my next composition and point to the sentence they found clearest.']]},
  x1:{asks:'Look back at this term’s entries and name what you can now do.',
    strong:['Something you can do now that you could not before', 'An entry you can point to, with your own words', 'Where you did it'],
    ex:[['Across subjects', 'In my Science and Geography entries I explained graphs in my own words. In Term 1 I only copied the numbers.'],
      ['CCA', 'My entries show I now speak up in team huddles. In March I only listened.'],
      ['Camp', 'My camp entry shows I can plan a task with others: I wrote that we split the jobs before we started.']]},
  x2:{asks:'Name where you are still stuck, and what stops you.',
    strong:['One area, named exactly', 'What gets in the way: time, the skill, the place or the people', 'Honest, without blaming yourself'],
    ex:[['Mathematics', 'I still get stuck on word problems. I panic when the question is long, so I do not read it properly.'],
      ['Choir', 'I still miss my entries in new songs. I practise alone, so I never hear the other parts.'],
      ['Group projects', 'I still find it hard to share work fairly. I end up doing it myself because asking feels awkward.']]},
  x3:{asks:'Plan one thing to try next term, and where you will try it.',
    strong:['One thing to try', 'Where: a subject, a CCA or an event', 'How you will know it worked'],
    ex:[['Mathematics', 'Next term I will underline the key numbers in every word problem before I start. It worked if I finish them all.'],
      ['Choir', 'I will practise with a recording of the other parts, and check at the next run through whether I come in on time.'],
      ['Science project', 'I will suggest we split the tasks on day one, and see whether everyone does a share.']]}
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
/* A whole word or phrase, so "ok" is not found inside "textbook". */
function hasPhrase(low, v){ return new RegExp('(^|[^a-z])' + v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z])').test(low); }
function scoreAnswer(q, text){
  const t = (text||'').trim(); const low = t.toLowerCase(); const w = tokens(t);
  const r = {id:q.id, words:w.length, score:0, flags:[]};
  if (!w.length){ r.score = -2; r.flags.push('empty'); return r; }
  if (w.length < 4){ r.score = -2; r.flags.push('thin'); if (VAGUE.some(v => hasPhrase(low, v))) r.vague = VAGUE.find(v => hasPhrase(low, v)); return r; }
  if (w.length >= 12) r.score += 1; if (w.length >= 28) r.score += 1;
  if (/\d/.test(t) || /"[^"]{3,}"|“[^”]{3,}”/.test(t) || /\b[A-Z][a-z]{2,}\b/.test(t.replace(/^\s*\w/, ''))){ r.score += 1; r.flags.push('specific'); }
  if (REASONS.some(k => low.includes(k))){ r.score += 1; r.flags.push('reasoned'); }
  const vague = VAGUE.filter(v => hasPhrase(low, v));
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

/* ---------- what counts as a response ----------
   empty: nothing written. thin: one to three words, or only "idk", "ok" and
   the like. answered: anything more. Nothing is said about an empty answer,
   and nothing is praised that is not there. */
const THIN_ONLY = ['idk','i dont know',"i don't know",'dont know',"don't know",'dunno','no idea','not sure','ok','okay','nothing','nil','na','n a','no','yes','none','same','same as above','-','.','?'];
function answerStatus(text){
  const t = String(text || '').trim(); if (!t) return 'empty';
  const low = t.toLowerCase().replace(/[.!?,]+$/, '').trim();
  if (THIN_ONLY.includes(low) || tokens(t).length < 4) return 'thin';
  return 'answered';
}
function answerStatuses(entry){ const fw = FRAMEWORKS[entry.kind]; return fw.steps.flatMap(s => s.qs).map(q => ({qid:q.id, status:answerStatus((entry.answers || {})[q.id])})); }
function hasAnyAnswer(entry){ return !!entry && Object.values(entry.answers || {}).some(v => String(v || '').trim()); }
const NOTHING_LINE = 'Nothing is written yet, so there is nothing to give feedback on.';
const EMPTY_LINE = 'Nothing to respond to here.';
/* The plan question in each framework: the behaviour the coach nudges is following through on it. */
const PLAN_Q = {grow:'r2', act:'t1', across:'x3'};
function planOf(e){ return e && (e.answers || {})[PLAN_Q[e.kind]] || ''; }
/* A first, small door for a thin answer. */
const DOORS = {
  g1:'What is one word or idea from this learning experience that you remember?', g2:'Who would you explain it to, and what would you say first?',
  r1:'Which question or step made you stop?', r2:'What is one small thing you could do this week, and on which day?',
  o1:'Where have you seen or used anything like this outside class, even something small?', o2:'Who at home could you tell one thing about it?',
  w1:'What do you think it will be about? A guess is fine.', w2:'What is the next thing on your timetable or schedule for this?',
  a1:'Which one word fits how you felt about the feedback?', a2:'Which part of the feedback would you try first?',
  c1:'Which success criterion is closest to this feedback?', c2:'Have you had feedback like this before? When?',
  t1:'What is one small habit you could change first?', t2:'What would you look at to see if you are improving?',
  x1:'Which one entry from this term are you most pleased with?', x2:'Which moment this term was hardest?', x3:'Where next term could you try one thing again?'
};
/* Sentence frames: blanks only, never the student's content. */
const FRAMES = {
  g1:'Today I understood that ___, because ___.', g2:'I would explain it to a friend by ___, starting with ___.',
  r1:'I am not sure yet about ___. It goes wrong when ___.', r2:'On ___ (day), at ___ (place), I will ___ for ___ minutes.',
  o1:'I saw or used this outside class when ___, because ___.', o2:'I told ___ about ___, and they asked ___.',
  w1:'I already know ___, so I expect it to ___.', w2:'Coming up next is ___. I will look out for ___.',
  a1:'When I got the feedback I felt ___, because ___.', a2:'This feedback could help me ___ next time, by ___.',
  c1:'This feedback is about the success criterion ___, because ___.', c2:'Last time I was told ___. This time ___.',
  t1:'I will change ___ to ___. I will start on ___, at ___.', t2:'In two weeks I will check ___ to see whether ___.',
  x1:'This term I could ___ in ___, which I could not do before.', x2:'I got stuck when ___, because ___.', x3:'Next term, in ___, I will try ___, and I will know it worked if ___.'
};
/* Models from other subjects, so there is nothing to copy. Two per question; the one whose subject differs from the entry's is used. */
const MODELS = {
  g1:[['Geography','I understood that a flood happens when rain falls faster than the drains can carry it away, because the ground is already full of water.'],['Music','I understood that a chord sounds sad when the middle note is lowered, because the gap between the notes gets smaller.']],
  g2:[['History','I would show my friend two newspaper headlines from the same day and ask which one is more likely to be true.'],['PE','I would ask my friend to try the pass first, then show them where to place their standing foot.']],
  r1:[['Art','I am not sure yet how to show distance in a drawing. It goes wrong when I draw the far trees the same size as the near ones.'],['Literature','I am not sure yet how to explain a quote. It goes wrong when I only say what it means, without the effect on the reader.']],
  r2:[['Mother Tongue','On Wednesday, at the library after school, I will write five new words in sentences for 15 minutes.'],['Physics','On Thursday, at my desk after dinner, I will redo two motion graph questions for 20 minutes.']],
  o1:[['Science','I saw this at the hawker centre when the uncle stirred the soup to cool it faster, because moving it spreads the heat.'],['Mathematics','I saw this in a bus timetable, because the buses come every 12 minutes, which is a pattern I can predict.']],
  o2:[['Geography','I told my grandmother about rising sea levels, and she asked whether East Coast Park would be safe.'],['Art','I told my brother about warm and cool colours, and he asked why his room feels cold.']],
  w1:[['Chemistry','I already know particles move faster when heated, so I expect the next topic to explain why reactions speed up.'],['English','I already know how to give reasons and examples, so I expect the debate to ask me to answer the other side too.']],
  w2:[['History','Coming up next is the merger. I will look out for the reasons each side gave.'],['Biology','Coming up next is enzymes. I will look out for why temperature matters.']],
  a1:[['Art','When I got the feedback I felt annoyed, because I had spent a long time on the shading.'],['Mathematics','When I got the feedback I felt relieved, because now I know why I keep losing marks on units.']],
  a2:[['Literature','This feedback could help me write fuller paragraphs next time, by adding the effect on the reader after each quote.'],['Science','This feedback could help me score my practical next time, by labelling every axis with units.']],
  c1:[['Geography','This feedback is about the success criterion "use data to support a point", because I did not quote any numbers.'],['Music','This feedback is about the success criterion "keep a steady beat", because I sped up in the chorus.']],
  c2:[['English','Last time I was told my paragraphs were too long. This time the feedback was about weak topic sentences.'],['Physics','Last time I was told to show my working. This time I showed it, but I forgot the units.']],
  t1:[['Mother Tongue','I will change reading only the first line to reading the whole question. I will start on Monday, at my desk.'],['History','I will change copying the source to explaining it in my own words. I will start on Tuesday, in class.']],
  t2:[['English','In two weeks I will check my next two essays to see whether each paragraph has a clear topic sentence.'],['Mathematics','In two weeks I will check my quiz corrections to see whether the same kind of mistake comes back.']],
  x1:[['Science','This term I could plan a fair test on my own in Science, which I could not do before.'],['PE','This term I could call for the ball early in games, which I could not do before.']],
  x2:[['Mathematics','I got stuck when word problems had two steps, because I rushed to the first number I saw.'],['Art','I got stuck when the colours turned muddy, because I mixed too many at once.']],
  x3:[['Geography','Next term, in fieldwork, I will try writing my observations as I go, and I will know it worked if my report has real numbers.'],['Music','Next term, in band practice, I will try counting the rests aloud, and I will know it worked if I come in on time.']]
};
function modelFor(qid, entry){ const m = MODELS[qid] || []; const subj = String((entry && entry.context && entry.context.name) || '').toLowerCase(); const pickM = m.find(x => x[0].toLowerCase() !== subj) || m[0]; return pickM ? `For example, in ${pickM[0]}: ${pickM[1]}` : ''; }

/* ---------- the built in coach: the same policy as the AI, offline ---------- */
function builtinCoach(entry, cls, profile){
  const fw = FRAMEWORKS[entry.kind]; const qs = fw.steps.flatMap(s => s.qs);
  const answers = answerStatuses(entry); const st = id => (answers.find(a => a.qid === id) || {}).status;
  const out = {source:'builtin', depth:'surface', gift:'', stretch:'', question:'', competency:'', answers, stretch_qid:'', stretch_flag:'', follow_through:{status:'none', note:''}, scaffold:{level:1, frame:'', model:''}, content_check:''};
  if (!hasAnyAnswer(entry)){ out.nothing = true; return out; }
  const scores = qs.map(q => scoreAnswer(q, entry.answers[q.id]));
  const real = scores.filter(s => st(s.id) === 'answered'); const thin = scores.filter(s => st(s.id) === 'thin');
  const all = qs.map(q => entry.answers[q.id] || '').join('\n');
  const voice = (cls && cls.voice) || {}; const phrase = pick(voice.phrases, entry.id);
  const mean = real.length ? real.reduce((a, s) => a + s.score, 0) / real.length : -1;
  const nextQ = qs.find(q => q.next); const nextS = scores.find(s => s.id === nextQ.id);
  const nextOk = nextS && nextS.hasTime && nextS.hasAction;
  // depth counts what is there and how much of the entry is there
  out.depth = (mean >= 1.6 && nextOk && real.length >= qs.length - 1) ? 'deep' : (mean >= 0.6 && real.length >= qs.length / 2 ? 'working' : 'surface');
  // follow through on the last plan comes first: it is the behaviour being built
  const ft = entry.followThrough && profile && profile.plans && profile.plans[0] && entry.followThrough.eid === profile.plans[0].eid ? entry.followThrough : null;
  if (ft) out.follow_through = {status:ft.answer === 'yes' ? 'done' : ft.answer === 'partly' ? 'partly' : 'not_done', note:''};
  else if (profile && profile.plans && profile.plans.length) out.follow_through = {status:'unclear', note:''};
  // gift: one true strength from the words, named by what it shows; never for an empty or thin answer alone
  const x = builtinE21cc(entry, []); const k = (x.ksvd || []).find(v => v.strength !== 'glimpse') || null; const item = k ? ksvdById(coreSet(), k.id) : null;
  const best = real.slice().sort((a, b) => b.score - a.score)[0];
  if (ft && ft.answer === 'yes') out.gift = `You followed through on last time’s plan: “${profile.plans[0].text}”. You said you would, and you did.`;
  else if (item) out.gift = `“${fragment(k.quote, 110)}”. This shows ${item.label.toLowerCase()}: ${item.plain.replace(/^You /, 'you ')}`;
  else if (best){ const QWHY = {r1:'you said exactly where you got stuck, so you know what to work on', a1:'you said how you felt, then thought about how the feedback can help', o1:'you linked the idea to real life', o2:'you explained it to someone else', c1:'you linked the feedback to the success criteria', c2:'you compared it with feedback you had before', w1:'you thought ahead about what is coming next'};
    const why = QWHY[best.id] || (best.flags.includes('reasoned') ? 'you gave a reason' : best.flags.includes('specific') ? 'you gave a specific example' : 'you wrote it in your own words');
    out.gift = `“${fragment(entry.answers[best.id], 110)}”. This is useful because ${why}.`; }
  // stretch: the weakest answer that has something in it; empty answers get nothing
  const pool = real.concat(thin);
  let weak = thin[0] || real.slice().sort((a, b) => a.score - b.score)[0];
  if (nextS && st(nextQ.id) !== 'empty' && !nextOk && !thin.length) weak = nextS;
  const weakQ = qs.find(q => q.id === weak.id); const qtext = weakQ.q.replace(/<[^>]+>/g, ''); const said = String(entry.answers[weak.id] || '').trim();
  let s = '', flag = '';
  if (st(weak.id) === 'thin'){ flag = 'thin'; s = `You wrote “${said}” for “${qtext}”. Add one detail to it.`; out.question = DOORS[weak.id] || PROBES[weak.id]; }
  else {
    if (weak.flags.includes('notime') || weak.flags.includes('noaction')){ flag = !weak.hasTime ? 'notime' : 'noaction'; s = `Your plan (“${fragment(said, 60)}”) needs ${!weak.hasAction ? 'the exact thing you will do' : ''}${!weak.hasAction && !weak.hasTime ? ' and ' : ''}${!weak.hasTime ? 'a day and a place' : ''}. Then you will know exactly when to do it.`; }
    else if (weak.flags.includes('vague')){ flag = 'vague'; s = `In your answer to “${qtext}”, the word “${weak.vague}” is too general. Replace it with exactly what you mean.`; }
    else if (weak.flags.includes('echo')){ flag = 'echo'; s = `Your answer to “${qtext}” mostly repeats the question. Explain it as you would to a friend who was not there.`; }
    else { flag = 'short'; s = `Your answer to “${qtext}” is the shortest. Add one detail, such as a number, a name or an example.`; }
    out.question = PROBES[weak.id];
  }
  if (ft && ft.answer !== 'yes') s = (ft.answer === 'partly' ? `You did part of last time’s plan. What stopped the rest? ` : `Last time’s plan did not happen, and that is fine. What got in the way? `) + `Make this week’s plan smaller: one task, one day, one place. ` + s;
  if (phrase) s = `${phrase} ${s}`;
  out.stretch = s; out.stretch_qid = weak.id; out.stretch_flag = flag;
  // scaffold: as much help as this student needs on this question, and no more
  const lv = Math.min(2, (profile && profile.scaffold && profile.scaffold[weak.id]) || 1);
  out.scaffold = {level:lv, frame:lv >= 2 ? (FRAMES[weak.id] || '') : '', model:''};
  // competency: what the words show, and what would make it more visible
  const seen = (x.evidence || []).filter(v => v.strength !== 'glimpse');
  const taskHeavy = TASKWORDS.filter(w => all.toLowerCase().includes(w)).length >= 2 && !seen.length;
  // an entry about the task alone is asked for the how first, whatever a keyword suggests
  if (x.stance === 'task') out.competency = 'You have written about what the task was. Now write about how you did it: how you worked it out, what you did when you were stuck, who you explained it to. This is where the competencies show.';
  else if (seen.length){ const c = compOf(seen[0].id); out.competency = `Your words show ${c.label.toLowerCase()}. ${c.probe}`; }
  else out.competency = taskHeavy ? 'You have written about what the task was. Now write about how you did it: how you worked it out, what you did when you were stuck, who you explained it to. This is where the competencies show.' : 'Add one moment where you made a choice, worked with someone or connected the idea to something else. That is where a competency shows.';
  if (entry.kind === 'act' && cls && Array.isArray(cls.criteria) && cls.criteria.length){
    const low = all.toLowerCase(); const hit = cls.criteria.find(c => tokens(c).filter(w => w.length > 4).some(w => low.includes(w)));
    out.competency += hit ? ` This links to the success criterion “${hit}”.` : ` Look at your teacher’s success criteria and quote the one this feedback is about.`;
  }
  return out;
}
/* Help while writing, offline: a question, then a frame, then a model from another subject. */
function stuckOffline(entry, qid, presses){
  const said = answerStatus((entry.answers || {})[qid]);
  const question = said === 'empty' || said === 'thin' ? (DOORS[qid] || PROBES[qid]) : (PROBES[qid] || DOORS[qid]);
  return {level:Math.min(3, presses), question, frame:presses >= 2 ? (FRAMES[qid] || '') : '', model:presses >= 3 ? modelFor(qid, entry) : ''};
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
        probe_for:{type:'string', enum:COMPETENCY_IDS},
        ksvd:{type:'array', description:'Knowledge, skills, values and dispositions the answers show, at most six, strongest first. Use only ids from the map. Each needs the student’s verbatim words; a thin answer gives at most a glimpse; an empty answer gives nothing.',
          items:{type:'object', additionalProperties:false, properties:{
            id:{type:'string', description:'An id from the map, such as ct1.s2.'},
            quote:{type:'string', description:'The student’s exact words, copied verbatim, under 25 words.'},
            strength:{type:'string', enum:['glimpse','clear','strong']}
          }, required:['id','quote','strength']}}
      }, required:['stance','stance_note','evidence','suggested','tagged_not_shown','probe','probe_for','ksvd']},
    answers:{type:'array', description:'Every guiding question id in the entry, with its status: empty (nothing written), thin (one to three words, or only idk, ok, not sure), answered.',
      items:{type:'object', additionalProperties:false, properties:{qid:{type:'string'}, status:{type:'string', enum:['empty','thin','answered']}}, required:['qid','status']}},
    stretch_qid:{type:'string', description:'The guiding question id the stretch is about. Never an empty answer.'},
    follow_through:{type:'object', additionalProperties:false, description:'Follow through on the most recent plan in the profile.', properties:{
      status:{type:'string', enum:['done','partly','not_done','unclear','none']},
      note:{type:'string', description:'One sentence to the student about the plan, or an empty string. Under 30 words.'}}, required:['status','note']},
    scaffold:{type:'object', additionalProperties:false, description:'Help at the level the profile gives for stretch_qid, never higher.', properties:{
      level:{type:'integer', description:'1, 2 or 3.'},
      frame:{type:'string', description:'Level 2 or 3: one sentence frame with blanks written as ___, with none of the student’s content. Otherwise an empty string.'},
      model:{type:'string', description:'Level 3 only: one or two sentences about a different subject, beginning “For example, in”. Otherwise an empty string.'}}, required:['level','frame','model']},
    content_check:{type:'string', description:'An empty string, unless a likely content misconception shows: then one question that sends the student to their teacher. Never state the correct content.'}
  },
  required:['gift','stretch','question','competency','depth','e21cc','answers','stretch_qid','follow_through','scaffold','content_check']
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
/* The knowledge, skills, values and dispositions map, as the coach reads it. */
function ksvdMapText(set){
  set = set || coreSet();
  return COMPETENCIES.map(c => { const items = ksvdFor(set, c.id); return items.length ? `${c.label}: ` + items.map(it => `[${it.id}] ${it.label} (${KSVD_NAME[it.type].toLowerCase()})`).join('; ') : ''; }).filter(Boolean).join('\n');
}
/* The coach's instructions. One set for every model: Gemini for testing, the
   school relay, Chrome's built in AI and the preview. */
function coachSystem(cls, stmts, tone, set){
  const v = (cls && cls.voice) || {};
  const lines = [
    'You are the coach inside the E21CC Log of a Singapore secondary school student (age 12 to 17) at Beatty Secondary School. The Log holds journals: GROW entries after any learning experience (a lesson, a training, a camp day, an event), and ACT entries after feedback. A third kind, Look across, is the student’s termly look at one area of competencies. You write like a caring secondary school teacher who coaches for success. Your job: build the student’s confidence and competence from what they actually wrote, and nudge one useful behaviour. You never write the reflection for them.',
    'GROW by reflecting (after a learning experience): G Gift yourself success (g1 What is one thing I understand from this learning experience? g2 How would I teach/explain this to a friend?), R Rise above with small steps (r1 What is one thing I do not yet understand? r2 What will I do to improve?), O Own your knowledge (o1 What is one real-life example or application? o2 How have I taught/shared this with a friend or family?), W Watch for what comes next (w2 What is coming up next? then w1 What do I already know about it, or expect from it? An honest prediction counts as an answer to w1).',
    'ACT on Feedback: A Acknowledge (How do I feel about the feedback? How might the feedback help me learn better?), C Connect (How does this connect with the success criteria and/or my goals? How does this connect with previous feedback?), T Test (What habit do I need to adjust and what is one thing I will do differently? How will I know I am improving?).',
    'How confidence is built. Confidence grows from evidence of the student’s own success, so start from something real in their words and name it precisely. Credit the strategy and the effort (“you checked both readings”), never the person (“you are smart”). Never inflate: a short answer earns a small, true observation and no praise. If something is not in the words, do not say it is. Feedback about the task and the process helps; feedback about the person does not.',
    'Where the student is. The message starts with a block headed “Where this student is”. Read it before the entry, and use all of it: the Sec level and band (Lower Sec is Sec 1 and 2, Upper Sec is Sec 3 to 5); the subject level (G1, G2 or G3) for this entry; the writing stage of each guiding question (starting, developing, confident); what the student has shown clearly before; the statements under way and what each still needs; the last plans and whether they were done; the last stretch and whether this entry acts on it; and the scaffold level for each question. Meet the student where they are: ask for one step beyond their stage, never three. At starting, ask for one concrete detail. At developing, ask for a reason or a specific moment. At confident, ask for transfer to a new situation, or a judgement. When the student has shown something clearly before, do not repeat it as their strength unless it is stronger now; look for what is new.',
    'Register by subject level. G1: short concrete sentences, one idea at a time, everyday words. G2: plain sentences, one reason at a time. G3: you may ask for comparison, abstraction and transfer. With no subject level given, use plain sentences. Always plain English that a 13 year old reads easily, with Singapore examples where an example helps.',
    'Read every answer first, and record each guiding question in “answers” with its status: empty when nothing is written; thin when it is one to three words, or only “idk”, “ok”, “not sure”, “nothing” or similar; answered otherwise. An empty answer gets no comment from you at all: do not praise it, do not guess what it might say, and do not build the stretch on it. A thin answer gets no praise; it may get one question that opens a small door (for “idk”: what is one small part you do know?). Draw only from answered and thin answers.',
    'Break the competencies into knowledge, skills, values and dispositions, using only the ids in the map at the end. Knowledge: what the words show the student understands. Skill: what the words show the student did. Value: what an action in the words shows the student cares about; the action is the evidence, and a value word on its own (“I was resilient”) does not count. Disposition: a habit of mind visible in how they went about it. Every item in e21cc.ksvd needs the student’s exact words, copied verbatim, under 25 words, and a strength: glimpse (a hint), clear (a specific moment), strong (a specific moment with how or why). A thin answer gives at most a glimpse. Even a short answer usually shows something small and true: find it, and do not stretch it beyond what is written. Reward specific moments and reasons; competency words used as labels earn nothing. Never name a missing value or disposition as a lack (“you are not resilient”); if it matters, ask a question instead.',
    'Write the feedback in this order. gift: one strength, quoting the student’s words, named by its knowledge, skill, value or disposition label from the map, and why it matters for that competency. stretch: one next step for one answered or thin question, framed as what would make a competency more visible; put that question’s id in stretch_qid. question: one question to answer now, one step beyond their stage. competency: connect the strength and the next step to the I can statement they are working towards, or to the group’s success criteria where given. Anchor every part in the subject content they wrote about (“in your titration practical”), so the content carries the competency; aim every comment at the competency, and never at the content itself.',
    'The behaviour to build is following through on plans. If the profile lists last plans: when the student says the most recent plan was done, or the entry shows it, make that the gift and set follow_through.status to done. Partly done: name the part done, and ask what stopped the rest (partly). Not done: no blame; ask what got in the way, and help them make the next plan smaller (not_done). No sign either way: unclear. No plans yet: none. Every plan the student writes should say what they will do, when and where; if theirs does not, that is the stretch.',
    'Scaffold at the level the profile gives for the question in stretch_qid, and never higher. Level 1: a question only; frame and model are empty strings. Level 2: the question plus one sentence frame with blanks written as ___ (for example “On ___, at ___, I will ___ for ___ minutes.”); the frame never contains the student’s content and never answers for them. Level 3: the question, a frame, and a model of one or two sentences about a different subject or situation, beginning “For example, in”; never a model about their own topic. Help fades: when the profile shows the last stretch was acted on, give less help than last time.',
    'Content is the vehicle for the competencies. If the entry shows a likely misconception in the subject content, put one question in content_check that sends the student to their teacher to check it (“Check with your teacher: does the indicator change colour at the end point, or before it?”). Never state or teach the correct content, and never mark the content right or wrong. Otherwise content_check is an empty string.',
    'Language. Plain English, short sentences, no jargon, no emoji. Do not use hyphens or dashes as punctuation; use commas, semicolons or colons. No slogans, sayings or clever turns of phrase, and never the pattern “X, not Y”. Do not mention marks or grades unless the student did. Say exactly what to do. One gift, one stretch, one question.',
    'Depth: surface = general words, no specifics, no dated next step; working = specific in places; deep = specific, honest, with a next step that has an action, a time and a place.',
    'Competency lens (MOE 21st Century Competencies, 2023 refresh). Use these exact names and read the entry against MOE’s definitions.\n' + DOMAINS.map(d => d.name + ': ' + COMPETENCIES.filter(c => c.d === d.id).map(c => `${c.name} [id ${c.id}]: ${c.moe || c.plain}`).join(' | ')).join('\n'),
    'Competency read rules. Evidence must be a verbatim phrase from the student’s answers; never paraphrase, never invent. glimpse = a word or phrase hints at the competency with no specific moment; clear = a specific moment in the student’s words shows it, with a detail; strong = the moment plus how or why, or the competency drives the next step. At most four competencies, strongest first, and none where no phrase supports it. Stance: task = the entry describes what the task or learning experience was, marks, or finishing, without how or why; mixed = some how or why; competency = the entry is about how the student thought, worked or related, with reasons. tagged_not_shown lists competencies the student claimed that the writing does not evidence. suggested lists up to two ids from the evidence the student should claim. The probe asks for the missing moment for one competency.'
  ];
  if (TONES[tone]) lines.push(TONES[tone].line);
  lines.push('Anchor every part of your feedback in the competencies: say which competency the words show and how, and frame the stretch as what would make a competency more visible.');
  if (stmts && stmts.length) lines.push('I can statements this student is working towards (Beatty’s own, for the student’s band). In e21cc.statements list at most three that this entry backs, each with the student’s verbatim words. Never invent; an empty list is a fine answer.\n' + stmts.map(s => `[${s.id}] (${(compOf(s.comp) || {name:''}).name}${s.strandName ? ', ' + s.strandName : ''}) ${s.text}`).join('\n'));
  lines.push('Knowledge, skills, values and dispositions (the map; use these ids only):\n' + ksvdMapText(set));
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
function entryForCoach(entry, profile){
  const fw = FRAMEWORKS[entry.kind]; const ctx = entry.context || {type:'subject', name: entry.subject};
  const lines = [entry.kind === 'across'
    ? `Framework: Look across (termly synthesis). Basket: ${(basketOf(entry.basket) || {name: entry.basket}).name}. ${termLabel(entry.term || '')}.`
    : `Framework: ${fw.name}. Context: ${contextTypeOf(ctx.type).label}, ${ctx.name || entry.subject || 'unspecified'}. Topic: ${entry.topic || 'unspecified'}.`];
  if (entry.kind === 'act' && entry.feedbackText) lines.push(`The feedback received (from ${entry.feedbackFrom || 'teacher'}): ${entry.feedbackText}`);
  if (entry.kind === 'across' && Array.isArray(entry.lookedAt) && entry.lookedAt.length) lines.push('Evidence the student looked across this term (quotes from earlier entries): ' + entry.lookedAt.map(x => `"${x.quote}"`).join(' | '));
  for (const s of fw.steps) for (const q of s.qs) lines.push(`${s.letter}: ${q.q.replace(/<[^>]+>/g,'')}\n${entry.answers[q.id] || '(blank)'}`);
  const tags = (entry.competencies||[]).map(t => { const c = COMPETENCIES.find(x=>x.id===t.id); const l = LEVELS.find(x=>x.n===t.level); return c ? `${c.name} [id ${c.id}] (${l ? l.label : ''})${t.where ? ', the student points to: "' + t.where + '"' : ''}` : null; }).filter(Boolean);
  lines.push('Competencies the student claims (check each against the words; a claim the student can point to is still only evidenced if the words show it): ' + (tags.length ? tags.join('; ') : 'none'));
  // the profile comes first, but is left out of the hash: a read stays fresh while the student's history grows
  if (profile) lines.unshift(profileBlock(profile));
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
  return {source:'builtin', at:Date.now(), stance, stance_note: STANCES[stance].help, evidence: top, suggested, tagged_not_shown, probe: pc ? pc.probe : '', probe_for, statements, ksvd:ksvdFromCues(entry)};
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
  return {source, at:Date.now(), stance, stance_note: String(raw.stance_note || STANCES[stance].help).slice(0,240), evidence, statements, ksvd:normaliseKsvd(entry, raw.ksvd),
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

/* ---------- the learner profile: where this student is ----------
   Computed on the device from the student's own log. The coach receives a
   summary: no name, no email, and no past answer text except the sentence
   of the last two plans, which it needs to check follow through. */
let CORE_SET = null;
function coreSet(){ return CORE_SET || (CORE_SET = normaliseStatementSet(DEFAULT_STATEMENTS)); }
const STAGE_WORD = {starting:'starting', developing:'developing', confident:'confident'};
function learnerProfile(p, set, entries, forEntry, opts = {}){
  set = set || coreSet(); entries = entries || [];
  const fid = forEntry && forEntry.id; const now = (forEntry && forEntry.created) || Date.now();
  const past = entries.filter(e => e.id !== fid && e.kind !== 'across' && e.created <= now).sort((a, b) => b.created - a.created);
  const band = bandFor(set, p || {});
  const subj = String((forEntry && forEntry.context && forEntry.context.name) || '').trim(); const levels = (p && p.experiences && p.experiences.levels) || {};
  const lk = Object.keys(levels).find(k => k.toLowerCase() === subj.toLowerCase());
  const subjectLevel = lk ? String(levels[lk]) : '';
  // writing stage per guiding question, from the last six entries of that journal
  const stage = {};
  for (const fw of [GROW, ACT]) for (const s of fw.steps) for (const q of s.qs){
    const sc = past.filter(e => e.kind === fw.id).slice(0, 6).map(e => scoreAnswer(q, (e.answers || {})[q.id])).filter(r => !r.flags.includes('empty'));
    if (!sc.length) continue; const m = sc.reduce((a, r) => a + r.score, 0) / sc.length;
    stage[q.id] = m >= 2 ? 'confident' : m >= .5 ? 'developing' : 'starting';
  }
  const ksvdSeen = {}; for (const e of past) for (const k of ((e.e21cc && e.e21cc.ksvd) || [])) if (k && k.id && k.strength !== 'glimpse') ksvdSeen[k.id] = (ksvdSeen[k.id] || 0) + 1;
  const underWay = (set.list || []).map(s => securedOf(entries, s)).filter(x => x.state === 'started' || x.state === 'linked').sort((a, b) => b.backing.length - a.backing.length).slice(0, 3).map(x => ({id:x.stmt.id, text:x.stmt.text, missing:x.missing}));
  const plans = past.filter(e => planOf(e).trim()).slice(0, 2).map(e => ({eid:e.id, at:e.created, text:fragment(planOf(e), 140), ticked:!!(p && p.done && p.done[e.id])}));
  // the last stretch, and whether this entry acts on it
  const last = past[0]; const lr = last && last.coach && (last.coach.ai || last.coach.builtin);
  let lastStretch = null;
  if (lr && lr.stretch_qid){
    const q = [GROW, ACT].flatMap(f => f.steps.flatMap(s => s.qs)).find(x => x.id === lr.stretch_qid);
    let uptake = null;
    if (q && forEntry && (forEntry.answers || {})[q.id] !== undefined && forEntry.kind === last.kind){
      const now2 = scoreAnswer(q, forEntry.answers[q.id]); const f = lr.stretch_flag || '';
      uptake = now2.flags.includes('empty') ? false : f === 'thin' ? answerStatus(forEntry.answers[q.id]) === 'answered' : f === 'notime' ? !!now2.hasTime : f === 'noaction' ? !!now2.hasAction : f ? !now2.flags.includes(f) : now2.score >= 1;
    }
    const prev = past[1] && past[1].coach && (past[1].coach.ai || past[1].coach.builtin);
    lastStretch = {qid:lr.stretch_qid, flag:lr.stretch_flag || '', uptake, twice:!!(prev && prev.stretch_qid === lr.stretch_qid && prev.stretch_flag && prev.stretch_flag === lr.stretch_flag)};
  }
  // scaffold per question: a question by default; a frame for a question still at its start, or a stretch missed twice; less after uptake; a model only after two calls for help
  const scaffold = {}; const fw = FRAMEWORKS[(forEntry && forEntry.kind) || 'grow'] || GROW; const stuck = opts.stuck || (forEntry && forEntry._stuck) || {};
  for (const s of fw.steps) for (const q of s.qs){
    let lv = stage[q.id] === 'starting' ? 2 : 1;
    if (lastStretch && lastStretch.qid === q.id){ if (lastStretch.twice) lv = Math.max(lv, 2); if (lastStretch.uptake) lv = Math.max(1, lv - 1); }
    if ((stuck[q.id] || 0) >= 2) lv = 3;
    scaffold[q.id] = lv;
  }
  const followThrough = forEntry && forEntry.followThrough && plans[0] && forEntry.followThrough.eid === plans[0].eid ? forEntry.followThrough.answer : '';
  const aim = forEntry && forEntry.target ? (set.list || []).find(s => s.id === forEntry.target) : null;
  return {sec:(p && p.level) || null, band, subjectLevel, subject:subj, entries:past.length, weeks:past.length ? Math.max(1, Math.ceil((now - past[past.length - 1].created) / (7 * 864e5))) : 0,
    stage, ksvdSeen, underWay, plans, lastStretch, scaffold, followThrough, aim:aim ? {id:aim.id, text:aim.text} : null};
}
/* The profile as the coach reads it: plain lines, no names. */
function profileBlock(pr, set){
  if (!pr) return '';
  set = set || coreSet(); const qname = id => { const q = [GROW, ACT, ACROSS].flatMap(f => f.steps.flatMap(s => s.qs.map(x => ({id:x.id, l:s.letter})))).find(x => x.id === id); return q ? `${q.l} (${id})` : id; };
  const L = ['Where this student is (read this before the entry):'];
  L.push(`Level: ${pr.sec ? 'Sec ' + pr.sec + ', ' : ''}${BAND_LABEL[pr.band] || pr.band || 'Lower Sec'} band.${pr.subjectLevel ? ` Subject level for ${pr.subject}: ${pr.subjectLevel}.` : ' Subject level: not given.'}`);
  L.push(pr.entries ? `Entries before this one: ${pr.entries}, over ${pr.weeks} week${pr.weeks === 1 ? '' : 's'}.` : 'This is the student’s first entry.');
  const st = Object.entries(pr.stage); L.push(st.length ? 'Writing stage by question: ' + st.map(([k, v]) => `${qname(k)} ${STAGE_WORD[v]}`).join('; ') + '.' : 'Writing stage: no history yet; treat every question as starting.');
  const seen = Object.entries(pr.ksvdSeen).sort((a, b) => b[1] - a[1]).slice(0, 8); L.push(seen.length ? 'Shown clearly before: ' + seen.map(([id, n]) => { const it = ksvdById(set, id); return it ? `${it.label} [${id}] x${n}` : ''; }).filter(Boolean).join('; ') + '.' : 'Shown clearly before: nothing yet.');
  if (pr.underWay.length) L.push('Statements under way: ' + pr.underWay.map(u => `[${u.id}] “${u.text}” (${u.missing || 'linked, not backed yet'})`).join('; '));
  if (pr.aim) L.push(`Aiming for: [${pr.aim.id}] “${pr.aim.text}”.`);
  L.push(pr.plans.length ? 'Last plans: ' + pr.plans.map((x, i) => `${i + 1}) “${x.text}” (${new Date(x.at).toLocaleDateString('en-SG', {day:'numeric', month:'short'})}${x.ticked ? ', ticked as done on Home' : ''})`).join(' ') : 'Last plans: none yet.');
  L.push(`Follow through on the most recent plan, as the student answered: ${pr.followThrough === 'yes' ? 'yes, done' : pr.followThrough === 'partly' ? 'partly done' : pr.followThrough === 'no' ? 'not done' : 'not asked or not answered'}.`);
  if (pr.lastStretch) L.push(`Last stretch was about ${qname(pr.lastStretch.qid)}${pr.lastStretch.flag ? ` (${({thin:'too short', notime:'no day or place', noaction:'no clear action', vague:'too general', echo:'repeated the question', short:'the shortest answer'})[pr.lastStretch.flag] || pr.lastStretch.flag})` : ''}. Acted on in this entry: ${pr.lastStretch.uptake === true ? 'yes' : pr.lastStretch.uptake === false ? 'no' : 'cannot tell'}${pr.lastStretch.twice ? '; the same stretch was missed twice in a row' : ''}.`);
  L.push('Scaffold level by question (never go higher): ' + Object.entries(pr.scaffold).map(([k, v]) => `${qname(k)} ${v}`).join('; ') + '.');
  return L.join('\n');
}
/* ---------- checking what a model says ---------- */
function ksvdStrengthCap(entry, quote){
  const fw = FRAMEWORKS[entry.kind]; const q = normText(quote);
  const qid = fw.steps.flatMap(s => s.qs).map(x => x.id).find(id => normText((entry.answers || {})[id]).includes(q));
  return qid && answerStatus(entry.answers[qid]) === 'thin' ? 'glimpse' : null;
}
function normaliseKsvd(entry, raw){
  const set = coreSet(); const out = []; const seen = new Set(); const rank = {glimpse:1, clear:2, strong:3};
  for (const x of (Array.isArray(raw) ? raw : [])){
    if (!x || !x.id || seen.has(x.id)) continue; const it = ksvdById(set, x.id); if (!it) continue;
    const q = String(x.quote || '').trim().replace(/[.!?…]+$/, ''); if (!isVerbatim(entry, q)) continue;
    let strength = rank[x.strength] ? x.strength : 'glimpse'; if (ksvdStrengthCap(entry, q)) strength = 'glimpse';
    seen.add(x.id); out.push({id:it.id, comp:it.comp, type:it.type, quote:q, strength});
    if (out.length >= 6) break;
  }
  return out.sort((a, b) => rank[b.strength] - rank[a.strength]);
}
/* Knowledge, skills, values and dispositions from cue words, for the offline coach.
   A value needs a specific moment; a thin answer gives at most a glimpse. */
function ksvdFromCues(entry){
  const set = coreSet(); const fw = FRAMEWORKS[entry.kind]; if (!fw || !set.ksvdIndex) return [];
  const items = Object.values(set.ksvdIndex); const found = [];
  for (const q of fw.steps.flatMap(s => s.qs)){
    const text = (entry.answers || {})[q.id]; const status = answerStatus(text); if (status === 'empty') continue;
    for (const sen of sentencesOf(text)){
      const low = ' ' + sen.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
      const words = tokens(sen).length; const specific = /\d/.test(sen) || words >= 12 || /\b[A-Z][a-z]{2,}\b/.test(sen.slice(1)); const reasoned = REASONS.some(r => low.includes(r)) || PROCESS.some(x => low.includes(x));
      for (const it of items){
        const hits = it.cues.filter(c => low.includes(c.length <= 4 ? ' ' + c + ' ' : c)).length; if (!hits) continue;
        let strength = status === 'thin' ? 'glimpse' : specific && reasoned ? 'clear' : specific ? 'clear' : 'glimpse';
        if (it.type === 'v' && strength === 'glimpse') continue;
        found.push({id:it.id, comp:it.comp, type:it.type, quote:sen.split(/\s+/).slice(0, 25).join(' ').replace(/[.!?…]+$/, ''), strength, _s:hits + (strength === 'clear' ? 2 : 0)});
      }
    }
  }
  // one per competency and type, strongest first, at most six
  const out = []; const used = new Set();
  for (const f of found.sort((a, b) => b._s - a._s)){ const k = f.comp + f.type; if (used.has(k) || used.has(f.id)) continue; used.add(k); used.add(f.id); const {_s, ...rest} = f; out.push(rest); if (out.length >= 6) break; }
  return out;
}
/* The coach's extras, checked against the words and the profile. */
function normaliseCoachExtras(entry, raw, profile){
  const answers = answerStatuses(entry); const qids = answers.map(a => a.qid);
  const fs = ['done', 'partly', 'not_done', 'unclear', 'none'];
  const ft = raw.follow_through && fs.includes(raw.follow_through.status) ? {status:raw.follow_through.status, note:String(raw.follow_through.note || '').slice(0, 240)} : {status:profile && profile.plans && profile.plans.length ? 'unclear' : 'none', note:''};
  // what the student said about last time's plan is the record; with a plan on file, "no plan yet" cannot be right
  if (profile && profile.followThrough) ft.status = {yes:'done', partly:'partly', no:'not_done'}[profile.followThrough] || ft.status;
  else if (profile && profile.plans && profile.plans.length && ft.status === 'none') ft.status = 'unclear';
  let sq = qids.includes(raw.stretch_qid) && (answers.find(a => a.qid === raw.stretch_qid) || {}).status !== 'empty' ? raw.stretch_qid : '';
  const allowed = sq && profile && profile.scaffold ? (profile.scaffold[sq] || 1) : 1;
  const sc = raw.scaffold || {}; const level = Math.max(1, Math.min(allowed, parseInt(sc.level, 10) || 1));
  // a frame keeps its blanks and none of the student's own sentences
  const own = qids.map(id => normText((entry.answers || {})[id])).filter(t => t.split(' ').length >= 5);
  const clean = t => { t = String(t || '').trim().slice(0, 300); return t && !own.some(o => normText(t).includes(o.split(' ').slice(0, 5).join(' '))) ? t : ''; };
  const frame = level >= 2 ? clean(sc.frame) : ''; const model = level >= 3 ? clean(sc.model) : '';
  const cc = String(raw.content_check || '').trim(); const content_check = cc && /\?\s*$/.test(cc) ? cc.slice(0, 240) : '';
  return {answers, stretch_qid:sq, follow_through:ft, scaffold:{level, frame:frame.includes('___') ? frame : '', model}, content_check};
}
/* ---------- help while writing, from the AI: one question, perhaps a frame or a model ---------- */
const STUCK_SCHEMA = {type:'object', additionalProperties:false, properties:{
  question:{type:'string', description:'One question that helps the student take the next small step on this guiding question. Under 30 words.'},
  frame:{type:'string', description:'At scaffold level 2 or 3: one sentence frame with blanks written as ___, containing none of the student’s content. Otherwise an empty string.'},
  model:{type:'string', description:'At scaffold level 3 only: one or two sentences about a different subject, starting “For example, in”. Otherwise an empty string.'}
}, required:['question', 'frame', 'model']};
function stuckSystem(){
  return ['You help a Singapore secondary school student who is stuck on one guiding question while writing a reflection in their E21CC Log. Build their confidence: help them take one small step themselves. Never write the answer or the reflection for them.',
    'Scaffold exactly at the level given. Level 1: one question only, pitched one step beyond what they have written; frame and model are empty strings. Level 2: the question plus one sentence frame with blanks written as ___, never filled with their content. Level 3: the question, a frame, and a model of one or two sentences about a different subject or situation, beginning “For example, in”; never about their own topic.',
    'If they have written nothing or only a few words, ask for the smallest true detail they can give. If they have written something, start from it: ask for the one detail, reason or moment that would make it stronger.',
    'Plain English, short sentences, Singapore context, no emoji. Do not use hyphens or dashes as punctuation. No slogans and no praise.'].join('\n\n');
}
function stuckUser(entry, qid, level, profile){
  const fw = FRAMEWORKS[entry.kind]; const s = fw.steps.find(x => x.qs.some(q => q.id === qid)); const q = s.qs.find(x => x.id === qid);
  return [profileBlock(profile), `Framework: ${fw.name}. Context: ${(entry.context && entry.context.name) || 'unspecified'}${entry.topic ? ', ' + entry.topic : ''}.`, `Guiding question (${s.letter}): ${q.q.replace(/<[^>]+>/g, '')}`, `What the student has written so far: ${String((entry.answers || {})[qid] || '').trim() || '(nothing yet)'}`, `Scaffold level for this request: ${level}.`].join('\n\n');
}

/* ==================================================================
   E21CC Log: shared helpers
   ================================================================== */
const APP_NAME = 'E21CC Log';
const SITE_MARK = 'v3';   // this site is the third version, beside logs/ and logsv2/
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
  {id:'subject', label:'Subject', ph:'Which subject?', topic:'Topic', topicPh:'e.g. Simultaneous equations'},
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
const DEFAULT_STATEMENTS = {"id": "beatty-v1", "version": 1, "draft": "V1", "title": "Beatty Secondary School: contextualised E21CC framework", "about": "Beatty's I can statements, taken from E21CC_Statements_for_BTYSS_V1.docx. Where the draft held an original and a proposed rewrite, the rewrite is used; deleted text is dropped. Statements are quoted word for word. Each strand is a ladder: Lower Sec (Sec 1 and 2) then Upper Sec (Sec 3 to 5). Statement ids are the strand id plus l1, l2 or u1, u2 and so on; keep them stable once students link entries to them. The notes on each strand list what the draft left open for the school to settle.", "bands": [{"id": "lower", "label": "Lower Sec", "levels": [1, 2]}, {"id": "upper", "label": "Upper Sec", "levels": [3, 4, 5]}], "mvvKey": {"m": "Mission: Adaptive Thinkers, Agile Learners, Active Contributors", "vi": "Vision: Purpose Driven Steward", "va": "DREAM values: Discipline, Resilience, Empathy, Adaptability, Mindfulness"}, "secKsvd": {"selfaware": {"k": [{"id": "sec.selfaware.k1", "label": "My strengths and limits", "plain": "You know what you are good at and not yet good at.", "cues": ["strength", "weakness", "good at", "not good at", "not yet good"]}], "s": [{"id": "sec.selfaware.s1", "label": "Naming what I feel and why", "plain": "You name a feeling and what caused it.", "cues": ["i felt", "i feel", "nervous", "proud", "frustrated", "anxious", "worried"]}], "v": [{"id": "sec.selfaware.v1", "label": "Integrity", "plain": "You were honest with yourself about how you did.", "cues": ["honest", "admitted", "the truth", "i was wrong", "owned up"]}], "d": [{"id": "sec.selfaware.d1", "label": "Self reflection", "plain": "You look honestly at yourself.", "cues": ["about myself", "i realised i", "i realized i", "i tend to"]}]}, "selfmanage": {"k": [{"id": "sec.selfmanage.k1", "label": "What helps me focus", "plain": "You know what helps and what distracts you.", "cues": ["focus", "distract", "phone", "quiet"]}], "s": [{"id": "sec.selfmanage.s1", "label": "Managing my time", "plain": "You plan your time to finish what you start.", "cues": ["schedule", "timetable", "minutes", "plan my time"]}, {"id": "sec.selfmanage.s2", "label": "Calming myself", "plain": "You manage a strong feeling so you can carry on.", "cues": ["calm", "breathe", "relax", "calmed down"]}], "v": [{"id": "sec.selfmanage.v1", "label": "Discipline", "plain": "You did what needed doing, carefully and on time.", "cues": ["carefully", "on time", "routine", "every day", "checked again", "stuck to", "step by step"]}, {"id": "sec.selfmanage.v2", "label": "Resilience", "plain": "You kept going after a setback.", "cues": ["tried again", "kept going", "did not give up", "didn't give up", "failed", "setback", "try again"]}], "d": [{"id": "sec.selfmanage.d1", "label": "Self control", "plain": "You hold back from what pulls you off track.", "cues": ["resisted", "stopped myself", "put away"]}]}, "socialaware": {"k": [{"id": "sec.socialaware.k1", "label": "Others' feelings", "plain": "You know others may be feeling something you cannot see.", "cues": ["they felt", "was upset", "my friend was"]}], "s": [{"id": "sec.socialaware.s1", "label": "Noticing how others feel", "plain": "You notice how someone else is finding things.", "cues": ["noticed", "saw that", "looked sad", "looked worried"]}], "v": [{"id": "sec.socialaware.v1", "label": "Empathy", "plain": "You thought about how others feel.", "cues": ["feelings", "how they felt", "how she felt", "how he felt", "put myself", "upset", "for them"]}, {"id": "sec.socialaware.v2", "label": "Respect", "plain": "You treated others and their views with respect.", "cues": ["respect", "listened", "polite", "their view", "valued"]}], "d": [{"id": "sec.socialaware.d1", "label": "Consideration", "plain": "You think about others, not only yourself.", "cues": ["thought about others", "for them", "for my friend"]}]}, "relationship": {"k": [{"id": "sec.relationship.k1", "label": "What healthy relationships need", "plain": "You know trust is built by small actions.", "cues": ["trust", "friendship"]}], "s": [{"id": "sec.relationship.s1", "label": "Asking for help", "plain": "You ask someone for help when you need it.", "cues": ["asked for help", "asked my teacher", "asked my friend"]}, {"id": "sec.relationship.s2", "label": "Repairing a relationship", "plain": "You make things right after a falling out.", "cues": ["apologised", "apologized", "sorry", "made up"]}], "v": [{"id": "sec.relationship.v1", "label": "Care", "plain": "You acted to help others.", "cues": ["helped", "cared", "supported", "looked out for", "kind to"]}, {"id": "sec.relationship.v2", "label": "Respect", "plain": "You treated others and their views with respect.", "cues": ["respect", "listened", "polite", "their view", "valued"]}], "d": [{"id": "sec.relationship.d1", "label": "Openness", "plain": "You share how you are doing with people you trust.", "cues": ["talked to", "told my", "opened up"]}]}, "decisions": {"k": [{"id": "sec.decisions.k1", "label": "Consequences", "plain": "You know choices have effects on you and others.", "cues": ["consequence", "consequences"]}], "s": [{"id": "sec.decisions.s1", "label": "Thinking of who is affected", "plain": "You consider others before you choose.", "cues": ["affect others", "who would", "for everyone"]}], "v": [{"id": "sec.decisions.v1", "label": "Responsibility", "plain": "You owned your part and what came of it.", "cues": ["responsible", "my part", "my fault", "owned up", "my job"]}, {"id": "sec.decisions.v2", "label": "Integrity", "plain": "You were honest, even when it was hard.", "cues": ["honest", "admitted", "the truth", "i was wrong", "owned up"]}], "d": [{"id": "sec.decisions.d1", "label": "Fairness", "plain": "You choose what is fair, not only what is easy.", "cues": ["fair", "right thing"]}]}}, "ksvdAbout": "Draft by the log for the school to review: each strand broken into knowledge (what the student understands), skills (what they do), values (what an action shows they care about, from DREAM and MOE’s core values) and dispositions (habits of mind). Cues are words the offline coach looks for; the AI coach reads for meaning. Keep ids stable once entries carry them.", "strands":[
  {"id": "ct1", "comp": "critical", "n": 1, "name": "Exercises sound reasoning and decision-making", "milestone": {"lower": "At Lower Sec, students use evidence to explain reasoning (Level 3.1).", "upper": "At Upper Sec, students use evidence and adopt different viewpoints to explain their reasoning and decisions, having considered the implications of the relationship among different viewpoints."}, "mvv": {"m": ["Adaptive Thinkers"], "vi": [], "va": ["Mindfulness", "Discipline"]}, "lower": ["I can explain my thinking and decisions using evidence.", "I can consider viewpoints different from my own and use them, alongside evidence, to explain my reasoning more fully."], "upper": ["I can work out how different viewpoints relate to each other, including where they conflict.", "I can explain what those conflicts mean for my conclusion and make decisions I can defend.", "I can weigh evidence and different viewpoints independently and make decisions I can defend on principle rather than preference."], "notes": ["Reviewer comment on the milestone: \"Need to have this?\" (Level 3.1)."], "ksvd": {"k": [{"id": "ct1.k1", "label": "What counts as evidence", "plain": "You know the difference between a fact you can check and an opinion.", "cues": ["evidence", "data", "fact", "proof", "results", "source"]}, {"id": "ct1.k2", "label": "Viewpoints and assumptions", "plain": "You know that people can see the same thing differently, and why.", "cues": ["viewpoint", "perspective", "point of view", "assume", "assumption", "opinion"]}], "s": [{"id": "ct1.s1", "label": "Giving reasons with evidence", "plain": "You explain a decision with a reason you can point to.", "cues": ["because", "therefore", "which means", "this shows", "so i decided"]}, {"id": "ct1.s2", "label": "Weighing two sides", "plain": "You compare options or views before you decide.", "cues": ["compared", "weighed", "on the other hand", "both", "whereas", "pros and cons"]}, {"id": "ct1.s3", "label": "Checking a conclusion", "plain": "You test an answer before you trust it.", "cues": ["checked", "double checked", "verified", "tested", "made sure", "repeat"]}], "v": [{"id": "ct1.v1", "label": "Mindfulness", "plain": "You paused to notice and think before acting.", "cues": ["noticed", "paused", "aware", "realised", "realized", "thought carefully", "reflected"]}, {"id": "ct1.v2", "label": "Discipline", "plain": "You did what needed doing, carefully and on time.", "cues": ["carefully", "on time", "routine", "every day", "checked again", "stuck to", "step by step"]}, {"id": "ct1.v3", "label": "Integrity", "plain": "You reported what you really found, even when it was not what you hoped.", "cues": ["honest", "admitted", "the truth", "i was wrong", "owned up"]}], "d": [{"id": "ct1.d1", "label": "Open mindedness", "plain": "You are willing to change your mind when the evidence says so.", "cues": ["changed my mind", "realised", "realized", "maybe", "the other view"]}, {"id": "ct1.d2", "label": "Healthy doubt", "plain": "You do not accept an answer just because it is given.", "cues": ["doubt", "unsure", "did not seem right", "looked wrong", "questioned", "not convinced"]}]}},
  {"id": "ct2", "comp": "critical", "n": 2, "name": "Uses metacognition to enhance, monitor and regulate thinking", "milestone": {"lower": "At Lower Sec, students can reflect on their thoughts, attitudes, behaviour and actions during their learning experiences, and determine the modifications (changes) required.", "upper": "At Upper Sec, students can plan, organise and evaluate their thinking strategies to monitor their learning, suspend judgement, reassess conclusions and consider alternatives to refine their thoughts, attitudes, behaviour and actions."}, "mvv": {"m": ["Agile Learners"], "vi": [], "va": ["Mindfulness", "Resilience", "Discipline"]}, "lower": ["I can reflect on how I think and learn, and identify changes I can make to improve.", "I can adjust my attitudes, behaviours and strategies to make a difference to my learning."], "upper": ["I can plan and monitor my own thinking strategies, and evaluate the effectiveness for my learning.", "I can reassess my conclusions and consider alternatives before refining my attitudes and actions.", "I can take ownership of my growth as a learner by consistently reflecting on and improving how I think, learn and act."], "notes": ["Reviewer comment: metacognition is called Adaptive Learning in Beatty's own VMV. School leaders to decide which name to use.", "Upper Sec 1 asks \"effectiveness of what?\"; the wording is unresolved."], "ksvd": {"k": [{"id": "ct2.k1", "label": "How I learn best", "plain": "You know which ways of studying work for you.", "cues": ["works for me", "learn best", "method", "strategy", "the way i"]}, {"id": "ct2.k2", "label": "My own patterns", "plain": "You know your habits, strengths and usual mistakes.", "cues": ["usually", "tend to", "habit", "careless", "always make", "often"]}], "s": [{"id": "ct2.s1", "label": "Noticing my thinking", "plain": "You notice what you were thinking while you worked.", "cues": ["i realised", "i realized", "i noticed", "i was thinking", "i thought"]}, {"id": "ct2.s2", "label": "Changing a strategy", "plain": "You try a different way when one is not working.", "cues": ["instead", "changed", "switched", "different way", "new method", "tried another"]}, {"id": "ct2.s3", "label": "Monitoring progress", "plain": "You check how you are doing against a goal.", "cues": ["progress", "improving", "track", "compared to last", "goal", "target"]}], "v": [{"id": "ct2.v1", "label": "Mindfulness", "plain": "You paid attention to how you learn, not only to what you learn.", "cues": ["noticed", "paused", "aware", "realised", "realized", "thought carefully", "reflected"]}, {"id": "ct2.v2", "label": "Resilience", "plain": "You kept going after a setback.", "cues": ["tried again", "kept going", "did not give up", "didn't give up", "failed", "setback", "try again"]}, {"id": "ct2.v3", "label": "Discipline", "plain": "You followed through on what you planned to change.", "cues": ["carefully", "on time", "routine", "every day", "checked again", "stuck to", "step by step"]}], "d": [{"id": "ct2.d1", "label": "Ownership", "plain": "You take charge of your learning instead of waiting to be told.", "cues": ["i decided", "on my own", "myself", "i chose", "took charge"]}, {"id": "ct2.d2", "label": "Belief that you can improve", "plain": "You treat a mistake as a step towards doing better.", "cues": ["learn from my", "better next time", "learnt from", "learned from"]}]}},
  {"id": "at3", "comp": "adaptive", "n": 3, "name": "Assesses different contexts and situations to make connections and draw new insights", "milestone": {"lower": "At Lower Sec, students can understand the similarities and differences between different contexts or situations and how this might affect their perspective or approach.", "upper": "At Upper Sec, students can draw on the similarities and differences between different contexts or situations to extract new insights to inform their perspective or approach."}, "mvv": {"m": ["Adaptive Thinkers", "Agile Learners"], "vi": [], "va": ["Adaptability", "Mindfulness"]}, "lower": ["I can identify similarities and differences between different situations, and use these connections to understand things in a new way.", "I can use the connections made and apply what I have learnt in another context."], "upper": ["I can identify what is similar and what is different between two situations.", "I can use the insights drawn from different contexts to sharpen my perspective, challenge my assumptions and approach problems in more creative and effective ways."], "notes": ["Upper Sec 1 (the proposed rewrite) reads easier than Lower Sec 1. The ladder needs checking.", "Reviewer comment on Upper Sec 2: would \"creative\" be needed, or \"approach situations differently\"?"], "ksvd": {"k": [{"id": "at3.k1", "label": "Similarities and differences", "plain": "You know what is alike and what is different between two situations.", "cues": ["similar", "same as", "unlike", "like when"]}, {"id": "at3.k2", "label": "Where an idea applies", "plain": "You know when an idea from one place fits another.", "cues": ["applies", "also works", "same idea", "used it in"]}], "s": [{"id": "at3.s1", "label": "Making connections", "plain": "You link what you learnt to another subject or to life.", "cues": ["reminded me", "connected", "link", "like in", "similar to"]}, {"id": "at3.s2", "label": "Transferring learning", "plain": "You use something learnt in one place to solve a problem in another.", "cues": ["used what", "applied", "same method", "from science", "from maths", "from math"]}, {"id": "at3.s3", "label": "Drawing a new insight", "plain": "You notice something new because you compared two situations.", "cues": ["now i see", "new way", "realised that", "realized that", "understood better"]}], "v": [{"id": "at3.v1", "label": "Adaptability", "plain": "You changed your approach when things changed.", "cues": ["adapted", "adjusted", "changed my", "switched", "new way", "instead"]}, {"id": "at3.v2", "label": "Mindfulness", "plain": "You paused to notice and think before acting.", "cues": ["noticed", "paused", "aware", "realised", "realized", "thought carefully", "reflected"]}], "d": [{"id": "at3.d1", "label": "Curiosity", "plain": "You look for links between things on your own.", "cues": ["wondered", "curious", "what if", "i wonder"]}, {"id": "at3.d2", "label": "Flexible thinking", "plain": "You are willing to see a familiar thing in a new way.", "cues": ["new way", "different angle", "looked at it again", "another way"]}]}},
  {"id": "at4", "comp": "adaptive", "n": 4, "name": "Manages complexities and ambiguities by adjusting one's perspective and strategies", "milestone": {"lower": "At Lower Sec, students can draw on different perspectives and strategies to adjust their approach when required, applying learnt knowledge and skills in unfamiliar contexts.", "upper": "At Upper Sec, students can draw on different perspectives and strategies to adjust their approach when required, adapting learnt knowledge and skills in new and unexpected contexts to solve complex and unexpected problems."}, "mvv": {"m": ["Adaptive Thinkers", "Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Adaptability", "Resilience"]}, "lower": ["I can engage with different perspectives and adjust my approach when I face unfamiliar situations.", "I can adjust my approach when things do not go as expected, and stay open to trying new strategies."], "upper": ["I can adapt my strategies and mindset when facing complex, ambiguous or unexpected challenges.", "I can draw on diverse perspectives to help me solve new problems.", "I can adapt both my strategies and my mindset in complex, real-world contexts to respond with confidence and integrity."], "notes": [], "ksvd": {"k": [{"id": "at4.k1", "label": "Unfamiliar situations", "plain": "You know a new or messy situation needs a different approach.", "cues": ["new situation", "unfamiliar", "never done", "first time", "unexpected"]}, {"id": "at4.k2", "label": "More than one route", "plain": "You know a problem can be solved in more than one way.", "cues": ["another way", "other ways", "options", "more than one"]}], "s": [{"id": "at4.s1", "label": "Adjusting the approach", "plain": "You change your plan when things do not go as expected.", "cues": ["adjusted", "changed plan", "changed the plan", "plan b", "adapted", "switched"]}, {"id": "at4.s2", "label": "Using other perspectives", "plain": "You use other people's ideas to solve something new.", "cues": ["suggested", "idea from", "teammate said", "my friend said", "asked my"]}, {"id": "at4.s3", "label": "Acting with uncertainty", "plain": "You make a sensible move even when you are not sure.", "cues": ["not sure", "still tried", "took a chance", "guessed"]}], "v": [{"id": "at4.v1", "label": "Adaptability", "plain": "You changed your approach when things changed.", "cues": ["adapted", "adjusted", "changed my", "switched", "new way", "instead"]}, {"id": "at4.v2", "label": "Resilience", "plain": "You kept going after a setback.", "cues": ["tried again", "kept going", "did not give up", "didn't give up", "failed", "setback", "try again"]}, {"id": "at4.v3", "label": "Integrity", "plain": "You were honest, even when it was hard.", "cues": ["honest", "admitted", "the truth", "i was wrong", "owned up"]}], "d": [{"id": "at4.d1", "label": "Composure", "plain": "You stay calm when things are uncertain.", "cues": ["calm", "did not panic", "didn't panic", "relaxed", "steady"]}, {"id": "at4.d2", "label": "Openness to new strategies", "plain": "You are willing to try something you have not tried before.", "cues": ["tried something new", "new strategy", "experiment", "never tried"]}]}},
  {"id": "it5", "comp": "inventive", "n": 5, "name": "Explores possibilities and generates novel and useful ideas", "milestone": {"lower": "At Lower Sec, students can generate ideas that may involve modifying existing ones and explore different pathways that are appropriate to respond to an issue or challenge.", "upper": "At Upper Sec, students can generate ideas that are unique or modified substantially from existing ones and explore different pathways that lead to solutions."}, "mvv": {"m": ["Adaptive Thinkers", "Active Contributors"], "vi": [], "va": ["Adaptability", "Resilience", "Mindfulness"]}, "lower": ["I can explore different possibilities and generate ideas in response to issues or challenges, including by building on or modifying existing ones.", "I can develop and refine my ideas by testing them against the issue or challenge at hand."], "upper": ["I can generate new ideas by exploring multiple pathways.", "I can take creative risks and use feedback to develop them into solutions that are genuinely useful.", "I can generate and develop original ideas to make a difference to the challenges I encounter."], "notes": ["Reviewer comment on \"creative risks\": unconventional or uncertain?"], "ksvd": {"k": [{"id": "it5.k1", "label": "What makes an idea useful", "plain": "You know an idea must work for the problem, not only be new.", "cues": ["useful", "practical"]}, {"id": "it5.k2", "label": "Building on ideas", "plain": "You know good ideas often grow from existing ones.", "cues": ["built on", "modified", "improved on", "based on"]}], "s": [{"id": "it5.s1", "label": "Generating ideas", "plain": "You come up with more than one idea.", "cues": ["ideas", "brainstorm", "came up with", "another idea"]}, {"id": "it5.s2", "label": "Testing an idea", "plain": "You try an idea out to see if it works.", "cues": ["tested", "tried it", "prototype", "experiment", "trial"]}, {"id": "it5.s3", "label": "Developing ideas from feedback", "plain": "You improve an idea after hearing what others think.", "cues": ["changed it after", "improved it", "improved my idea"]}], "v": [{"id": "it5.v1", "label": "Adaptability", "plain": "You changed your approach when things changed.", "cues": ["adapted", "adjusted", "changed my", "switched", "new way", "instead"]}, {"id": "it5.v2", "label": "Resilience", "plain": "You kept going after a setback.", "cues": ["tried again", "kept going", "did not give up", "didn't give up", "failed", "setback", "try again"]}, {"id": "it5.v3", "label": "Mindfulness", "plain": "You paused to notice and think before acting.", "cues": ["noticed", "paused", "aware", "realised", "realized", "thought carefully", "reflected"]}], "d": [{"id": "it5.d1", "label": "Curiosity", "plain": "You ask what if, and want to find out.", "cues": ["what if", "wonder", "curious", "imagine"]}, {"id": "it5.d2", "label": "Creative courage", "plain": "You try an idea that might not work.", "cues": ["risk", "took a chance", "tried anyway", "bold"]}]}},
  {"id": "it6", "comp": "inventive", "n": 6, "name": "Evaluates and refines ideas to formulate novel and useful solutions", "milestone": {"lower": "At Lower Sec, students can evaluate and refine their ideas using relevant strategies and based on a set of criteria that is appropriate for the task or context.", "upper": "At Upper Sec, students can evaluate and refine their ideas iteratively, using relevant strategies and based on a set of criteria that is appropriate for the task or context."}, "mvv": {"m": ["Adaptive Thinkers", "Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Discipline", "Resilience", "Mindfulness"]}, "lower": ["I can evaluate my ideas using relevant criteria to identify what is working and what is not.", "I can refine my thinking and make deliberate improvements to arrive at a better solution."], "upper": ["I can evaluate and refine my ideas using relevant criteria to identify what is working and what is not.", "I can challenge my own ideas and use this to push my thinking towards creative and robust solutions.", "I can develop creative and useful solutions through evaluation, creative risk-taking and a deep awareness of the needs of the issue."], "notes": ["Upper Sec 1 nearly repeats Lower Sec 1.", "Reviewer comment on Upper Sec 2: keep \"useful solutions\" rather than \"robust\"?"], "ksvd": {"k": [{"id": "it6.k1", "label": "Criteria for success", "plain": "You know what a good solution has to do.", "cues": ["rubric", "requirement", "has to work"]}, {"id": "it6.k2", "label": "Strengths and limits of an idea", "plain": "You know an idea can work in some ways and not in others.", "cues": ["strength", "weakness", "worked", "did not work", "didn't work"]}], "s": [{"id": "it6.s1", "label": "Evaluating against criteria", "plain": "You judge your work against clear criteria.", "cues": ["against the criteria", "checked against", "rubric", "met the"]}, {"id": "it6.s2", "label": "Refining", "plain": "You make deliberate changes to improve your work.", "cues": ["improved my", "refined", "edited", "revised", "second draft", "made it better"]}, {"id": "it6.s3", "label": "Challenging my own idea", "plain": "You look for what could go wrong with your own idea.", "cues": ["what could go wrong", "flaw", "problem with my", "questioned my"]}], "v": [{"id": "it6.v1", "label": "Discipline", "plain": "You did what needed doing, carefully and on time.", "cues": ["carefully", "on time", "routine", "every day", "checked again", "stuck to", "step by step"]}, {"id": "it6.v2", "label": "Resilience", "plain": "You kept going after a setback.", "cues": ["tried again", "kept going", "did not give up", "didn't give up", "failed", "setback", "try again"]}, {"id": "it6.v3", "label": "Mindfulness", "plain": "You paused to notice and think before acting.", "cues": ["noticed", "paused", "aware", "realised", "realized", "thought carefully", "reflected"]}], "d": [{"id": "it6.d1", "label": "Perseverance", "plain": "You keep improving instead of stopping at the first version.", "cues": ["another try", "kept improving", "second version", "tried again"]}, {"id": "it6.d2", "label": "High standards", "plain": "You aim for work that is good, not only finished.", "cues": ["proud", "quality", "my best"]}]}},
  {"id": "co1", "comp": "communication", "n": 1, "name": "Effectively communicates information and co-constructs meaning", "milestone": {"lower": "At Lower Sec, students can convey and evaluate knowledge to co-construct new understandings and ideas coherently, while considering the specific purpose and context of communication.", "upper": "At Upper Sec, students can convey and critically evaluate knowledge to co-construct new understandings and complex ideas persuasively and with impact, while considering the specific purpose and context of communication."}, "mvv": {"m": ["Active Contributors", "Agile Learners"], "vi": [], "va": ["Empathy", "Discipline", "Mindfulness"]}, "lower": ["I can express my ideas clearly and confidently, using appropriate language and tone to suit the purpose, audience and context.", "I can check whether my message is understood and build on others’ ideas to learn together.", "I can process information shared with me and consider how it connects with the information I already have."], "upper": ["I can present complex ideas persuasively, using appropriate language and tone to suit the purpose, audience and context.", "I can critically evaluate what I share and how I share it to ensure my communication is honest, accurate and responsible.", "I can build on what others contribute to work towards shared insight rather than just conveying my own views.", "I can gather feedback from my audience and synthesise different viewpoints to achieve a deeper understanding."], "notes": ["Lower Sec 3 and Upper Sec 4 were proposed additions in the draft.", "Reviewer comments on Upper Sec 2: overlap with adjusting, and \"where did these come from?\""], "ksvd": {"k": [{"id": "co1.k1", "label": "Purpose, audience and context", "plain": "You know your words must suit who you are talking to, and why.", "cues": ["audience", "purpose", "explain to", "younger", "for my friend"]}, {"id": "co1.k2", "label": "Accurate and responsible sharing", "plain": "You know what you share should be true and fair.", "cues": ["accurate", "honest about"]}], "s": [{"id": "co1.s1", "label": "Explaining clearly", "plain": "You explain an idea so someone else can follow it.", "cues": ["explained", "explain it", "would explain", "taught", "in my own words", "diagram"]}, {"id": "co1.s2", "label": "Checking understanding", "plain": "You check that the other person understood.", "cues": ["asked if", "understood", "checked if", "did they get"]}, {"id": "co1.s3", "label": "Building on others' ideas", "plain": "You add to what someone else said.", "cues": ["added to", "built on", "her idea", "his idea", "agreed and"]}], "v": [{"id": "co1.v1", "label": "Empathy", "plain": "You thought about what your listener needed.", "cues": ["feelings", "how they felt", "how she felt", "how he felt", "put myself", "upset", "for them"]}, {"id": "co1.v2", "label": "Discipline", "plain": "You did what needed doing, carefully and on time.", "cues": ["carefully", "on time", "routine", "every day", "checked again", "stuck to", "step by step"]}, {"id": "co1.v3", "label": "Mindfulness", "plain": "You paused to notice and think before acting.", "cues": ["noticed", "paused", "aware", "realised", "realized", "thought carefully", "reflected"]}], "d": [{"id": "co1.d1", "label": "Confidence to speak", "plain": "You speak up and share your thinking.", "cues": ["spoke up", "presented", "shared", "volunteered"]}, {"id": "co1.d2", "label": "Openness to feedback", "plain": "You welcome questions and corrections.", "cues": ["feedback", "corrected", "asked me", "pointed out"]}]}},
  {"id": "co2", "comp": "communication", "n": 2, "name": "Engages empathetically with diverse perspectives", "milestone": {"lower": "At Lower Sec, students respond with respect and empathy, and are sensitive to the diverse backgrounds that influence different perspectives while interacting with others.", "upper": "At Upper Sec, students respond with respect and empathy, and are sensitive to the diverse backgrounds that influence the context of communication with others."}, "mvv": {"m": ["Active Contributors"], "vi": [], "va": ["Empathy", "Mindfulness", "Adaptability"]}, "lower": ["I can listen actively and acknowledge others' feelings and viewpoints.", "I can ask thoughtful questions with empathy to better understand others’ perspectives."], "upper": ["I can validate others’ feelings and viewpoints, helping everyone feel heard, respected and valued.", "I can adjust how I communicate to build trust, resolve misunderstandings, and encourage open dialogue."], "notes": ["The Upper Sec rewrites merge four earlier statements into two."], "ksvd": {"k": [{"id": "co2.k1", "label": "Others' feelings and views", "plain": "You know others may feel or see things differently.", "cues": ["upset", "their view", "perspective", "how they felt"]}, {"id": "co2.k2", "label": "What listening is", "plain": "You know listening means understanding, not waiting to talk.", "cues": ["listened", "heard", "listen"]}], "s": [{"id": "co2.s1", "label": "Active listening", "plain": "You listen and show you understood.", "cues": ["listened", "nodded", "repeated back", "heard her", "heard him"]}, {"id": "co2.s2", "label": "Asking caring questions", "plain": "You ask questions to understand someone.", "cues": ["asked her", "asked him", "asked how", "asked why", "asked them"]}, {"id": "co2.s3", "label": "Adjusting how I speak", "plain": "You change how you speak to build trust.", "cues": ["calmly", "gently", "softer", "changed how i said"]}], "v": [{"id": "co2.v1", "label": "Empathy", "plain": "You thought about how others feel.", "cues": ["feelings", "how they felt", "how she felt", "how he felt", "put myself", "upset", "for them"]}, {"id": "co2.v2", "label": "Mindfulness", "plain": "You paused to notice and think before acting.", "cues": ["noticed", "paused", "aware", "realised", "realized", "thought carefully", "reflected"]}, {"id": "co2.v3", "label": "Respect", "plain": "You treated others and their views with respect.", "cues": ["respect", "listened", "polite", "their view", "valued"]}], "d": [{"id": "co2.d1", "label": "Patience", "plain": "You give others time to speak and think.", "cues": ["waited", "patient", "let them", "let her", "let him"]}, {"id": "co2.d2", "label": "Wanting to understand", "plain": "You want to understand people, not only reply.", "cues": ["wanted to understand", "why they", "why she", "why he"]}]}},
  {"id": "cl3", "comp": "collaboration", "n": 3, "name": "Interacts and works effectively in group settings to contribute to shared goals", "milestone": {"lower": "At Lower Sec, students can manage disagreements with group members and take in suggestions, while contributing to the completion of a task to meet the shared goals.", "upper": "At Upper Sec, students can mediate conflict and disagreement, reaching compromises or consensus for collective decisions to meet shared goals."}, "mvv": {"m": ["Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Empathy", "Resilience", "Discipline"]}, "lower": ["I can contribute meaningfully to group work, doing my fair share and supporting my teammates to help the group succeed.", "I can manage disagreements and help the group find a way forward to achieve our shared goals."], "upper": ["I can build consensus and lead my team towards shared goals.", "I can help teammates understand each other's perspectives, de-escalate tension and work through disagreements to strengthen relationships."], "notes": [], "ksvd": {"k": [{"id": "cl3.k1", "label": "Shared goals", "plain": "You know what your group is trying to achieve together.", "cues": ["our goal", "together", "team", "group"]}, {"id": "cl3.k2", "label": "Settling disagreements", "plain": "You know fair ways to settle a disagreement.", "cues": ["disagree", "argument", "vote", "compromise"]}], "s": [{"id": "cl3.s1", "label": "Doing my share", "plain": "You contribute your part to the group's work.", "cues": ["my part", "my share", "contributed", "i did my"]}, {"id": "cl3.s2", "label": "Supporting teammates", "plain": "You help a teammate who is struggling.", "cues": ["helped", "supported", "encouraged", "cheered"]}, {"id": "cl3.s3", "label": "Finding a way forward", "plain": "You help the group move past a disagreement.", "cues": ["compromise", "agreed", "settled", "way forward", "agreed together"]}], "v": [{"id": "cl3.v1", "label": "Empathy", "plain": "You thought about how others feel.", "cues": ["feelings", "how they felt", "how she felt", "how he felt", "put myself", "upset", "for them"]}, {"id": "cl3.v2", "label": "Resilience", "plain": "You kept going after a setback.", "cues": ["tried again", "kept going", "did not give up", "didn't give up", "failed", "setback", "try again"]}, {"id": "cl3.v3", "label": "Responsibility", "plain": "You owned your part and what came of it.", "cues": ["responsible", "my part", "my fault", "owned up", "my job"]}], "d": [{"id": "cl3.d1", "label": "Team spirit", "plain": "You care about the group's success, not only your own.", "cues": ["our team", "together", "as a team", "for the team"]}, {"id": "cl3.d2", "label": "Fairness", "plain": "You make sure everyone gets a fair say.", "cues": ["fair", "everyone", "turns", "each person"]}]}},
  {"id": "cl4", "comp": "collaboration", "n": 4, "name": "Collectively defines and negotiates roles and tasks to achieve group goals", "milestone": {"lower": "At Lower Sec, students can determine and effectively assume the role they will play by considering the dynamics of the group.", "upper": "At Upper Sec, students can reflect on their working relationships with the group and adapt to contribute to the shared goals, as determined collectively by its members."}, "mvv": {"m": ["Active Contributors", "Agile Learners"], "vi": ["Purpose Driven Steward"], "va": ["Discipline", "Adaptability", "Empathy"]}, "lower": ["I can take on a clear role in my group, communicate my responsibilities to my teammates and contribute to a shared work plan.", "I can follow through on my responsibilities and check in with my team to make sure our shared plan is on track."], "upper": ["I can reflect on how I work with others and use this to improve how the group works.", "I can adapt my role to serve the group's needs when the situation calls for it.", "I can help my team define responsibilities collectively and ensure that every member is set up to contribute meaningfully."], "notes": [], "ksvd": {"k": [{"id": "cl4.k1", "label": "Roles and responsibilities", "plain": "You know what each person in the group is responsible for.", "cues": ["role", "in charge of", "responsible for"]}, {"id": "cl4.k2", "label": "A shared plan", "plain": "You know the steps and deadlines the group agreed on.", "cues": ["deadline", "timeline", "group plan", "our plan"]}], "s": [{"id": "cl4.s1", "label": "Taking on a role", "plain": "You take a clear role and tell the group what you will do.", "cues": ["my role", "i was in charge", "i took on", "i volunteered to"]}, {"id": "cl4.s2", "label": "Following through for the team", "plain": "You do what you said you would, on time.", "cues": ["finished my", "on time", "completed", "delivered"]}, {"id": "cl4.s3", "label": "Checking in", "plain": "You check that the group's plan is on track.", "cues": ["checked in", "updated", "reminded", "asked the group"]}], "v": [{"id": "cl4.v1", "label": "Discipline", "plain": "You did what needed doing, carefully and on time.", "cues": ["carefully", "on time", "routine", "every day", "checked again", "stuck to", "step by step"]}, {"id": "cl4.v2", "label": "Adaptability", "plain": "You changed your approach when things changed.", "cues": ["adapted", "adjusted", "changed my", "switched", "new way", "instead"]}, {"id": "cl4.v3", "label": "Responsibility", "plain": "You owned your part and what came of it.", "cues": ["responsible", "my part", "my fault", "owned up", "my job"]}], "d": [{"id": "cl4.d1", "label": "Reliability", "plain": "Your team can count on you.", "cues": ["on time", "as promised", "did my part"]}, {"id": "cl4.d2", "label": "Flexibility in roles", "plain": "You step into a different role when the group needs it.", "cues": ["took over", "filled in", "switched roles", "stepped in"]}]}},
  {"id": "in5", "comp": "information", "n": 5, "name": "Employs effective strategies to locate information and exercises discernment", "milestone": {"lower": "At Lower Sec, students can select, organise and synthesise information from multiple sources and verify the accuracy, credibility and currency of information by cross-referencing multiple sources.", "upper": "At Upper Sec, students can refine search results, organise information systematically and manage information sensitively, and evaluate the accuracy, credibility and relevance of information."}, "mvv": {"m": ["Agile Learners", "Adaptive Thinkers"], "vi": ["Purpose Driven Steward"], "va": ["Mindfulness", "Discipline"]}, "lower": ["I can search for information from multiple sources and check whether it is accurate and credible.", "I can organise the information I find in a way that supports my learning and helps me make better decisions."], "upper": ["I can refine and organise information from diverse sources, assessing its accuracy, credibility and relevance with rigour.", "I can evaluate information by interrogating its assumptions, biases and limitations.", "I can manage information with discernment and sensitivity, and take responsibility for how I apply it in my learning and decision-making."], "notes": ["Reviewer comments: is \"with rigour\" needed; is \"interrogating\" too strong (\"questioning\")?"], "ksvd": {"k": [{"id": "in5.k1", "label": "Credible sources", "plain": "You know how to tell if a source can be trusted.", "cues": ["reliable", "credible", "trust", "official", "source"]}, {"id": "in5.k2", "label": "Bias and limits", "plain": "You know a source can be one sided or incomplete.", "cues": ["bias", "biased", "one sided", "opinion", "missing"]}], "s": [{"id": "in5.s1", "label": "Searching widely", "plain": "You look in more than one place.", "cues": ["searched", "looked up", "several", "multiple", "different websites"]}, {"id": "in5.s2", "label": "Checking accuracy", "plain": "You check information against another source.", "cues": ["cross checked", "compared sources", "checked if true", "verified", "fact check"]}, {"id": "in5.s3", "label": "Organising information", "plain": "You sort information so it helps you decide.", "cues": ["organised", "organized", "sorted", "summary", "mind map"]}], "v": [{"id": "in5.v1", "label": "Mindfulness", "plain": "You paused to notice and think before acting.", "cues": ["noticed", "paused", "aware", "realised", "realized", "thought carefully", "reflected"]}, {"id": "in5.v2", "label": "Discipline", "plain": "You did what needed doing, carefully and on time.", "cues": ["carefully", "on time", "routine", "every day", "checked again", "stuck to", "step by step"]}, {"id": "in5.v3", "label": "Integrity", "plain": "You were honest, even when it was hard.", "cues": ["honest", "admitted", "the truth", "i was wrong", "owned up"]}], "d": [{"id": "in5.d1", "label": "Discernment", "plain": "You think before you believe or share.", "cues": ["not sure if", "doubted", "checked first"]}, {"id": "in5.d2", "label": "Thoroughness", "plain": "You do not stop at the first answer you find.", "cues": ["more sources", "kept looking", "another source"]}]}},
  {"id": "in6", "comp": "information", "n": 6, "name": "Creates and shares information ethically and maintains a positive online presence", "milestone": {"lower": "At Lower Sec, students can consider the impact of what they share and create, maintain positive relationships with others, and acknowledge sources of information.", "upper": "At Upper Sec, students can contribute to information and perspectives shared in constructive and ethical ways, and manage their online reputation and relationships responsibly."}, "mvv": {"m": ["Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Mindfulness", "Discipline", "Empathy"]}, "lower": ["I can share information responsibly by considering its impact on others, whether online or offline.", "I can exercise self-control in how I behave online and offline, making deliberate choices about what I post, share and say."], "upper": ["I can contribute to conversations and platforms in constructive and ethical ways, and hold myself to a high standard of honesty and care in what I share.", "I can manage a positive online presence by being aware that my digital footprint shapes how others see me and what I stand for, now and in the future."], "notes": ["Reviewer comments: Lower Sec 2 overlaps with Lower Sec 1; \"where did this come from?\" on Upper Sec 1."], "ksvd": {"k": [{"id": "in6.k1", "label": "Digital footprint", "plain": "You know what you post stays, and shapes how others see you.", "cues": ["post", "online", "footprint", "social media"]}, {"id": "in6.k2", "label": "Credit and honesty", "plain": "You know to credit others' work and share only what is true.", "cues": ["credit", "cite", "reference", "copied", "plagiarism"]}], "s": [{"id": "in6.s1", "label": "Thinking before sharing", "plain": "You consider the impact before you post or say something.", "cues": ["before posting", "decided not to", "deleted", "thought about how"]}, {"id": "in6.s2", "label": "Self control online", "plain": "You choose carefully what to post, share and say.", "cues": ["did not reply", "didn't reply", "ignored", "chose not"]}, {"id": "in6.s3", "label": "Contributing constructively", "plain": "You add something helpful to a conversation.", "cues": ["helpful comment", "constructive", "kind comment"]}], "v": [{"id": "in6.v1", "label": "Mindfulness", "plain": "You paused to notice and think before acting.", "cues": ["noticed", "paused", "aware", "realised", "realized", "thought carefully", "reflected"]}, {"id": "in6.v2", "label": "Integrity", "plain": "You were honest, even when it was hard.", "cues": ["honest", "admitted", "the truth", "i was wrong", "owned up"]}, {"id": "in6.v3", "label": "Empathy", "plain": "You thought about how others feel.", "cues": ["feelings", "how they felt", "how she felt", "how he felt", "put myself", "upset", "for them"]}], "d": [{"id": "in6.d1", "label": "Self restraint", "plain": "You pause before reacting.", "cues": ["paused", "calmed down", "waited"]}, {"id": "in6.d2", "label": "Care for others", "plain": "You think about how your words land on others.", "cues": ["hurt", "feelings", "kind", "respectful"]}]}},
  {"id": "cv1", "comp": "civic", "n": 1, "name": "Demonstrates understanding of values, ideals and issues of personal, community and national significance", "milestone": {"lower": "At Lower Sec, students can describe and explain issues that affect the culture, social and economic development, governance, future and identity of Singapore, and understand multiple perspectives on them.", "upper": "At Upper Sec, students can explain, analyse, evaluate, and construct new understandings of issues that affect Singapore, and manage tensions among multiple perspectives to work towards a common good."}, "mvv": {"m": ["Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Mindfulness", "Empathy", "Discipline"]}, "lower": ["I can explain issues that affect Singapore's society, culture and future.", "I can understand why people hold different views based on their values and life experiences."], "upper": ["I can analyse issues from multiple perspectives to understand the reasons and values behind each viewpoint.", "I can share thoughtful views on societal issues to contribute positively as a responsible citizen."], "notes": [], "ksvd": {"k": [{"id": "cv1.k1", "label": "Issues facing Singapore", "plain": "You know about issues that affect Singapore's society and future.", "cues": ["singapore", "ageing", "aging", "housing", "policy", "national", "government"]}, {"id": "cv1.k2", "label": "Why views differ", "plain": "You know people's values and lives shape their views.", "cues": ["values", "background", "experience", "because they"]}], "s": [{"id": "cv1.s1", "label": "Explaining an issue", "plain": "You explain a Singapore issue in your own words.", "cues": ["issue", "affects people"]}, {"id": "cv1.s2", "label": "Seeing several sides", "plain": "You look at an issue from more than one group's view.", "cues": ["other side", "elderly", "workers", "residents", "perspective"]}, {"id": "cv1.s3", "label": "Sharing a reasoned view", "plain": "You give your own view with a reason.", "cues": ["i believe", "in my view", "my opinion is"]}], "v": [{"id": "cv1.v1", "label": "Mindfulness", "plain": "You paused to notice and think before acting.", "cues": ["noticed", "paused", "aware", "realised", "realized", "thought carefully", "reflected"]}, {"id": "cv1.v2", "label": "Empathy", "plain": "You thought about how others feel.", "cues": ["feelings", "how they felt", "how she felt", "how he felt", "put myself", "upset", "for them"]}, {"id": "cv1.v3", "label": "Harmony", "plain": "You helped people get along across differences.", "cues": ["get along", "united", "harmony", "included everyone"]}], "d": [{"id": "cv1.d1", "label": "Civic curiosity", "plain": "You want to understand what is happening around you.", "cues": ["news", "current affairs"]}, {"id": "cv1.d2", "label": "Respect for difference", "plain": "You accept that others may hold different views.", "cues": ["different view", "why they believe"]}]}},
  {"id": "cv2", "comp": "civic", "n": 2, "name": "Plays active and constructive roles to improve the school, community and nation", "milestone": {"lower": "At Lower Sec, students can plan and organise programmes with others that contribute to school and community, with support, and can differentiate the civic roles played by individuals, groups and organisations in contributing to the community and nation.", "upper": "At Upper Sec, students can independently identify appropriate and constructive steps to address issues, and initiate, plan and organise programmes with others that contribute to school, community and/or nation, and evaluate the complementary civic roles played by individuals, groups, organisations and government."}, "mvv": {"m": ["Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Empathy", "Resilience", "Discipline"]}, "lower": ["I can work with others to plan and carry out projects that help my school and community.", "I can take steps to make a positive difference on the people around me.", "I can explain how different people and organisations each play a role in making our community better."], "upper": ["I can identify issues that matter and plan constructive ways to address them.", "I can lead group efforts around a common goal to improve my school and community.", "I can evaluate how individuals, groups and organisations work together to build a better society."], "notes": [], "ksvd": {"k": [{"id": "cv2.k1", "label": "Who makes the community work", "plain": "You know how people and organisations each play a part.", "cues": ["community", "organisation", "organization", "volunteers", "town council", "grassroots"]}, {"id": "cv2.k2", "label": "Needs around me", "plain": "You know what people in your school or community need.", "cues": ["elderly", "residents", "needy"]}], "s": [{"id": "cv2.s1", "label": "Planning a project", "plain": "You plan steps to help your school or community.", "cues": ["planned", "project", "organised", "organized", "event"]}, {"id": "cv2.s2", "label": "Taking action", "plain": "You carry out something that helps others.", "cues": ["volunteered", "helped", "cleaned", "collected", "donated"]}, {"id": "cv2.s3", "label": "Leading others", "plain": "You lead a group effort towards a common goal.", "cues": ["led", "leader", "in charge", "coordinated"]}], "v": [{"id": "cv2.v1", "label": "Responsibility", "plain": "You owned your part and what came of it.", "cues": ["responsible", "my part", "my fault", "owned up", "my job"]}, {"id": "cv2.v2", "label": "Care", "plain": "You acted to help others.", "cues": ["helped", "cared", "supported", "looked out for", "kind to"]}, {"id": "cv2.v3", "label": "Resilience", "plain": "You kept going after a setback.", "cues": ["tried again", "kept going", "did not give up", "didn't give up", "failed", "setback", "try again"]}], "d": [{"id": "cv2.d1", "label": "Initiative", "plain": "You act without waiting to be asked.", "cues": ["on my own", "i suggested", "i started", "took the initiative"]}, {"id": "cv2.d2", "label": "Service", "plain": "You want to make a difference for others.", "cues": ["help others", "make a difference", "give back"]}]}},
  {"id": "gl3", "comp": "global", "n": 3, "name": "Aware of global issues, interconnections and trends, and forms informed perspectives", "milestone": {"lower": "At Lower Sec, students can demonstrate awareness of global issues, explain their impact and describe Singapore's role in addressing issues in the global community.", "upper": "At Upper Sec, students can actively find out about global issues, analyse them and discern their implications for individuals, Singapore and other countries."}, "mvv": {"m": ["Adaptive Thinkers", "Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Mindfulness", "Adaptability"]}, "lower": ["I can identify global issues and explain how they affect Singapore and my everyday life.", "I can form my own views on what global events and trends mean for me and my school."], "upper": ["I can research global issues and analyse how these issues impact Singapore and other countries.", "I can develop well-reasoned and responsible views on global events and trends."], "notes": ["The draft notes that another school frames this as considering global issues and trends from multiple perspectives and their relevance to Singapore."], "ksvd": {"k": [{"id": "gl3.k1", "label": "Global issues", "plain": "You know about issues beyond Singapore, such as climate or trade.", "cues": ["climate", "global", "world", "war", "trade", "pandemic"]}, {"id": "gl3.k2", "label": "Interconnections", "plain": "You know how events elsewhere affect Singapore and you.", "cues": ["affects singapore", "import", "prices", "connected"]}], "s": [{"id": "gl3.s1", "label": "Linking global to local", "plain": "You explain how a world issue affects life here.", "cues": ["in singapore", "affects us", "my family", "prices"]}, {"id": "gl3.s2", "label": "Researching a world issue", "plain": "You look into a world issue using reliable sources.", "cues": ["researched", "news", "article", "read about"]}, {"id": "gl3.s3", "label": "Forming a reasoned view", "plain": "You give a view on a world event, with a reason.", "cues": ["i believe", "in my view", "singapore should"]}], "v": [{"id": "gl3.v1", "label": "Mindfulness", "plain": "You paused to notice and think before acting.", "cues": ["noticed", "paused", "aware", "realised", "realized", "thought carefully", "reflected"]}, {"id": "gl3.v2", "label": "Adaptability", "plain": "You changed your approach when things changed.", "cues": ["adapted", "adjusted", "changed my", "switched", "new way", "instead"]}, {"id": "gl3.v3", "label": "Responsibility", "plain": "You owned your part and what came of it.", "cues": ["responsible", "my part", "my fault", "owned up", "my job"]}], "d": [{"id": "gl3.d1", "label": "Global curiosity", "plain": "You want to know what is happening in the world.", "cues": ["news", "curious", "read about"]}, {"id": "gl3.d2", "label": "Open mindedness", "plain": "You consider views from other countries.", "cues": ["other countries", "their view", "another country"]}]}},
  {"id": "gl4", "comp": "global", "n": 4, "name": "Interacts confidently with people from Singapore and beyond on global issues", "milestone": {"lower": "At Lower Sec, students can interact respectfully with people from Singapore and other countries to understand each other better and/or discuss global issues and reach relevant conclusions.", "upper": "At Upper Sec, students can interact respectfully and confidently with people from Singapore and other countries on various platforms to discuss global issues and recommend appropriate actions to address them."}, "mvv": {"m": ["Active Contributors", "Agile Learners"], "vi": ["Purpose Driven Steward"], "va": ["Empathy", "Adaptability"]}, "lower": ["I can interact respectfully with people from different backgrounds and countries.", "I can share my thoughts on global issues with others, listen openly to theirs, and build a common understanding."], "upper": ["I can connect confidently and respectfully with people locally and globally to discuss world issues.", "I can propose realistic, well-informed solutions to global issues while staying sensitive to different needs and perspectives."], "notes": [], "ksvd": {"k": [{"id": "gl4.k1", "label": "People of different countries", "plain": "You know people from other countries may see things differently.", "cues": ["country", "overseas", "foreign", "exchange", "international"]}, {"id": "gl4.k2", "label": "Respectful discussion", "plain": "You know how to discuss an issue respectfully.", "cues": ["respect", "polite", "discussion"]}], "s": [{"id": "gl4.s1", "label": "Interacting respectfully", "plain": "You talk with people from other backgrounds with respect.", "cues": ["talked with", "exchange student", "visitors", "overseas students"]}, {"id": "gl4.s2", "label": "Listening and sharing views", "plain": "You share your view and listen openly to theirs.", "cues": ["shared", "listened", "discussed"]}, {"id": "gl4.s3", "label": "Proposing solutions", "plain": "You suggest a realistic solution to a global problem.", "cues": ["global solution", "countries could"]}], "v": [{"id": "gl4.v1", "label": "Empathy", "plain": "You thought about how others feel.", "cues": ["feelings", "how they felt", "how she felt", "how he felt", "put myself", "upset", "for them"]}, {"id": "gl4.v2", "label": "Adaptability", "plain": "You changed your approach when things changed.", "cues": ["adapted", "adjusted", "changed my", "switched", "new way", "instead"]}, {"id": "gl4.v3", "label": "Respect", "plain": "You treated others and their views with respect.", "cues": ["respect", "listened", "polite", "their view", "valued"]}], "d": [{"id": "gl4.d1", "label": "Confidence with others", "plain": "You reach out to people you do not know yet.", "cues": ["introduced", "reached out", "made friends"]}, {"id": "gl4.d2", "label": "Openness", "plain": "You are open to ideas from other places.", "cues": ["learnt from them", "learned from them", "new to me"]}]}},
  {"id": "cc5", "comp": "crosscultural", "n": 5, "name": "Aware of and appreciates the cultural background and identity of self and others", "milestone": {"lower": "At Lower Sec, students can appreciate the value of a diversity of cultural and religious communities' heritage, customs, and perspectives, and their contributions to Singapore and the world.", "upper": "At Upper Sec, students can appreciate the value of a diversity of cultural and religious communities' heritage, customs, perspectives, and contributions, and identify commonalities between one's own and other cultures."}, "mvv": {"m": ["Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Empathy", "Mindfulness"]}, "lower": ["I can respect and value the traditions, cultures, and beliefs of different communities in Singapore and around the world.", "I can reflect on how my own culture and background shape how I view the world."], "upper": ["I can understand how different cultural histories and life experiences shape the way people see themselves and society.", "I can find common ground and shared values across different cultural and religious backgrounds.", "I can use my understanding of cultural diversity to build meaningful relationships based on mutual respect."], "notes": [], "ksvd": {"k": [{"id": "cc5.k1", "label": "Cultures and traditions", "plain": "You know about the traditions and beliefs of different communities.", "cues": ["culture", "tradition", "festival", "religion", "custom", "race"]}, {"id": "cc5.k2", "label": "How my background shapes me", "plain": "You know your own culture shapes how you see things.", "cues": ["my culture", "my family", "my background", "at home we"]}], "s": [{"id": "cc5.s1", "label": "Learning about other cultures", "plain": "You find out about a culture different from yours.", "cues": ["learnt about their", "learned about their", "asked about their", "their culture"]}, {"id": "cc5.s2", "label": "Reflecting on my own view", "plain": "You notice how your background shapes your view.", "cues": ["because of my", "i grew up", "my own view"]}, {"id": "cc5.s3", "label": "Finding common ground", "plain": "You find shared values across differences.", "cues": ["in common", "common ground", "shared values", "both of us"]}], "v": [{"id": "cc5.v1", "label": "Empathy", "plain": "You thought about how others feel.", "cues": ["feelings", "how they felt", "how she felt", "how he felt", "put myself", "upset", "for them"]}, {"id": "cc5.v2", "label": "Respect", "plain": "You treated others and their views with respect.", "cues": ["respect", "listened", "polite", "their view", "valued"]}, {"id": "cc5.v3", "label": "Harmony", "plain": "You helped people get along across differences.", "cues": ["get along", "united", "harmony", "included everyone"]}], "d": [{"id": "cc5.d1", "label": "Appreciation", "plain": "You value differences instead of judging them.", "cues": ["appreciate", "respect their"]}, {"id": "cc5.d2", "label": "Curiosity about cultures", "plain": "You want to learn about other ways of life.", "cues": ["curious about their", "wondered about their"]}]}},
  {"id": "cc6", "comp": "crosscultural", "n": 6, "name": "Shows sensitivity and openness in interactions with diverse communities to promote social cohesion", "milestone": {"lower": "At Lower Sec, students can demonstrate empathy, awareness of their own biases, and appropriate behaviour towards the lived experiences of people from different social, cultural and religious backgrounds within and beyond Singapore.", "upper": "At Upper Sec, students can demonstrate appropriate skills and behaviour to work together with people from a diverse range of social, cultural and religious backgrounds within and beyond Singapore, and contribute to promoting social cohesion."}, "mvv": {"m": ["Active Contributors"], "vi": ["Purpose Driven Steward"], "va": ["Empathy", "Adaptability", "Mindfulness"]}, "lower": ["I can identify my own assumptions and biases and see how they affect how I treat others.", "I can show empathy and respect to people from all backgrounds to help build a united school and community."], "upper": ["I can collaborate effectively with diverse teams by respecting differences and bringing out the best in everyone.", "I can bridge differences and promote social harmony in my school, community, and nation."], "notes": [], "ksvd": {"k": [{"id": "cc6.k1", "label": "Assumptions and bias", "plain": "You know everyone has assumptions that can affect how they treat others.", "cues": ["assumed", "assumption", "stereotype", "bias", "judged"]}, {"id": "cc6.k2", "label": "What holds a community together", "plain": "You know what helps people of different backgrounds live well together.", "cues": ["harmony", "united", "cohesion"]}], "s": [{"id": "cc6.s1", "label": "Checking my assumptions", "plain": "You notice an assumption you made, and question it.", "cues": ["i assumed", "i was wrong about", "i judged", "turned out"]}, {"id": "cc6.s2", "label": "Including others", "plain": "You make sure people of all backgrounds are included.", "cues": ["included", "invited", "welcomed", "made sure everyone"]}, {"id": "cc6.s3", "label": "Bridging differences", "plain": "You help people who differ to work together.", "cues": ["brought together", "helped them understand", "bridge"]}], "v": [{"id": "cc6.v1", "label": "Empathy", "plain": "You thought about how others feel.", "cues": ["feelings", "how they felt", "how she felt", "how he felt", "put myself", "upset", "for them"]}, {"id": "cc6.v2", "label": "Harmony", "plain": "You helped people get along across differences.", "cues": ["get along", "united", "harmony", "included everyone"]}, {"id": "cc6.v3", "label": "Respect", "plain": "You treated others and their views with respect.", "cues": ["respect", "listened", "polite", "their view", "valued"]}], "d": [{"id": "cc6.d1", "label": "Humility", "plain": "You accept that your first view may be wrong.", "cues": ["i was wrong", "i misjudged"]}, {"id": "cc6.d2", "label": "Inclusiveness", "plain": "You look out for those who are left out.", "cues": ["left out", "included them", "made sure everyone"]}]}}
]};
const BAND_LABEL = {lower:'Lower Sec', upper:'Upper Sec'};
/* ---------- knowledge, skills, values and dispositions ----------
   Each strand (and each social and emotional competency) breaks into what a
   student understands (k), does (s), shows they care about (v) and their
   habits of mind (d). Fixed ids, so evidence builds up under the same names. */
const KSVD_TYPES = ['k', 's', 'v', 'd'];
const KSVD_NAME = {k:'Knowledge', s:'Skill', v:'Value', d:'Disposition'};
function normaliseKsvdMap(m, comp, strand){
  const out = {k:[], s:[], v:[], d:[]}; if (!m || typeof m !== 'object') return out;
  for (const t of KSVD_TYPES) for (const it of (Array.isArray(m[t]) ? m[t] : [])) if (it && it.id && it.label) out[t].push({id:String(it.id), type:t, comp, strand, label:String(it.label), plain:String(it.plain || ''), cues:Array.isArray(it.cues) ? it.cues.map(x => String(x).toLowerCase()) : []});
  return out;
}
/* Every KSVD item of a competency, across its strands. */
function ksvdFor(set, comp){
  if (!set || !set.strands) return [];
  const maps = set.strands.filter(s => s.comp === comp).map(s => s.ksvd).concat(set.secKsvd && set.secKsvd[comp] ? [set.secKsvd[comp]] : []);
  return maps.flatMap(m => KSVD_TYPES.flatMap(t => m[t]));
}
function ksvdById(set, id){ return (set && set.ksvdIndex && set.ksvdIndex[id]) || null; }
function normaliseStatementSet(raw){
  if (!raw || typeof raw !== 'object') return null;
  const base = {id:String(raw.id || 'custom'), version:raw.version || 1, placeholder:!!raw.placeholder, draft:String(raw.draft || ''), title:String(raw.title || 'I can statements'), about:String(raw.about || ''), mvvKey:raw.mvvKey || null};
  if (Array.isArray(raw.strands)){
    const strands = [], list = [], seen = new Set();
    for (const st of raw.strands){
      const c = st && compOf(st.comp); if (!c || !st.id) continue;
      const strand = {id:String(st.id), comp:c.id, basket:c.d, n:Number(st.n) || strands.filter(x => x.comp === c.id).length + 1, name:String(st.name || ''), milestone:st.milestone || {}, mvv:st.mvv || {m:[], vi:[], va:[]}, notes:Array.isArray(st.notes) ? st.notes : [], ksvd:normaliseKsvdMap(st.ksvd, c.id, String(st.id)), lower:[], upper:[]};
      for (const band of ['lower', 'upper']) (Array.isArray(st[band]) ? st[band] : []).forEach((text, i) => {
        if (!text) return; const id = `${strand.id}.${band[0]}${i + 1}`; if (seen.has(id)) return; seen.add(id);
        const s = {id, comp:c.id, competencies:[c.id], basket:c.d, band, strand:strand.id, strandName:strand.name, strandN:strand.n, rung:i + 1, level:null, text:String(text).trim(), mvv:strand.mvv};
        strand[band].push(s); list.push(s);
      });
      strands.push(strand);
    }
    const bands = Array.isArray(raw.bands) && raw.bands.length ? raw.bands.map(b => ({id:String(b.id), label:String(b.label || BAND_LABEL[b.id] || b.id), levels:Array.isArray(b.levels) ? b.levels.map(Number) : []})) : [{id:'lower', label:'Lower Sec', levels:[1, 2]}, {id:'upper', label:'Upper Sec', levels:[3, 4, 5]}];
    // knowledge, skills, values and dispositions: by strand, and for the social and emotional competencies by competency
    const secKsvd = {}; for (const [cid, m] of Object.entries(raw.secKsvd || {})) if (compOf(cid)) secKsvd[cid] = normaliseKsvdMap(m, cid, 'sec.' + cid);
    const ksvdIndex = {}; for (const m of strands.map(x => x.ksvd).concat(Object.values(secKsvd))) for (const t of KSVD_TYPES) for (const it of m[t]) ksvdIndex[it.id] = it;
    return {...base, bands, strands, list, secKsvd, ksvdIndex, ksvdAbout:String(raw.ksvdAbout || '')};
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
   Level 1: the competency shows in an entry, or any statement is secured.
   Level 2: in every strand, the Lower Sec band is met or an Upper Sec statement is secured.
   Level 3: the Upper Sec band met in every strand, and a teacher has confirmed it.
   v3 has three levels. v2's fourth, Leading, folds into Level 3; its teacher
   confirmations carry over, because both mean the top level was confirmed.
   Competencies without statements (the social and emotional ones, for now) have no level. */
const LOG_LEVELS = [
  {id:'emerging', label:'Emerging', help:'It shows in your entries. Now secure its statements.'},
  {id:'developing', label:'Developing', help:'You have secured the Lower Sec statements in each strand.'},
  {id:'proficient', label:'Proficient', help:'You have secured the Upper Sec statements in each strand, and a teacher has confirmed it.'}
];
/* The words a student sees for the three levels follow their look. Teachers always see the
   standard words (look A), so a class can share one language whatever each student chose. */
const LEVEL_WORDS = {a:['Emerging', 'Developing', 'Proficient'], b:['Setting Sail', 'Navigating', 'Charting'], c:['Level 1', 'Level 2', 'Level 3'], d:['One star', 'Two stars', 'Three stars']};
let LEVEL_LOOK = 'a';
function setLevelWords(look){ LEVEL_LOOK = LEVEL_WORDS[look] ? look : 'a'; }
function levelWords(look){ return LEVEL_WORDS[look || LEVEL_LOOK] || LEVEL_WORDS.a; }
const OLD_LEVEL = {leading:'proficient'};
function levelIdx(id){ return LOG_LEVELS.findIndex(x => x.id === (OLD_LEVEL[id] || id)) + 1; }
function levelLabel(id, look){ const i = levelIdx(id); return i ? levelWords(look)[i - 1] : 'Not started'; }
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
  const waiting = idx === 2 && upperAll && !conf;
  if (idx === 2 && upperAll && conf) idx = 3;
  const W = levelWords();
  // the next step and the statement to aim for
  const firstOpen = list => (list.find(x => !x.secured && x.backing.length) || list.find(x => !x.secured) || {}).stmt || null;
  let next = '', target = null; const q = s => `“${s}”`;
  const n = (k, w, more) => `${k === 1 ? 'one' : k}${more ? ' more' : ''} ${w}${k === 1 ? '' : 's'}`;
  if (idx === 0){ next = 'Write an entry that shows it, then link it to a statement.'; target = firstOpen(rows[0].lower); }
  else if (idx === 1){ const r = rows.find(x => !(x.lowerMet || x.su > 0)); target = firstOpen(r.lower); next = `To reach ${W[1]}, secure ${n(r.needLower, 'Lower Sec statement', r.sl > 0)} in ${q(r.strand.name)}.`; }
  else if (idx === 2 && !waiting){ const r = rows.slice().sort((a, b) => (a.upperMet - b.upperMet) || b.su - a.su)[0]; target = firstOpen(r.upper); next = `To reach ${W[2]}, secure ${n(r.needUpper, 'Upper Sec statement', r.su > 0)} in ${q(r.strand.name)}.`; }
  else if (waiting) next = `${W[2]}: waiting for a teacher. Share your log with a teacher and ask them to confirm it.`;
  // how many statements stand between this competency and its next level: Home's longer term step uses it
  const need = idx === 0 ? 1 : idx === 1 ? rows.filter(x => !(x.lowerMet || x.su > 0)).reduce((k, x) => k + x.needLower, 0) : idx === 2 && !waiting ? rows.reduce((k, x) => k + x.needUpper, 0) : 0;
  return {comp, level:idx ? LOG_LEVELS[idx - 1].id : null, idx, none:false, strands:rows, secured, total:all.length, waiting, confirmed:conf || null, next, target, need};
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
  // the student's year (Sec 1 to 5) sets their band of statements; a teacher's confirmation of the top level, by competency
  if (p.level === undefined) p.level = null;
  if (!p.confirmed || typeof p.confirmed !== 'object') p.confirmed = {};
  p.prefs.journal = Object.assign({pivot:'experience', view:'bookmarks'}, p.prefs.journal || {});
  // the student's own subjects, CCA and other experiences: nothing is assumed
  p.experiences = Object.assign({subjects:[], cca:'', others:[], levels:{}}, p.experiences || {});
  if (!p.experiences.levels || typeof p.experiences.levels !== 'object') p.experiences.levels = {};
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
