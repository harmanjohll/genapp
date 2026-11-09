// A goal with a step due yesterday, an if then line, a week answered partly and an entry that names it, so the colour
// sweep and the route audit see the goal loop (5.1): the step to check, the weeks so far, and the entries listed.
module.exports = function withGoal(P){
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const yday = Date.now() - 864e5, ago = Date.now() - 10 * 864e5, ymd = t => new Date(t).toLocaleDateString('en-CA');
  P.goals = [{id:'ag1', kind:'grade', subject:'Chemistry', level:'G3', now:'B4', target:'B3', result:'eoy', why:'To keep a pathway open',
    steps:[`Every ${DAYS[new Date(yday).getDay()]}: redo the questions I got wrong`, 'If I run out of time, or feel stressed, then I will do just ten minutes'],
    stepChecks:{['0:' + ymd(yday - 7 * 864e5)]:{answer:'partly', at:yday - 7 * 864e5}}, checks:[], created:ago, updated:ago}];
  if (P.entries[0]) P.entries[0].goal = 'ag1';
  return P;
};
