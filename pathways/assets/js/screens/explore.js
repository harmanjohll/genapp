// Explore: everything that is not "my year" or "my plan", behind one door.
//
// The destinations and the game were two of five equal nav items, competing
// with the planning path for a first-time student's attention. Here they sit
// together as things to wander through once the plan has a shape.

import { getState } from '../state.js?v=4.1.0';
import { reach } from '../engine/reach.js?v=4.1.0';
import { signalStrip } from '../ui/signal.js?v=4.1.0';
import { skyline } from '../ui/scenes.js?v=4.1.0';
import { onAction } from '../ui/dom.js?v=4.1.0';
import { icon } from '../ui/icons.js?v=4.1.0';

export default {
  id: 'explore',
  title: 'Pathways',
  era: 'school',
  render(root, api) {
    const st = getState();
    document.body.dataset.dock = 'off';
    const c = api.ctx();
    const rows = c.destinations.map((d) => reach(c.plan, d, c));
    const open = rows.filter((r) => r.state === 'open').length;
    root.innerHTML = `
    <div class="wrap homewrap">
      <h1 class="ex-h">Pathways</h1>
      <div class="ex-grid">
        <button type="button" class="ex-card ex-after press arrive" data-action="go" data-s="after">
          <span class="ex-t">Where can I go after Sec?</span>
          <span class="ex-p">Eight places, what each asks, what it costs, and the other ways in.</span>
          <span class="ex-sig">${signalStrip(rows, { key: 'explore' })}<span class="ex-n"><b>${open}</b>/8 open</span></span>
          <span class="ex-go">${icon('arrow')}</span>
        </button>
        <button type="button" class="ex-card ex-play press arrive d1" data-action="go" data-s="play">
          <span class="ex-art" aria-hidden="true">${skyline('school')}</span>
          <span class="ex-t">Play a life forward</span>
          <span class="ex-p">${st.liveRun ? 'Your story is mid chapter.' : 'From your subjects to age 35. No choice ends the story.'}</span>
          <span class="ex-go">${icon('play')}</span>
        </button>
        <button type="button" class="ex-card ex-small press arrive d2" data-action="go" data-s="work">${icon('d_portfolio')}<span class="ex-t">Jobs and sectors</span></button>
        <button type="button" class="ex-card ex-small press arrive d2" data-action="go" data-s="money">${icon('target')}<span class="ex-t">Fees and financial help</span></button>
        <button type="button" class="ex-card ex-small press arrive d3" data-action="go" data-s="schools">${icon('home')}<span class="ex-t">My school type</span></button>
        <button type="button" class="ex-card ex-small press arrive d3" data-action="go" data-s="adults">${icon('d_people')}<span class="ex-t">For parents and teachers</span></button>
      </div>
    </div>`;
    onAction(root, {});
  },
};
