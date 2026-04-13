/* Optional UI enhancer (3D tilt + reflection) — non-destructive
   Usage: load this script after page loads. It only attaches pointer handlers and inline transforms.
   Honors prefers-reduced-motion: will disable on reduced-motion.
*/
(function(){
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const tiltElements = document.querySelectorAll('.card, .login-card, .profile-card, .service-card');
  if (!tiltElements.length) return;

  tiltElements.forEach(el=>{
    el.style.transformStyle = 'preserve-3d';
    el.style.willChange = 'transform';

    function onPointerMove(e){
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width/2;
      const cy = r.top + r.height/2;
      const dx = (e.clientX - cx)/r.width;
      const dy = (e.clientY - cy)/r.height;
      const rx = (-dy * 8).toFixed(2);
      const ry = (dx * 12).toFixed(2);
      const tz = Math.max(0, 6 - (Math.abs(dx)+Math.abs(dy))*4).toFixed(2);
      el.style.transition = 'transform 120ms ease-out';
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${tz}px)`;
      // subtle inner reflection movement
      el.style.setProperty('--shine-x', `${(dx*50)+50}%`);
      el.style.setProperty('--shine-y', `${(dy*50)+50}%`);
    }
    function onPointerLeave(){ el.style.transform = ''; }
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerleave', onPointerLeave);
    // cleanup on unload
    window.addEventListener('unload', ()=>{
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);
    });
  });
})();
