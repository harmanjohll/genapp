// A Learning Log v1 database: two profiles, one with a PIN, drafts, entries with reads.
const crypto = require('crypto');
const day = 864e5; const T = Date.parse('2026-10-12T09:00:00+08:00');
function sha(s){ return crypto.createHash('sha256').update(s).digest('hex'); }
function e(id, kind, t, subject, topic, answers, comps, ev){
  return {id, kind, created:t, updated:t, subject, topic, feedbackFrom:'teacher', feedbackText: kind==='act' ? 'Your conclusion does not use the data from Table 2.' : '', answers, competencies:comps,
    coach:{builtin:{source:'builtin', depth:'working', gift:'g', stretch:'s', question:'What would you check first next time?', competency:'c'}, ai:null},
    e21cc:{source:'builtin', at:t, stance:'competency', stance_note:'n', evidence:ev, suggested:[], tagged_not_shown:[], probe:'p', probe_for:'critical'}};
}
const aisha = {id:'p1', name:'Aisha Tan', email:'aisha_tan@students.edu.sg', classCode:'DEMO', pin:null, created:T-90*day,
  prefs:{mood:'mountain', accent:'yellow', size:'normal', avatar:'🌱', motto:'Believe you can.'}, coach:{mode:'builtin', key:'', relayUrl:'', token:'', model:'claude-opus-5'},
  entries:[
    e('e1','grow',T-80*day,'Chemistry','Titration',{g1:'I checked both readings because the first titre was too high, so I decided to repeat it.', g2:'I would show my friend the burette and explain why the meniscus matters.', r1:'I do not yet understand why we swirl the flask.', r2:'Redo Q3 on Tuesday after CCA for 20 minutes.'},[{id:'critical',level:2,where:'checked both readings'}],
      [{id:'critical',strength:'strong',quote:'I checked both readings because the first titre was too high, so I decided to repeat it',why:'w'}]),
    e('e2','act',T-40*day,'English','Argumentative essay',{a1:'I felt annoyed at first but the comment is fair.', c1:'It connects to the criterion on using evidence.', t1:'Instead of listing points I will explain each one with an example, starting with Friday homework.', t2:'My next essay will have a reason after every claim.'},[{id:'selfaware',level:1,where:''}],
      [{id:'selfaware',strength:'clear',quote:'I felt annoyed at first but the comment is fair',why:'w'}]),
    e('e3','grow',T-3*day,'Football CCA','Set pieces',{g1:'Our team agreed on who marks whom at corners, and we decided together to switch when it did not work.', r2:'Practise heading with Ravi on Thursday at 4pm for 15 minutes.'},[{id:'collaboration',level:2,where:'decided together'}],
      [{id:'collaboration',strength:'strong',quote:'Our team agreed on who marks whom at corners, and we decided together to switch when it did not work',why:'w'},{id:'adaptive',strength:'clear',quote:'we decided together to switch when it did not work',why:'w'}])
  ], drafts:{grow:{kind:'grow', step:1, subject:'Physics', topic:'Moments', answers:{g1:'draft words'}, competencies:[]}}, done:{}};
aisha.entries[0].pushed = {at:T-79*day, kind:'msforms'};
const ben = {id:'p2', name:'Ben Lim', email:'ben_lim@students.edu.sg', classCode:'', pin:sha('ben_lim@students.edu.sg:1234'), created:T-10*day,
  prefs:{mood:'paper', accent:'mint', size:'normal', avatar:'🦉', motto:'Small steps, every week.'}, coach:{mode:'builtin'}, entries:[], drafts:{}, done:{}};
module.exports = {v1:{profiles:{p1:aisha, p2:ben}, current:null, classes:{}}, T};
