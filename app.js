'use strict';
const report=JSON.parse(document.getElementById('report-data').textContent);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>n===null||n===undefined?'未取得':Number(n).toLocaleString('zh-TW',{maximumFractionDigits:2});
function download(name,text,type='text/plain'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff',text],{type}));a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500)}
function csv(rows){return rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n')}
function renderChart(){
 const s=report.charts.find(x=>x.id===$('#series-select').value)||report.charts[0];
 const start=Number($('#year-start').value),end=Number($('#year-end').value); let lo=Math.min(start,end),hi=Math.max(start,end);
 const rows=s.data.filter(d=>d.year>=lo&&d.year<=hi); const valid=rows.filter(d=>typeof d.value==='number');
 $('#chart-title').textContent=s.title;$('#chart-definition').textContent=s.definition;$('#chart-unit').textContent='單位：'+s.unit+'｜'+s.coverage;
 $('#chart-limits').textContent=s.limitations;$('#chart-sources').innerHTML=s.sources.map(id=>`<a href="#source-${esc(id)}">[${esc(id)}]</a>`).join(' ');
 const W=900,H=330,p={l:66,r:24,t:30,b:45},max=Math.max(...valid.map(d=>d.value),1)*1.12,minY=0,minX=lo,maxX=hi===lo?hi+1:hi;
 const x=y=>p.l+(y-minX)/(maxX-minX)*(W-p.l-p.r),y=v=>H-p.b-(v-minY)/max*(H-p.t-p.b);
 let svg=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="chart-svg-title chart-svg-desc"><title id="chart-svg-title">${esc(s.title)}</title><desc id="chart-svg-desc">${esc(s.unit)}；${lo}年至${hi}年，${valid.length}個有效年度。完整數字見下方資料表。缺值不連線。</desc>`;
 for(let i=0;i<=4;i++){const v=max*i/4;svg+=`<line class="gridline" x1="${p.l}" x2="${W-p.r}" y1="${y(v)}" y2="${y(v)}"/><text class="axis-label" x="${p.l-10}" y="${y(v)+4}" text-anchor="end">${Math.round(v).toLocaleString('zh-TW')}</text>`}
 let segment=[],segments=[];for(let yr=lo;yr<=hi;yr++){const d=rows.find(v=>v.year===yr);if(d&&typeof d.value==='number'){segment.push(d)}else if(segment.length){segments.push(segment);segment=[]}}if(segment.length)segments.push(segment);
 for(const seg of segments){svg+=`<polyline class="series-line" points="${seg.map(d=>x(d.year)+','+y(d.value)).join(' ')}"/>`}
 for(const d of valid)svg+=`<circle class="dot" cx="${x(d.year)}" cy="${y(d.value)}" r="4"><title>${d.year}：${fmt(d.value)}${esc(s.unit)}</title></circle>`;
 const labels=[...new Set([lo,...Array.from({length:Math.max(0,hi-lo+1)},(_,i)=>lo+i).filter(a=>a%5===0),hi])];for(const yr of labels)svg+=`<text class="axis-label" x="${x(yr)}" y="${H-14}" text-anchor="middle">${yr}</text>`;
 if(!valid.length)svg+=`<text x="450" y="160" text-anchor="middle" fill="#52645c">選取年度內沒有這個指標的資料；不代表零。</text>`;
 svg+='</svg>';$('#chart-svg').innerHTML=svg;
 $('#chart-table').innerHTML=`<caption>${esc(s.title)}｜${esc(s.unit)}</caption><thead><tr><th scope="col">年度</th><th scope="col">數值</th><th scope="col">來源</th></tr></thead><tbody>${Array.from({length:hi-lo+1},(_,i)=>lo+i).map(yr=>{const d=rows.find(r=>r.year===yr);return `<tr><th scope="row">${yr}</th><td>${fmt(d?.value)}</td><td>${d?(d.sources||s.sources).map(id=>`<a href="#source-${esc(id)}">${esc(id)}</a>`).join('、'):'未收錄／未取得'}</td></tr>`}).join('')}</tbody>`;
 $('#chart-status').textContent=`顯示${lo}–${hi}年；${valid.length}個有資料年度。${start>end?'起訖順序已自動交換。':''}`;
 $('#download-chart').onclick=()=>download(s.id+'.csv',csv([['indicator','year','value','unit','definition','source_ids'],...Array.from({length:hi-lo+1},(_,i)=>lo+i).map(yr=>{const d=rows.find(r=>r.year===yr);return [s.title,yr,d?.value??'',s.unit,s.definition,(d?.sources||s.sources).join(';')]})]),'text/csv;charset=utf-8');
}
['#series-select','#year-start','#year-end'].forEach(s=>$(s).addEventListener('change',renderChart));renderChart();
function filterCards(input,select,cards,status){function run(){const q=$(input).value.trim().toLocaleLowerCase(),category=select?$(select).value:'all';let n=0;$$(cards).forEach(card=>{const visible=(!q||card.textContent.toLocaleLowerCase().includes(q))&&(category==='all'||card.dataset.category===category);card.hidden=!visible;if(visible)n++});$(status).textContent=`顯示 ${n} 筆${n?'':'；請換一個關鍵字或重設篩選'}`};$(input).addEventListener('input',run);if(select)$(select).addEventListener('change',run);run();return run}
const filterDrugs=filterCards('#drug-search','#drug-filter','.drug-card','#drug-status');
const filterCases=filterCards('#case-search','#case-filter','.case-card','#case-status');
const filterSources=filterCards('#source-search',null,'.source-card','#source-status');
$('#reset-drugs').onclick=()=>{$('#drug-search').value='';$('#drug-filter').value='all';filterDrugs()};
$('#reset-cases').onclick=()=>{$('#case-search').value='';$('#case-filter').value='all';filterCases()};
$('#source-search').addEventListener('keydown',e=>{if(e.key==='Escape'){$('#source-search').value='';filterSources()}});
const searchables=$$('[data-searchable]');
$('#site-search').addEventListener('input',()=>{const q=$('#site-search').value.trim().toLocaleLowerCase();$('#search-results').replaceChildren();if(!q){$('#search-count').textContent='搜尋章節、物質、案件、數據與方法。';return}const hits=searchables.filter(el=>el.textContent.toLocaleLowerCase().includes(q)).slice(0,30);$('#search-count').textContent=`找到${hits.length}${hits.length===30?'＋':''}筆。點選前往內容。`;for(const hit of hits){const li=document.createElement('li'),a=document.createElement('a');a.href='#'+hit.id;a.textContent=(hit.querySelector('h3,h2,h4')?.textContent||hit.dataset.title||hit.id);a.addEventListener('click',e=>{e.preventDefault();hit.hidden=false;location.hash=hit.id;for(let p=hit.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;$('#search-results').replaceChildren();$('#search-count').textContent='已前往所選內容；搜尋框可清除。'});li.append(a);$('#search-results').append(li)}});
$('#site-search').addEventListener('keydown',e=>{if(e.key==='Escape'){$('#site-search').value='';$('#site-search').dispatchEvent(new Event('input'))}});
function revealHash(){const id=decodeURIComponent(location.hash.slice(1));const el=document.getElementById(id);if(el){el.hidden=false;for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true}}
window.addEventListener('hashchange',revealHash);revealHash();
$('#check-quiz').onclick=()=>{let answered=0,correct=0;report.quiz.forEach((q,i)=>{const selected=$(`input[name="q${i}"]:checked`),feedback=$(`#feedback-${i}`);feedback.hidden=false;if(selected){answered++;const ok=Number(selected.value)===q.answer;if(ok)correct++;feedback.textContent=(ok?'理解正確。':'再想一想。')+q.explanation}else feedback.textContent='尚未作答。'+q.explanation});$('#quiz-score').textContent=`已作答${answered}/${report.quiz.length}題，其中${correct}題理解正確。請閱讀解析，重點是學會判讀與求助。`};
$('#reset-quiz').onclick=()=>{$$('#quiz input').forEach(x=>x.checked=false);$$('#quiz .feedback').forEach(x=>{x.hidden=true;x.textContent=''});$('#quiz-score').textContent='重新開始。答案不會上傳或保存。'};
let printDetails=[];window.addEventListener('beforeprint',()=>{printDetails=$$('details').map(d=>[d,d.open]);printDetails.forEach(([d])=>d.open=true)});window.addEventListener('afterprint',()=>printDetails.forEach(([d,v])=>d.open=v));
$$('[data-print]').forEach(b=>b.onclick=()=>window.print());
$('#contrast-toggle').onclick=()=>{document.body.classList.toggle('contrast');$('#contrast-toggle').setAttribute('aria-pressed',document.body.classList.contains('contrast')?'true':'false')};
window.addEventListener('pageshow',()=>{renderChart();filterCases();filterDrugs();filterSources();revealHash();});
document.documentElement.dataset.ready='true';
