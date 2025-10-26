(function(){
  const __ = window.wp?.i18n?.__ ?? ((s)=>s);

  const getGlobalConfig = () => {
    if (typeof window !== 'undefined' && typeof window.GS_CONFIG !== 'undefined') return window.GS_CONFIG;
    if (typeof globalThis !== 'undefined' && typeof globalThis.GS_CONFIG !== 'undefined') return globalThis.GS_CONFIG;
    if (typeof GS_CONFIG !== 'undefined') return GS_CONFIG;
    return null;
  };

  const getInjectedPresets = () => {
    if (typeof window !== 'undefined' && window.GS_PRESETS && typeof window.GS_PRESETS === 'object') return window.GS_PRESETS;
    if (typeof globalThis !== 'undefined' && globalThis.GS_PRESETS && typeof globalThis.GS_PRESETS === 'object') return globalThis.GS_PRESETS;
    if (typeof GS_PRESETS !== 'undefined') return GS_PRESETS;
    return null;
  };

  const getDefaultPresetValues = () => {
    const cfg = getGlobalConfig();
    if (cfg && cfg.defaults && typeof cfg.defaults === 'object') {
      return Object.assign({}, cfg.defaults);
    }
    return {
      speed: 1.0,
      linecount: 10,
      amplitude: 0.15,
      thickness: 0.003,
      yoffset: 0.15,
      linethickness: 0.003,
      softnessbase: 0.0,
      softnessrange: 0.2,
      amplitudefalloff: 0.05,
      bokehexponent: 3.0,
      bgangle: 45,
      col1: '#3a80ff',
      col2: '#ff66e0',
      bg1: '#331600',
      bg2: '#330033',
    };
  };

  const DEFAULT_PRESET_VALUES = getDefaultPresetValues();

  const applyDefaults = (preset) => Object.assign({}, DEFAULT_PRESET_VALUES, preset || {});

  const PRESETS = (() => {
    const injected = getInjectedPresets();
    const target = (injected && typeof injected === 'object') ? injected : {};
    Object.keys(target).forEach((key) => {
      if (target[key] && typeof target[key] === 'object') {
        target[key] = applyDefaults(target[key]);
      }
    });
    if (!target.calm) {
      target.calm = applyDefaults();
    }
    if (!target.custom || typeof target.custom !== 'object') {
      target.custom = {};
    }
    return target;
  })();

  if (typeof window !== 'undefined') {
    window.GS_PRESETS = PRESETS;
  } else if (typeof globalThis !== 'undefined') {
    globalThis.GS_PRESETS = PRESETS;
  }

  const clamp = (v, min, max)=> Math.min(max, Math.max(min, v));
  const hexToRgbf = (hex)=>{
    if (!hex) return [1,1,1];
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return [1,1,1];
    return [parseInt(m[1],16)/255, parseInt(m[2],16)/255, parseInt(m[3],16)/255];
  };

  const defaultFallbackText = () => {
    if (window.GS_FALLBACK && typeof window.GS_FALLBACK.text === 'string') {
      return window.GS_FALLBACK.text;
    }
    return 'Interactive gradient disabled: WebGL unavailable.';
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
    uniform float uThickness;
    uniform float uSoftnessBase;
    uniform float uAmplitudeFalloff;
    uniform float uYOffset;
    uniform float uLineThickness;
    uniform float uSoftnessRange;
    uniform float uBokehExponent;
    uniform float uBgAngle;
    uniform vec3 uCol1;
    uniform vec3 uCol2;
    uniform vec3 uBg1;
    uniform vec3 uBg2;
    const float MAX_LINES = 32.0;

    float wave(vec2 uv, float speed, float amp, float thickness, float softness, float yOff) {
      float falloff = smoothstep(1.0, 0.5, abs(uv.x));
      float y = falloff * sin(iTime * speed + uv.x * 10.0) * amp - yOff;
      return 1.0 - smoothstep(thickness, thickness + softness, abs(uv.y - y));
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / iResolution.y;
      vec2 bgUv = gl_FragCoord.xy / iResolution.xy;
      vec4 col = vec4(0.0, 0.0, 0.0, 1.0);
      col.rgb = mix(uBg1, uBg2, clamp(bgUv.x + bgUv.y, 0.0, 1.0));

      vec2 centered = bgUv - 0.5;
      float angle = radians(uBgAngle);
      float s = sin(angle);
      float c = cos(angle);
      vec2 rotated = vec2(centered.x * c - centered.y * s, centered.x * s + centered.y * c);
      float bgMix = clamp(rotated.x + 0.5, 0.0, 1.0);
      col.rgb = mix(uBg1, uBg2, bgMix);
      uv -= 0.5;

      float aaDy = iResolution.y * 0.000005;
      float denom = max(1.0, uLineCount - 1.0);

      for (float i = 0.0; i < MAX_LINES; i += 1.0) {
        if (i <= uLineCount) {
          float t = i / denom;
          vec3 lineCol = mix(uCol1, uCol2, t);
          float bokeh = pow(t, max(0.5, uBokehExponent));
          float thickness = max(0.0001, uLineThickness);
          float softness = aaDy + uSoftnessBase + bokeh * uSoftnessRange;
          float amp = max(0.0, uAmplitude - uAmplitudeFalloff * t);
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

  const FALLBACK_EMPTY_SENTINEL = '__gs_empty__';
  const FALLBACK_PROPS_KEY = 'gsFallbackProps';

  class GradientShaderEl extends HTMLElement {
    connectedCallback(){
      this._initRetries = 0;
      this._retryTimer = null;
      this._contextLost = false;
      this._initWebGL();
    }

    disconnectedCallback(){
      if (this._retryTimer) {
        clearTimeout(this._retryTimer);
        this._retryTimer = null;
      }
      if (this._boundResize) {
        window.removeEventListener('resize', this._boundResize);
        this._boundResize = null;
      }
      if (this._raf) cancelAnimationFrame(this._raf);
      if (this._mo) this._mo.disconnect();
      if (this._ro) {
        this._ro.disconnect();
        this._ro = null;
      }
      this._detachContextListeners();
      if (this._canvas && this.contains(this._canvas)) {
        this.removeChild(this._canvas);
      }
      this._canvas = null;
      this._gl = null;
      this._program = null;
      this._u = null;
    }

    _initWebGL(){
      if (!this.isConnected || this._gl) return;

      this._clearFallback(false);

      const cfg = this._getConfig();
      const isNewCanvas = !this._canvas;
      const canvas = this._canvas || document.createElement('canvas');
      if (isNewCanvas) {
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
        canvas.setAttribute('aria-hidden', 'true');
      }
      this.style.position = 'relative';
      this.style.display = 'block';
      this.style.width = this.style.width || '100%';
      this.style.minHeight = this._resolveMinHeight();

      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        if (this._canvas) {
          this._canvas.style.visibility = 'hidden';
        }
        if (isNewCanvas) {
          this._detachContextListeners();
          if (canvas && this.contains(canvas)) this.removeChild(canvas);
          this._canvas = null;
        }
        this._applyFallbackGradient(cfg);
        this._scheduleRetry();
        return;
      }

      if (isNewCanvas) {
        this._canvas = canvas;
        this.appendChild(this._canvas);
      }
      this._attachContextListeners();
      if (this._canvas) this._canvas.style.removeProperty('visibility');
      this._gl = gl;

      this._program = createProgram(this._gl, vs, fs);
      if (!this._program) {
        if (this._canvas) {
          this._canvas.style.visibility = 'hidden';
        }
        if (isNewCanvas) {
          this._detachContextListeners();
          if (this._canvas && this.contains(this._canvas)) {
            this.removeChild(this._canvas);
          }
          this._canvas = null;
        }
        this._gl = null;
        if (this._canvas && this._canvas.parentNode === this) {
          this._canvas.removeEventListener('webglcontextlost', this._onContextLost);
          this._canvas.removeEventListener('webglcontextrestored', this._onContextRestored);
          this.removeChild(this._canvas);
        }
        this._canvas = null;
        this._applyFallbackGradient(cfg);
        this._scheduleRetry();
        return;
      }
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
        uThickness:  this._gl.getUniformLocation(this._program, 'uThickness'),
        uSoftnessBase: this._gl.getUniformLocation(this._program, 'uSoftnessBase'),
        uAmplitudeFalloff: this._gl.getUniformLocation(this._program, 'uAmplitudeFalloff'),
        uYOffset:    this._gl.getUniformLocation(this._program, 'uYOffset'),
        uLineThickness: this._gl.getUniformLocation(this._program, 'uLineThickness'),
        uSoftnessRange: this._gl.getUniformLocation(this._program, 'uSoftnessRange'),
        uBokehExponent: this._gl.getUniformLocation(this._program, 'uBokehExponent'),
        uBgAngle: this._gl.getUniformLocation(this._program, 'uBgAngle'),
        uCol1:       this._gl.getUniformLocation(this._program, 'uCol1'),
        uCol2:       this._gl.getUniformLocation(this._program, 'uCol2'),
        uBg1:        this._gl.getUniformLocation(this._program, 'uBg1'),
        uBg2:        this._gl.getUniformLocation(this._program, 'uBg2'),
      };

      this._start = performance.now();
      if (!this._boundResize) {
        this._boundResize = this._resize.bind(this);
      }
      window.addEventListener('resize', this._boundResize);
      if (typeof ResizeObserver !== 'undefined') {
        if (this._ro) {
          this._ro.disconnect();
        }
        this._ro = new ResizeObserver(()=> this._resize());
        this._ro.observe(this);
      }
      this._mo = new MutationObserver(()=> this._updateUniforms());
      this._mo.observe(this, { attributes: true });

      this._resize();
      this._updateUniforms();
      this._raf = requestAnimationFrame(this._render.bind(this));
      this._cancelRetry();
      this._initRetries = 0;
      this._clearFallback(true);
      this._contextLost = false;
    }

    _attachContextListeners(canvas){
      if (!this._onContextLost) {
        this._onContextLost = (event)=>{
          event.preventDefault();
          if (this._raf) {
            cancelAnimationFrame(this._raf);
            this._raf = null;
          }
          if (this._resize) {
            window.removeEventListener('resize', this._resize);
          }
          if (this._mo) this._mo.disconnect();
          if (this._ro) this._ro.disconnect();
          this._mo = null;
          this._ro = null;
          this._gl = null;
          this._program = null;
          this._u = null;
          this._contextLost = true;
          const cfg = this._lastConfig || this._getConfig();
          this._applyFallbackGradient(cfg);
        };
      }

      if (!this._onContextRestored) {
        this._onContextRestored = ()=>{
          if (!this._contextLost) return;
          this._cancelRetry();
          this._initWebGL();
        };
      }

      canvas.addEventListener('webglcontextlost', this._onContextLost, false);
      canvas.addEventListener('webglcontextrestored', this._onContextRestored, false);
    }

    _handleContextLost(event){
      event.preventDefault();
      this._cancelRetry();
      if (this._raf) {
        cancelAnimationFrame(this._raf);
        this._raf = null;
      }
      if (this._boundResize) {
        window.removeEventListener('resize', this._boundResize);
        this._boundResize = null;
      }
      if (this._mo) {
        this._mo.disconnect();
        this._mo = null;
      }
      if (this._ro) {
        this._ro.disconnect();
        this._ro = null;
      }
      this._program = null;
      this._u = null;
      this._gl = null;
      if (this._canvas) {
        this._canvas.style.visibility = 'hidden';
      }
      this._applyFallbackGradient(this._getConfig());
    }

    _handleContextRestored(){
      this._cancelRetry();
      this._initWebGL();
    }

    _attachContextListeners(){
      if (!this._canvas || this._contextListenersAttached) return;
      if (!this._onContextLost) {
        this._onContextLost = this._handleContextLost.bind(this);
      }
      if (!this._onContextRestored) {
        this._onContextRestored = this._handleContextRestored.bind(this);
      }
      this._canvas.addEventListener('webglcontextlost', this._onContextLost, false);
      this._canvas.addEventListener('webglcontextrestored', this._onContextRestored, false);
      this._contextListenersAttached = true;
    }

    _detachContextListeners(){
      if (!this._canvas || !this._contextListenersAttached) return;
      if (this._onContextLost) {
        this._canvas.removeEventListener('webglcontextlost', this._onContextLost, false);
      }
      if (this._onContextRestored) {
        this._canvas.removeEventListener('webglcontextrestored', this._onContextRestored, false);
      }
      this._contextListenersAttached = false;
    }

    _scheduleRetry(){
      if (!this._shouldRetry()) return;
      if (this._retryTimer) return;

      const attempt = this._initRetries || 0;
      if (attempt >= 20) return;
      const delay = attempt < 3 ? 300 : Math.min(4000, 600 * attempt);

      this._retryTimer = setTimeout(() => {
        this._retryTimer = null;
        this._initRetries = attempt + 1;
        this._initWebGL();
      }, delay);
    }

    _shouldRetry(){
      return !!(document && document.body && document.body.classList.contains('wp-admin'));
    }

    _cancelRetry(){
      if (this._retryTimer) {
        clearTimeout(this._retryTimer);
        this._retryTimer = null;
      }
    }

    _getFallbackHost(){
      if (this.dataset && this.dataset.hasFallback === 'true' && this.parentElement) {
        return this.parentElement;
      }
      return this;
    }

    _styleDatasetKey(prop){
      const camel = prop.replace(/-([a-z])/g, (_, c)=> c.toUpperCase());
      return `gsOriginal${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
    }

    _trackFallbackProp(el, prop){
      if (!el?.dataset) return;
      const current = el.dataset[FALLBACK_PROPS_KEY] ? el.dataset[FALLBACK_PROPS_KEY].split(',').filter(Boolean) : [];
      if (!current.includes(prop)) {
        current.push(prop);
        el.dataset[FALLBACK_PROPS_KEY] = current.join(',');
      }
    }

    _setFallbackStyle(el, prop, value){
      if (!el?.style || !el.dataset) return;
      const key = this._styleDatasetKey(prop);
      if (!(key in el.dataset)) {
        const existing = el.style.getPropertyValue(prop);
        el.dataset[key] = existing ? existing : FALLBACK_EMPTY_SENTINEL;
      }
      el.style.setProperty(prop, value);
      this._trackFallbackProp(el, prop);
    }

    _restoreFallbackStyles(el){
      if (!el?.style || !el.dataset) return;
      const tracked = el.dataset[FALLBACK_PROPS_KEY] ? el.dataset[FALLBACK_PROPS_KEY].split(',').filter(Boolean) : [];
      tracked.forEach((prop)=>{
        const key = this._styleDatasetKey(prop);
        const original = el.dataset[key];
        if (original && original !== FALLBACK_EMPTY_SENTINEL) {
          el.style.setProperty(prop, original);
        } else {
          el.style.removeProperty(prop);
        }
        delete el.dataset[key];
      });
      if (el.dataset[FALLBACK_PROPS_KEY]) {
        delete el.dataset[FALLBACK_PROPS_KEY];
      }
    }

    _clearFallback(clearHost = true){
      if (this._fallbackLayer && this.contains(this._fallbackLayer)) {
        this.removeChild(this._fallbackLayer);
      }
      if (this._fallbackMessage && this.contains(this._fallbackMessage)) {
        this.removeChild(this._fallbackMessage);
      }
      this._fallbackLayer = null;
      this._fallbackMessage = null;
      this._fallbackActive = false;

      this._restoreFallbackStyles(this);
      if (this.dataset && this.dataset.gsFallback) {
        delete this.dataset.gsFallback;
      }
      if (this.dataset && this.dataset.gsFallbackActive) {
        delete this.dataset.gsFallbackActive;
      }

      const host = this._getFallbackHost();
      if (host && host !== this && clearHost) {
        const layer = host.querySelector('[data-gs-fallback-layer]');
        if (layer) host.removeChild(layer);
        const message = host.querySelector('[data-gs-fallback-message]');
        if (message) host.removeChild(message);
        this._restoreFallbackStyles(host);
        if (host.dataset && host.dataset.gsFallbackActive) {
          delete host.dataset.gsFallbackActive;
        }
      } else if (host && clearHost) {
        this._restoreFallbackStyles(host);
        if (host.dataset && host.dataset.gsFallbackActive) {
          delete host.dataset.gsFallbackActive;
        }
      }
    }

    _applyFallbackGradient(cfg){
      const baseGradient = `linear-gradient(135deg, ${cfg.bg1}, ${cfg.bg2})`;
      const accentStep = Math.max(1, 100 / Math.max(1, cfg.linecount));
      const accentHalf = accentStep / 2;
      const pct = (value)=> `${Number(value.toFixed(3))}%`;
      const accentGradient = `repeating-linear-gradient(90deg, ${cfg.col1} 0%, ${cfg.col1} ${pct(accentHalf)}, ${cfg.col2} ${pct(accentHalf)}, ${cfg.col2} ${pct(accentStep)})`;

      const host = this._getFallbackHost();

      const computedPosition = (typeof window !== 'undefined' && window.getComputedStyle)
        ? window.getComputedStyle(host).position
        : host.style.position;
      if (!computedPosition || computedPosition === 'static') {
        this._setFallbackStyle(host, 'position', 'relative');
      }
      this._setFallbackStyle(host, 'background', cfg.bg1);
      this._setFallbackStyle(host, 'background-image', `${accentGradient}, ${baseGradient}`);
      this._setFallbackStyle(host, 'background-blend-mode', 'screen');
      if (host.dataset) {
        host.dataset.gsFallbackActive = 'true';
      }

      this.dataset.gsFallback = 'true';
      this._fallbackActive = true;

      let layer = host.querySelector('[data-gs-fallback-layer]');
      if (!layer) {
        layer = document.createElement('div');
        layer.dataset.gsFallbackLayer = 'true';
        layer.setAttribute('aria-hidden', 'true');
        layer.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;border-radius:inherit;mix-blend-mode:screen;opacity:0.6;pointer-events:none;background-repeat:no-repeat;background-size:cover';
        host.appendChild(layer);
      }
      layer.style.backgroundImage = `${accentGradient}, ${baseGradient}`;
      this._fallbackLayer = layer;

      let message = host.querySelector('[data-gs-fallback-message]');
      if (!message) {
        message = document.createElement('span');
        message.dataset.gsFallbackMessage = 'true';
        message.setAttribute('role', 'status');
        message.setAttribute('aria-live', 'polite');
        message.style.cssText = 'position:absolute;left:0.75rem;bottom:0.75rem;padding:0.25rem 0.5rem;font-size:0.75rem;color:#fff;background:rgba(0,0,0,0.35);border-radius:999px;pointer-events:none;letter-spacing:0.02em;';
        host.appendChild(message);
      }
      message.textContent = this.getAttribute('fallback-text') || 'Interactive gradient disabled: WebGL unavailable.';
      this._fallbackMessage = message;
    }

    _getConfig(){
      const globalCfg = getGlobalConfig();
      const requestedPreset = (() => {
        const attr = this.getAttribute('preset');
        if (attr && attr.trim() !== '') return attr.trim();
        if (globalCfg && typeof globalCfg.default === 'string') return globalCfg.default;
        return 'calm';
      })();
      const presetKey = requestedPreset.toLowerCase();
      const userPresets = (globalCfg && globalCfg.userPresets) ? globalCfg.userPresets : {};
      const userKey = Object.keys(userPresets).find((key) => key.toLowerCase() === presetKey);
      const user = userKey ? userPresets[userKey] : null;
      const p = user || PRESETS[presetKey] || PRESETS.calm;
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
        thickness: pick('thickness', p.thickness ?? 0.003),
        softnessbase: pick('softnessbase', p.softnessbase ?? 0.2),
        amplitudefalloff: pick('amplitudefalloff', p.amplitudefalloff ?? 0.05),
        yoffset:   pick('yoffset', p.yoffset ?? 0.15),
        linethickness: pick('linethickness', p.linethickness ?? 0.003),
        softnessrange: pick('softnessrange', p.softnessrange ?? 0.2),
        bokehexponent: pick('bokehexponent', p.bokehexponent ?? 3.0),
        bgangle: pick('bgangle', p.bgangle ?? 45),
        col1:      pickCol('col1', p.col1 || '#3a80ff'),
        col2:      pickCol('col2', p.col2 || '#ff66e0'),
        bg1:       pickCol('bg1',  p.bg1  || '#331600'),
        bg2:       pickCol('bg2',  p.bg2  || '#330033'),
      };
    }

    _resize(){
      if (!this._canvas || !this._gl) return;
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
      if (!this._gl || !this._u) return;
      this.style.minHeight = this._resolveMinHeight();
      const cfg = this._getConfig();
      this._lastConfig = cfg;
      const gl = this._gl;
      gl.uniform1f(this._u.uSpeed, cfg.speed);
      gl.uniform1f(this._u.uLineCount, cfg.linecount);
      gl.uniform1f(this._u.uAmplitude, cfg.amplitude);
      gl.uniform1f(this._u.uThickness, cfg.thickness);
      gl.uniform1f(this._u.uSoftnessBase, cfg.softnessbase);
      gl.uniform1f(this._u.uAmplitudeFalloff, cfg.amplitudefalloff);
      gl.uniform1f(this._u.uYOffset, cfg.yoffset);
      gl.uniform1f(this._u.uLineThickness, cfg.linethickness);
      gl.uniform1f(this._u.uSoftnessRange, cfg.softnessrange);
      gl.uniform1f(this._u.uBokehExponent, cfg.bokehexponent);
      gl.uniform1f(this._u.uBgAngle, cfg.bgangle);
      const [r1,g1,b1] = hexToRgbf(cfg.col1);
      const [r2,g2,b2] = hexToRgbf(cfg.col2);
      const [rb1,gb1,bb1] = hexToRgbf(cfg.bg1);
      const [rb2,gb2,bb2] = hexToRgbf(cfg.bg2);
      gl.uniform3f(this._u.uCol1, r1,g1,b1);
      gl.uniform3f(this._u.uCol2, r2,g2,b2);
      gl.uniform3f(this._u.uBg1, rb1,gb1,bb1);
      gl.uniform3f(this._u.uBg2, rb2,gb2,bb2);
    }

    _render(now){
      if (!this._gl || !this._u) return;
      const t = (now - this._start) / 1000.0;
      const gl = this._gl;
      gl.uniform2f(this._u.iResolution, gl.canvas.width, gl.canvas.height);
      gl.uniform1f(this._u.iTime, t);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      this._raf = requestAnimationFrame(this._render.bind(this));
    }

    _resolveMinHeight(){
      const normalizedAttr = this._normalizeMinHeight(this.getAttribute('min-height'));
      if (normalizedAttr) return normalizedAttr;
      const normalizedInline = this._normalizeMinHeight(this.style && this.style.minHeight);
      if (normalizedInline) return normalizedInline;
      return '300px';
    }

    _normalizeMinHeight(value){
      if (value == null) return null;
      const trimmed = String(value).trim();
      if (!trimmed) return null;
      if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
        return `${trimmed}px`;
      }
      return trimmed;
    }
  }

  if (!customElements.get('gradient-shader')) {
    customElements.define('gradient-shader', GradientShaderEl);
  }
  window.GS_PRESETS = PRESETS;
})();
