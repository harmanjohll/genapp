// ===== Tab switching =====
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.tab-panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(target).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// ===== Show, Don't Tell — emotion examples =====
const emotions = [
  {
    name: 'Sad',
    accent: '#5c6bc0',
    tell: 'She was very sad.',
    show: 'Her shoulders slumped. A single tear traced a slow path down her cheek as she stared at her shoes, unable to meet anyone\'s eyes.'
  },
  {
    name: 'Happy',
    accent: '#ffd54f',
    tell: 'He was so happy.',
    show: 'A grin spread across his face like sunshine breaking through clouds. He bounced on his toes, unable to stand still, his eyes shining.'
  },
  {
    name: 'Angry',
    accent: '#e53935',
    tell: 'I was very angry.',
    show: 'My jaw clenched so hard my teeth ached. My fists balled at my sides, and I felt the heat rising from my chest all the way to my ears.'
  },
  {
    name: 'Scared',
    accent: '#7e57c2',
    tell: 'She was scared.',
    show: 'Her breath came in short, ragged gasps. She pressed her back against the wall, her wide eyes darting around the dark room as her legs turned to jelly.'
  },
  {
    name: 'Nervous',
    accent: '#26a69a',
    tell: 'He felt nervous.',
    show: 'His palms were slick with sweat. He wiped them on his shorts for the tenth time, his heart drumming a frantic beat against his ribs.'
  },
  {
    name: 'Excited',
    accent: '#ff7043',
    tell: 'They were excited.',
    show: 'They could barely sit still in their seats. Lisa kept tapping her foot against the chair leg, while Marcus bounced up and down whispering, "Is it time yet? Is it time yet?"'
  },
  {
    name: 'Embarrassed',
    accent: '#ec407a',
    tell: 'I was embarrassed.',
    show: 'My cheeks burned like a hot stove. I stared at the floor, wishing it would open up and swallow me whole as the laughter echoed around the classroom.'
  },
  {
    name: 'Surprised',
    accent: '#42a5f5',
    tell: 'She was surprised.',
    show: 'Her mouth fell open. The book slipped from her fingers and thumped onto the floor, but she didn\'t even notice. "What?" she finally whispered.'
  },
  {
    name: 'Disappointed',
    accent: '#8d6e63',
    tell: 'He was disappointed.',
    show: 'His smile faded. He nodded slowly, but his eyes had lost their shine. "Oh," he said softly, looking down at his trophy-less hands.'
  },
  {
    name: 'Proud',
    accent: '#66bb6a',
    tell: 'I felt proud.',
    show: 'I stood a little taller. A warm glow filled my chest as I held up the certificate, and I caught Mother dabbing her eyes in the front row.'
  },
  {
    name: 'Confused',
    accent: '#ab47bc',
    tell: 'She was confused.',
    show: 'Her brows knitted together. She turned the letter over in her hands, then over again, as if the answer might be hiding on the back.'
  },
  {
    name: 'Tired',
    accent: '#78909c',
    tell: 'He was tired.',
    show: 'His eyelids felt as heavy as stones. He dragged his feet down the corridor, his schoolbag suddenly weighing a tonne against his aching shoulders.'
  },
  {
    name: 'Lonely',
    accent: '#5c6bc0',
    tell: 'I felt lonely.',
    show: 'I sat at the corner of the canteen, picking at my rice. Around me, laughter exploded from every table — but none of it was for me. The empty seat across from me seemed to grow wider with every passing second.'
  },
  {
    name: 'Jealous',
    accent: '#9ccc65',
    tell: 'She was jealous.',
    show: 'A bitter twist tightened her stomach as she watched them laugh together. She forced a smile, but her hands gripped her pencil so tightly the wood creaked.'
  },
  {
    name: 'Guilty',
    accent: '#bcaaa4',
    tell: 'He felt guilty.',
    show: 'His stomach churned. He couldn\'t look his mother in the eye, and the lie sat in his mouth like a lump of cold porridge he couldn\'t swallow.'
  },
  {
    name: 'Relieved',
    accent: '#4dd0e1',
    tell: 'I was relieved.',
    show: 'A long breath rushed out of me. My shoulders dropped, and I felt my whole body soften, as though someone had finally let go of a rope that had been pulling me tight.'
  },
  {
    name: 'Shocked',
    accent: '#ef5350',
    tell: 'She was shocked.',
    show: 'The colour drained from her face. She gripped the edge of the table, her knees suddenly weak, and the world around her seemed to slow to a crawl.'
  },
  {
    name: 'Worried',
    accent: '#ffa726',
    tell: 'He was worried.',
    show: 'He chewed his bottom lip and glanced at the clock for the hundredth time. His mother still wasn\'t home. He paced from the window to the door and back again.'
  }
];

const grid = document.getElementById('emotion-grid');
emotions.forEach(e => {
  const card = document.createElement('div');
  card.className = 'emotion-card';
  card.style.setProperty('--accent', e.accent);
  card.innerHTML = `
    <h3>${e.name}</h3>
    <div class="tell"><span class="mini-label">TELL (boring):</span><br>${e.tell}</div>
    <div class="show"><span class="mini-label">SHOW (great!):</span><br>${e.show}</div>
  `;
  grid.appendChild(card);
});

// ===== Practice mode — word counter =====
const textareas = document.querySelectorAll('.practice-step textarea');
const totalEl = document.getElementById('total-words');
const progressFill = document.getElementById('progress-fill');

function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function updateCounts() {
  let total = 0;
  textareas.forEach(ta => {
    const count = countWords(ta.value);
    total += count;
    const counter = ta.parentElement.querySelector('.counter .words');
    if (counter) counter.textContent = count;
  });
  totalEl.textContent = total;
  // Progress bar: 400 words = 100%
  const pct = Math.min(100, (total / 400) * 100);
  progressFill.style.width = pct + '%';

  // Save to localStorage
  const data = {};
  textareas.forEach(ta => { data[ta.dataset.section] = ta.value; });
  try { localStorage.setItem('p6el-essay', JSON.stringify(data)); } catch (e) {}
}

textareas.forEach(ta => ta.addEventListener('input', updateCounts));

// Restore from localStorage
try {
  const saved = JSON.parse(localStorage.getItem('p6el-essay') || '{}');
  textareas.forEach(ta => {
    if (saved[ta.dataset.section]) ta.value = saved[ta.dataset.section];
  });
  updateCounts();
} catch (e) {}

// ===== Preview =====
const previewBtn = document.getElementById('preview-btn');
const closePreview = document.getElementById('close-preview');
const previewBox = document.getElementById('preview');
const previewContent = document.getElementById('preview-content');

previewBtn.addEventListener('click', () => {
  const sections = ['intro', 'rising', 'climax', 'falling', 'conclusion'];
  let html = '';
  sections.forEach(s => {
    const ta = document.querySelector(`textarea[data-section="${s}"]`);
    if (ta && ta.value.trim()) {
      html += `<p>${ta.value.replace(/\n/g, '<br>')}</p>`;
    }
  });
  if (!html) {
    previewContent.innerHTML = '<p><em>You haven\'t written anything yet! Fill in the steps above first.</em></p>';
  } else {
    previewContent.innerHTML = html;
  }
  previewBox.classList.remove('hidden');
  previewBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

closePreview.addEventListener('click', () => {
  previewBox.classList.add('hidden');
});

// ===== Clear =====
const clearBtn = document.getElementById('clear-btn');
clearBtn.addEventListener('click', () => {
  if (confirm('Clear all your writing? This cannot be undone.')) {
    textareas.forEach(ta => { ta.value = ''; });
    updateCounts();
    previewBox.classList.add('hidden');
  }
});
