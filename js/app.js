import {story} from './story.js';
import {sceneArt} from './art.js';
const $=s=>document.querySelector(s);
const film=$('#film'),backdrop=$('#backdrop'),drawing=$('#art-holder'),copy=$('#chapter-content'),slider=$('#scrubber'),dots=$('#chapter-dots'),play=$('#play-pause');
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
let current=0,playing=false,timer=null;
for(let i=0;i<story.length;i++){const d=document.createElement('span');d.className='chapter-dot';d.setAttribute('aria-hidden','true');dots.append(d)}
slider.max=story.length-1;
function render(index,animate=true){
 current=Math.max(0,Math.min(story.length-1,index));
 const c=story[current],motion=animate&&!reduce.matches;
 copy.classList.remove('copy-enter');if(motion)void copy.offsetWidth;
 $('#act-label').textContent=c.act;$('#place-label').textContent=c.place;$('#chapter-title').textContent=c.title;$('#narration').textContent=c.narration;
 $('#chapter-number').textContent=String(current+1).padStart(2,'0');$('#side-index').textContent=String(current+1).padStart(2,'0')+'—'+story.length;
 slider.value=current;slider.setAttribute('aria-valuetext',(current+1)+' of '+story.length+': '+c.detail);
 $('#track-fill').style.width=(current/(story.length-1)*100)+'%';
 $('#previous').disabled=current===0;$('#next').disabled=current===story.length-1;
 backdrop.className='film-backdrop palette-'+c.palette;drawing.innerHTML=sceneArt(c.scene);
 if(c.image){backdrop.style.setProperty('--photo','url("'+encodeURI(c.image).replaceAll('"','%22')+'")');backdrop.classList.add('has-photo')}else backdrop.style.removeProperty('--photo');
 [...dots.children].forEach((d,i)=>d.classList.toggle('is-active',i<=current));
 if(motion)copy.classList.add('copy-enter');film.dataset.chapter=current+1;
}
function stop(){playing=false;clearInterval(timer);timer=null;$('#play-glyph').textContent='▶';$('#play-label').textContent='PLAY STORY';play.setAttribute('aria-label','Play documentary')}
function start(){if(playing)return;if(current===story.length-1)render(0);playing=true;$('#play-glyph').textContent='Ⅱ';$('#play-label').textContent='PAUSE STORY';play.setAttribute('aria-label','Pause documentary');timer=setInterval(()=>{if(current<story.length-1)render(current+1);else stop()},7800)}
function navigate(i){if(playing)stop();render(i)}
$('#previous').addEventListener('click',()=>navigate(current-1));
$('#next').addEventListener('click',()=>navigate(current+1));
slider.addEventListener('input',e=>navigate(Number(e.target.value)));
play.addEventListener('click',()=>playing?stop():start());
window.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||document.activeElement===slider)return;if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;if(!film.contains(document.activeElement)&&window.scrollY>film.clientHeight*.5)return;if(e.key==='ArrowRight'){e.preventDefault();navigate(current+1)}if(e.key==='ArrowLeft'){e.preventDefault();navigate(current-1)}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
$('#year').textContent=new Date().getFullYear();render(0,false);