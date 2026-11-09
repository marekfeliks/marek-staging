import {story} from './story.js';
import {sceneArt} from './art.js';
import {setupChapterIndex} from './chapter-index.js';
import {setupJourneyMap} from './journey.js';
const $=s=>document.querySelector(s);
const film=$('#film'),backdrop=$('#backdrop'),drawing=$('#art-holder'),copy=$('#chapter-content'),slider=$('#scrubber'),dots=$('#chapter-dots'),play=$('#play-pause');
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
// Automatic playback is a quick overview; visitors can pause or navigate to read in depth.
const PLAY_CHAPTER_MS=5000;
let current=0,playing=false,timer=null;
for(let i=0;i<story.length;i++){const d=document.createElement('span');d.className='chapter-dot';d.setAttribute('aria-hidden','true');dots.append(d)}
slider.max=story.length-1;
$('#chapter-count').textContent=story.length;
$('#chapter-total').textContent=story.length;
function render(index,animate=true){
 current=Math.max(0,Math.min(story.length-1,index));
 const c=story[current],motion=animate&&!reduce.matches;
 copy.classList.remove('copy-enter');
 copy.classList.toggle('long-title', c.title.length > 28);
 copy.scrollTop=0;
 if(motion)void copy.offsetWidth;
 $('#act-label').textContent=c.act;$('#place-label').textContent=c.place;$('#chapter-title').textContent=c.title;$('#narration').textContent=c.narration;
 $('#chapter-number').textContent=String(current+1).padStart(2,'0');$('#side-index').textContent=String(current+1).padStart(2,'0')+'—'+story.length;
 slider.value=current;slider.setAttribute('aria-valuetext',(current+1)+' of '+story.length+': '+c.detail);
 $('#track-fill').style.width=(current/(story.length-1)*100)+'%';
 $('#previous').disabled=current===0;$('#next').disabled=current===story.length-1;
 backdrop.className='film-backdrop palette-'+c.palette;drawing.innerHTML=sceneArt(c.scene);
 if(c.image){backdrop.style.setProperty('--photo','url("'+encodeURI(c.image).replaceAll('"','%22')+'")');backdrop.classList.add('has-photo')}else backdrop.style.removeProperty('--photo');
 [...dots.children].forEach((d,i)=>d.classList.toggle('is-active',i<=current));
 if(motion)copy.classList.add('copy-enter');film.dataset.chapter=current+1;
 document.dispatchEvent(new CustomEvent('feliks:chapterchange',{detail:{index:current}}));
}
function stop(){playing=false;clearInterval(timer);timer=null;$('#play-glyph').textContent='▶';$('#play-label').textContent='PLAY STORY';play.setAttribute('aria-label','Play documentary')}
function start(){if(playing)return;if(current===story.length-1)render(0);playing=true;$('#play-glyph').textContent='Ⅱ';$('#play-label').textContent='PAUSE STORY';play.setAttribute('aria-label','Pause documentary');timer=setInterval(()=>{if(current<story.length-1)render(current+1);else stop()},PLAY_CHAPTER_MS)}
function navigate(i){if(playing)stop();render(i);cleanAddressBar()}
$('#previous').addEventListener('click',()=>navigate(current-1));
$('#next').addEventListener('click',()=>navigate(current+1));
slider.addEventListener('input',e=>navigate(Number(e.target.value)));
play.addEventListener('click',()=>playing?stop():start());
window.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||document.querySelector('#chapter-index-dialog')?.open||document.activeElement===slider)return;if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(!film.contains(document.activeElement)&&window.scrollY>film.clientHeight*.5)return;if(e.key==='ArrowRight'){e.preventDefault();navigate(current+1)}if(e.key==='ArrowLeft'){e.preventDefault();navigate(current-1)}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
// Support old deep links, but never leave query strings or fragments in the address.
function cleanAddressBar(){
 if(location.search||location.hash) history.replaceState(history.state,'',location.pathname);
}
function chapterFromHash(hash=location.hash){
 const match=hash.match(/^#chapter-(\d+)$/);
 return match?Math.max(0,Math.min(story.length-1,Number(match[1])-1)):null;
}
function scrollToSection(hash,focus=false){
 if(!hash||hash==='#')return false;
 let id;
 try{id=decodeURIComponent(hash.slice(1))}catch{return false}
 const target=document.getElementById(id);
 if(!target)return false;
 target.scrollIntoView({behavior:reduce.matches?'auto':'smooth',block:'start'});
 if(focus){
   if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');
   target.focus({preventScroll:true});
 }
 return true;
}
// Keep internal section navigation functional without adding a #fragment.
document.addEventListener('click',event=>{
 if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
 const link=event.target.closest?.('a[href^="#"]');
 if(!link)return;
 const hash=link.getAttribute('href');
 if(!hash||hash==='#')return;
 let id;
 try{id=decodeURIComponent(hash.slice(1))}catch{return}
 if(!document.getElementById(id))return;
 event.preventDefault();
 scrollToSection(hash,link.classList.contains('skip-link'));
 cleanAddressBar();
});
window.addEventListener('hashchange',()=>{
 const hash=location.hash;
 const chosen=chapterFromHash(hash);
 if(chosen!==null){stop();render(chosen)}
 else scrollToSection(hash);
 cleanAddressBar();
});
const initialHash=window.__feliksIncomingHash||location.hash;
$('#year').textContent=new Date().getFullYear();
render(chapterFromHash(initialHash)??0,false);
cleanAddressBar();
setupChapterIndex({story,navigate,getCurrent:()=>current});
setupJourneyMap({story,navigate,getCurrent:()=>current});
if(initialHash&&chapterFromHash(initialHash)===null){
 requestAnimationFrame(()=>scrollToSection(initialHash,initialHash==='#chapter-title'));
}