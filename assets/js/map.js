/**
 * Trabalho Já MZ
 * Dashboard geográfico real de Moçambique
 *
 * SUBSTITUI o ficheiro actual do mapa
 * Exemplo: assets/js/map.js
 *
 * Usa SVG com silhueta real aproximada + províncias posicionadas
 * pronto para ligar aos dados Google Sheets.
 */

(function (global) {
'use strict';

/* ==========================================
   PROVÍNCIAS (posição geográfica real)
========================================== */

const PROVINCES = [

{ id:'niassa', name:'Niassa', x:155, y:85,  w:95, h:105 },
{ id:'cabodelgado', name:'Cabo Delgado', x:250, y:70, w:95, h:135 },
{ id:'nampula', name:'Nampula', x:235, y:205, w:110, h:105 },
{ id:'tete', name:'Tete', x:80, y:210, w:110, h:95 },
{ id:'zambezia', name:'Zambézia', x:180, y:215, w:70, h:120 },
{ id:'manica', name:'Manica', x:145, y:340, w:70, h:90 },
{ id:'sofala', name:'Sofala', x:215, y:330, w:78, h:120 },
{ id:'inhambane', name:'Inhambane', x:205, y:455, w:92, h:145 },
{ id:'gaza', name:'Gaza', x:120, y:455, w:88, h:130 },
{ id:'maputoprov', name:'Maputo Província', x:145, y:595, w:78, h:95 },
{ id:'maputocidade', name:'Maputo Cidade', x:200, y:690, w:18, h:18 }

];

/* ==========================================
   CORES BANDEIRA
========================================== */

const COLORS = {
women:'#DA121A',   // vermelho
men:'#007A3D',     // verde
equal:'#FCE100',   // amarelo
none:'#D9D9D9'     // cinza
};

/* ==========================================
   COR CONFORME DADOS
========================================== */

function getColor(stat){

if(!stat || stat.total===0) return COLORS.none;

const f = Number(stat.F)||0;
const m = Number(stat.M)||0;

if(f > m) return COLORS.women;
if(m > f) return COLORS.men;

return COLORS.equal;
}

/* ==========================================
   MAPA REAL SVG
========================================== */

function render(hostId, stats={}){

const host = document.getElementById(hostId);
if(!host) return;

const provMap = stats.provincias || {};

host.innerHTML = `
<svg viewBox="0 0 420 760" class="mz-map">

<style>
.mz-map{
width:100%;
height:auto;
max-height:760px;
font-family:Arial,sans-serif;
}

.outline{
fill:#f8f8f8;
stroke:#999;
stroke-width:2;
}

.prov{
stroke:#fff;
stroke-width:2;
cursor:pointer;
transition:.2s;
}

.prov:hover{
opacity:.85;
filter:brightness(1.05);
}

.label{
font-size:11px;
font-weight:bold;
fill:#fff;
paint-order:stroke;
stroke:#000;
stroke-width:.7;
pointer-events:none;
}

</style>

<!-- SILHUETA REAL DE MOÇAMBIQUE -->
<path class="outline"
d="
M145 40
L265 38
L300 55
L340 45
L365 78
L360 250
L335 300
L318 355
L320 465
L305 610
L250 710
L205 740
L175 730
L150 690
L130 620
L120 520
L95 420
L100 300
L115 215
L130 110
Z"/>

${PROVINCES.map(p=>{

const st = provMap[p.name] || {F:0,M:0,total:0};
const fill = getColor(st);

return `
<rect class="prov"
x="${p.x}" y="${p.y}"
width="${p.w}" height="${p.h}"
rx="4"
fill="${fill}"
data-name="${p.name}"
data-f="${st.F||0}"
data-m="${st.M||0}"
data-total="${st.total||0}">
<title>${p.name}</title>
</rect>

<text
x="${p.x + p.w/2}"
y="${p.y + p.h/2}"
text-anchor="middle"
dominant-baseline="middle"
class="label">
${shortName(p.name)}
</text>
`;

}).join('')}

</svg>
`;

bindTooltip(host);
}

/* ==========================================
   TOOLTIP
========================================== */

function bindTooltip(host){

let tip = document.getElementById('mapTooltip');

if(!tip){
tip = document.createElement('div');
tip.id='mapTooltip';
tip.style.cssText=`
position:fixed;
display:none;
background:#fff;
padding:10px;
border-radius:10px;
box-shadow:0 10px 25px rgba(0,0,0,.15);
font-size:13px;
z-index:9999`;
document.body.appendChild(tip);
}

host.querySelectorAll('.prov').forEach(el=>{

el.onmousemove = e=>{

tip.style.display='block';
tip.style.left=(e.clientX+15)+'px';
tip.style.top=(e.clientY+15)+'px';

tip.innerHTML=`
<b>${el.dataset.name}</b><br>
Mulheres: ${el.dataset.f}<br>
Homens: ${el.dataset.m}<br>
Total: ${el.dataset.total}
`;
};

el.onmouseleave = ()=>{
tip.style.display='none';
};

});
}

/* ==========================================
   SHORT NAME
========================================== */

function shortName(n){

return n
.replace('Maputo Província','Maputo Prov.')
.replace('Maputo Cidade','Mpt. Cid.')
.replace('Cabo Delgado','C. Delgado');
}

/* ==========================================
   EXPORT
========================================== */

const API = { render };

if(typeof module !== 'undefined' && module.exports){
module.exports = API;
}else{
global.TJMZMap = API;
}

})(typeof window !== 'undefined' ? window : globalThis);
