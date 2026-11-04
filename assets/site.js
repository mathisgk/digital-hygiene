(function(){
'use strict';
var PFX='cp-hygiene-', mem={};
var store={
  get:function(k){try{var v=localStorage.getItem(PFX+k);if(v!==null)return v;}catch(e){}return mem[k]===undefined?null:mem[k];},
  set:function(k,v){mem[k]=String(v);try{localStorage.setItem(PFX+k,String(v));}catch(e){}},
  del:function(k){delete mem[k];try{localStorage.removeItem(PFX+k);}catch(e){}}
};
function $(s,r){return (r||document).querySelector(s);}
function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
function pad(n){return (n<10?'0':'')+n;}
function fileFor(m){return pad(m.n)+'-'+m.slug+'.html';}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function json(id){var e=document.getElementById(id);if(!e)return null;try{return JSON.parse(e.textContent);}catch(x){return null;}}
function modBySlug(s){var M=window.MODS||[];for(var i=0;i<M.length;i++){if(M[i].slug===s)return M[i];}return null;}
function sel(id,label,opts){return '<label for="'+id+'">'+label+'</label><select id="'+id+'">'+opts.map(function(o,i){return '<option value="'+i+'">'+o+'</option>';}).join('')+'</select>';}

/* ---------- flashcards ---------- */
function flashcards(){
  var host=$('#flash'),cards=json('cards-data');
  if(!host||!cards)return;
  var order=cards.map(function(_,i){return i;}),pos=0,known={};
  host.innerHTML='<div class="fc"><div class="fc-card" id="fcc" role="button" tabindex="0" aria-label="Flashcard. Press Enter to flip."><div class="fc-face fc-front" id="fcf"></div><div class="fc-face fc-back" id="fcb"></div></div></div>'+
   '<div class="fc-ctl"><button class="btn alt" id="fc-prev">Back</button><span class="fc-count" id="fc-n"></span><button class="btn alt" id="fc-next">Next</button><button class="btn alt" id="fc-shuf">Shuffle</button><button class="btn" id="fc-know">Got it</button></div>';
  var card=$('#fcc');
  function show(){var c=cards[order[pos]];$('#fcf').textContent=c[0];$('#fcb').textContent=c[1];card.classList.remove('flip');
    var k=Object.keys(known).length;$('#fc-n').textContent=(pos+1)+' of '+cards.length+'  |  known '+k;
    $('#fc-know').textContent=known[order[pos]]?'Got it (undo)':'Got it';}
  function flip(){card.classList.toggle('flip');}
  card.addEventListener('click',flip);
  card.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();flip();}});
  $('#fc-prev').onclick=function(){pos=(pos-1+cards.length)%cards.length;show();};
  $('#fc-next').onclick=function(){pos=(pos+1)%cards.length;show();};
  $('#fc-shuf').onclick=function(){order=shuffle(order);pos=0;show();};
  $('#fc-know').onclick=function(){var k=order[pos];if(known[k])delete known[k];else known[k]=1;show();};
  show();
}

/* ---------- quiz ---------- */
function quiz(){
  var host=$('#quiz'),qs=json('quiz-data'),slug=document.body.getAttribute('data-slug'),qs0=qs;
  if(!host||!qs)return;
  function shuffleOpts(list){return list.map(function(q){var idx=shuffle(q.o.map(function(_,i){return i;}));return {q:q.q,o:idx.map(function(i){return q.o[i];}),a:idx.indexOf(q.a),e:q.e};});}
  function render(){
    host.innerHTML=qs.map(function(q,i){
      return '<div class="q" id="q'+i+'"><h3>'+(i+1)+'. '+q.q+'</h3>'+q.o.map(function(o,j){
        return '<label><input type="radio" name="q'+i+'" value="'+j+'"> '+o+'</label>';}).join('')+'<div class="why"></div></div>';}).join('')+
      '<p><button class="btn" id="q-check">Check answers</button> <button class="btn alt" id="q-retry" hidden>Try again</button></p><div class="score" id="q-score"></div>';
    $('#q-check').onclick=check;
    $('#q-retry').onclick=function(){qs=shuffleOpts(qs0);render();};
  }
  function check(){
    var score=0,answered=0;
    qs.forEach(function(q,i){
      var box=$('#q'+i),pick=$('input[name=q'+i+']:checked',box);
      var labels=$$('label',box);
      labels.forEach(function(l){l.classList.remove('right','wrong');});
      if(pick){answered++;}
      labels[q.a].classList.add('right');
      if(pick&&+pick.value===q.a){score++;box.className='q ok shown';}
      else{box.className='q bad shown';if(pick)labels[+pick.value].classList.add('wrong');}
      $('.why',box).textContent=q.e;
    });
    $('#q-score').textContent='Score: '+score+' of '+qs.length+(answered<qs.length?'  (unanswered count as missed)':'');
    $('#q-retry').hidden=false;
    var best=parseInt(store.get('quiz:'+slug)||'-1',10);
    if(score>best)store.set('quiz:'+slug,score);
  }
  render();
}

/* ---------- mark complete ---------- */
function complete(){
  var b=$('#done-btn'),slug=document.body.getAttribute('data-slug');
  if(!b)return;
  function paint(){var d=store.get('done:'+slug)==='1';b.textContent=d?'Completed (tap to undo)':'Mark this briefing complete';b.className=d?'btn':'cta';}
  b.onclick=function(){if(store.get('done:'+slug)==='1')store.del('done:'+slug);else store.set('done:'+slug,'1');paint();};
  paint();
}

/* ---------- index ---------- */
function indexPage(){
  var M=window.MODS||[];
  var done=0;
  $$('.mod').forEach(function(a){
    var s=a.getAttribute('data-slug'),st=$('.st',a);
    var d=store.get('done:'+s)==='1',q=store.get('quiz:'+s);
    if(d){done++;st.textContent='done';st.className='st done';}
    else if(q!==null){st.textContent='quiz '+q+'/3';}
  });
  var pct=Math.round(done/M.length*100);
  var m=$('#meter i');if(m)m.style.width=pct+'%';
  var l=$('#meter-label');if(l)l.textContent=done+' of '+M.length+' briefings complete';
  var s=$('#search');
  if(s)s.addEventListener('input',function(){
    var t=s.value.toLowerCase();
    $$('.mod').forEach(function(a){a.style.display=a.textContent.toLowerCase().indexOf(t)>-1?'':'none';});
    $$('.part').forEach(function(p){var n=p.nextElementSibling,any=false;
      $$('.mod',n).forEach(function(a){if(a.style.display!=='none')any=true;});p.style.display=any?'':'none';n.style.display=any?'':'none';});
  });
}

/* ---------- tonight ---------- */
function tonight(){
  var host=$('#chk'),items=json('tonight-data');
  if(!host||!items)return;
  function paint(){
    var n=0;
    host.innerHTML=items.map(function(it,i){
      var on=store.get('tonight:'+i)==='1';if(on)n++;
      var m=modBySlug(it.slug);
      return '<li class="'+(on?'on':'')+'"><input type="checkbox" id="c'+i+'" '+(on?'checked':'')+' data-i="'+i+'"><label for="c'+i+'">'+(i+1)+'. '+it.t+' <a href="'+(m?fileFor(m):'#')+'">module '+(m?pad(m.n):'')+'</a></label></li>';}).join('');
    $$('input',host).forEach(function(c){c.onchange=function(){var i=c.getAttribute('data-i');if(c.checked)store.set('tonight:'+i,'1');else store.del('tonight:'+i);paint();};});
    var mm=$('#meter i');if(mm)mm.style.width=(n/items.length*100)+'%';
    var l=$('#meter-label');if(l)l.textContent=n+' of '+items.length+' done';
  }
  paint();
}

/* ---------- glossary ---------- */
function glossary(){
  var s=$('#search');if(!s)return;
  s.addEventListener('input',function(){var t=s.value.toLowerCase();
    $$('.gl').forEach(function(g){g.style.display=g.textContent.toLowerCase().indexOf(t)>-1?'':'none';});});
}

/* ---------- widgets ---------- */
var W={};

W.threat=function(root){
  var b=$('.wbody',root);
  b.innerHTML='<p>Answer five questions. Everything runs in your browser and nothing is saved.</p>'+
   sel('t-what','What do you most want to protect?',['My social media and photos','My money and bank accounts','My business and client data','My identity (SSN, tax, credit)','My private messages and location'])+
   sel('t-who','Who are you protecting it from?',['Random criminals and automated scams','A person who knows me (ex, family, coworker)','A stalker or abuser','A government or powerful organization'])+
   sel('t-like','How likely is an attempt?',['Unlikely','Possible','Likely'])+
   sel('t-imp','How bad is it if you fail?',['Annoying','Costly','Life-changing'])+
   sel('t-eff','How much trouble will you go through?',['Minimal','Some','Whatever it takes'])+
   '<p><button class="btn" id="t-go">Build my threat model</button></p><div class="out" id="t-out" hidden></div>';
  $('#t-go').onclick=function(){
    var v=function(id){return +$('#'+id).value;};
    var whoW=[1,3,3,3][v('t-who')],score=whoW+(v('t-like')+1)+(v('t-imp')+1);
    var tier=score<=5?'Baseline':(score<=7?'Elevated':'High risk');
    var base=['passwords','mfa','updates','phishing','backups'];
    var extra=[];
    if(tier!=='Baseline')extra=extra.concat(['email','mobile','money','messaging']);
    if(tier==='High risk')extra=extra.concat(['exposure','burner']);
    var byWhat={0:['exposure'],1:['money'],2:['backups','email'],3:['money'],4:['messaging','mobile']}[v('t-what')];
    var all=[];base.concat(extra,byWhat).forEach(function(s){if(all.indexOf(s)<0)all.push(s);});
    var links=all.map(function(s){var m=modBySlug(s);return m?'<li><a href="'+fileFor(m)+'">'+pad(m.n)+'. '+m.title+'</a></li>':'';}).join('');
    var note=(v('t-eff')===0&&tier!=='Baseline')?'<p><b>Heads up:</b> your risk is higher than the effort you are willing to spend. Start with the first three links only, and revisit.</p>':'';
    if(tier==='High risk')note+='<p>For high-risk threat models, general advice is a floor. Seek help from a specialist organization.</p>';
    var o=$('#t-out');o.hidden=false;
    o.innerHTML='<p><span class="pill '+(tier==='Baseline'?'good':(tier==='Elevated'?'warn':'bad'))+'">'+tier+'</span> Score '+score+' of 9.</p>'+note+'<p>Read these briefings first:</p><ol>'+links+'</ol>';
  };
};

W.entropy=function(root){
  var b=$('.wbody',root);
  b.innerHTML='<p class="small">Teaching calculator. Never type a real password into any website, including this one. This page asks for none.</p>'+
   '<label for="e-w">Random words in the passphrase: <b id="e-n">6</b></label><input type="range" id="e-w" min="3" max="10" value="6">'+
   '<label for="e-l">Where the words come from</label><select id="e-l"><option value="7776">Dice word list, 7,776 words, picked at random</option><option value="2048">2,048 word list, picked at random</option><option value="100">Words a person would think of (about 100 likely choices)</option></select>'+
   '<div class="out" id="e-out"></div>';
  function human(sec){
    if(sec<1)return 'less than a second';
    if(sec<60)return Math.round(sec)+' seconds';
    var m=sec/60;if(m<60)return Math.round(m)+' minutes';
    var h=m/60;if(h<24)return Math.round(h)+' hours';
    var d=h/24;if(d<365)return Math.round(d)+' days';
    var y=d/365;
    if(y<1000)return Math.round(y).toLocaleString()+' years';
    if(y<1e6)return Math.round(y/1e3).toLocaleString()+' thousand years';
    if(y<1e9)return Math.round(y/1e6).toLocaleString()+' million years';
    if(y<1e12)return Math.round(y/1e9).toLocaleString()+' billion years';
    return 'longer than the age of the universe';
  }
  function upd(){
    var n=+$('#e-w').value,L=+$('#e-l').value;$('#e-n').textContent=n;
    var bits=n*Math.log(L)/Math.LN2,pb=8*Math.log(95)/Math.LN2;
    var t1=Math.pow(2,bits)/2/1e10,t2=Math.pow(2,pb)/2/1e10;
    $('#e-out').innerHTML='<div class="row"><b>Your passphrase</b><span>'+bits.toFixed(1)+' bits. Average time to crack: <b>'+human(t1)+'</b></span></div>'+
     '<div class="row"><b>8 random characters, all types</b><span>'+pb.toFixed(1)+' bits. Average time to crack: <b>'+human(t2)+'</b></span></div>'+
     '<p class="small">Assumes an offline attacker making 10 billion guesses per second against a fast hash, and finding the answer halfway through. Real managers slow this down further. The point: each added random word multiplies the work, and human-chosen words are far weaker than random ones.</p>';
  }
  $('#e-w').oninput=upd;$('#e-l').onchange=upd;upd();
};

W.browsers=function(root){
  var rows=[
   {n:'Safari (Mac)',p:402,w:29,f:'Randomized'},{n:'Brave',p:399,w:32,f:'Randomized'},
   {n:'Vivaldi + uBlock Origin Lite',p:399,w:32,f:'Unique'},{n:'Edge',p:398,w:33,f:'Unique'},
   {n:'LibreWolf',p:396,w:35,f:'Unique'},{n:'Chrome + uBO Lite + Malwarebytes',p:395,w:36,f:'Unique'},
   {n:'Firefox + uBO + Arkenfox',p:395,w:36,f:'Unique'}];
  var b=$('.wbody',root),zero=true,key='p';
  b.innerHTML='<p class="small">Instructor lab results, all browsers on system-wide Proton VPN. BrowserAudit tests security-spec compliance out of 431 checks. EFF Cover Your Tracks tests fingerprinting.</p>'+
   '<div class="toggles"><label><input type="checkbox" id="b-z" checked> Bars start at zero (honest scale)</label>'+
   '<label>Sort by <select id="b-s" style="width:auto"><option value="p">BrowserAudit score</option><option value="f">Fingerprint result</option></select></label></div><div class="bars" id="b-bars"></div>'+
   '<p class="small" id="b-note"></p>';
  function draw(){
    var r=rows.slice().sort(function(a,b){return key==='p'?(b.p-a.p):((a.f==='Randomized'?0:1)-(b.f==='Randomized'?0:1)||b.p-a.p);});
    var lo=zero?0:380,hi=zero?431:405;
    $('#b-bars').innerHTML=r.map(function(x){var w=Math.max(2,(x.p-lo)/(hi-lo)*100);
      return '<div class="b"><span>'+x.n+'</span><div class="track"><div class="fill '+(x.f==='Randomized'?'rand':'')+'" style="width:'+w+'%"></div></div><span>'+x.p+' / '+x.w+' <span class="pill '+(x.f==='Randomized'?'good':'warn')+'">'+x.f+'</span></span></div>';}).join('');
    $('#b-note').textContent=zero?'On an honest scale the browsers are nearly identical on spec compliance. Green bars are the ones that randomize their fingerprint.':'Zoomed scale: this exaggerates a gap of about 7 checks. Always check the axis.';
  }
  $('#b-z').onchange=function(){zero=this.checked;draw();};
  $('#b-s').onchange=function(){key=this.value;draw();};
  draw();
};

W.vpn=function(root){
  var b=$('.wbody',root);
  b.innerHTML='<div class="toggles"><label><input type="checkbox" id="v-on"> VPN connected</label><label><input type="checkbox" id="v-g"> Logged into Google</label></div><div id="v-out"></div>';
  function pill(c,t){return '<span class="pill '+c+'">'+t+'</span>';}
  function upd(){
    var on=$('#v-on').checked,g=$('#v-g').checked;
    var rows=[
     ['Your ISP sees',on?pill('good','Only that you use a VPN'):pill('bad','Every site you visit')],
     ['The VPN company sees',on?pill('warn','Your destinations (trust them)'):pill('good','Nothing, you are not using one')],
     ['Websites see your IP as',on?pill('good','The VPN server\'s address'):pill('bad','Your real home address')],
     ['Google knows who you are',g?pill('bad','Yes, because you logged in'):pill('good','Not by name (cookies and fingerprint can still link visits)')],
     ['Trackers and fingerprinting',pill('warn','Unchanged by the VPN. Browser and blocker handle this.')]];
    $('#v-out').innerHTML=rows.map(function(r){return '<div class="row"><b>'+r[0]+'</b><span>'+r[1]+'</span></div>';}).join('');
  }
  $('#v-on').onchange=upd;$('#v-g').onchange=upd;upd();
};

W.dns=function(root){
  var b=$('.wbody',root);
  b.innerHTML='<label for="d-site">Site you visit</label><input type="text" id="d-site" value="example.com">'+
   '<label for="d-mode">How your DNS works</label><select id="d-mode"><option value="plain">Default: plain DNS to your ISP</option><option value="doh">Encrypted DNS (DoH) to a resolver you chose</option><option value="vpn">VPN with its own DNS</option></select>'+
   '<p><button class="btn" id="d-go">Look it up</button></p><div id="d-out" hidden></div>';
  $('#d-go').onclick=function(){
    var site=($('#d-site').value||'example.com').replace(/[^a-zA-Z0-9.\-]/g,'').slice(0,60)||'example.com',mode=$('#d-mode').value;
    var cap,who;
    if(mode==='plain'){
      cap='10.0.0.20 -> ISP resolver   UDP 53   DNS query:  '+site+' A?\nISP resolver -> 10.0.0.20   UDP 53   DNS answer: '+site+' = 203.0.113.10';
      who='<span class="pill bad">Your ISP and anyone on the path can read '+esc(site)+'</span>';
    }else if(mode==='doh'){
      cap='10.0.0.20 -> resolver       TCP 443  TLS Application Data (encrypted)\nresolver -> 10.0.0.20       TCP 443  TLS Application Data (encrypted)';
      who='<span class="pill warn">Your ISP sees that you used a resolver, not the site name. The resolver you chose sees the name.</span>';
    }else{
      cap='10.0.0.20 -> VPN server     UDP 51820 encrypted tunnel\nVPN server -> 10.0.0.20     UDP 51820 encrypted tunnel';
      who='<span class="pill warn">Your ISP sees only the tunnel. The VPN company sees the lookup.</span>';
    }
    var o=$('#d-out');o.hidden=false;
    o.innerHTML='<p><b>What the network sees (simulated capture):</b></p><pre class="cap">'+esc(cap)+'</pre><p>'+who+'</p><p class="small">Simulation only. The address 203.0.113.10 is a reserved documentation address. To see the real thing, capture DNS in Wireshark on your own machine.</p>';
  };
};

W.phish=function(root){
  var b=$('.wbody',root);
  b.innerHTML='<p>Click everything in this email that looks like a red flag, then check your answers.</p>'+
  '<div class="mail"><div class="mh2"><div><b>From:</b> <span class="hot" tabindex="0" data-f="1" data-why="The display name says Northbridge, but the domain northbridge-secure-login.co is not the bank\'s real domain.">Northbridge Security &lt;alerts@northbridge-secure-login.co&gt;</span></div>'+
  '<div><b>Subject:</b> <span class="hot" tabindex="0" data-f="1" data-why="Threat of closing the account in 24 hours is manufactured urgency.">URGENT: Your account will be closed in 24 hours</span></div>'+
  '<div><b>Received:</b> <span class="hot" tabindex="0" data-f="0" data-why="A normal weekday time is not a red flag. Do not rely on timestamps.">Tuesday 9:14 AM</span></div></div>'+
  '<div class="mb"><p><span class="hot" tabindex="0" data-f="1" data-why="A real bank greets you by name. Generic greetings suggest mass sending.">Dear Valued Customer,</span></p>'+
  '<p>We detected unusual sign-in activity. <span class="hot" tabindex="0" data-f="1" data-why="Fear plus a deadline pushes you to act before thinking.">Verify your identity now or your account will be permanently suspended.</span></p>'+
  '<p><span class="hot btnfake" tabindex="0" data-f="1" data-why="The button text says northbridge.com but the real link goes to northbridge-secure-login.co. Hover to see the true destination, or never click and go to the site yourself.">northbridge.com/verify</span></p>'+
  '<p>Attached: <span class="hot" tabindex="0" data-f="1" data-why="An unexpected .html attachment can open a fake login page locally. Banks do not send these.">Security_Form.html</span></p>'+
  '<p style="color:#666;font-size:.85rem"><span class="hot" tabindex="0" data-f="0" data-why="A plain street address in a footer is normal. Scammers can fake it too, so it proves nothing either way.">Northbridge Savings, 100 Main Street</span></p></div></div>'+
  '<p><button class="btn" id="p-go">Check my answers</button> <button class="btn alt" id="p-reset">Reset</button></p><div class="out" id="p-out" hidden></div>';
  var hot=$$('.hot',root);
  hot.forEach(function(h){
    function tg(){h.classList.toggle('sel');}
    h.addEventListener('click',function(e){e.preventDefault();tg();});
    h.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();tg();}});
  });
  $('#p-go').onclick=function(){
    var hit=0,miss=[],wrong=[],total=0;
    hot.forEach(function(h){
      var f=h.getAttribute('data-f')==='1',s=h.classList.contains('sel'),why=h.getAttribute('data-why');
      h.classList.remove('r-hit','r-miss','r-wrong');
      if(f){total++;if(s){hit++;h.classList.add('r-hit');}else{miss.push(why);h.classList.add('r-miss');}}
      else if(s){wrong.push(why);h.classList.add('r-wrong');}
    });
    var o=$('#p-out');o.hidden=false;
    o.innerHTML='<p><b>You found '+hit+' of '+total+' red flags.</b></p>'+
      (miss.length?'<p>Missed:</p><ul>'+miss.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'')+
      (wrong.length?'<p>Not actually red flags:</p><ul>'+wrong.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'')+
      '<p class="small">Green marks are flags you caught, orange are ones you missed, red are false alarms.</p>';
  };
  $('#p-reset').onclick=function(){hot.forEach(function(h){h.classList.remove('sel','r-hit','r-miss','r-wrong');});$('#p-out').hidden=true;};
};

W.clickfix=function(root){
  var b=$('.wbody',root);
  b.innerHTML='<p class="small">Harmless demo. Nothing is copied to your clipboard and nothing runs.</p><div id="cf-stage"></div>';
  function s1(){
    $('#cf-stage').innerHTML='<div class="fake"><div class="cb" id="cf-cb"><span class="box"></span> I am not a robot</div><p style="font-size:.75rem;color:#777;margin:8px 0 0">Protected by SecureCheck</p></div>';
    $('#cf-cb').onclick=s2;
  }
  function s2(){
    $('#cf-stage').innerHTML='<div class="fake"><b>Verification step 2 of 2</b><p>To prove you are human:</p><ol><li>Press <b>Windows + R</b></li><li>Press <b>Ctrl + V</b></li><li>Press <b>Enter</b></li></ol></div>'+
     '<p>What do you do?</p><p><button class="btn" id="cf-do">Follow the steps</button> <button class="btn alt" id="cf-no">Something is off</button></p>';
    $('#cf-do').onclick=function(){res(false);};$('#cf-no').onclick=function(){res(true);};
  }
  function res(ok){
    $('#cf-stage').innerHTML='<div class="out"><p><span class="pill '+(ok?'good':'bad')+'">'+(ok?'Good catch':'This would have infected you')+'</span></p>'+
     '<p>This is <b>ClickFix</b>. A real CAPTCHA never asks you to open a system window or paste anything. The page silently copies a malicious command to your clipboard, then walks you through running it yourself, which skips most browser and download protections.</p>'+
     '<p>If you ever do this by accident: disconnect from the network, use a different device to change your passwords (email first), and rebuild the machine. See Module 19.</p><p><button class="btn alt" id="cf-again">Try again</button></p></div>';
    $('#cf-again').onclick=s1;
  }
  s1();
};

W.encrypt=function(root){
  var D={
   'Signal':['Yes','Nothing readable stored','Yes, by default','You and your contact','Minimal','History lives on your device. Check backup settings.'],
   'WhatsApp':['Yes','Content unreadable to server','Yes, by default','You and your contact','Meta collects who, when, and how often','Backups are not E2EE unless you turn on encrypted backups.'],
   'iMessage':['Yes','Encrypted, device keys','Yes, Apple to Apple','Your devices','Apple holds some','iCloud backup can expose messages unless Advanced Data Protection is on.'],
   'iPhone to Android texts (RCS)':['Yes','Depends on rollout','Rolling out since May 2026, beta, carrier dependent','Your devices','Carrier and platform see some','Look for the lock icon. Do not assume.'],
   'Telegram regular and group chats':['Yes','Encrypted, but Telegram holds the keys','No','Telegram','Telegram holds it','Readable by Telegram servers. Avoid for sensitive talk.'],
   'Telegram Secret Chat':['Yes','Not stored on servers','Yes, one-on-one only','Your two devices','Less','Rarely used. Device specific.'],
   'Plain SMS':['No','Carrier stores it','No','Not applicable','Carrier holds it','Spoofable and tied to SIM swapping. Not for sensitive messages.'],
   'Regular email':['Usually between servers','Provider encrypts, provider holds keys','No, unless both sides use PGP or the same private provider','Your provider','Provider holds it','Treat as postcards unless both ends use end-to-end tools.']};
  var labels=['Encrypted in transit?','Encrypted at rest on the server?','End to end?','Who holds the keys?','Metadata','Watch out for'];
  var b=$('.wbody',root);
  b.innerHTML='<label for="x-app">Pick a service</label><select id="x-app">'+Object.keys(D).map(function(k){return '<option>'+k+'</option>';}).join('')+'</select><div id="x-out"></div>';
  function cls(i,v){var t=v.toLowerCase();if(i===2){return t.indexOf('yes')===0?'good':(t.indexOf('no')===0?'bad':'warn');}
    if(i===3)return t.indexOf('telegram')===0||t.indexOf('your provider')===0||t.indexOf('not')===0?'bad':'good';return '';}
  function upd(){
    var v=D[$('#x-app').value];
    $('#x-out').innerHTML=labels.map(function(l,i){var c=cls(i,v[i]);
      return '<div class="row"><b>'+l+'</b><span>'+(c?'<span class="pill '+c+'">'+esc(v[i])+'</span>':esc(v[i]))+'</span></div>';}).join('')+
      '<p class="small">Armored truck = in transit. Vault the company has the key to = at rest. Sealed envelope only the recipient can open = end to end.</p>';
  }
  $('#x-app').onchange=upd;upd();
};

W.irorder=function(root){
  var steps=['Contain: disconnect the device, do not pay or reply','Switch to a clean device','Secure email: password, sessions, forwarding rules, recovery, connected apps','Secure the rest: password manager, bank, Apple or Google account, social, with MFA','Money: call the bank, freeze credit','Warn contacts about possible impersonation','Rebuild the device if malware ran','Report: FTC, IC3, IT','Find the entry point and fix it'];
  var b=$('.wbody',root),next=0,list=shuffle(steps.map(function(s,i){return {t:s,i:i};}));
  function draw(){
    b.innerHTML='<p>Tap the steps in the right order. Step '+(Math.min(next+1,steps.length))+' of '+steps.length+'.</p><div class="steps" id="o-pick"></div><ol class="ordered" id="o-done"></ol><p id="o-msg" class="small"></p><p><button class="btn alt" id="o-reset">Reset</button></p>';
    list.forEach(function(x){var btn=document.createElement('button');btn.textContent=x.t;if(x.i<next)btn.className='used';
      btn.onclick=function(){
        if(x.i===next){next++;draw();}
        else{btn.classList.add('shake');$('#o-msg').textContent='Not yet. Think about what stops the damage first and what everything else depends on.';setTimeout(function(){btn.classList.remove('shake');},350);}
      };$('#o-pick').appendChild(btn);});
    $('#o-done').innerHTML=steps.slice(0,next).map(function(s){return '<li>'+esc(s)+'</li>';}).join('');
    if(next===steps.length)$('#o-msg').innerHTML='<b>All nine in order. Clean device, email first, then everything else.</b>';
    $('#o-reset').onclick=function(){next=0;list=shuffle(list);draw();};
  }
  draw();
};


/* ---------- reset and progress report ---------- */
function resetAll(){
  try{var keys=[];for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf(PFX)===0)keys.push(k);}
    keys.forEach(function(k){localStorage.removeItem(k);});}catch(e){}
  mem={};
}
function wireReset(){
  $$('[data-reset]').forEach(function(b){
    b.onclick=function(){
      if(window.confirm('Clear all saved progress on this browser? This cannot be undone.')){resetAll();location.reload();}
    };
  });
}
function progressPage(){
  var M=window.MODS||[],items=json('tonight-data')||[],host=$('#report');
  if(!host)return;
  var d=$('#r-date');if(d)d.textContent=new Date().toLocaleDateString();
  var done=0,taken=0,pts=0;
  var rows=M.map(function(m){
    var ok=store.get('done:'+m.slug)==='1',q=store.get('quiz:'+m.slug);
    if(ok)done++;if(q!==null){taken++;pts+=parseInt(q,10);}
    return '<tr><td>'+pad(m.n)+'. '+esc(m.title)+'</td><td>'+(ok?'Complete':'Not complete')+'</td><td>'+(q===null?'Not taken':q+' of 3')+'</td></tr>';
  }).join('');
  var tn=0;
  var trows=items.map(function(it,i){
    var on=store.get('tonight:'+i)==='1';if(on)tn++;
    return '<tr><td>'+(i+1)+'. '+esc(it.t)+'</td><td>'+(on?'Done':'Not done')+'</td></tr>';
  }).join('');
  host.innerHTML='<h2>Summary</h2><table class="t"><tr><th>Measure</th><th>Result</th></tr>'+
    '<tr><td>Briefings marked complete</td><td>'+done+' of '+M.length+'</td></tr>'+
    '<tr><td>Quizzes taken</td><td>'+taken+' of '+M.length+'</td></tr>'+
    '<tr><td>Best quiz points</td><td>'+pts+' of '+(M.length*3)+'</td></tr>'+
    '<tr><td>Do This Tonight items done</td><td>'+tn+' of '+items.length+'</td></tr></table>'+
    '<h2>Briefings</h2><table class="t"><tr><th>Briefing</th><th>Status</th><th>Best quiz score</th></tr>'+rows+'</table>'+
    '<h2>Do This Tonight</h2><table class="t"><tr><th>Task</th><th>Status</th></tr>'+trows+'</table>';
  var p=$('#r-print');if(p)p.onclick=function(){window.print();};
}

/* ---------- boot ---------- */
function boot(){
  var page=document.body.getAttribute('data-page');
  if(page==='module'){flashcards();quiz();complete();$$('.widget[data-widget]').forEach(function(w){var f=W[w.getAttribute('data-widget')];if(f)f(w);});}
  else if(page==='index')indexPage();
  else if(page==='tonight')tonight();
  else if(page==='glossary')glossary();
  else if(page==='progress')progressPage();
  wireReset();
}
window.CP_BOOT=boot;
if(!window.CP_SINGLE){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();}
})();
