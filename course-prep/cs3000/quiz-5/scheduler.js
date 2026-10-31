export function priority(card,progress){const p=progress[card.id];if(!p)return 200;if(p.streak<2&&p.misses)return 1000+p.misses*10;if(p.streak<2)return 100;return (p.due||0)<=Date.now()?50:0}
export function selectDeck(cards,progress,mode){
 let pool=cards.filter(c=>mode==='formula'?c.topic==='formula':mode==='must'?c.must:mode==='quarter'||mode==='halftime'?c.topic!=='formula'&&!c.optional:c.topic===mode);
 pool=pool.map((c,i)=>({c,i})).sort((a,b)=>priority(b.c,progress)-priority(a.c,progress)||a.i-b.i).map(x=>x.c);
 if(!['quarter','halftime'].includes(mode))return pool.map(c=>c.id);
 // Breaks lead with subproblem practice; listing a topic twice gives it two cards per round.
 const max=mode==='quarter'?6:30,topics=mode==='quarter'?['shape','sub','shape','basics','knapsack','lcs','coin','edit','proof']:['sub','shape','shape','basics','coin','knapsack','lcs','edit','proof'],out=[];
 for(const c of pool.filter(c=>(progress[c.id]?.misses||0)>0&&progress[c.id]?.streak<2).slice(0,2))out.push(c.id);
 while(out.length<max){let added=false;for(const t of topics){const c=pool.find(c=>c.topic===t&&!out.includes(c.id));if(c&&out.length<max){out.push(c.id);added=true}}if(!added)break}
 return out;
}
export function recordAnswer(progress,id,correct,now=Date.now()){
 const p=progress[id]||{streak:0,misses:0,attempts:0};
 return {...progress,[id]:{attempts:p.attempts+1,misses:p.misses+(correct?0:1),streak:correct?p.streak+1:0,last:now,due:now+(correct?(p.streak>=1?86400000:600000):0)}};
}
export function scheduleMiss(session,id,deck){
 const retries={...session.retries,[id]:(session.retries[id]||0)+1};
 const queue=[...session.queue];if(retries[id]>2)return {...session,retries};
 // Three other cards separate a miss from its retry, even near the end.
 const remaining=queue.length-session.pos-1;
 if(remaining<3){const fillers=deck.filter(x=>x!==id&&!queue.slice(session.pos+1).includes(x));for(let k=remaining;k<3&&fillers.length;k++)queue.push(fillers.shift())}
 queue.splice(Math.min(session.pos+4,queue.length),0,id);return {...session,queue,retries};
}
