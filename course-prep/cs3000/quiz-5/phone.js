import {initTools} from './tools.js';
import {selectDeck,recordAnswer,scheduleMiss} from './scheduler.js';
const $=s=>document.querySelector(s),KEY='cs3000-q5-phone-v1';
let data,state={progress:{},session:null},storageOK=true,view='home',numeric='',feedback=null,phoneMode=true,tools;
try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');state={...state,...s};state.progress=state.progress||{}}catch{storageOK=false}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{storageOK=false;$('#toast').textContent='Storage unavailable. This session works, but progress may not survive closing.'}}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function mastered(t){let cards=data.cards.filter(c=>c.topic===t);return `${cards.filter(c=>(state.progress[c.id]?.streak||0)>=2).length} of ${cards.length} mastered`}
function button(label,action,cls=''){let b=document.createElement('button');b.textContent=label;b.className=cls;b.onclick=action;return b}
function mode(phone){phoneMode=phone;$('#phone-app').hidden=!phone;$('#full-view').hidden=phone;const u=new URL(location.href);u.searchParams.set('mode',phone?'phone':'full');history.replaceState(null,'',u);if(!phone&&!$('#full-frame').src)$('#full-frame').src='full.html'+location.hash;if(phone&&data)home()}
$('#full-switch').onclick=()=>mode(false);$('#phone-switch').onclick=()=>mode(true);$('#home-button').onclick=()=>home();
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===$('#full-frame').contentWindow&&e.data?.type==='q5-full-hash'&&/^#lesson-\d+$/.test(e.data.hash)){history.replaceState(null,'',location.pathname+location.search+e.data.hash)}});
function dock(items){$('#dock').replaceChildren(...items)}
function home(){view='home';$('#home-button').hidden=true;const resume=state.session&&state.session.pos<state.session.queue.length;$('#stage').innerHTML=`<h1>Pick the subproblem.<br>The rest follows.</h1><p class="lead">Quiz 5 · Mon, Nov 2<br>New problems, one step at a time: visualize, find the subproblem, relate, generalize, implement in order. Every example is small enough to work in your head.</p>${resume?'<button class="resume" id="resume">Resume your break</button>':''}<div class="start-grid"><button class="start primary" data-deck="sub">Subproblem lab<small>${data.cards.filter(c=>c.topic==='sub').length} new problems · ~2 min each</small></button><button class="start" data-deck="shape">Shape drill<small>${mastered('shape')}</small></button><button class="start" data-deck="quarter">Quarter break<small>4 min · 6 cards</small></button><button class="start" data-deck="halftime">Halftime<small>20 min · 30 cards</small></button></div><h2>Pick a topic</h2><div class="topic-list">${Object.entries(data.topics).filter(([t])=>!['formula','sub','shape'].includes(t)).map(([t,name])=>`<button class="topic" data-deck="${t}"><span>${esc(name)}<small>${mastered(t)}</small></span><span class="chevron" aria-hidden="true">›</span></button>`).join('')}<button class="topic special" data-deck="formula"><span>Formula flash<small>${mastered('formula')}</small></span><span class="chevron" aria-hidden="true">›</span></button><button class="topic special" data-deck="must"><span>Night-before / morning<small>${data.cards.filter(c=>c.must).length} must-know cards</small></span><span class="chevron" aria-hidden="true">›</span></button></div><p class="subtle">Missed cards return after three other cards and come first next time. Two correct recalls master a card. Progress stays on this device.</p><p class="subtle">Wait for “Offline ready” above before the network drops.</p><div id="toast" aria-live="polite"></div>`;
 $('#stage').querySelectorAll('[data-deck]').forEach(b=>b.onclick=()=>start(b.dataset.deck));if(resume)$('#resume').onclick=()=>{view='card';renderCard()};dock([button('Must-know',()=>start('must'),'secondary'),button('Next problem',()=>start('sub'),'primary')]);$('#stage').scrollTop=0;
}
function start(name){const deck=selectDeck(data.cards,state.progress,name);state.session={name,deck,queue:[...deck],pos:0,retries:{},correct:0,answered:0,started:Date.now(),result:null};save();view='card';renderCard()}
function current(){return data.cards.find(c=>c.id===state.session.queue[state.session.pos])}
function renderCard(){
 const s=state.session;if(s.pos>=s.queue.length){finish();return}view='card';const c=current();feedback=s.result;numeric=s.draft||'';$('#home-button').hidden=false;
 tools?.cardChanged(c.id);const done=state.progress[c.id],retry=s.queue.indexOf(c.id)<s.pos;
 $('#stage').innerHTML=`<div class="card-top"><span>${esc(data.topics[c.topic])}${retry?' · <span class="retry-label">Review again</span>':''}</span><span>${s.pos+1} / ${s.queue.length}</span></div><div class="card-progress" aria-label="Session progress"><div style="width:${s.pos/s.queue.length*100}%"></div></div><article id="study-card" data-card-id="${c.id}" data-kind="${c.kind}" data-optional="${!!c.optional}">${c.optional?'<div class="work-tag">Optional: Work it out</div>':''}<h1 class="question">${esc(c.prompt)}</h1><div id="answer-zone"></div><div id="feedback-zone" aria-live="polite"></div><p class="source">${esc(c.source)}</p></article><div id="toast" aria-live="polite"></div>`;
 if(c.kind==='choice'){
  $('#answer-zone').innerHTML='<div class="choices">'+c.options.map((v,i)=>`<button class="choice ${v.length>22?'long':''}" data-option="${i}">${esc(v)}</button>`).join('')+'</div>';
  $('#answer-zone').querySelectorAll('button').forEach(b=>b.onclick=()=>grade(c.options[+b.dataset.option]===c.answer,c.options[+b.dataset.option]));
 }else if(c.kind==='numeric'){
  $('#answer-zone').innerHTML='<div class="numeric-display" role="textbox" aria-label="Numeric answer" aria-readonly="true">—</div><div class="keypad" aria-label="Number pad">'+['1','2','3','⌫','4','5','6','Clear','7','8','9','−','.','0'].map(k=>`<button class="${k==='Clear'||k==='⌫'?'small':''}" data-key="${k}" aria-label="${k==='⌫'?'Backspace':k==='−'?'Minus':k==='.'?'Decimal point':k}">${k}</button>`).join('')+'</div><p class="numeric-hint">Tap the number pad. No keyboard needed.</p>';
  $('#answer-zone').querySelectorAll('[data-key]').forEach(b=>{b.onclick=()=>key(b.dataset.key)});
 }else if(c.kind!=='steps'){
  $('#answer-zone').innerHTML='<p class="lead">Recall it in your head, then reveal.</p>';
 }
 if(feedback)showFeedback();else if(c.kind==='steps')renderSteps(c);else{
  let action=c.kind==='flip'?button('Reveal answer',reveal,'primary'):c.kind==='numeric'?button('Check answer',()=>{if(numeric===''||numeric==='-'||numeric==='.'){$('#toast').textContent='Tap a number first.';return}grade(Math.abs(Number(numeric)-Number(c.answer))<=Number(c.tolerance||1e-8),numeric)},'primary'):button('Choose an answer above',()=>{},'primary');
  if(c.kind==='choice')action.disabled=true;dock([action]);
 }
 $('#stage').scrollTop=0;
}
function problemHead(c){return `<div class="problem"><p>${esc(c.setup)}</p><p class="example">${esc(c.example)}</p></div>`}
function trail(c,n){return `<ol class="step-trail">${c.steps.slice(0,n).map((x,i)=>`<li class="${state.session.step?.missed.includes(i)?'stumbled':''}"><span>${esc(x.tag)}</span>${esc(x.answer)}</li>`).join('')}</ol>`}
// A steps card walks one new problem through the five steps; a wrong pick explains itself and stays on the step.
function renderSteps(c,scroll){
 const s=state.session;if(!s.step||s.step.id!==c.id||s.step.at!==s.pos)s.step={id:c.id,at:s.pos,i:0,missed:[],tried:[],shown:false};
 const st=s.step,x=c.steps[st.i],last=st.i===c.steps.length-1,miss=st.tried.length&&!st.shown?x.options[st.tried.at(-1)]:null;
 $('#answer-zone').innerHTML=`${problemHead(c)}${trail(c,st.i)}<div class="step-now"><div class="step-tag">Step ${st.i+1} of ${c.steps.length} · ${esc(x.tag)}</div><h2>${esc(x.q)}</h2><div class="choices">${x.options.map((v,k)=>`<button class="choice ${v.length>22?'long':''} ${st.tried.includes(k)?'wrong':''} ${st.shown&&v===x.answer?'selected':''}" data-option="${k}" ${st.tried.includes(k)||st.shown?'disabled':''}>${esc(v)}</button>`).join('')}</div></div>`;
 $('#feedback-zone').innerHTML=st.shown?`<div class="feedback"><h2>${st.missed.includes(st.i)?'Got there':'Right'}</h2><p>${esc(x.why)}</p></div>`:miss?`<div class="feedback missed"><h2>Not quite</h2><p>${esc(x.miss[miss])}</p><p class="screen-hint">Pick again.</p></div>`:'';
 $('#answer-zone').querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>{if(x.options[+b.dataset.option]===x.answer)st.shown=true;else{st.tried.push(+b.dataset.option);if(!st.missed.includes(st.i))st.missed.push(st.i)}save();renderSteps(c,'feedback')});
 dock(st.shown?[button('Pause',home,'secondary'),button(last?'Finish problem':'Next step',()=>{if(last)grade(!st.missed.length,c.answer);else{st.i++;st.tried=[];st.shown=false;save();renderSteps(c,'step')}},'primary')]:[button('Pause',home,'secondary'),Object.assign(button('Pick an answer above',()=>{},'primary'),{disabled:true})]);
 if(scroll==='feedback')$('#feedback-zone').scrollIntoView({block:'nearest',behavior:'smooth'});else if(scroll==='step')$('.step-now').scrollIntoView({block:'start',behavior:'smooth'});
}
function key(k){if(feedback)return;if(k==='Clear')numeric='';else if(k==='⌫')numeric=numeric.slice(0,-1);else if(k==='−')numeric=numeric.startsWith('-')?numeric.slice(1):'-'+numeric;else if(k==='.'&&!numeric.includes('.'))numeric+='.';else if(/^\d$/.test(k)&&numeric.length<16)numeric+=k;$('.numeric-display').textContent=numeric||'—';$('#toast').textContent=''}
function reveal(){const c=current();$('#answer-zone').innerHTML=`<div class="flip-face">${esc(c.answer)}</div>`;$('#feedback-zone').innerHTML=`<div class="feedback"><p>${esc(c.explain)}</p><div class="formula">${c.math}</div></div>`;dock([button('Need review',()=>grade(false,c.answer),'secondary'),button('Got it',()=>grade(true,c.answer),'primary')]);}
function grade(correct,selected){if(state.session.result)return;const c=current();state.progress=recordAnswer(state.progress,c.id,correct);if(!correct)state.session=scheduleMiss(state.session,c.id,state.session.deck);state.session.correct+=correct?1:0;state.session.answered++;state.session.result={correct,selected};feedback=state.session.result;save();showFeedback()}
function showFeedback(){const c=current(),r=state.session.result;if(!r)return;
 if(c.kind==='steps'){const missed=state.session.step?.missed||[];$('#answer-zone').innerHTML=problemHead(c)+trail(c,c.steps.length);$('#feedback-zone').innerHTML=`<div class="feedback ${r.correct?'':'missed'}"><h2>${r.correct?'Clean run':'Worth another pass'}</h2>${missed.length?`<p class="correct-answer">Stumbled on: ${esc(missed.map(i=>c.steps[i].tag).join(', '))}. It comes back after three cards.</p>`:''}<p class="recipe">${esc(c.answer)}</p><p>${esc(c.explain)}</p></div><p class="screen-hint">Swipe left or tap Next.</p>`;dock([button('Pause',home,'secondary'),button('Next',next,'primary')]);return}
 $('#answer-zone').querySelectorAll('button').forEach(b=>{b.disabled=true;if(c.kind==='choice'&&c.options[+b.dataset.option]===r.selected)b.classList.add(r.correct?'selected':'wrong')});
 if(c.kind==='choice')$('#answer-zone').innerHTML=`<div class="choice ${r.correct?'selected':'wrong'}">Your pick: ${esc(r.selected)}</div>`;
 if(c.kind==='numeric'){$('#answer-zone').innerHTML=`<div class="numeric-display" role="textbox" aria-label="Numeric answer" aria-readonly="true">${esc(r.selected)}</div>`}
 if(c.kind==='flip')$('#answer-zone').innerHTML=`<div class="flip-face">${esc(c.answer)}</div>`;
 $('#feedback-zone').innerHTML=`<div class="feedback ${r.correct?'':'missed'}"><h2>${r.correct?'Correct':'Review this'}</h2>${!r.correct&&c.kind!=='flip'?`<p class="correct-answer">Answer: ${esc(c.answer)}</p>`:''}${!r.correct&&c.miss?.[r.selected]?`<p class="miss-why">Why not “${esc(r.selected)}”: ${esc(c.miss[r.selected])}</p>`:''}<p>${esc(c.explain)}</p><div class="formula">${c.math}</div></div><p class="screen-hint">Swipe left or tap Next.</p>`;
 dock([button('Pause',home,'secondary'),button('Next',next,'primary')]);
}
function next(){if(!state.session?.result)return;state.session.pos++;state.session.result=null;state.session.draft='';save();renderCard()}
function finish(){view='summary';const s=state.session;$('#home-button').hidden=false;$('#stage').innerHTML=`<h1>Break well spent.</h1><div class="summary-metric">${s.correct} / ${s.answered}</div><p>Correct recalls this break.</p><p class="lead">Your progress is saved. Cards that need work will come first next time.</p><div class="topic-list">${Object.entries(data.topics).map(([t,name])=>`<div class="topic"><span>${esc(name)}<small>${mastered(t)}</small></span></div>`).join('')}</div><div id="toast"></div>`;dock([button('Home',home,'secondary'),button('Another 3 min',()=>start('quarter'),'primary')]);$('#stage').scrollTop=0}
let touchStart;$('#stage').addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY}});$('#stage').addEventListener('pointerup',e=>{if(!touchStart||view!=='card')return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;if(dx< -60&&Math.abs(dy)<55){if(state.session.result){e.preventDefault();requestAnimationFrame(next)}else $('#toast').textContent='Answer or reveal before moving on.'}});
window.addEventListener('keydown',e=>{if(tools?.isOpen()||view!=='card'||current()?.kind!=='numeric'||state.session.result)return;if(/^\d$/.test(e.key))key(e.key);else if(e.key==='Backspace')key('⌫');else if(e.key==='-')key('−');else if(e.key==='.')key('.')});
let onlineReady=false;
function cacheLabel(){const el=$('#cache-status');el.textContent=onlineReady?(navigator.onLine?'Offline ready · progress on device':'Offline · all decks ready'):'Saving for offline…';el.classList.toggle('ready',onlineReady)}
window.addEventListener('online',cacheLabel);window.addEventListener('offline',cacheLabel);
async function setupOffline(){
 if(!('serviceWorker' in navigator)){$('#cache-status').textContent='Offline caching unavailable in this browser';return}
 try{
  const hadController=!!navigator.serviceWorker.controller;await navigator.serviceWorker.register('./sw.js',{scope:'./'});const reg=await navigator.serviceWorker.ready;
  navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='Q5_OFFLINE_READY'){onlineReady=true;cacheLabel()}});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{onlineReady=true;cacheLabel();if(hadController)location.reload()});
  const channel=new MessageChannel();channel.port1.onmessage=e=>{if(e.data?.ready){onlineReady=true;cacheLabel()}};reg.active?.postMessage({type:'Q5_CACHE_STATUS'},[channel.port2]);
 }catch{$('#cache-status').textContent='Offline save failed · reconnect and reload'}
}
const params=new URLSearchParams(location.search),showPhone=params.get('mode')==='phone'||params.get('mode')!=='full'&&matchMedia('(max-width:599px)').matches;
$('#phone-app').hidden=!showPhone;$('#full-view').hidden=showPhone;if(!showPhone)$('#full-frame').src='full.html'+location.hash;
try{data=await fetch('./decks.json').then(r=>{if(!r.ok)throw Error();return r.json()});tools=initTools({getCard:()=>view==='card'?current()?.id:null,canUseAnswer:()=>view==='card'&&current()?.kind==='numeric'&&!state.session.result,useAnswer:value=>{numeric=value;$('.numeric-display').textContent=value;state.session.draft=value;save()}});if(showPhone)home();setupOffline()}catch{$('#stage').innerHTML='<h1>Reconnect once to save the decks.</h1><p class="lead">Then every card works offline. Reload when you have a connection.</p>';dock([button('Reload',()=>location.reload(),'primary')])}
