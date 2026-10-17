/* Mouse intent enables real poses, including on touch-first hybrid devices. */
(function () {
  const media=document.querySelector('.mm-hero-media');
  if(!media)return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  let loaded=false,mouseSeen=false;
  // Establish the static first-paint state before DOMContentLoaded; resource
  // preparation still waits for load or an actual mouse interaction.
  media.classList.toggle('mm-static-poster',Boolean(motion.matches||navigator.connection?.saveData||!fine.matches));
  function sync(){
    const staticMode=Boolean(motion.matches||navigator.connection?.saveData||(!fine.matches&&!mouseSeen));
    media.classList.toggle('mm-static-poster',staticMode);
    if(staticMode||loaded)return;
    loaded=true;
    const script=document.createElement('script');script.src='assets/js/hero-media.js';
    script.onerror=()=>{loaded=false;script.remove();media.classList.add('mm-video-error');};
    document.body.appendChild(script);
  }
  window.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'||!event.isPrimary)return;
    const hero=document.getElementById('hero').getBoundingClientRect();
    if(event.clientY<hero.top||event.clientY>hero.bottom)return;
    mouseSeen=true;media.dataset.mmPointer='mouse';
    window.mmHeroPointer={x:event.clientX,y:event.clientY};sync();
  },{passive:true});
  window.addEventListener('pointerdown',event=>{
    if(event.pointerType==='touch'){media.dataset.mmPointer='touch';media.classList.add('mm-static-poster');window.mmHeroPointer=null;}
  },{passive:true});
  motion.addEventListener('change',sync);fine.addEventListener('change',sync);
  navigator.connection?.addEventListener?.('change',sync);
  if(document.readyState==='complete')sync();else addEventListener('load',sync,{once:true});
})();
