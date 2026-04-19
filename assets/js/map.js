/**
 * Trabalho Ja MZ - MAPA REAL SVG DE MOÇAMBIQUE
 * Versão substituta do ficheiro actual
 *
 * Usa contorno vertical realista de Moçambique
 * Províncias posicionadas conforme geografia real
 * Liga com Google Sheets via stats.provincias
 *
 * MOSTRA:
 * Mulheres vs Homens por província
 */

(function (global) {
'use strict';

/* ===============================
   GEOMETRIA MAIS REALISTA
================================= */

const PROVINCES_GEO = [

{
name:'Niassa',
path:`M170,40
L285,38
L315,62
L310,150
L245,170
L190,158
L162,95 Z`,
cx:235, cy:110
},

{
name:'Cabo Delgado',
path:`M285,38
L365,18
L395,72
L392,210
L355,250
L305,230
L310,150
L315,62 Z`,
cx:345, cy:120
},

{
name:'Nampula',
path:`M190,158
L305,230
L295,345
L238,370
L182,310
L170,220 Z`,
cx:255, cy:285
},

{
name:'Tete',
path:`M55,195
L170,220
L182,310
L108,350
L35,290 Z`,
cx:105, cy:270
},

{
name:'Zambézia',
path:`M170,220
L238,370
L220,455
L165,498
L115,402
L108,350
L182,310 Z`,
cx:185, cy:355
},

{
name:'Manica',
path:`M165,498
L220,455
L242,545
L190,602
L145,560 Z`,
cx:190, cy:525
},

{
name:'Sofala',
path:`M220,455
L330,412
L340,555
L242,545 Z`,
cx:285, cy:500
},

{
name:'Inhambane',
path:`M190,602
L242,545
L332,690
L288,805
L205,745 Z`,
cx:265, cy:675
},

{
name:'Gaza',
path:`M95,635
L190,602
L205,745
L122,810
L72,715 Z`,
cx:140, cy:700
},

{
name:'Maputo Província',
path:`M122,810
L205,745
L192,860
L138,892
L102,835 Z`,
cx:155, cy:835
},

{
name:'Maputo Cidade',
path:`M175,875
L195,868
L193,890
L170,892 Z`,
cx:182, cy:882
}

];

/* ===============================
   CORES BANDEIRA
================================= */

const LEGEND = {
F:'#DA121A',      // Vermelho = maioria mulheres
M:'#007A3D',      // Verde = maioria homens
EQUAL:'#FCE100',  // Amarelo = equilíbrio
NONE:'#D9D9D9'    // Sem dados
};

/* ===============================
   COR
================================= */

function colorFor(prov){

if(!prov) return LEGEND.NONE;
if(prov.total===0) return LEGEND.NONE;

const total = prov.F + prov.M || 1;
const ratio = prov.F / total;

if(ratio > 0.55) return LEGEND.F;
if(ratio < 0.45) return LEGEND.M;

return LEGEND.EQUAL;
}

/* ===============================
   RENDER
================================= */

function render(hostId, stats){

const host = document.getElementById(hostId);
if(!host) return;

const parts = PROVINCES_GEO.map(g=>{

const raw = stats?.provincias?.[g.name];
const data = normalize(raw);
const fill = colorFor(data);

return `
<path class="prov"
d="${g.path}"
fill="${fill}"
data-name="${esc(g.name)}"
data-f="${data.F}"
data-m="${data.M}"
data-total="${data.total}">
<title>${g.name}</title>
</path>

<text x="${g.cx}" y="${g.cy}"
text-anchor="middle"
class="label">${short(g.name)}</text>
`;
});

host.innerHTML = `
<svg viewBox="0 0 420 920" class="mozmap">

<style>
.mozmap{width:100%;height:auto}
.prov{
stroke:#fff;
stroke-width:2;
cursor:pointer;
transition:.2s;
}
.prov:hover{
opacity:.85;
transform:translateY(-2px);
}
.label{
font-size:11px;
font-family:Arial;
font-weight:bold;
fill:#fff;
paint-order:stroke;
stroke:#000;
stroke-width:.8;
}
</style>

${parts.join('')}

</svg>
`;

tooltipBind(host);
}

/* ===============================
   TOOLTIP
================================= */

function tooltipBind(host){

let tip = document.getElementById('mapTip');

if(!tip){
tip = document.createElement('div');
tip.id='mapTip';
tip.style.cssText=`
position:fixed;
background:#fff;
padding:10px;
border-radius:10px;
box-shadow:0 8px 25px rgba(0,0,0,.15);
font-size:13px;
display:none;
z-index:9999`;
document.body.appendChild(tip);
}

host.querySelectorAll('.prov').forEach(p=>{

p.onmousemove = e=>{

tip.style.display='block';
tip.style.left=(e.clientX+15)+'px';
tip.style.top=(e.clientY+15)+'px';

tip.innerHTML=`
<b>${p.dataset.name}</b><br>
Mulheres: ${p.dataset.f}<br>
Homens: ${p.dataset.m}<br>
Total: ${p.dataset.total}
`;
};

p.onmouseleave = ()=> tip.style.display='none';

});
}

/* ===============================
   HELPERS
================================= */

function normalize(raw){

if(!raw) return {F:0,M:0,total:0};

return {
F:Number(raw.F)||0,
M:Number(raw.M)||0,
total:Number(raw.total)||0
};
}

function short(n){
return n
.replace('Maputo Província','Maputo Prov.')
.replace('Maputo Cidade','Maputo Cid.')
.replace('Cabo Delgado','C. Delgado');
}

function esc(s){
return String(s);
}

/* ===============================
   EXPORT
================================= */

const API = {
render,
colorFor,
PROVINCES_GEO,
LEGEND
};

if(typeof module!=='undefined' && module.exports){
module.exports = API;
}else{
global.TJMZMap = API;
}

})(typeof window!=='undefined' ? window : globalThis);
