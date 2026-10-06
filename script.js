const modal = document.querySelector('#game-modal');
const mount = document.querySelector('#game-mount');
const modalName = document.querySelector('#modal-game-name');
const gameNames = {minesweeper:'Minesweeper',tetris:'Tetris','2048':'2048'};
let cleanupGame = null;
let soundEnabled = true;
let audioContext = null;
const pointsStorageKey = 'pixelPartyPoints';
let playerPoints = Number.parseInt(localStorage.getItem(pointsStorageKey) || '0', 10) || 0;
const galaxyOwnedStorageKey = 'pixelPartyGalaxyOwned';
const textureStorageKey = 'pixelPartyTexture';
let galaxyOwned = localStorage.getItem(galaxyOwnedStorageKey) === 'true';
let equippedTexture = localStorage.getItem(textureStorageKey) || 'classic';
if (equippedTexture === 'galaxy' && !galaxyOwned) equippedTexture = 'classic';
let highlightedTexture = equippedTexture;
const blockombStorageKey = 'pixelPartyBlockombs';
let blockombCount = Number.parseInt(localStorage.getItem(blockombStorageKey) || '0', 10) || 0;

function renderPoints() {
  document.querySelectorAll('[data-points-balance]').forEach(element => { element.textContent = `${playerPoints} pts`; });
}

function renderPowerupMenu() {
  const loadout = document.querySelector('#powerup-loadout');
  const buyButton = document.querySelector('#blockomb-buy');
  if (buyButton) buyButton.textContent = 'buy blockomb';
  if (loadout) loadout.innerHTML = `<div class="powerup-inventory"><img src="assets/blockomb.png" alt="" /><div><strong>Blockomb</strong><span>${blockombCount} in your inventory</span></div><span class="powerup-note">usable in Tetris</span></div>`;
}

function buyBlockomb() {
  if (playerPoints < 200) return;
  playerPoints -= 200;
  blockombCount += 1;
  localStorage.setItem(pointsStorageKey, String(playerPoints));
  localStorage.setItem(blockombStorageKey, String(blockombCount));
  renderPoints();
  renderPowerupMenu();
}

function setupCollectionTabs() {
  document.querySelectorAll('.collection-tabs').forEach(tabGroup => {
    tabGroup.querySelectorAll('.collection-tab').forEach(tab => { tab.onclick = () => { tabGroup.querySelectorAll('.collection-tab').forEach(item => { item.classList.toggle('active', item === tab); item.setAttribute('aria-selected', item === tab ? 'true' : 'false'); }); const section = tabGroup.parentElement; section.querySelectorAll(':scope > .collection-panel').forEach(panel => { panel.hidden = panel.id !== tab.dataset.collectionTab; }); }; });
  });
}

function awardPoints(amount) {
  const awarded = Math.max(0, amount);
  playerPoints += awarded;
  localStorage.setItem(pointsStorageKey, String(playerPoints));
  renderPoints();
  return awarded;
}

function applyTexture() {
  document.body.classList.toggle('galaxy-theme', equippedTexture === 'galaxy' && galaxyOwned);
}

function renderTexturePreview() {
  const panel = document.querySelector('#theme-preview-panel');
  if (!panel) return;
  const galaxy = highlightedTexture === 'galaxy';
  const previewImage = galaxy ? 'assets/galaxy-tetris-preview.png' : 'assets/classic-tetris-preview.png';
  const previewAlt = galaxy ? 'Still image of a pink Tetris piece falling through a Galaxy-themed board' : 'Still image of a yellow Tetris piece falling through the Classic-themed board';
  panel.innerHTML = `<p class="shop-item-kicker">texture pack</p><h3>${galaxy ? 'Galaxy' : 'Classic'}</h3><div class="preview-tetris-image-wrap"><img class="preview-tetris-image" src="${previewImage}" alt="${previewAlt}" /></div><p class="preview-caption">${galaxy ? 'A neon starfield, midnight boards, and cosmic piece colors.' : 'The original warm Pixel Party palette.'}</p>`;
}

function updateHighlightedTexture() {
  const loadout = document.querySelector('#texture-loadout');
  if (!loadout) return;
  const items = [...loadout.querySelectorAll('.texture-option')];
  if (!items.length) return;
  const center = loadout.getBoundingClientRect().top + loadout.clientHeight / 2;
  const closest = items.reduce((best, item) => { const distance = Math.abs(item.getBoundingClientRect().top + item.offsetHeight / 2 - center); return distance < best.distance ? {item,distance} : best; }, {item:items[0],distance:Infinity}).item;
  highlightedTexture = closest.dataset.texture;
  items.forEach(item => item.classList.toggle('highlighted', item === closest));
  renderTexturePreview();
}

function centerTexture(texture) {
  const loadout = document.querySelector('#texture-loadout');
  const item = loadout?.querySelector(`[data-texture="${texture}"]`);
  if (!loadout || !item) return;
  loadout.scrollTop = item.offsetTop - (loadout.clientHeight - item.offsetHeight) / 2;
  updateHighlightedTexture();
}

function renderTextureMenu() {
  const loadout = document.querySelector('#texture-loadout');
  const buyButton = document.querySelector('#galaxy-buy');
  if (!loadout || !buyButton) return;
  buyButton.textContent = galaxyOwned ? 'owned' : 'buy texture pack';
  buyButton.disabled = galaxyOwned || playerPoints < 2000;
  const textures = `<div class="texture-scroll-spacer" aria-hidden="true"></div><div class="texture-option" data-texture="classic"><div><strong>Classic</strong><span>Original Pixel Party look</span></div><button class="game-action" data-texture-button="classic">${equippedTexture === 'classic' ? 'equipped' : 'equip'}</button></div>${galaxyOwned ? `<div class="texture-option" data-texture="galaxy"><div><strong>Galaxy</strong><span>Deep-space game UI</span></div><button class="game-action" data-texture-button="galaxy">${equippedTexture === 'galaxy' ? 'equipped' : 'equip'}</button></div>` : ''}<div class="texture-scroll-spacer" aria-hidden="true"></div>`;
  loadout.innerHTML = textures;
  loadout.onscroll = updateHighlightedTexture;
  loadout.querySelectorAll('[data-texture-button]').forEach(button => { button.onclick = event => { event.stopPropagation(); equippedTexture = button.dataset.textureButton; localStorage.setItem(textureStorageKey, equippedTexture); highlightedTexture = equippedTexture; applyTexture(); renderTextureMenu(); }; });
  requestAnimationFrame(() => centerTexture(highlightedTexture));
}

function buyGalaxy() {
  if (galaxyOwned || playerPoints < 2000) return;
  playerPoints -= 2000;
  localStorage.setItem(pointsStorageKey, String(playerPoints));
  galaxyOwned = true;
  localStorage.setItem(galaxyOwnedStorageKey, 'true');
  renderPoints();
  renderTextureMenu();
}

document.querySelectorAll('.game-card').forEach(card => card.addEventListener('click', () => openGame(card.dataset.game)));
document.querySelector('#close-game').addEventListener('click', closeGame);
modal.addEventListener('click', e => { if (e.target === modal) closeGame(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeGame(); });
renderPoints();
applyTexture();
renderTextureMenu();
renderPowerupMenu();
setupCollectionTabs();
document.querySelector('#galaxy-buy')?.addEventListener('click', buyGalaxy);
document.querySelector('#blockomb-buy')?.addEventListener('click', buyBlockomb);
function openGame(game) { modalName.textContent = gameNames[game]; modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; mount.innerHTML=''; if(game==='minesweeper') cleanupGame=renderMinesweeper(); if(game==='tetris') cleanupGame=renderTetris(); if(game==='2048') cleanupGame=render2048(); }
function closeGame() { if(cleanupGame) cleanupGame(); cleanupGame=null; modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
function shell(title, subtitle, scoreLabel) { return `<div class="modal-game"><div class="game-top"><div><h2>${title}</h2><p>${subtitle}</p></div><div class="score">${scoreLabel}<strong id="game-score">0</strong></div></div><div id="game-area"></div><p class="game-hint">Use your keyboard or tap to play.</p></div>`; }

function getAudioContext() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioContext = new AudioContext();
  }
  if (audioContext?.state === 'suspended') audioContext.resume();
  return audioContext;
}

function playMinesweeperSound(kind) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(kind === 'bomb' ? 0.16 : 0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + (kind === 'bomb' ? 0.22 : 0.11));

  const oscillator = ctx.createOscillator();
  oscillator.type = kind === 'bomb' ? 'square' : 'triangle';
  oscillator.frequency.setValueAtTime(kind === 'bomb' ? 180 : 150, now);
  oscillator.frequency.exponentialRampToValueAtTime(kind === 'bomb' ? 54 : 72, now + (kind === 'bomb' ? 0.2 : 0.1));
  oscillator.connect(gain);
  oscillator.start(now);
  oscillator.stop(now + (kind === 'bomb' ? 0.22 : 0.11));

  const buffer = ctx.createBuffer(1, ctx.sampleRate * (kind === 'bomb' ? 0.18 : 0.08), ctx.sampleRate);
  const noise = buffer.getChannelData(0);
  for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  filter.type = kind === 'bomb' ? 'highpass' : 'lowpass';
  filter.frequency.value = kind === 'bomb' ? 700 : 900;
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(gain);
  source.start(now);
}

function playWinFanfare() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const start = ctx.currentTime + index * 0.09;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.1, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.21);
  });
}

function playTetrisBlip(kind) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const isLock = kind === 'lock';
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(isLock ? 180 : 420, now);
  oscillator.frequency.exponentialRampToValueAtTime(isLock ? 110 : 620, now + 0.08);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.1);
}

function playTetrisLineBreak(lineCount) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 480;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.13, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
  gain.connect(filter);
  filter.connect(ctx.destination);
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
  const noise = buffer.getChannelData(0);
  for (let i = 0; i < noise.length; i++) noise[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(gain);
  source.start(now);
  for (let i = 0; i < Math.min(lineCount, 3); i++) {
    const oscillator = ctx.createOscillator();
    const toneGain = ctx.createGain();
    const start = now + i * 0.055;
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(520 - i * 105, start);
    toneGain.gain.setValueAtTime(0.001, start);
    toneGain.gain.linearRampToValueAtTime(0.07, start + 0.008);
    toneGain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
    oscillator.connect(toneGain);
    toneGain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.13);
  }
}

function play2048EndTheme(won) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const notes = won ? [261.63,329.63,392,523.25,659.25] : [440,369.99,311.13,233.08];
  const now = ctx.currentTime;
  notes.forEach((frequency,index)=>{
    const start=now+index*0.09, oscillator=ctx.createOscillator(), gain=ctx.createGain();
    oscillator.type='square';
    oscillator.frequency.value=frequency;
    gain.gain.setValueAtTime(0.001,start);
    gain.gain.linearRampToValueAtTime(won?0.09:0.07,start+0.01);
    gain.gain.exponentialRampToValueAtTime(0.001,start+0.16);
    oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(start);oscillator.stop(start+0.17);
  });
}

function renderMinesweeper() {
  mount.innerHTML = shell('Minesweeper','Clear the squares without waking the mines.','flags left'); const area=document.querySelector('#game-area'); const size=9, mineCount=10; let cells=[], ended=false, won=false, flags=0, firstMove=true, flagMode=false, pointsAwarded=false, endPoints=0;
  function reset(){ended=false;won=false;flags=0;firstMove=true;flagMode=false;pointsAwarded=false;endPoints=0;cells=Array.from({length:size*size},(_,i)=>({i,mine:false,revealed:false,flag:false}));draw(true);}
  function neighbors(i){const x=i%size,y=Math.floor(i/size),out=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx>=0&&nx<size&&ny>=0&&ny<size)out.push(ny*size+nx)}return out}
  function mineCountAround(i){return neighbors(i).filter(n=>cells[n].mine).length;}
  function openingFrom(i){
    const opening=new Set(), queue=[i];
    while(queue.length){const current=queue.shift();if(opening.has(current))continue;opening.add(current);if(mineCountAround(current)===0)neighbors(current).forEach(n=>{if(!opening.has(n)&&!cells[n].mine)queue.push(n)});}
    return opening;
  }
  function hasStarterClue(opening){
    return [...opening].some(i=>mineCountAround(i)===1&&neighbors(i).filter(n=>!opening.has(n)).length===1);
  }
  function plantMines(safeIndex){
    // Search for a natural opening: the first click floods a safe area and
    // leaves at least one visible 1 touching exactly one covered mine.
    const protectedSquares=new Set([safeIndex,...neighbors(safeIndex)]);
    for(let attempt=0;attempt<300;attempt++){
      cells.forEach(c=>{c.mine=false;c.revealed=false});
      let placed=0;
      while(placed<mineCount){const i=Math.floor(Math.random()*cells.length);if(!protectedSquares.has(i)&&!cells[i].mine){cells[i].mine=true;placed++;}}
      if(hasStarterClue(openingFrom(safeIndex)))return;
    }
  }
  function reveal(i, playSound=true){if(ended||cells[i].flag||cells[i].revealed)return;if(firstMove){plantMines(i);firstMove=false;}cells[i].revealed=true;if(cells[i].mine){ended=true;endPoints=0;if(!pointsAwarded){awardPoints(endPoints);pointsAwarded=true}playMinesweeperSound('bomb');cells.forEach(c=>{if(c.mine)c.revealed=true});}else{if(playSound)playMinesweeperSound('dig');if(neighbors(i).filter(n=>cells[n].mine).length===0)neighbors(i).forEach(n=>reveal(n,false));if(!ended&&cells.every(c=>c.mine||c.revealed)){ended=true;won=true;endPoints=50;if(!pointsAwarded){awardPoints(endPoints);pointsAwarded=true}playWinFanfare();}}draw();}
  function toggleFlag(i){if(ended||cells[i].revealed)return;const c=cells[i];c.flag=!c.flag;flags+=c.flag?1:-1;draw();}
  function draw(animate=false){area.classList.add('mine-game-area');area.innerHTML=`<div class="mine-board">${cells.map(c=>{let n=neighbors(c.i).filter(i=>cells[i].mine).length;let row=Math.floor(c.i/size),col=c.i%size;return `<button class="mine-cell ${c.revealed?'revealed':''} ${c.mine&&c.revealed?'mine':''} ${animate?'forming':''}" style="${animate?`--wave-delay:${(row+col)*32}ms`:''}" data-i="${c.i}">${c.revealed?(c.mine?'✹':(n||'')):(c.flag?'⚑':'')}</button>`}).join('')}</div><div class="game-actions"><button class="game-action" id="mine-reset">new board</button><button class="game-action" id="mine-flag">⚑ flag mode: ${flagMode?'on':'off'}</button><button class="game-action sound-toggle" id="mine-sound" aria-label="Turn sound ${soundEnabled?'off':'on'}">${soundEnabled?'🔊':'🔇'} sound</button></div>${ended?`<div class="mine-win"><span class="win-kicker">${won?'field cleared':'run ended'}</span><strong>${won?'nice work ✦':'game over'}</strong><span>${won?'All safe squares swept.':'A mine woke up.'} +${endPoints} pts</span><div><button class="game-action" id="mine-replay">play again</button><button class="game-action" id="mine-change">change game</button></div></div>`:''}`;document.querySelector('#game-score').textContent=mineCount-flags;area.querySelectorAll('.mine-cell').forEach(b=>{b.addEventListener('click',()=>flagMode?toggleFlag(+b.dataset.i):reveal(+b.dataset.i));b.addEventListener('contextmenu',e=>{e.preventDefault();toggleFlag(+b.dataset.i)})});document.querySelector('#mine-reset').onclick=reset;document.querySelector('#mine-flag').onclick=()=>{flagMode=!flagMode;draw()};document.querySelector('#mine-sound').onclick=()=>{soundEnabled=!soundEnabled;draw()};if(ended){document.querySelector('#mine-replay').onclick=reset;document.querySelector('#mine-change').onclick=closeGame;}}
  reset(); return ()=>{};
}

function render2048(){
  mount.innerHTML=shell('2048','Slide the tiles. Find the 2048.','score');const area=document.querySelector('#game-area');area.classList.add('twenty-game-area');area.style.position='relative';const board=Array(16).fill(0);let score=0,ended=false,won=false,runPoints=0,merges=0,createdNumbers=new Set(),pointsAwarded=false,endPoints=0;
  function add(){const empty=board.map((v,i)=>v?null:i).filter(i=>i!==null);if(empty.length)board[empty[Math.floor(Math.random()*empty.length)]]=Math.random()<.9?2:4}
  function position(index){return {x:index%4,y:Math.floor(index/4)}}
  function tileColor(value){if(value===2)return '#fff0c9';if(value===4)return '#ffd4ad';if(value===8)return 'var(--orange)';if(value===16)return 'var(--lavender)';if(value===32)return 'var(--blue)';return '#4ca9a2'}
  function canMove(){return board.some((value,index)=>{if(!value)return true;const x=index%4,y=Math.floor(index/4);return (x<3&&board[index+1]===value)||(y<3&&board[index+4]===value)})}
  function draw(moves=[]){const moveByTarget=new Map(moves.map(move=>[move.to,move]));const highestTile=Math.max(...board);area.innerHTML=`<div class="twenty-game"><div class="twenty-board" style="position:relative">${board.map(v=>`<div class="twenty-cell" data-value="${v}"></div>`).join('')}<div class="twenty-tiles" style="position:absolute;inset:0;pointer-events:none">${board.map((v,index)=>{if(!v)return '';const move=moveByTarget.get(index);const target=position(index);const from=move?position(move.from):target;return `<div class="twenty-tile ${move&&move.from!==move.to?'sliding':''}" data-value="${v}" data-index="${index}" style="position:absolute;display:grid;place-items:center;z-index:1;font-family:'Space Grotesk',sans-serif;font-size:25px;font-weight:700;background:${tileColor(v)};color:${v>=8?'white':'var(--ink)'};--tile-x:${target.x};--tile-y:${target.y};--tile-dx:${from.x-target.x};--tile-dy:${from.y-target.y}">${v}</div>`}).join('')}</div></div><div class="twenty-controls"><button class="arrow-btn" data-dir="left">←</button><button class="arrow-btn" data-dir="up">↑</button><button class="arrow-btn" data-dir="down">↓</button><button class="arrow-btn" data-dir="right">→</button></div><div class="game-actions"><button class="game-action" id="twenty-reset">new game</button></div></div>${ended?`<div class="twenty-end"><span class="win-kicker">run complete</span><strong>game over</strong><span>Score: ${score} · Highest tile: ${highestTile} · +${endPoints} pts</span><div><button class="game-action" id="twenty-replay">play again</button><button class="game-action" id="twenty-change">choose new</button></div></div>`:''}`;const boardEl=area.querySelector('.twenty-board');const step=(boardEl.clientWidth-18+8)/4;const tileSize=step-8;boardEl.style.setProperty('--twenty-step',`${step}px`);area.querySelectorAll('.twenty-tile').forEach(tile=>{const x=Number(tile.style.getPropertyValue('--tile-x')),y=Number(tile.style.getPropertyValue('--tile-y')),dx=Number(tile.style.getPropertyValue('--tile-dx')),dy=Number(tile.style.getPropertyValue('--tile-dy'));tile.style.left=`${9+x*step}px`;tile.style.top=`${9+y*step}px`;tile.style.width=`${tileSize}px`;tile.style.height=`${tileSize}px`;tile.style.setProperty('--tile-dx-px',`${dx*step}px`);tile.style.setProperty('--tile-dy-px',`${dy*step}px`)});document.querySelector('#game-score').textContent=score;area.querySelectorAll('.arrow-btn').forEach(b=>b.onclick=()=>move(b.dataset.dir));document.querySelector('#twenty-reset').onclick=reset;if(ended){document.querySelector('#twenty-replay').onclick=reset;document.querySelector('#twenty-change').onclick=closeGame}}
  function finish(didWin,moves=[]){ended=true;won=didWin;endPoints=runPoints;if(!pointsAwarded){awardPoints(endPoints);pointsAwarded=true}play2048EndTheme(true);draw(moves)}
  function move(dir){if(ended)return;const lines=[];if(dir==='left'||dir==='right')for(let y=0;y<4;y++)lines.push([...Array(4)].map((_,x)=>y*4+(dir==='left'?x:3-x)));else for(let x=0;x<4;x++)lines.push([...Array(4)].map((_,y)=>(dir==='up'?y:3-y)*4+x));const next=Array(16).fill(0),moves=[];lines.forEach(indices=>{const tokens=indices.filter(index=>board[index]).map(index=>({value:board[index],from:index}));const output=[];tokens.forEach(token=>{const last=output[output.length-1];if(last&&last.value===token.value&&!last.merged){last.value*=2;last.merged=true;last.froms.push(token.from);score+=last.value;merges+=1;if(!createdNumbers.has(last.value)){createdNumbers.add(last.value);runPoints+=10}if(merges%5===0)runPoints+=2}else output.push({value:token.value,froms:[token.from],merged:false})});output.forEach((item,targetOffset)=>{const target=indices[targetOffset];next[target]=item.value;moves.push({from:item.froms[0],to:target})})});if(next.every((v,i)=>v===board[i]))return;board.splice(0,board.length,...next);add();if(board.includes(2048))return finish(true,moves);if(!canMove())return finish(false,moves);draw(moves)}
  function reset(){ended=false;won=false;score=0;runPoints=0;merges=0;createdNumbers=new Set();pointsAwarded=false;endPoints=0;board.fill(0);add();add();draw()}
  function key(e){const dirs={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};if(dirs[e.key]){e.preventDefault();move(dirs[e.key])}} document.addEventListener('keydown',key);reset();return()=>document.removeEventListener('keydown',key);
}

function renderTetris(){
  mount.innerHTML=shell('Tetris','Drop blocks. Clear lines. Keep going.','lines');const area=document.querySelector('#game-area');area.classList.add('tetris-game-area');document.querySelector('.game-hint').textContent='Arrows move · ↑ rotates · spacebar hard drops.';let grid=Array(180).fill(0),piece={x:4,y:0,type:0,rotation:0,color:'#ffd91c'},nextType=0,nextColor='#17c5ff',lines=0,over=false,clearing=false,interval,pointsAwarded=false,endPoints=0;
  const shapes=[
    [[[1,1,1,1]],[[1],[1],[1],[1]]],
    [[[1,1],[1,1]]],
    [[[0,1,0],[1,1,1]],[[1,0],[1,1],[1,0]],[[1,1,1],[0,1,0]],[[0,1],[1,1],[0,1]]],
    [[[1,1,0],[0,1,1]],[[0,1],[1,1],[1,0]]],
    [[[0,1,1],[1,1,0]],[[1,0],[1,1],[0,1]]]
  ];
  const pieceColors=['#ffd91c','#17c5ff','#86f772','#ff5f59','#e369ff'];
  function randomColor(){return pieceColors[Math.floor(Math.random()*pieceColors.length)]}
  function shape(){return shapes[piece.type][piece.rotation%shapes[piece.type].length]}
  function cells(){return shape().flatMap((r,y)=>r.map((v,x)=>v?[piece.x+x,piece.y+y]:null).filter(Boolean))}
  function hit(dx=0,dy=0){return cells().some(([x,y])=>x+dx<0||x+dx>=10||y+dy>=18||y+dy<0||grid[(y+dy)*10+x+dx])}
  function fallDelay(){return 650*Math.pow(0.93,Math.floor(lines/10))}
  function restartTimer(){clearInterval(interval);if(!over&&!clearing)interval=setInterval(drop,fallDelay())}
  function spawnNext(){piece={x:4,y:0,type:nextType,rotation:0,color:nextColor};nextType=Math.floor(Math.random()*shapes.length);nextColor=randomColor();if(hit()){over=true;if(!pointsAwarded){endPoints=lines*10;awardPoints(endPoints);pointsAwarded=true}}draw();if(!over)playTetrisBlip('spawn')}
  function crumbs(rows){return rows.flatMap(row=>Array.from({length:10},(_,x)=>`<i class="tetris-crumb" style="background:${grid[row*10+x]};left:${5+x*26}px;top:${5+row*26}px;--crumb-x:${x%2?24:-24}px;--crumb-y:${430+(x%3)*28}px;--crumb-r:${x%2?150:-130}deg;animation-delay:${(x%4)*18}ms"></i>`)).join('')}
  function animateLineClear(rows){clearing=true;playTetrisLineBreak(rows.length);draw(rows);setTimeout(()=>{[...rows].sort((a,b)=>b-a).forEach(row=>{grid.splice(row*10,10);grid.unshift(...Array(10).fill(0))});lines+=rows.length;clearing=false;spawnNext();restartTimer()},540)}
  function lock(){cells().forEach(([x,y])=>{if(y>=0)grid[y*10+x]=piece.color});const clearedRows=Array.from({length:18},(_,row)=>row).filter(row=>grid.slice(row*10,row*10+10).every(Boolean));if(clearedRows.length){clearInterval(interval);animateLineClear(clearedRows)}else{playTetrisBlip('lock');spawnNext()}}
  function preview(){const previewShape=shapes[nextType][0];return `<div class="next-piece" style="display:grid;grid-template-columns:repeat(${previewShape[0].length},18px);gap:2px;justify-content:center;align-content:center;height:100%">${previewShape.flat().map(cell=>`<i class="${cell?'filled':''}" style="display:block;width:18px;height:18px;background:${cell?nextColor:'transparent'}"></i>`).join('')}</div>`}
  function draw(clearingRows=[]){const clearingSet=new Set(clearingRows);area.innerHTML=`<div class="tetris-wrap"><div class="tetris-board">${grid.map((v,i)=>{const row=Math.floor(i/10);return `<div class="tetris-cell ${v?'filled':''} ${clearingSet.has(row)?'clearing':''}" style="${v?`background:${v}`:''}"></div>`}).join('')}${clearingRows.length?crumbs(clearingRows):''}</div><div class="tetris-side"><div class="score">next</div><div class="next-box">${preview()}</div><div class="game-actions"><button class="game-action" id="tetris-blockomb" ${blockombCount?'':'disabled'}><img class="blockomb-icon" src="assets/blockomb.png" alt="" />blockomb <span>${blockombCount}</span></button><button class="game-action" id="tetris-reset">reset</button></div></div></div>${over?`<div class="tetris-game-over"><span class="win-kicker">run complete</span><strong>game over</strong><span>You cleared ${lines} line${lines===1?'':'s'} · +${endPoints} pts</span><div><button class="game-action" id="tetris-replay">play again</button><button class="game-action" id="tetris-change">change game</button></div></div>`:''}`;document.querySelector('#game-score').textContent=lines;cells().forEach(([x,y])=>{const el=document.querySelector('.tetris-board').children[y*10+x];if(el){el.classList.add('active');el.style.background=piece.color}});if(over){clearInterval(interval);document.querySelector('.game-hint').textContent='Game over — choose another round.'}document.querySelector('#tetris-blockomb').onclick=useBlockomb;document.querySelector('#tetris-reset').onclick=reset;if(over){document.querySelector('#tetris-replay').onclick=reset;document.querySelector('#tetris-change').onclick=closeGame}}
  function move(dx){if(!hit(dx,0)){piece.x+=dx;draw()}}
  function useBlockomb(){if(over||clearing||!blockombCount)return;blockombCount-=1;localStorage.setItem(blockombStorageKey,String(blockombCount));spawnNext()}
  function rotate(){if(over)return;const oldRotation=piece.rotation,oldX=piece.x;piece.rotation=(piece.rotation+1)%shapes[piece.type].length;for(const offset of [0,-1,1,-2,2]){piece.x=oldX+offset;if(!hit(0,0)){draw();return}}piece.rotation=oldRotation;piece.x=oldX}
  function drop(){if(clearing)return;if(!hit(0,1)){piece.y++;draw()}else lock()}
  function hardDrop(){if(over||clearing)return;while(!hit(0,1))piece.y++;lock()}
  function key(e){if(over||clearing)return;if(e.key==='ArrowLeft')move(-1);if(e.key==='ArrowRight')move(1);if(e.key==='ArrowDown')drop();if(e.key==='ArrowUp')rotate();if(e.code==='Space'||e.key===' '){e.preventDefault();hardDrop()}}
  function reset(){clearInterval(interval);grid=Array(180).fill(0);lines=0;over=false;clearing=false;pointsAwarded=false;endPoints=0;piece={x:4,y:0,type:Math.floor(Math.random()*shapes.length),rotation:0,color:randomColor()};nextType=Math.floor(Math.random()*shapes.length);nextColor=randomColor();draw();playTetrisBlip('spawn');restartTimer()}document.addEventListener('keydown',key);reset();return()=>{clearInterval(interval);document.removeEventListener('keydown',key)};
}
