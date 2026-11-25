/* CYBER 2.0 — shared local player progression
   Progress is stored on this browser/device. Cloud account sync is a later phase. */
(()=>{'use strict';
const KEY='cyber_player_v2';
const game=(location.pathname.split('/').pop()||'home').replace(/\.html?$/i,'')||'home';
const titles={'game':'Hardwood Legends','cyber-strike':'Cyber Strike','neon-runner':'Neon Runner','dungeon-quest':'Dungeon Quest','bastion-defense':'Bastion Defense','volleyball':'Volleyball Legends','dust-line-open-range':'Dust Line Open Range','deflect':'Deflect'};
const title=titles[game]||'CYBER';
const safeRead=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{xp:0,minutes:0,games:[],achievements:[]}}catch(e){return{xp:0,minutes:0,games:[],achievements:[]}}};
let data=safeRead();
data.xp=Number(data.xp)||0;data.minutes=Number(data.minutes)||0;
data.games=Array.isArray(data.games)?data.games:[];data.achievements=Array.isArray(data.achievements)?data.achievements:[];
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}};
const award=(id,name,desc,xp)=>{if(data.achievements.some(a=>a.id===id))return;data.achievements.push({id,name,desc});data.xp+=xp;toast('Achievement unlocked: '+name+'  +'+xp+' XP');save()};
if(!data.games.includes(game)){data.games.push(game);data.xp+=25;toast('First visit to '+title+'  +25 XP');}
const launchKey='cyber_launch_'+game;let last=0;try{last=Number(localStorage.getItem(launchKey))||0}catch(e){}
if(Date.now()-last>30*60*1000){data.xp+=10;try{localStorage.setItem(launchKey,String(Date.now()))}catch(e){}}
award('first-launch','First Steps','Played your first CYBER game',25);
if(data.games.length>=3)award('explorer','Game Explorer','Tried 3 different CYBER games',75);
save();
let minuteCarry=0;
setInterval(()=>{if(document.visibilityState==='hidden')return;minuteCarry++;if(minuteCarry>=1){minuteCarry=0;data.minutes++;data.xp+=5;if(data.minutes>=60)award('one-hour','Dedicated Player','Played for 60 minutes in total',100);save();render();}},60000);
const level=()=>Math.floor(data.xp/250)+1;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let host=document.createElement('div');host.id='cyber-player-widget';host.style.cssText='position:fixed;right:16px;bottom:16px;z-index:2147483000;font:13px system-ui;color:#f7f8ff;';document.body.appendChild(host);
const root=host.attachShadow?host.attachShadow({mode:'open'}):host;
root.innerHTML='<style>:host{all:initial}.launcher{border:1px solid #7a6aff88;background:linear-gradient(130deg,#16192bfa,#101827fa);color:#fff;border-radius:12px;padding:10px 14px;font:800 12px system-ui;letter-spacing:.06em;box-shadow:0 8px 30px #0008;cursor:pointer}.launcher b{color:#62e5ff}.panel{display:none;width:260px;margin-bottom:9px;padding:15px;border:1px solid #ffffff25;border-radius:14px;background:#0c1120f5;box-shadow:0 18px 50px #000b;backdrop-filter:blur(16px)}.panel.open{display:block}.top{display:flex;justify-content:space-between;align-items:center}.name{font-weight:900;letter-spacing:.12em}.level{color:#69e5ff;font-weight:900}.muted{color:#9eabc2;font-size:11px}.bar{height:7px;background:#ffffff1c;border-radius:9px;overflow:hidden;margin:9px 0}.bar i{display:block;height:100%;background:linear-gradient(90deg,#9d6bff,#55d8ff)}.stats{display:flex;justify-content:space-between;margin:9px 0}.ach{border-top:1px solid #ffffff1a;padding-top:9px;margin-top:9px}.ach div{font-size:11px;color:#dce5f6;margin-top:5px}.toast{position:fixed;right:0;bottom:64px;background:#111b2b;border:1px solid #55d8ff66;border-radius:10px;padding:10px 13px;max-width:260px;box-shadow:0 8px 30px #0009;opacity:0;transform:translateY(8px);transition:.25s;pointer-events:none}.toast.show{opacity:1;transform:none}</style><section class="panel" id="panel"><div class="top"><span class="name">CYBER PLAYER</span><span class="level" id="level">LVL 1</span></div><div class="muted" id="game"></div><div class="stats"><span id="xp">0 XP</span><span id="minutes">0 MIN</span></div><div class="bar"><i id="progress" style="width:0%"></i></div><div class="muted" id="next"></div><div class="ach"><b>ACHIEVEMENTS</b><div id="achievements"></div></div><p class="muted">Progress is saved on this device.</p></section><button class="launcher" id="toggle"><b>✦</b> PLAYER <span id="mini">LVL 1</span></button><div class="toast" id="toast"></div>';
const $=id=>root.getElementById(id);
function render(){let lv=level(),within=data.xp%250;$('level').textContent='LVL '+lv;$('mini').textContent='LVL '+lv;$('game').textContent='NOW PLAYING · '+title;$('xp').textContent=data.xp+' XP';$('minutes').textContent=data.minutes+' MIN';$('progress').style.width=(within/250*100)+'%';$('next').textContent=(250-within)+' XP to level '+(lv+1);$('achievements').innerHTML=data.achievements.length?data.achievements.map(a=>'<div>🏆 '+esc(a.name)+'</div>').join(''):'<span class="muted">Play games to unlock rewards.</span>'}
function toast(msg){let el=$('toast');if(!el)return;el.textContent=msg;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3500)}
$('toggle').addEventListener('click',()=>$('panel').classList.toggle('open'));render();
})();