/* CYBER Worlds Upgrade — bespoke maps, characters, landmarks and live HUD */
(()=>{
'use strict';
const G=window.CYBER_GAME, T=window.THREE;
if(!G||!T)return;
const {scene,player,pickups,enemies,cfg}=G;
const C=(color,rough=.7,metal=0)=>color&&color.isMaterial?color:new T.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const add=(geo,mat,x,y,z,sx=1,sy=1,sz=1,parent=scene)=>{
 const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
};
const box=(x,y,z,w,h,d,col,par=scene)=>add(new T.BoxGeometry(w,h,d),C(col,.72,.12),x,y,z,1,1,1,par);
const cyl=(x,y,z,r1,r2,h,col,par=scene,n=12)=>add(new T.CylinderGeometry(r1,r2,h,n),C(col,.65,.12),x,y,z,1,1,1,par);
const sph=(x,y,z,r,col,par=scene)=>add(new T.SphereGeometry(r,16,12),C(col,.48,.18),x,y,z,1,1,1,par);
const group=(x=0,y=0,z=0)=>{const g=new T.Group();g.position.set(x,y,z);scene.add(g);return g};
const rand=(a,b)=>a+Math.random()*(b-a);
const keep=new Set([player,...pickups,...enemies]);
[...scene.children].forEach(o=>{if(o.isMesh&&!keep.has(o))scene.remove(o);if(o.type==='GridHelper')scene.remove(o)});
const oldGround=scene.children.find(o=>o.isMesh&&o.geometry&&o.geometry.type==='PlaneGeometry');
if(oldGround)scene.remove(oldGround);
const themes={
 sky:{ground:'#26384b',sky:'#91b8db',accent:'#78e9ff',wall:'#526c83',name:'THE SHATTERED SKY'},
 race:{ground:'#171d31',sky:'#111b38',accent:'#00eaff',wall:'#263c64',name:'NEON COAST CIRCUIT'},
 ocean:{ground:'#06465a',sky:'#073b59',accent:'#62e9ff',wall:'#0b7790',name:'ABYSSAL TRENCH'},
 space:{ground:'#10142b',sky:'#080b20',accent:'#b88aff',wall:'#3a3268',name:'ORBITAL DEBRIS FIELD'},
 stealth:{ground:'#202635',sky:'#111827',accent:'#9daeff',wall:'#414b60',name:'BLACKSITE ZERO'},
 survival:{ground:'#294431',sky:'#a5b88c',accent:'#a8df83',wall:'#526e46',name:'PINEFALL VALLEY'},
 mech:{ground:'#353b48',sky:'#222a3a',accent:'#ff9b6d',wall:'#687080',name:'IRONCLAD COMBAT YARD'},
 puzzle:{ground:'#34304d',sky:'#19172f',accent:'#ffd66e',wall:'#655c8c',name:'THE CORE COMPLEX'},
 horror:{ground:'#24202d',sky:'#100d19',accent:'#bd8be8',wall:'#4a3c53',name:'WARD 13 — ABANDONED'},
 platform:{ground:'#594334',sky:'#b6c9dc',accent:'#ffbf75',wall:'#89664b',name:'CLOUDPEAK ASCENT'}
};
const th=themes[cfg.kind]||themes.sky;
scene.background=new T.Color(th.sky);
scene.fog=new T.Fog(th.sky,42,112);
const ground=add(new T.PlaneGeometry(120,120),C(th.ground,.95),0,-.16,0);
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;
const platformMat=C(th.wall,.88),accentMat=new T.MeshStandardMaterial({color:th.accent,emissive:th.accent,emissiveIntensity:.45,roughness:.35});
const trimMat=C('#c5d0df',.38,.72);
function wall(x,z,w,d,h=3,col=th.wall){box(x,h/2,z,w,h,d,col)}
function pillar(x,z,h=5){cyl(x,h/2,z,.34,.48,h,th.wall);cyl(x,h+.12,z,.55,.55,.22,th.accent)}
function lamp(x,z){const p=cyl(x,2.7,z,.08,.08,5,'#1d2636');sph(x,5.25,z,.23,th.accent);const l=new T.PointLight(th.accent,1.3,13);l.position.set(x,5,z);scene.add(l)}
function ring(x,y,z,r=1){const m=add(new T.TorusGeometry(r,.07,8,32),accentMat,x,y,z);m.rotation.x=Math.PI/2;return m}
function tree(x,z,s=1){const t=group(x,0,z);cyl(0,.85,0,.22,.3,1.7,'#5d4938',t);for(let i=0;i<3;i++)add(new T.ConeGeometry(1.05-i*.2,1.8,7),C(i%2?'#315b3c':'#3d7048'),0,2+i*.8,0,s*(1-i*.12),s*(1-i*.1),s*(1-i*.12),t);return t}
function rock(x,z,s=1,col='#687789'){const m=add(new T.DodecahedronGeometry(1,1),C(col,.95),x,s*.45,z,s*1.1,s*.65,s*.9);m.rotation.set(rand(0,1),rand(0,3),rand(0,1));return m}
function crate(x,z,col='#7d8b9d'){box(x,.6,z,1.2,1.2,1.2,col);box(x,.6,z,1.3,.12,1.3,'#222b3b')}
function tower(x,z,h=8){box(x,h/2,z,2,h,2,th.wall);box(x,h+.15,z,2.3,.3,2.3,th.accent);for(let y=1;y<h;y+=2)box(x,y,z+1.02,1,.12,.08,'#d6e0ed')}
function arch(x,z,col=th.accent){box(x-1.6,1.6,z,.25,3.2,.3,th.wall);box(x+1.6,1.6,z,.25,3.2,.3,th.wall);box(x,3.15,z,3.5,.3,.3,col);ring(x,1.8,z,1.1)}
function makeMap(){
 // A deliberate perimeter and navigable landmark layout, with a distinct silhouette per game.
 if(cfg.kind==='sky'){
  for(let i=0;i<7;i++){const x=(i-3)*13,z=(i%2?8:-8);const p=add(new T.CylinderGeometry(7,9,1.4,8),C('#52677c'),x,-.9,z);p.rotation.y=i*.4;for(let j=0;j<5;j++)rock(x+rand(-5,5),z+rand(-5,5),rand(.7,1.5),'#71869a');pillar(x,z,8+rand(0,5));}
  for(let i=0;i<18;i++){const x=rand(-50,50),z=rand(-50,50);if(Math.abs(x)>12||Math.abs(z)>12)ring(x,rand(2,8),z,.55)}
  arch(0, -16);wall(-58,0,2,116,12);wall(58,0,2,116,12);wall(0,-58,116,2,12);wall(0,58,116,2,12);
 } else if(cfg.kind==='race'){
  // Three-lane circuit with barriers, gantries, light towers and pit structures.
  for(let z=-32;z<=32;z+=16){box(0,.02,z,18,.12,5,'#242b42');for(let x=-7;x<=7;x+=7)box(x,.09,z,3,.03,4,'#e7edf6')}
  for(let x of [-13,13]){wall(x,0,1.1,78,1.5,'#3b4b72');for(let z=-34;z<=34;z+=8){box(x,.9,z,1.5,.6,1.2,th.accent)}}
  for(let z=-30;z<=30;z+=15){tower(-20,z,7);tower(20,z,7);lamp(-11,z);lamp(11,z)}
  arch(0,-37);for(let x=-28;x<=28;x+=8){box(x,4,-46,5,8,.5,'#26314d');box(x,8,-46,5,.3,.7,th.accent)}
  for(let i=0;i<22;i++){const x=rand(-48,48),z=rand(-50,50);if(Math.abs(x)>24||Math.abs(z)>48)box(x,rand(2,6),z,rand(3,8),rand(4,12),rand(3,8),'#202c4b')}
 } else if(cfg.kind==='ocean'){
  // Reef canyon, wreck, coral columns, kelp and deep trench.
  for(let x=-48;x<=48;x+=12){for(let z=-48;z<=48;z+=12){if(Math.random()>.36)rock(x+rand(-3,3),z+rand(-3,3),rand(1.2,3),'#17677a')}}
  for(let i=0;i<24;i++){const x=rand(-46,46),z=rand(-46,46);cyl(x,rand(1,3),z,.18,.08,rand(3,8),i%2?'#287f77':'#3c9c9a')}
  // shipwreck
  const wreck=group(18,0,-12);box(0,1,0,15,2.2,5,'#4b5963',wreck);for(let x=-6;x<=6;x+=4)box(x,3,0,.4,3,.4,'#87939a',wreck);box(0,4,0,1,4,1,'#66737b',wreck);ring(-8,1,0,1.3);
  for(let x of [-55,55])for(let z=-40;z<=40;z+=12)cyl(x,5,z,1,1,10,'#0b7184');
  for(let i=0;i<10;i++)sph(rand(-45,45),rand(1,12),rand(-45,45),rand(.2,.6),'#b7f4ff');
 } else if(cfg.kind==='space'){
  // asteroid belt, docking station and neon orbital gates
  for(let i=0;i<65;i++){const x=rand(-52,52),z=rand(-52,52);rock(x,z,rand(.7,3),i%2?'#555a75':'#77748d')}
  for(let i=0;i<5;i++){const x=(i-2)*18;ring(x,4,-18,4+i*.5);pillar(x,-18,9)}
  const station=group(0,0,-42);cyl(0,0,0,7,7,3,'#59627c',station).rotation.x=Math.PI/2;for(let i=0;i<4;i++){box((i-1.5)*5,0,0,1,1,13,'#7b86a0',station)}
  for(let i=0;i<24;i++)sph(rand(-55,55),rand(5,35),rand(-55,55),rand(.08,.22),'#fff4d1');
 } else if(cfg.kind==='stealth'){
  // Guard compound: connected corridors, towers, cover and searchlight pylons.
  wall(-18,0,1,72,5);wall(18,0,1,72,5);wall(0,-36,36,1,5);wall(0,36,36,1,5);
  for(let z=-24;z<=24;z+=16){wall(-7,z,14,1,3);wall(7,z,14,1,3);tower(-14,z,7);tower(14,z,7)}
  for(let x=-10;x<=10;x+=5)crate(x,-30,'#4b5866');
  for(let x of [-25,25])for(let z of [-20,0,20]){pillar(x,z,7);lamp(x,z)}
  arch(0,34);for(let z=-28;z<=28;z+=14)box(0,.9,z,4,1.8,1,'#3c4655');
 } else if(cfg.kind==='survival'){
  // Forest valley, creek, rocky ridges, camp and lookout.
  for(let i=0;i<95;i++){const x=rand(-54,54),z=rand(-54,54);if(Math.hypot(x,z)>9)tree(x,z,rand(.7,1.45))}
  for(let z=-52;z<=52;z+=8){rock(-48,z,rand(2,4),'#687b69');rock(48,z,rand(2,4),'#687b69')}
  for(let i=0;i<9;i++)rock(-18+i*4,18+Math.sin(i)*5,rand(1.5,2.8),'#6d806e');
  // campfire and shelter
  const fire=sph(0,.4,0,.55,'#ff9c45');const fl=new T.PointLight('#ff8a3d',2,18);fl.position.set(0,2,0);scene.add(fl);
  box(0,1.6,5,5,.25,4,'#7b593b');for(let x of [-2.4,2.4])cyl(x,.8,5,.12,.12,1.6,'#8d6844');
  tower(26,-25,10);for(let i=0;i<10;i++)lamp(rand(-40,40),rand(-40,40));
 } else if(cfg.kind==='mech'){
  // Armoured arena with cover lanes, hangars and a central reactor.
  for(let x of [-30,30])for(let z of [-30,30])tower(x,z,12);
  for(let z=-20;z<=20;z+=10){box(-13,1.5,z,5,3,3,'#596474');box(13,1.5,z,5,3,3,'#596474')}
  const core=cyl(0,4,0,3,3,8,'#677487');core.material=accentMat;ring(0,7,0,4);
  for(let x=-42;x<=42;x+=14){wall(x,-48,8,2,7,'#485363');wall(x,48,8,2,7,'#485363')}
  for(let z=-40;z<=40;z+=16){lamp(-45,z);lamp(45,z)}
  arch(0,-43,'#ff9b6d');
 } else if(cfg.kind==='puzzle'){
  // Modular maze, marked lanes, switch plinths and a portal exit.
  const cells=[[-18,-18],[-6,-18],[6,-18],[18,-18],[-18,-6],[6,-6],[18,-6],[-18,6],[-6,6],[18,6],[-18,18],[6,18]];
  cells.forEach(([x,z],i)=>{wall(x,z,9,1,3.2);wall(x,z,1,9,3.2);if(i%3===0)box(x,3.4,z,2,.25,2,th.accent)});
  for(const [x,z] of [[-24,-24],[24,-24],[-24,24]]){cyl(x,.5,z,1.2,1.2,1,th.accent);ring(x,1.3,z,.9)}
  arch(24,24,'#ffe08a');for(let i=0;i<8;i++)pillar(rand(-42,42),rand(-42,42),rand(2,5));
 } else if(cfg.kind==='horror'){
  // Abandoned hospital: corridors, wards, flickering lamps and broken room shells.
  wall(0,-28,58,1,4);wall(0,28,58,1,4);wall(-29,0,1,56,4);wall(29,0,1,56,4);
  for(let x=-20;x<=20;x+=10){wall(x,-12,1,30,3.5);wall(x,12,1,30,3.5)}
  for(let z=-20;z<=20;z+=10){box(-24,1,z,7,2,1,'#4b3e4c');box(24,1,z,7,2,1,'#4b3e4c')}
  for(let x=-20;x<=20;x+=10){lamp(x,-22);lamp(x,22)}
  for(let i=0;i<14;i++){const x=rand(-24,24),z=rand(-24,24);box(x,.15,z,rand(1,3),.3,rand(1,3),'#5c4d5b')}
  arch(0,25,'#b68be4');
 } else {
  // Mountain ascent with stepped platforms, suspended bridges and summit beacon.
  for(let i=0;i<12;i++){const x=(i%4-1.5)*12,z=-42+Math.floor(i/4)*17,y=1+Math.floor(i/4)*3;const p=box(x,y,z,8,.9,8,i%2?'#806047':'#987451');p.position.y=y;}
  for(let i=0;i<8;i++){const x=rand(-44,44),z=rand(-44,44);rock(x,z,rand(1,2.5),'#9b8064')}
  for(let z=-40;z<=40;z+=16){pillar(-50,z,7);pillar(50,z,7)}
  tower(0,-50,16);ring(0,12,-50,3);arch(0,40,'#ffc078');
 }
 // Four-sided distant boundaries keep the playfield intentional.
 wall(-59,0,2,120,5);wall(59,0,2,120,5);wall(0,-59,120,2,5);wall(0,59,120,2,5);
}
makeMap();
function limb(parent,x,y,z,r,len,color){const pivot=new T.Group();pivot.position.set(x,y,z);parent.add(pivot);const mesh=add(new T.CapsuleGeometry(r,len,4,8),C(color,.72,.08),0,-len*.38,0,1,1,1,pivot);return pivot}
function buildAvatar(){
 while(player.children.length)player.remove(player.children[0]);
 const isVehicle=cfg.kind==='race',isMech=cfg.kind==='mech',isPilot=cfg.kind==='space',isDiver=cfg.kind==='ocean',isPuzzle=cfg.kind==='puzzle';
 const shell=C(isMech?'#c5ced9':isVehicle?'#d8e4f5':isPilot?'#a8a4dc':isDiver?'#e4f2f3':isPuzzle?'#e6bd63':cfg.color,.34,.55);
 const dark=C('#20283a',.6,.4),skin=C('#bd8e6d',.72),glow=new T.MeshStandardMaterial({color:th.accent,emissive:th.accent,emissiveIntensity:.65,metalness:.35,roughness:.28});
 const parts=[];
 if(isVehicle){
  add(new T.BoxGeometry(2.2,.65,3.8),shell,0,.65,0,1,1,1,player);
  add(new T.BoxGeometry(1.45,.75,1.6),C('#70c8e8',.2,.55),0,1.25,-.35,1,1,1,player);
  for(const x of [-1.05,1.05])for(const z of [-1.2,1.2]){const w=add(new T.CylinderGeometry(.38,.38,.25,20),dark,x,.38,z,1,1,1,player);w.rotation.z=Math.PI/2;add(new T.TorusGeometry(.28,.06,8,20),glow,x,.38,z,1,1,1,player).rotation.y=Math.PI/2}
  for(const x of [-.65,.65]){const lamp=sph(x,.7,-1.95,.12,th.accent,player);lamp.material.emissive=new T.Color(th.accent);lamp.material.emissiveIntensity=1.4;}
 } else if(isMech){
  add(new T.BoxGeometry(1.8,1.9,1),shell,0,1.65,0,1,1,1,player);
  add(new T.BoxGeometry(1.25,.85,.9),dark,0,2.9,0,1,1,1,player);
  sph(0,3.02,-.48,.23,'#ffb47b',player);
  for(const x of [-1.15,1.15]){add(new T.BoxGeometry(.65,1.7,.7),shell,x,1.75,0,1,1,1,player);add(new T.BoxGeometry(.5,.45,1.1),dark,x,.75,-.25,1,1,1,player)}
  for(const x of [-.55,.55]){add(new T.BoxGeometry(.55,1.15,.65),shell,x,.48,0,1,1,1,player);add(new T.BoxGeometry(.85,.3,.9),dark,x,.1,.05,1,1,1,player)}
  box(0,2.2,-.56,.65,.14,.08,th.accent,player);
 } else {
  const torso=add(new T.CapsuleGeometry(isDiver?.48:.38,.82,5,10),shell,0,1.2,0,1,1,1,player);
  add(new T.SphereGeometry(.3,18,14),isDiver?C('#d9eff5',.2,.5):skin,0,2.12,0,1,1,1,player);
  if(isDiver){add(new T.SphereGeometry(.34,16,12),glow,0,2.13,-.03,1.15,.75,1.1,player);add(new T.BoxGeometry(.9,.2,.2),dark,0,1.75,.1,1,1,1,player);add(new T.BoxGeometry(.16,.7,.18),glow,-.5,.7,.25,1,1,1,player);add(new T.BoxGeometry(.16,.7,.18),glow,.5,.7,.25,1,1,1,player)}
  else if(isPilot){add(new T.SphereGeometry(.34,16,12),dark,0,2.13,0,1.15,1,1.15,player);add(new T.BoxGeometry(.48,.14,.1),glow,0,2.13,-.31,1,1,1,player);add(new T.BoxGeometry(.9,.15,.9),dark,0,1.8,0,1,1,1,player)}
  else if(isPuzzle){add(new T.BoxGeometry(.6,.12,.5),glow,0,2.1,-.12,1,1,1,player);add(new T.BoxGeometry(.6,.8,.55),dark,0,1.2,0,1,1,1,player)}
  else {add(new T.BoxGeometry(.65,.18,.38),dark,0,2.2,-.02,1,1,1,player)}
  for(const x of [-.52,.52]){const a=limb(player,x,1.7,0,.16,.82,isMech?'#c4ccd5':cfg.color);parts.push(a);const hand=sph(x,0,0,.14,skin, a)}
  for(const x of [-.22,.22]){const leg=limb(player,x,.72,0,.19,.82,isDiver?'#d9e7ec':'#20283a');parts.push(leg);add(new T.BoxGeometry(.42,.2,.65),dark,x,.1,-.12,1,1,1,player)}
  if(cfg.kind==='stealth'){for(const x of [-.24,.24])box(x,2.12,-.12,.13,.12,.1,'#111827',player);add(new T.ConeGeometry(.13,.45,8),dark,.0,2.38,.05,1,1,1,player)}
 }
 player.userData.limbs=parts;player.userData.baseY=player.position.y;
}
buildAvatar();
function detailedEnemy(e,i){
 while(e.children.length)e.remove(e.children[0]);
 e.geometry?.dispose?.();
 e.geometry=new T.SphereGeometry(.001,4,4);e.material=new T.MeshBasicMaterial({transparent:true,opacity:0});
 const enemyMat=C(cfg.kind==='horror'?'#28202e':cfg.kind==='ocean'?'#1d7d90':cfg.kind==='space'?'#b34d6a':cfg.kind==='mech'?'#9a4d3d':'#9c5557',.42,.38);
 const core=add(new T.CapsuleGeometry(.42,.8,4,8),enemyMat,0,.85,0,1,1,1,e);
 sph(0,1.65,0,.3,cfg.kind==='horror'?'#d8a7f2':'#f4c5a2',e);
 for(const x of [-.55,.55]){const arm=add(new T.CapsuleGeometry(.13,.65,3,6),enemyMat,x,1.05,0,1,1,1,e);arm.rotation.z=x*.55}
 for(const x of [-.2,.2])add(new T.CapsuleGeometry(.16,.6,3,6),dark,x,.25,0,1,1,1,e);
 if(cfg.kind==='horror'){sph(-.12,1.68,-.25,.07,'#ff405f',e);sph(.12,1.68,-.25,.07,'#ff405f',e)}
 e.userData.phase=i*.8;
}
enemies.forEach(detailedEnemy);
// Replace random scatter with game-specific pickup placement and visual identity.
const spots={
 sky:[[-25,0,-20],[-15,0,18],[0,0,-25],[20,0,12],[32,0,-8],[-35,0,4],[8,0,32],[35,0,28]],
 race:[[-9,0,-28],[9,0,-18],[-9,0,-5],[9,0,8],[-9,0,23],[9,0,34],[0,0,0],[0,0,42]],
 ocean:[[-24,1,-22],[-10,2,8],[18,1,-12],[28,3,22],[-34,4,30],[5,3,-38]],
 space:[[-30,5,-22],[-16,4,12],[0,6,-32],[18,5,16],[34,8,-12],[-38,9,32],[8,12,34],[38,4,30],[0,4,42],[24,12,-42]],
 stealth:[[-12,0,-25],[12,0,-12],[-12,0,5],[12,0,22],[0,0,32]],
 survival:[[-20,0,-22],[18,0,-18],[-32,0,4],[28,0,10],[-12,0,30],[16,0,34],[-40,0,-35],[40,0,36],[0,0,-42],[0,0,18],[35,0,-38],[-35,0,40]],
 mech:[[-22,0,-22],[22,0,-22],[-22,0,22],[22,0,22],[0,0,-30],[0,0,30],[-34,0,0],[34,0,0],[0,0,0],[12,0,12]],
 puzzle:[[-24,0,-24],[-6,0,-18],[18,0,-18],[-18,0,6],[6,0,6],[24,0,24]],
 horror:[[-20,0,-20],[20,0,-20],[-20,0,0],[20,0,0],[-20,0,20],[20,0,20],[-8,0,-24],[8,0,24],[0,0,0],[0,0,18],[0,0,-12],[12,0,12]],
 platform:[[-18,1,-28],[-6,3,-16],[6,5,-4],[18,7,8],[-12,9,20],[0,11,32],[18,13,42],[-28,4,2],[30,6,24],[0,15,-42],[36,8,-22],[-36,10,36]]
};
const coords=spots[cfg.kind]||spots.sky;
pickups.forEach((p,i)=>{
 const q=coords[i%coords.length];p.position.set(q[0],q[1]+(cfg.kind==='platform'?1.3:1.1),q[2]);
 p.geometry.dispose?.();p.geometry=new T.OctahedronGeometry(cfg.kind==='race'?.5:.42,1);
 p.material=accentMat;p.scale.setScalar(1);
 if(cfg.kind==='puzzle'){p.geometry=new T.BoxGeometry(.8,.8,.8);p.material=C(i%2?'#64e5ff':'#ffd66e',.25,.5)}
 if(cfg.kind==='ocean'){p.geometry=new T.DodecahedronGeometry(.48,1);p.material=C('#7deaff',.2,.65)}
});
// Add mission-specific visual waypoints and recognizable props.
if(cfg.kind==='sky'){for(let i=0;i<6;i++){const x=-30+i*12;ring(x,3+Math.sin(i)*2,-8,1.25)}}
if(cfg.kind==='race'){for(let z=-35;z<=35;z+=7){box(0,.03,z,1.4,.08,1.4,'#f4f7ff')}}
if(cfg.kind==='ocean'){for(let i=0;i<16;i++){const x=rand(-45,45),z=rand(-45,45);const coral=group(x,0,z);for(let j=0;j<4;j++){const c=cyl(rand(-.5,.5),rand(.6,1.8),rand(-.5,.5),.16,.06,rand(1.2,2.5),i%2?'#ed8f89':'#e5b66e',coral);c.rotation.z=rand(-.5,.5)}}}
if(cfg.kind==='space'){for(let i=0;i<12;i++){const x=rand(-45,45),z=rand(-45,45);const d=group(x,rand(5,22),z);cyl(0,0,0,.8,.8,2,'#6e7592',d).rotation.x=Math.PI/2;ring(0,0,0,1.25)}}
if(cfg.kind==='stealth'){for(let i=0;i<8;i++){const x=rand(-14,14),z=rand(-28,28);const cone=add(new T.ConeGeometry(4,9,20,1,true),new T.MeshBasicMaterial({color:'#b9d6ff',transparent:true,opacity:.07,side:T.DoubleSide}),x,4.5,z);cone.rotation.x=Math.PI}}
if(cfg.kind==='survival'){for(let i=0;i<8;i++){const x=rand(-42,42),z=rand(-42,42);rock(x,z,rand(.6,1.2),'#8c6848')}}
if(cfg.kind==='mech'){for(let i=0;i<8;i++){const x=rand(-35,35),z=rand(-35,35);const c=group(x,0,z);box(0,1,0,2,2,2,'#4d596b',c);box(0,2.1,0,2.2,.18,2.2,th.accent,c)}}
if(cfg.kind==='puzzle'){for(const [x,z] of [[-24,-24],[24,-24],[-24,24]]){const sw=cyl(x,.6,z,.85,.85,1.2,'#e5bf55');ring(x,1.35,z,1.1);sw.userData.switch=true}}
if(cfg.kind==='horror'){for(let i=0;i<9;i++){const x=rand(-24,24),z=rand(-24,24);box(x,1.2,z,rand(1,3),.15,rand(1,3),'#594653')}}
if(cfg.kind==='platform'){for(let i=0;i<10;i++){const x=rand(-42,42),z=rand(-42,42);const p=box(x,rand(1,8),z,rand(3,7),.8,rand(3,7),'#98734f');p.userData.platform=true;ring(x,p.position.y+1,z,.8)}}
// Camera framing and richer avatar movement.
const mini=document.createElement('canvas');mini.width=180;mini.height=180;mini.id='cyberMiniMap';
Object.assign(mini.style,{position:'fixed',right:'22px',bottom:'22px',width:'150px',height:'150px',border:'1px solid #ffffff66',borderRadius:'12px',background:'#07101dcc',zIndex:4,boxShadow:'0 8px 30px #0008'});
document.body.appendChild(mini);const ctx=mini.getContext('2d');
const hud=document.createElement('div');hud.id='worldLabel';hud.textContent=th.name;
Object.assign(hud.style,{position:'fixed',left:'22px',bottom:'72px',padding:'8px 12px',border:'1px solid #ffffff35',borderRadius:'8px',background:'#07101dcc',color:th.accent,font:'800 11px system-ui',letterSpacing:'.14em',zIndex:4});
document.body.appendChild(hud);
const markerList=pickups.map(p=>p.position);
function drawMap(){
 ctx.clearRect(0,0,180,180);ctx.fillStyle='#08111ddd';ctx.fillRect(0,0,180,180);ctx.strokeStyle='#ffffff20';ctx.lineWidth=1;
 for(let i=0;i<=6;i++){ctx.beginPath();ctx.moveTo(i*30,0);ctx.lineTo(i*30,180);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*30);ctx.lineTo(180,i*30);ctx.stroke()}
 const px=(x)=>90+x*1.38,pz=(z)=>90+z*1.38;
 ctx.fillStyle=th.accent;markerList.forEach(p=>{if(p){ctx.beginPath();ctx.arc(px(p.x),pz(p.z),3,0,Math.PI*2);ctx.fill()}});
 ctx.fillStyle='#ff6c79';enemies.forEach(e=>{if(e.visible){ctx.beginPath();ctx.arc(px(e.position.x),pz(e.position.z),3.5,0,Math.PI*2);ctx.fill()}});
 ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(px(player.position.x),pz(player.position.z),5,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=th.accent;ctx.strokeRect(1,1,178,178);
}
let elapsed=0;
G.tick=(dt)=>{
 elapsed+=dt;
 player.userData.limbs?.forEach((l,i)=>{l.rotation.x=Math.sin(elapsed*8+i*Math.PI)*.28});
 if(cfg.kind==='race')player.rotation.z=Math.sin(elapsed*8)*.035;
 if(cfg.kind==='mech')player.children.forEach((m,i)=>{if(i%2===0)m.rotation.x=Math.sin(elapsed*2+i)*.025});
 if(cfg.kind==='space')player.position.y=Math.sin(elapsed*2)*.18;
 if(cfg.kind==='ocean')player.position.y=Math.sin(elapsed*1.5)*.14;
 enemies.forEach((e,i)=>{if(e.visible){e.rotation.y+=dt*(.35+i*.04);e.position.y=(cfg.kind==='ocean'||cfg.kind==='space'?1.4:.8)+Math.sin(elapsed*2+e.userData.phase)*.12}});
 pickups.forEach((p,i)=>{if(p.parent){p.rotation.y+=dt*1.4;p.rotation.x+=dt*.35}});
 drawMap();
};
G.worldName=th.name;
G.worldFeatures=['Bespoke environment layout','Landmark structures and cover','Custom player and enemy models','Live minimap and collectible markers'];
// Compact map key and quality-of-life controls.
const tip=document.createElement('div');tip.textContent='SHIFT  SPRINT  ·  M  MAP';
Object.assign(tip.style,{position:'fixed',left:'22px',top:'112px',padding:'7px 10px',borderRadius:'7px',background:'#07101dbb',color:'#d3d9e7',font:'700 10px system-ui',letterSpacing:'.08em',zIndex:4,pointerEvents:'none'});
document.body.appendChild(tip);
document.addEventListener('keydown',e=>{if(e.code==='KeyM'){mini.style.display=mini.style.display==='none'?'block':'none'}});
})();