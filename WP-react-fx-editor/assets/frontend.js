(function(){
  const PRESETS = {
    calm:     { speed: 1.0, linecount: 10, amplitude: 0.15, yoffset: 0.15, col1:'#3a80ff', col2:'#ff66e0', bg1:'#331600', bg2:'#330033', bgAngle: 0 },
    vibrant:  { speed: 1.6, linecount: 14, amplitude: 0.22, yoffset: 0.12, col1:'#00ffc2', col2:'#ff006e', bg1:'#001219', bg2:'#3a0ca3', bgAngle: 0 },
    nocturne: { speed: 0.9, linecount: 12, amplitude: 0.18, yoffset: 0.20, col1:'#4cc9f0', col2:'#4361ee', bg1:'#0b132b', bg2:'#1c2541', bgAngle: 0 },
    sunrise:  { speed: 1.2, linecount: 11, amplitude: 0.20, yoffset: 0.10, col1:'#ff9e00', col2:'#ff4d6d', bg1:'#250902', bg2:'#3b0d11', bgAngle: 0 },
    mono:     { speed: 1.0, linecount: 9,  amplitude: 0.16, yoffset: 0.15, col1:'#aaaaaa', col2:'#ffffff', bg1:'#111111', bg2:'#222222', bgAngle: 0 },
    custom:   {}
  };

  const clamp = (v, min, max)=> Math.min(max, Math.max(min, v));
  const hexToRgbf = (hex)=>{
    if (!hex) return [1,1,1];
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return [1,1,1];
    return [parseInt(m[1],16)/255, parseInt(m[2],16)/255, parseInt(m[3],16)/255];
  };

  const vs = `
    attribute vec2 a_position;
    void main(){ gl_Position = vec4(a_position, 0.0, 1.0); }
  `;

  const fs = `
    precision mediump float;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform float uSpeed;
    uniform float uLineCount;
    uniform float uAmplitude;
    uniform float uYOffset;
    uniform vec3 uCol1;
    uniform vec3 uCol2;
    uniform vec3 uBg1;
    uniform vec3 uBg2;
    uniform float uBgAngle;
    const float MAX_LINES = 32.0;

    float wave(vec2 uv, float speed, float amp, float thickness, float softness, float yOff) {
      float falloff = smoothstep(1.0, 0.5, abs(uv.x));
      float y = falloff * sin(iTime * speed + uv.x * 10.0) * amp - yOff;
      return 1.0 - smoothstep(thickness, thickness + softness, abs(uv.y - y));
    }

    void main() {
      vec2 baseUv = gl_FragCoord.xy / iResolution.y;
      vec2 pivot = vec2(0.5 * iResolution.x / iResolution.y, 0.5);
      vec2 bgUv = baseUv - pivot;
      float s = sin(uBgAngle);
      float c = cos(uBgAngle);
      bgUv = mat2(c, -s, s, c) * bgUv + pivot;

      vec4 col = vec4(0.0, 0.0, 0.0, 1.0);
      col.rgb = mix(uBg1, uBg2, clamp(bgUv.x + bgUv.y, 0.0, 1.0));

      vec2 uv = baseUv - vec2(0.5, 0.5);

      float aaDy = iResolution.y * 0.000005;
      float denom = max(1.0, uLineCount - 1.0);

      for (float i = 0.0; i < MAX_LINES; i += 1.0) {
        if (i <= uLineCount) {
          float t = i / denom;
          vec3 lineCol = mix(uCol1, uCol2, t);
          float bokeh = pow(t, 3.0);
          float thickness = 0.003;
          float softness = aaDy + bokeh * 0.2;
          float amp = max(0.0, uAmplitude - 0.05 * t);
          float amt = max(0.0, pow(1.0 - bokeh, 2.0) * 0.9);
          col.rgb += wave(uv, uSpeed * (1.0 + t), amp, thickness, softness, uYOffset) * lineCol * amt;
        }
      }
      gl_FragColor = col;
    }
  `;

  function createShader(gl, type, source){
    const sh = gl.createShader(type);
    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('Shader error', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function createProgram(gl, vsSrc, fsSrc){
    const v = createShader(gl, gl.VERTEX_SHADER, vsSrc);
    const f = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    if (!v || !f) return null;
    const p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error('Program link error', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }

  class GradientShaderEl extends HTMLElement {
    connectedCallback(){
      this._canvas = document.createElement('canvas');
      this._canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      this.style.position = 'relative';
      this.style.display = 'block';
      this.style.width = this.style.width || '100%';
      this.style.minHeight = this.style.minHeight || '300px';
      this.appendChild(this._canvas);

      this._gl = this._canvas.getContext('webgl') || this._canvas.getContext('experimental-webgl');
      if (!this._gl) { console.error('WebGL not supported'); return; }

      this._program = createProgram(this._gl, vs, fs);
      if (!this._program) return;
      this._gl.useProgram(this._program);

      const buf = this._gl.createBuffer();
      this._gl.bindBuffer(this._gl.ARRAY_BUFFER, buf);
      const positions = new Float32Array([-1,-1, 1,-1, -1,1,  -1,1, 1,-1, 1,1]);
      this._gl.bufferData(this._gl.ARRAY_BUFFER, positions, this._gl.STATIC_DRAW);
      const aPos = this._gl.getAttribLocation(this._program, 'a_position');
      this._gl.enableVertexAttribArray(aPos);
      this._gl.vertexAttribPointer(aPos, 2, this._gl.FLOAT, false, 0, 0);

      this._u = {
        iResolution: this._gl.getUniformLocation(this._program, 'iResolution'),
        iTime:       this._gl.getUniformLocation(this._program, 'iTime'),
        uSpeed:      this._gl.getUniformLocation(this._program, 'uSpeed'),
        uLineCount:  this._gl.getUniformLocation(this._program, 'uLineCount'),
        uAmplitude:  this._gl.getUniformLocation(this._program, 'uAmplitude'),
        uYOffset:    this._gl.getUniformLocation(this._program, 'uYOffset'),
        uCol1:       this._gl.getUniformLocation(this._program, 'uCol1'),
        uCol2:       this._gl.getUniformLocation(this._program, 'uCol2'),
        uBg1:        this._gl.getUniformLocation(this._program, 'uBg1'),
        uBg2:        this._gl.getUniformLocation(this._program, 'uBg2'),
        uBgAngle:    this._gl.getUniformLocation(this._program, 'uBgAngle'),
      };

      this._start = performance.now();
      this._resize = this._resize.bind(this);
      window.addEventListener('resize', this._resize);
      this._mo = new MutationObserver(()=> this._updateUniforms());
      this._mo.observe(this, { attributes: true });

      this._resize();
      this._updateUniforms();
      this._raf = requestAnimationFrame(this._render.bind(this));
    }

    disconnectedCallback(){
      window.removeEventListener('resize', this._resize);
      if (this._raf) cancelAnimationFrame(this._raf);
      if (this._mo) this._mo.disconnect();
    }

    _getConfig(){
      const presetName = (this.getAttribute('preset') || 'calm').toLowerCase();
      const user = (window.GS_CONFIG && window.GS_CONFIG.userPresets && window.GS_CONFIG.userPresets[presetName]) || null;
      const p = user || PRESETS[presetName] || PRESETS.calm;
      const getAttr = (name)=>{
        const direct = this.getAttribute(name);
        if (direct != null) return direct;
        const lower = name.toLowerCase();
        if (lower !== name) {
          const alt = this.getAttribute(lower);
          if (alt != null) return alt;
        }
        return null;
      };
      const pick = (name, def)=>{
        const v = getAttr(name);
        if (v == null || v === '') return def;
        const n = parseFloat(v);
        return isNaN(n) ? def : n;
      };
      const pickInt = (name, def)=>{
        const v = getAttr(name);
        if (v == null || v === '') return def;
        const n = parseInt(v, 10);
        return isNaN(n) ? def : n;
      };
      const pickCol = (name, def)=> getAttr(name) || def;

      return {
        speed:     pick('speed', p.speed ?? 1.0),
        linecount: clamp(pickInt('linecount', p.linecount ?? 10), 1, 32),
        amplitude: pick('amplitude', p.amplitude ?? 0.15),
        yoffset:   pick('yoffset', p.yoffset ?? 0.15),
        col1:      pickCol('col1', p.col1 || '#3a80ff'),
        col2:      pickCol('col2', p.col2 || '#ff66e0'),
        bg1:       pickCol('bg1',  p.bg1  || '#331600'),
        bg2:       pickCol('bg2',  p.bg2  || '#330033'),
        bgAngle:  pick('bgAngle', p.bgAngle ?? 0),
      };
    }

    _resize(){
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(this.clientWidth * dpr);
      const h = Math.floor(this.clientHeight * dpr);
      if (this._canvas.width !== w || this._canvas.height !== h) {
        this._canvas.width = w;
        this._canvas.height = h;
        this._gl.viewport(0, 0, w, h);
      }
    }

    _updateUniforms(){
      const cfg = this._getConfig();
      const gl = this._gl;
      gl.uniform1f(this._u.uSpeed, cfg.speed);
      gl.uniform1f(this._u.uLineCount, cfg.linecount);
      gl.uniform1f(this._u.uAmplitude, cfg.amplitude);
      gl.uniform1f(this._u.uYOffset, cfg.yoffset);
      const [r1,g1,b1] = hexToRgbf(cfg.col1);
      const [r2,g2,b2] = hexToRgbf(cfg.col2);
      const [rb1,gb1,bb1] = hexToRgbf(cfg.bg1);
      const [rb2,gb2,bb2] = hexToRgbf(cfg.bg2);
      gl.uniform3f(this._u.uCol1, r1,g1,b1);
      gl.uniform3f(this._u.uCol2, r2,g2,b2);
      gl.uniform3f(this._u.uBg1, rb1,gb1,bb1);
      gl.uniform3f(this._u.uBg2, rb2,gb2,bb2);
      gl.uniform1f(this._u.uBgAngle, cfg.bgAngle * Math.PI / 180);
    }

    _render(now){
      const t = (now - this._start) / 1000.0;
      const gl = this._gl;
      gl.uniform2f(this._u.iResolution, gl.canvas.width, gl.canvas.height);
      gl.uniform1f(this._u.iTime, t);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      this._raf = requestAnimationFrame(this._render.bind(this));
    }
  }

  if (!customElements.get('gradient-shader')) {
    customElements.define('gradient-shader', GradientShaderEl);
  }
  window.GS_PRESETS = PRESETS;
})();
