export function calculate(input,ans=0){
 const text=String(input).replaceAll('×','*').replaceAll('÷','/').replaceAll('−','-').replaceAll('√','sqrt');
 if(text.length>240)throw Error('Expression is too long.');
 const tokens=[];let p=0;
 while(p<text.length){if(/\s/.test(text[p])){p++;continue}const rest=text.slice(p),number=rest.match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i),name=rest.match(/^[A-Za-z]+/);if(number){tokens.push({type:'number',v:Number(number[0])});p+=number[0].length}else if(name){tokens.push({type:'name',v:name[0]});p+=name[0].length}else if('+-*/^(),%'.includes(text[p]))tokens.push({type:text[p++]});else throw Error('Use numbers and the calculator buttons.');if(tokens.length>180)throw Error('Try a shorter expression.')}
 let i=0,depth=0;const peek=t=>tokens[i]?.type===t,take=t=>{if(!peek(t))throw Error('Check the parentheses or missing number.');return tokens[i++]},finite=n=>{if(!Number.isFinite(n))throw Error('Result is outside the real-number range.');return n};
 function expr(){let x=term();while(peek('+')||peek('-')){let op=tokens[i++].type,y=term();x=finite(op==='+'?x+y:x-y)}return x}
 function term(){let x=unary();while(peek('*')||peek('/')){let op=tokens[i++].type,y=unary();if(op==='/'&&y===0)throw Error('Cannot divide by zero.');x=finite(op==='*'?x*y:x/y)}return x}
 function unary(){if(peek('+')){i++;return unary()}if(peek('-')){i++;return -unary()}return power()}
 function power(){let x=primary();while(peek('%')){i++;x/=100}if(peek('^')){i++;x=finite(x**unary())}return x}
 function primary(){if(++depth>50)throw Error('Too many nested parentheses.');let x;
  if(peek('number'))x=tokens[i++].v;
  else if(peek('(')){i++;x=expr();take(')')}
  else if(peek('name')){const n=tokens[i++].v;if(n==='Ans')x=ans;else{if(!['sqrt','ln','exp','sigmoid','mean'].includes(n))throw Error('Unknown function.');take('(');const a=[expr()];while(peek(',')){i++;a.push(expr())}take(')');if(n!=='mean'&&a.length!==1)throw Error('This function takes one number.');const v=a[0];if(n==='sqrt'){if(v<0)throw Error('Square root needs a nonnegative number.');x=Math.sqrt(v)}else if(n==='ln'){if(v<=0)throw Error('ln needs a positive number.');x=Math.log(v)}else if(n==='exp')x=Math.exp(v);else if(n==='sigmoid')x=v>=0?1/(1+Math.exp(-v)):Math.exp(v)/(1+Math.exp(v));else x=a.reduce((s,n)=>s+n,0)/a.length}}
  else throw Error('Enter a number first.');depth--;return finite(x)
 }
 if(!tokens.length)throw Error('Enter a calculation first.');const value=expr();if(i!==tokens.length)throw Error('Use × between numbers or parentheses.');return finite(value);
}
export function formatNumber(n){return Object.is(n,-0)?'0':Number(n.toPrecision(12)).toString()}
