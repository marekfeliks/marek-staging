import {landPath} from './land.js';

// Geographic reference points only: countries use representative central points,
// not bases, operational coordinates, flight plans, or actual maritime routes.
const places = {
  poland:       {label:'Poland',lon:19.1,lat:52.1,region:'europe',kind:'Departure'},
  nice:         {label:'Nice',lon:7.26,lat:43.70,region:'europe',kind:'Recruitment'},
  aubagne:      {label:'Aubagne',lon:5.57,lat:43.29,region:'europe',kind:'Recruitment'},
  'castelnaudary-basic':{label:'Castelnaudary · CEV',lon:1.95,lat:43.32,region:'europe',kind:'Basic training'},
  'nimes-4':    {label:'Nîmes · 2REI',lon:4.36,lat:43.84,region:'europe',kind:'4th Company'},
  senegal:      {label:'Senegal',lon:-14.5,lat:14.5,region:'world',kind:'Deployment'},
  'mali-1':     {label:'Mali · I',lon:-3.8,lat:17.3,region:'world',kind:'Deployment'},
  uae:          {label:'United Arab Emirates',lon:53.9,lat:24.2,region:'world',kind:'Deployment'},
  'rca-1':      {label:'Central African Republic · I',lon:20.9,lat:6.6,region:'world',kind:'Deployment'},
  'rca-2':      {label:'Central African Republic · II',lon:20.9,lat:6.6,region:'world',kind:'Deployment',offset:[10,-7]},
  'castelnaudary-cic':{label:'Castelnaudary · CIC',lon:1.95,lat:43.32,region:'europe',kind:'Further instruction',offset:[-9,8]},
  martinique:   {label:'Martinique',lon:-61.0,lat:14.6,region:'world',kind:'Deployment'},
  'mali-2':     {label:'Mali · II',lon:-3.8,lat:17.3,region:'world',kind:'Deployment',offset:[10,8]},
  'cote-ivoire': {label:"Côte d'Ivoire · maritime mission",lon:-5.55,lat:7.55,region:'world',kind:'Maritime deployment'},
  'nimes-ccl':  {label:'Nîmes · CCL',lon:4.36,lat:43.84,region:'europe',kind:'CCL / Sergent-chef',offset:[10,-7]},
  'castelnaudary-ccs':{label:'Castelnaudary · CCS',lon:1.95,lat:43.32,region:'europe',kind:'Deputy section leader',offset:[3,13]},
  luxembourg:   {label:'Luxembourg',lon:6.13,lat:49.7,region:'europe',kind:'Telecommunications'}
};
const SVG_NS='http://www.w3.org/2000/svg';
const $=selector=>document.querySelector(selector);
const svgElement=(name, attrs={})=>{
  const node=document.createElementNS(SVG_NS,name);
  for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));
  return node;
};
function point({lon,lat,offset=[0,0]}){
  return {x:(lon+180)/360*1200+offset[0],y:(83-lat)/160*600+offset[1]};
}
function curvedRoute(a,b){
  const pa=point(a),pb=point(b);
  const dx=pb.x-pa.x,dy=pb.y-pa.y;
  if(Math.hypot(dx,dy)<12)
    return 'M'+pa.x.toFixed(1)+','+pa.y.toFixed(1)+' q26,-30 '+dx.toFixed(1)+','+dy.toFixed(1);
  const lift=Math.min(72,12+Math.hypot(dx,dy)*0.09);
  const cx=(pa.x+pb.x)/2,cy=(pa.y+pb.y)/2-lift;
  return 'M'+pa.x.toFixed(1)+','+pa.y.toFixed(1)+' Q'+cx.toFixed(1)+','+cy.toFixed(1)+' '+pb.x.toFixed(1)+','+pb.y.toFixed(1);
}
export function setupJourneyMap({story,navigate,getCurrent}){
  const svg=$('#atlas-svg'),land=$('#atlas-land'),links=$('#atlas-paths'),pins=$('#atlas-pins');
  const list=$('#atlas-stop-list'),back=$('#atlas-prev'),next=$('#atlas-next');
  const replay=$('#atlas-replay'),status=$('#atlas-status');
  if(!svg||!land||!links||!pins||!list||!back||!next||!replay||!status)return;
  land.setAttribute('d',landPath);
  const stops=story.flatMap((chapter,chapterIndex)=>
    (chapter.waypoints||[]).map(id=>{
      if(!places[id])throw new Error('Unknown journey location: '+id);
      return {...places[id],id,chapterIndex,chapterTitle:chapter.title,act:chapter.act};
    })
  );
  const routeNodes=[],pinNodes=[],listNodes=[];
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  let selected=0,revealed=0,replayTimer=null;
  const activeLabel=svgElement('text',{class:'atlas-active-label','aria-hidden':'true'});
  pins.after(activeLabel);

  stops.forEach((stop,i)=>{
    if(i){
      const route=svgElement('path',{d:curvedRoute(stops[i-1],stop),class:'atlas-route'});
      links.append(route);
      const length=route.getTotalLength();
      route.style.strokeDasharray=String(length+1);
      route.style.strokeDashoffset=String(length+1);
      routeNodes.push(route);
    }
    const {x,y}=point(stop);
    const g=svgElement('g',{class:'atlas-waypoint',transform:'translate('+x+','+y+')',
       tabindex:'0',role:'button','aria-label':'Journey stop '+(i+1)+': '+stop.label+', chapter '+(stop.chapterIndex+1)});
    const title=svgElement('title');title.textContent=stop.label+' — '+stop.kind;
    g.append(title,svgElement('circle',{r:12,class:'atlas-pin-hit'}),
      svgElement('circle',{r:9,class:'atlas-pin-halo'}),
      svgElement('circle',{r:4.6,class:'atlas-pin-core'}));
    g.addEventListener('click',()=>goTo(i,true));
    g.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();goTo(i,true)}
    });
    pins.append(g);pinNodes.push(g);
    const b=document.createElement('button');
    b.type='button';b.className='atlas-stop';b.dataset.region=stop.region;
    b.innerHTML='<span class="atlas-stop-sequence">'+String(i+1).padStart(2,'0')+'</span><span class="atlas-stop-name"></span>';
    b.querySelector('.atlas-stop-name').textContent=stop.label;
    b.setAttribute('aria-label','Explore '+stop.label+', chapter '+(stop.chapterIndex+1));
    b.addEventListener('click',()=>goTo(i,false));
    list.append(b);listNodes.push(b);
  });

  function cancelReplay(){
    if(replayTimer!==null){clearInterval(replayTimer);replayTimer=null}
    replay.removeAttribute('aria-pressed');replay.textContent='↻ REPLAY ROUTE';
  }
  function draw(index,through=index){
    selected=Math.max(0,Math.min(stops.length-1,index));
    revealed=Math.max(0,Math.min(stops.length-1,through));
    const chosen=stops[selected],p=point(chosen);
    routeNodes.forEach((line,i)=>{
      const visible=i+1<=revealed;
      line.classList.toggle('is-revealed',visible);
      line.style.strokeDashoffset=visible?'0':line.style.strokeDasharray;
    });
    pinNodes.forEach((g,i)=>{
      g.classList.toggle('is-revealed',i<=revealed);
      g.classList.toggle('is-active',i===selected&&i<=revealed);
      if(i===selected&&i<=revealed)g.setAttribute('aria-current','step');
      else g.removeAttribute('aria-current');
    });
    listNodes.forEach((b,i)=>{
      b.classList.toggle('is-current',i===selected);
      if(i===selected)b.setAttribute('aria-current','step');
      else b.removeAttribute('aria-current');
    });
    activeLabel.textContent=chosen.label;
    activeLabel.setAttribute('x',String(p.x+ (p.x>990?-13:13)));
    activeLabel.setAttribute('text-anchor',p.x>990?'end':'start');
    activeLabel.setAttribute('y',String(p.y-15));
    $('#atlas-step').textContent=String(selected+1).padStart(2,'0')+' / '+stops.length;
    $('#atlas-current-title').textContent=chosen.label;
    $('#atlas-current-description').textContent=chosen.chapterTitle;
    $('#atlas-current-context').textContent=chosen.kind+' · Chapter '+String(chosen.chapterIndex+1).padStart(2,'0');
    status.textContent='Location '+(selected+1)+' of '+stops.length+': '+chosen.label;
    back.disabled=selected===0;
    next.disabled=selected===stops.length-1;
    $('#atlas-progress').style.width=((revealed+1)/stops.length*100)+'%';
  }
  function goTo(index,scrollToFilm){
    cancelReplay();
    const stop=stops[index];
    // Navigate the story itself, then explicitly focus the chosen stop for
    // chapters that map to several places (such as Nice and Aubagne).
    navigate(stop.chapterIndex);
    draw(index);
    if(scrollToFilm)$('#film').scrollIntoView({behavior:reduce.matches?'auto':'smooth'});
  }
  function showChapter(chapterIndex){
    cancelReplay();
    let i=0;
    for(let j=0;j<stops.length;j++){if(stops[j].chapterIndex<=chapterIndex)i=j;else break}
    draw(i,i);
  }
  function replayRoute(){
    cancelReplay();
    if(reduce.matches){draw(stops.length-1);return}
    draw(0,0);
    replay.setAttribute('aria-pressed','true');
    replay.textContent='Ⅱ STOP REPLAY';
    let cursor=0;
    replayTimer=setInterval(()=>{
      cursor++;
      if(cursor>=stops.length){cancelReplay();return}
      draw(cursor,cursor);
    },720);
  }
  back.addEventListener('click',()=>goTo(selected-1,false));
  next.addEventListener('click',()=>goTo(selected+1,false));
  replay.addEventListener('click',()=>replayTimer!==null?cancelReplay():replayRoute());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelReplay()});
  for(const button of document.querySelectorAll('[data-atlas-view]')){
    button.addEventListener('click',()=>{
      const isFrance=button.dataset.atlasView==='europe';
      svg.setAttribute('viewBox',isFrance?'555 74 175 175':'0 0 1200 600');
      svg.classList.toggle('is-europe',isFrance);
      document.querySelectorAll('[data-atlas-view]').forEach(b=>
        b.setAttribute('aria-pressed',String(b===button)));
    });
  }
  document.addEventListener('feliks:chapterchange',e=>showChapter(e.detail.index));
  showChapter(getCurrent());
}
