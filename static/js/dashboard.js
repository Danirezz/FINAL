document.addEventListener('DOMContentLoaded', () => {

/* 🔐 PROTECCIÓN */
const token = localStorage.getItem('wbills_token');
if(!token){
  window.location.href = '/';
}

/* 📦 DATA */
const CATS=[{n:'Alimentación',e:'🍔'},{n:'Transporte',e:'🚌'},{n:'Ocio',e:'🎬'},{n:'Salud',e:'🏥'},{n:'Educación',e:'📚'},{n:'Salario',e:'💼'}];
let uCats=[...CATS],selCat=null,tipo=null,totIng=4500000,totGas=80600;

/* 💾 STORAGE */
function saveData(){
  localStorage.setItem('wbills_data', JSON.stringify({totIng,totGas,uCats}));
}
function loadData(){
  const d=JSON.parse(localStorage.getItem('wbills_data')||'{}');
  if(d.totIng) totIng=d.totIng;
  if(d.totGas) totGas=d.totGas;
  if(d.uCats) uCats=d.uCats;
}
loadData();

/* 📅 FECHA */
const today=new Date().toISOString().split('T')[0];
document.getElementById('f-fecha').value=today;

/* 📊 KPIs */
function upKPIs(){
  const b=totIng-totGas;
  document.getElementById('king').textContent='$'+totIng.toLocaleString('es-CO');
  document.getElementById('kgas').textContent='$'+totGas.toLocaleString('es-CO');
  document.getElementById('kbal').textContent='$'+b.toLocaleString('es-CO');
}
upKPIs();

/* 👤 USER */
try{
  const u=JSON.parse(localStorage.getItem('wbills_user')||'{}');
  if(u.name){
    const n=u.name.split(' ')[0];
    document.getElementById('wname').textContent=n;
    document.getElementById('topuser').textContent='Hola, '+n;
    document.getElementById('topav').textContent=n.substring(0,2).toUpperCase();
  }
}catch(e){}

/* 🧠 UI */
function selectTipo(t){
  tipo=t;
  document.getElementById('btn-ing').className='abtn'+(t==='ingreso'?' active-sel':'');
  document.getElementById('btn-gas').className='abtn'+(t==='gasto'?' active-sel':'');
  document.getElementById('form-ttl').textContent=t==='ingreso'?'↑ Registrar Ingreso':'↓ Registrar Gasto';
  document.getElementById('mov-form').classList.add('open');
  document.getElementById('af').className='af';
}

function fmtMonto(inp){
  let v=inp.value.replace(/\D/g,'');
  inp.value=v?'$'+parseInt(v).toLocaleString('es-CO'):'';
}

/* 📂 CATEGORÍAS */
function buildCatSel(){
  const c=document.getElementById('cat-sel');
  c.innerHTML='';
  uCats.forEach((cat,i)=>{
    const d=document.createElement('div');
    d.className='cs'+(selCat===i?' sel':'');
    d.innerHTML='<div class="cs-ico">'+cat.e+'</div><div style="font-size:10px">'+cat.n+'</div>';
    d.onclick=()=>{
      selCat=i;
      buildCatSel();
      document.getElementById('nc-form').classList.remove('open');
    };
    c.appendChild(d);
  });
}
buildCatSel();

function addCat(){
  const n=document.getElementById('nc-name').value.trim();
  const e=document.getElementById('nc-emoji').value.trim()||'🏷️';
  if(!n)return;
  uCats.push({n,e});
  selCat=uCats.length-1;
  document.getElementById('nc-name').value='';
  document.getElementById('nc-emoji').value='';
  buildCatSel();
  saveData();
}

/* 💾 GUARDAR */
function guardar(){
  const raw=document.getElementById('f-monto').value.replace(/\D/g,'');
  const desc=document.getElementById('f-desc').value.trim();
  const fecha=document.getElementById('f-fecha').value;
  const af=document.getElementById('af');

  if(!tipo){
    af.textContent='⚠ Selecciona tipo.';
    af.className='af err';
    return;
  }

  if(selCat===null){
    af.textContent='⚠ Selecciona categoría.';
    af.className='af err';
    return;
  }

  if(!raw){
    af.textContent='⚠ Ingresa monto.';
    af.className='af err';
    return;
  }

  const cat=uCats[selCat];
  const v=parseInt(raw);

  if(tipo==='ingreso') totIng+=v;
  else totGas+=v;

  upKPIs();
  saveData();

  af.textContent='✓ Guardado';
  af.className='af ok';

  document.getElementById('f-monto').value='';
  document.getElementById('f-desc').value='';
  selCat=null;
  buildCatSel();
}

/* 📊 CHARTS (protegido) */
if(typeof Chart !== 'undefined'){
  console.log('Chart.js OK');
}else{
  console.warn('Chart.js no cargó');
}

});