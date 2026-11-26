/* CYBER PLAYER — shared account progression and cloud saves.
   Local cache keeps games playable offline; signed-in accounts sync through Supabase. */
(()=>{'use strict';
if(window.CYBER&&window.CYBER.playerReady)return;
const KEY='cyber_player_v2',SUPABASE_URL='https://izixnrbnmqurmmywxefu.supabase.co';
const SUPABASE_KEY='sb_publishable_At7uz5tej6TPjrpOlh26Hw__uZ3zece';
const game=(location.pathname.split('/').pop()||'home').replace(/\.html?$/i,'')||'home';
const titles={'game':'Hardwood Legends','cyber-strike':'Cyber Strike','neon-runner':'Neon Runner','dungeon-quest':'Dungeon Quest','bastion-defense':'Bastion Defense','volleyball':'Volleyball Legends','dust-line-open-range':'Dust Line Open Range','deflect':'Deflect','basketball27':'Basketball 27','courtside-27':'Courtside 27','Shenanigans Battles':'Battle Shenanigans','fortnite':'Fortnite'};
const title=titles[game]||game.replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
const empty=()=>({xp:0,minutes:0,games:[],achievements:[],gameData:{},stats:{}});
const read=()=>{try{return Object.assign(empty(),JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){return empty()}};
let data=read(),client=null,user=null,cloudReady=false,saveTimer=null,uiReady=false,pending=[];
data.xp=Math.max(0,Number(data.xp)||0);data.minutes=Math.max(0,Number(data.minutes)||0);
for(const k of ['games','achievements'])if(!Array.isArray(data[k]))data[k]=[];
if(!data.gameData||typeof data.gameData!=='object')data.gameData={};
if(!data.stats||typeof data.stats!=='object')data.stats={};
const localSave=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}};
const toast=msg=>{if(!uiReady){pending.push(msg);return}const el=$('toast');if(el){el.textContent=msg;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3500)}};
const merge=(a,b)=>{
 const out=Object.assign(empty(),a||{},b||{});
 out.xp=Math.max(Number(a?.xp)||0,Number(b?.xp)||0);
 out.minutes=Math.max(Number(a?.minutes)||0,Number(b?.minutes)||0);
 out.games=[...new Set([...(a?.games||[]),...(b?.games||[])])];
 out.achievements=[...(a?.achievements||[])];
 for(const item of b?.achievements||[])if(!out.achievements.some(x=>x.id===item.id))out.achievements.push(item);
 out.gameData=Object.assign({},a?.gameData||{},b?.gameData||{});
 out.stats=Object.assign({},a?.stats||{},b?.stats||{});
 return out;
};
const level=()=>Math.floor(data.xp/250)+1;
const $=id=>root.getElementById(id);
function queueCloudSave(){localSave();if(!user||!client)return;clearTimeout(saveTimer);saveTimer=setTimeout(pushCloud,700)}
async function pushCloud(){
 if(!user||!client)return;
 const payload=JSON.parse(JSON.stringify(data));
 const {error}=await client.from('cyber_player_saves').upsert({user_id:user.id,save_data:payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});
 if(error){console.warn('CYBER cloud save failed:',error.message);toast('Cloud save pending — '+error.message);return}
 cloudReady=true;render();
}
async function pullCloud(){
 if(!user||!client)return;
 const {data:row,error}=await client.from('cyber_player_saves').select('save_data').eq('user_id',user.id).maybeSingle();
 if(error){console.warn('CYBER cloud load failed:',error.message);toast('Could not load cloud save. Run the CYBER save SQL.');return}
 if(row&&row.save_data){data=merge(data,row.save_data);localSave();await pushCloud()}
 else await pushCloud();
 cloudReady=true;render();toast('CYBER progress synced to your account');
}
function award(id,name,desc,xp){
 if(data.achievements.some(a=>a.id===id))return;
 data.achievements.push({id,name,desc});data.xp+=xp;toast('Achievement unlocked: '+name+'  +'+xp+' XP');queueCloudSave()
}
function render(){
 if(!$('level'))return;
 const lv=level(),within=data.xp%250;
 $('level').textContent='LVL '+lv;$('mini').textContent='LVL '+lv;
 $('game').textContent='NOW PLAYING · '+title;
 $('xp').textContent=data.xp+' XP';$('minutes').textContent=data.minutes+' MIN';
 $('progress').style.width=(within/250*100)+'%';
 $('next').textContent=(250-within)+' XP to level '+(lv+1);
 $('achievements').innerHTML=data.achievements.length?data.achievements.map(a=>'<div>🏆 '+String(a.name).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</div>').join(''):'<span class="muted">Play games to unlock rewards.</span>';
 $('cloud').textContent=user?(cloudReady?'CLOUD SYNCED · '+user.email:'SYNCING ACCOUNT…'):'SIGN IN TO ENABLE CLOUD SAVES';
}
function authMessage(t){$('authStatus').textContent=t}
async function ensureSupabase(){
 if(window.supabase?.createClient){client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);return}
 await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
 client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
}
function buildWidget(){
 const host=document.createElement('div');host.id='cyber-player-widget';host.style.cssText='position:fixed;right:16px;bottom:16px;z-index:2147483000;font:13px system-ui;color:#f7f8ff';document.body.appendChild(host);
 const root=host.attachShadow?host.attachShadow({mode:'open'}):host;
 root.innerHTML='<style>:host{all:initial}.launcher{border:1px solid #7a6aff88;background:linear-gradient(130deg,#16192bfa,#101827fa);color:#fff;border-radius:12px;padding:10px 14px;font:800 12px system-ui;cursor:pointer;box-shadow:0 8px 30px #0008}.launcher b{color:#62e5ff}.panel{display:none;width:280px;max-height:75vh;overflow:auto;margin-bottom:9px;padding:15px;border:1px solid #ffffff25;border-radius:14px;background:#0c1120f7;box-shadow:0 18px 50px #000b}.panel.open{display:block}.top{display:flex;justify-content:space-between}.name{font-weight:900;letter-spacing:.12em}.level{color:#69e5ff;font-weight:900}.muted{color:#9eabc2;font-size:11px}.bar{height:7px;background:#ffffff1c;border-radius:9px;overflow:hidden;margin:9px 0}.bar i{display:block;height:100%;background:linear-gradient(90deg,#9d6bff,#55d8ff)}.stats{display:flex;justify-content:space-between;margin:9px 0}.ach{border-top:1px solid #ffffff1a;padding-top:9px;margin-top:9px}.ach div{font-size:11px;color:#dce5f6;margin-top:5px}.toast{position:fixed;right:0;bottom:64px;background:#111b2b;border:1px solid #55d8ff66;border-radius:10px;padding:10px 13px;max-width:260px;opacity:0;transform:translateY(8px);transition:.25s;pointer-events:none}.toast.show{opacity:1;transform:none}input{box-sizing:border-box;width:100%;margin:5px 0;padding:10px;background:#080d17;border:1px solid #ffffff25;border-radius:6px;color:white}button.action{width:100%;margin-top:7px;padding:10px;border:1px solid #8e73ff88;border-radius:6px;background:#7652dc;color:white;font-weight:800;cursor:pointer}button.secondary{background:#ffffff0c}.auth{border-top:1px solid #ffffff1a;margin-top:12px;padding-top:10px}</style><section class="panel" id="panel"><div class="top"><span class="name">CYBER PLAYER</span><span class="level" id="level">LVL 1</span></div><div class="muted" id="game"></div><div class="stats"><span id="xp">0 XP</span><span id="minutes">0 MIN</span></div><div class="bar"><i id="progress" style="width:0%"></i></div><div class="muted" id="next"></div><div class="ach"><b>ACHIEVEMENTS</b><div id="achievements"></div></div><div class="auth"><div class="muted" id="cloud">Checking CYBER account…</div><div id="authFields"><input id="email" type="email" placeholder="CYBER account email" autocomplete="email"><input id="password" type="password" placeholder="Password" autocomplete="current-password"><button class="action" id="login">Sign in</button><button class="action secondary" id="signup">Create account</button></div><button class="action secondary" id="logout" style="display:none">Sign out</button><div class="muted" id="authStatus"></div></div></section><button class="launcher" id="toggle"><b>✦</b> PLAYER <span id="mini">LVL 1</span></button><div class="toast" id="toast"></div>';
 root.getElementById('toggle').onclick=()=>$('panel').classList.toggle('open');
 root.getElementById('login').onclick=async()=>{const email=$('email').value.trim(),password=$('password').value;if(!email||!password)return authMessage('Enter your email and password.');authMessage('Signing in…');const {data:d,error}=await client.auth.signInWithPassword({email,password});if(error)return authMessage(error.message);user=d.user;await pullCloud();authMessage('Signed in successfully.')};
 root.getElementById('signup').onclick=async()=>{const email=$('email').value.trim(),password=$('password').value;if(!email||password.length<6)return authMessage('Enter an email and a password of at least 6 characters.');authMessage('Creating account…');const {data:d,error}=await client.auth.signUp({email,password});if(error)return authMessage(error.message);if(d.session){user=d.user;await pullCloud();authMessage('Account created and synced.')}else authMessage('Check your email to verify your CYBER account.')};
 root.getElementById('logout').onclick=async()=>{await client.auth.signOut();user=null;cloudReady=false;render();authMessage('Signed out. Local progress remains on this device.')};
}
const host=document.createElement('div'); // no-op placeholder removed before widget build
// Track this game and award first-visit XP.
if(!data.games.includes(game)){data.games.push(game);data.xp+=25;toast('First visit to '+title+'  +25 XP')}
const launchKey='cyber_launch_'+game;let last=0;try{last=Number(localStorage.getItem(launchKey))||0}catch(e){}
if(Date.now()-last>30*60*1000){data.xp+=10;try{localStorage.setItem(launchKey,String(Date.now()))}catch(e){}}
award('first-launch','First Steps','Played your first CYBER game',25);
if(data.games.length>=3)award('explorer','Game Explorer','Tried 3 different CYBER games',75);
localSave();
let minuteCarry=0;
setInterval(()=>{if(document.visibilityState==='hidden')return;minuteCarry++;data.minutes++;data.xp+=5;if(data.minutes>=60)award('one-hour','Dedicated Player','Played for 60 minutes in total',100);else queueCloudSave();render()},60000);
window.CYBER={
 playerReady:true,
 getPlayerData:()=>JSON.parse(JSON.stringify(data)),
 saveGameData:async(gameId,saveData)=>{if(!gameId||typeof gameId!=='string')throw new Error('A game ID is required');data.gameData[gameId]=Object.assign({},data.gameData[gameId]||{},saveData||{});queueCloudSave();return true},
 loadGameData:gameId=>JSON.parse(JSON.stringify(data.gameData[gameId]||{})),
 addXP:amount=>{data.xp=Math.max(0,data.xp+(Number(amount)||0));queueCloudSave();render()},
 recordStat:(name,value)=>{if(!name)return;data.stats[name]=value;queueCloudSave()},
 sync:()=>pushCloud()
};
buildWidget();render();uiReady=true;pending.splice(0).forEach(toast);
ensureSupabase().then(async()=>{const {data:d}=await client.auth.getSession();if(d.session){user=d.session.user;await pullCloud()}client.auth.onAuthStateChange((_event,session)=>{if(session?.user){user=session.user;pullCloud()}else{user=null;cloudReady=false;render()}});render()}).catch(e=>{console.warn('CYBER account service unavailable:',e);toast('Account service unavailable. Local save still works.')});
})();
