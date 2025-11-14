const IMAGES = [
  { id:1, src:'images/car1.jpg', title:'Porsche 911 Turbo', category:'sport', brand:'porsche' },
  { id:2, src:'images/car2.jpg', title:'BMW M4 Competition', category:'sport', brand:'bmw' },
  { id:3, src:'images/car3.jpg', title:'Mercedes G-Class', category:'suv', brand:'mercedes' },
  { id:4, src:'images/car4.jpg', title:'Audi R8', category:'sport', brand:'audi' },
  { id:5, src:'images/car5.jpg', title:'Classic Mustang', category:'classic', brand:'ford' },
  { id:6, src:'images/car6.jpg', title:'Porsche Cayenne', category:'suv', brand:'porsche' },
  { id:7, src:'images/car7.jpg', title:'BMW 3.0 CSL (classic)', category:'classic', brand:'bmw' },
  { id:8, src:'images/car8.jpg', title:'Mercedes AMG GT', category:'sport', brand:'mercedes' },
  { id:9, src:'images/car9.jpg', title:'BMW X5', category:'crossover', brand:'bmw' }
];


const STATE = {
  category: 'all',
  brand: 'all',
  query: '',
  effect: 'none',
  onlyFavorites: false,
  page: 1,
  perPage: 9
};




const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const saveFavs = favs => localStorage.setItem('ag_favs', JSON.stringify(favs || []));
const loadFavs = () => {
  try { return JSON.parse(localStorage.getItem('ag_favs') || '[]'); } catch(e){ return []; }
};
let FAVORITES = new Set(loadFavs());





/* МАРШРУТИЗАЦИЯ */
function showRouteFromHash(){
  const hash = location.hash || '#home';
  $$('.page').forEach(p => p.classList.remove('page--active'));
  const id = hash.replace('#','');
  const el = document.getElementById(id);
  if(el) el.classList.add('page--active');


  $$('.nav-link').forEach(a => a.classList.toggle('active', a.getAttribute('href')===('#'+id)));
}
window.addEventListener('hashchange', showRouteFromHash);
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  showRouteFromHash();
  renderGallery();
  bindControls();
  initLightbox();
});




/* НАВИГАЦИЯ */
function initNav(){
  const navToggle = $('#navToggle'), navList = $('#navList');
  if(navToggle){
    navToggle.addEventListener('click', () => {
      navList.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', navList.classList.contains('open'));
    });
  }
  document.querySelectorAll('[data-route]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const href = a.getAttribute('href');
    location.hash = href;
    if(navList && navList.classList.contains('open')) navList.classList.remove('open');
  }));
}



/* ФИЛЬТРАЦИЯ */
function getFiltered(){
  const q = STATE.query.trim().toLowerCase();
  return IMAGES.filter(img => {
    if(STATE.onlyFavorites && !FAVORITES.has(String(img.id))) return false;
    if(STATE.category !== 'all' && img.category !== STATE.category) return false;
    if(STATE.brand !== 'all' && img.brand !== STATE.brand) return false;
    if(q && !img.title.toLowerCase().includes(q)) return false;
    return true;
  });
}



function renderGallery(){
  const grid = $('#galleryGrid');
  grid.innerHTML = '';
  const all = getFiltered();
  const total = all.length;
  const pages = Math.max(1, Math.ceil(total / STATE.perPage));
  if(STATE.page > pages) STATE.page = pages;
  const start = (STATE.page - 1) * STATE.perPage;
  const items = all.slice(start, start + STATE.perPage);







  //  создавать карты
  items.forEach(img => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <figure>
        <img data-src="${img.src}" alt="${escapeHtml(img.title)}" loading="lazy" />
        <div class="badge">${img.brand} • ${img.category}</div>
        <button class="heart ${FAVORITES.has(String(img.id)) ? 'active' : ''}" data-id="${img.id}" aria-label="Добавить в избранное">♥</button>
      </figure>
      <div class="meta">
        <h4>${escapeHtml(img.title)}</h4>
        <p>ID: ${img.id}</p>
      </div>
    `;
    // НАЖАТИЕ ДЛЯ ОТКРЫТИЕ ЛУТБОКСА
    card.querySelector('img').addEventListener('click', () => openLightbox(img.id));




    card.querySelector('.heart').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(img.id, e.currentTarget);
    });
    grid.appendChild(card);
  });



  // ЭФФЕКТЫ К ИЗОБР.
  applyEffectToGrid();



  // ОБНОВЛЕНИЕ ИНТЕРФЕЙСА В НОВИГАЦИИ
  $('#pageInfo').textContent = `${STATE.page} / ${pages}`;
  $('#prevPage').disabled = STATE.page <= 1;
  $('#nextPage').disabled = STATE.page >= pages;




  // ПОЯВЛЕНИЕ ПОСЛЕ РЕНДЕРИНГА
  requestAnimationFrame(()=> {
    $$('.card').forEach((c,i) => {
      c.style.opacity = '0';
      c.style.transform = 'translateY(8px)';
      setTimeout(()=>{ c.style.transition = 'opacity .36s, transform .36s'; c.style.opacity='1'; c.style.transform='translateY(0)'; }, 40 + i*30);
    });
  });



  // загрузка изображений путем установки src из data-src
  $$('#galleryGrid img').forEach(imgEl => {
    if(!imgEl.src) imgEl.src = imgEl.dataset.src;
  });
}


function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }



/* ЭЛЕМЕНТЫ УПРАВЛЕНИЯ */
function bindControls(){
  $('#categorySelect').addEventListener('change', e => { STATE.category = e.target.value; STATE.page = 1; renderGallery(); });
  $('#brandSelect').addEventListener('change', e => { STATE.brand = e.target.value; STATE.page = 1; renderGallery(); });
  $('#filterEffect').addEventListener('change', e => { STATE.effect = e.target.value; applyEffectToGrid(); });
  $('#searchInput').addEventListener('input', debounce(e => { STATE.query = e.target.value; STATE.page = 1; renderGallery(); }, 220));
  $('#prevPage').addEventListener('click', ()=>{ if(STATE.page>1){ STATE.page--; renderGallery(); } });
  $('#nextPage').addEventListener('click', ()=>{ STATE.page++; renderGallery(); });
  $('#favToggle').addEventListener('click', ()=>{ STATE.onlyFavorites = !STATE.onlyFavorites; $('#favToggle').classList.toggle('active', STATE.onlyFavorites); STATE.page=1; renderGallery(); });
}



/* ЭФФЕКТЫ CSS */
function applyEffectToGrid(){
  const eff = STATE.effect || 'none';
  $$('#galleryGrid img').forEach(i => i.style.filter = eff);
}



function debounce(fn, ms=200){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }




/* ИЗБРАННОЕ ФОТО */
function toggleFavorite(id, btnEl){
  const key = String(id);
  if(FAVORITES.has(key)){ FAVORITES.delete(key); btnEl.classList.remove('active'); }
  else { FAVORITES.add(key); btnEl.classList.add('active'); }
  saveFavs([...FAVORITES]);
}



/* Lightbox (КАРУСЕЛЬ) */
let currentIndex = -1;
function initLightbox(){
  $('#lbClose').addEventListener('click', closeLightbox);
  $('#lbPrev').addEventListener('click', ()=>navigateLightbox(-1));
  $('#lbNext').addEventListener('click', ()=>navigateLightbox(1));
  document.addEventListener('keydown', (e) => {
    if($('#lightbox').getAttribute('aria-hidden')==='false'){
      if(e.key==='Escape') closeLightbox();
      if(e.key==='ArrowLeft') navigateLightbox(-1);
      if(e.key==='ArrowRight') navigateLightbox(1);
    }
  });
}





function openLightbox(id){
  const all = getFiltered();
  currentIndex = all.findIndex(i => i.id === id);
  if(currentIndex === -1) {
    // НАЙТИ В ИЗБРАННЫХ
    currentIndex = IMAGES.findIndex(i => i.id === id);
  }
  showLightboxImage();
  $('#lightbox').setAttribute('aria-hidden','false');
}



function closeLightbox(){ $('#lightbox').setAttribute('aria-hidden','true'); }



function navigateLightbox(dir){
  const all = getFiltered();
  if(all.length===0) return;
  currentIndex = (currentIndex + dir + all.length) % all.length;
  showLightboxImage();
}



function showLightboxImage(){
  const all = getFiltered();
  let imgObj = all[currentIndex];
  if(!imgObj) imgObj = IMAGES.find(i => i.id === (all[0] && all[0].id) || 1);
  $('#lbImage').src = imgObj.src;
  $('#lbImage').alt = imgObj.title;
  $('#lbCaption').textContent = imgObj.title;
  $('#lbMeta').textContent = `${imgObj.brand} • ${imgObj.category} • ID:${imgObj.id}`;
}