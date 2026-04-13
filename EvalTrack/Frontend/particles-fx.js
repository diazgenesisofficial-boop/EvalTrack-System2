/* Lightweight particle background with subtle mouse parallax
   - Non-destructive: create a canvas element with class 'particles-canvas' and include this script
   - Respects prefers-reduced-motion
*/
(function(){
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function initParticles(){
    const canvas = document.createElement('canvas');
    canvas.className = 'particles-canvas';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let w=canvas.width=innerWidth, h=canvas.height=innerHeight;
    let mouse = { x: w/2, y: h/2 };

    const particles = [];
    const count = Math.max(25, Math.floor((w*h)/90000));

    for(let i=0;i<count;i++){
      particles.push({
        x: Math.random()*w,
        y: Math.random()*h,
        r: Math.random()*2+0.8,
        vx: (Math.random()-0.5)*0.2,
        vy: (Math.random()-0.5)*0.2,
        life: Math.random()*100
      });
    }

    function resize(){ w=canvas.width=innerWidth; h=canvas.height=innerHeight; }
    window.addEventListener('resize', resize);

    window.addEventListener('pointermove', (e)=>{ mouse.x = e.clientX; mouse.y = e.clientY; });

    function draw(){
      ctx.clearRect(0,0,w,h);
      particles.forEach(p=>{
        // slight attraction to mouse for parallax
        const dx = (mouse.x - p.x) * 0.0006;
        const dy = (mouse.y - p.y) * 0.0006;
        p.x += p.vx + dx;
        p.y += p.vy + dy;

        if(p.x < -10) p.x = w + 10;
        if(p.x > w + 10) p.x = -10;
        if(p.y < -10) p.y = h + 10;
        if(p.y > h + 10) p.y = -10;

        const op = 0.12 + 0.6 * (p.r/3);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,255,255,${op})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') initParticles(); else window.addEventListener('DOMContentLoaded', initParticles);
})();
