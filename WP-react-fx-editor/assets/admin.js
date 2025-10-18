( function( element, components, apiFetch, i18n ) {
  const { useState, useEffect, useRef } = element;
  const { Button, TextControl, RangeControl, ColorPicker, SelectControl, Notice } = components;
  const __ = i18n.__;
  apiFetch.use( apiFetch.createNonceMiddleware( GS_ADMIN.nonce ) );

  const BUILTIN = {
    calm:     { speed: 1.0, linecount: 10, amplitude: 0.15, thickness: 0.003, softnessbase: 0.2, amplitudefalloff: 0.05, yoffset: 0.15, col1:'#3a80ff', col2:'#ff66e0', bg1:'#331600', bg2:'#330033' },
    vibrant:  { speed: 1.6, linecount: 14, amplitude: 0.22, thickness: 0.003, softnessbase: 0.2, amplitudefalloff: 0.05, yoffset: 0.12, col1:'#00ffc2', col2:'#ff006e', bg1:'#001219', bg2:'#3a0ca3' },
    nocturne: { speed: 0.9, linecount: 12, amplitude: 0.18, thickness: 0.003, softnessbase: 0.2, amplitudefalloff: 0.05, yoffset: 0.20, col1:'#4cc9f0', col2:'#4361ee', bg1:'#0b132b', bg2:'#1c2541' },
    sunrise:  { speed: 1.2, linecount: 11, amplitude: 0.20, thickness: 0.003, softnessbase: 0.2, amplitudefalloff: 0.05, yoffset: 0.10, col1:'#ff9e00', col2:'#ff4d6d', bg1:'#250902', bg2:'#3b0d11' },
    mono:     { speed: 1.0, linecount: 9,  amplitude: 0.16, thickness: 0.003, softnessbase: 0.2, amplitudefalloff: 0.05, yoffset: 0.15, col1:'#aaaaaa', col2:'#ffffff', bg1:'#111111', bg2:'#222222' }
  };

  function ColorField({ label, value, onChange }) {
    return element.createElement('div', { style: { marginBottom: '12px' } },
      element.createElement('div', { style: { marginBottom: '6px' } }, label),
      element.createElement(ColorPicker, {
        color: value || '#000000',
        onChangeComplete: (c)=> onChange(c.hex),
        disableAlpha: true
      })
    );
  }

  function App(){
    const [presets, setPresets] = useState(GS_ADMIN.config.userPresets || {});
    const [def, setDef] = useState(GS_ADMIN.config.default || 'calm');
    const [base, setBase] = useState('calm');
    const defaultName = __('Mon preset', 'gs');
    const [name, setName] = useState(defaultName);
    const [cfg, setCfg] = useState(Object.assign({}, BUILTIN[base]));
    const [msg, setMsg] = useState(null);
    const prevRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(()=>{ setCfg(Object.assign({}, BUILTIN[base])); }, [base]);

    useEffect(()=>{
      const el = prevRef.current;
      if (!el) return;
      Object.entries(cfg).forEach(([k,v])=> el.setAttribute(k, String(v)));
      el.setAttribute('preset','custom');
    }, [cfg]);

    const setField = (k)=>(v)=> setCfg(prev=> Object.assign({}, prev, { [k]: v }));

    async function savePreset(){
      setMsg(null);
      try {
        const res = await apiFetch({ path: 'gs/v1/presets', method: 'POST', data: { name, data: cfg } });
        setPresets(res.presets || {});
        setMsg({ type: 'success', text: __('Preset enregistré', 'gs') });
      } catch(err){
        setMsg({ type: 'error', text: err.message || 'Erreur' });
      }
    }

    async function delPreset(n){
      if (!confirm(__('Supprimer ce preset ?', 'gs'))) return;
      try {
        const res = await apiFetch({ path: 'gs/v1/presets/' + encodeURIComponent(n), method: 'DELETE' });
        setPresets(res.presets || {});
      } catch(err){}
    }

    async function makeDefault(n){
      try {
        const res = await apiFetch({ path: 'gs/v1/default', method: 'POST', data: { name: n } });
        setDef(res.default);
      } catch(err){}
    }

    function exportPreset(n, data){
      try {
        const payload = JSON.stringify({ name: n, data }, null, 2);
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `preset-${n}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch(err){
        setMsg({ type: 'error', text: err.message || __('Impossible d\'exporter le preset', 'gs') });
      }
    }

    function triggerImport(){
      if (fileInputRef.current){
        fileInputRef.current.click();
      }
    }

    async function importPreset(event){
      const file = event.target.files && event.target.files[0];
      event.target.value = '';
      if (!file) return;
      setMsg(null);
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || !parsed.name || !parsed.data){
          throw new Error(__('Fichier de preset invalide', 'gs'));
        }
        const res = await apiFetch({ path: 'gs/v1/presets', method: 'POST', data: { name: parsed.name, data: parsed.data } });
        setPresets(res.presets || {});
        setMsg({ type: 'success', text: __('Preset importé', 'gs') });
      } catch(err){
        setMsg({ type: 'error', text: err.message || __('Impossible d\'importer le preset', 'gs') });
      }
    }

    return element.createElement('div', { className: 'gs-grid' },
      element.createElement('div', { className: 'gs-card' },
        element.createElement('h2', null, __('Éditeur de preset', 'gs')),
        msg && element.createElement('div', null,
          element.createElement(Notice, { status: msg.type, onRemove: ()=> setMsg(null) }, msg.text)
        ),
        element.createElement(SelectControl, {
          label: __('Modèle de base', 'gs'),
          value: base,
          onChange: setBase,
          options: Object.keys(BUILTIN).map(k=>({label:k, value:k}))
        }),
        element.createElement(TextControl, { label: __('Nom du preset', 'gs'), value: name, onChange: setName }),
        element.createElement('div', { className: 'gs-preview', style: { margin: '12px 0' } },
          element.createElement('gradient-shader', { ref: prevRef, style: 'display:block;width:100%;height:100%' })
        ),
        element.createElement('div', { style: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' } },
          element.createElement(RangeControl, { label:'Speed', min:0.5, max:3, step:0.01, value: cfg.speed, onChange: setField('speed') }),
          element.createElement(RangeControl, { label:'Line Count', min:1, max:32, step:1, value: cfg.linecount, onChange: setField('linecount') }),
          element.createElement(TextControl, { label:'Amplitude', value: String(cfg.amplitude), onChange: (v)=> setField('amplitude')(parseFloat(v||'0')) }),
          element.createElement(TextControl, { label:'Thickness', value: String(cfg.thickness), onChange: (v)=> setField('thickness')(parseFloat(v||'0')) }),
          element.createElement(TextControl, { label:'Softness Base', value: String(cfg.softnessbase), onChange: (v)=> setField('softnessbase')(parseFloat(v||'0')) }),
          element.createElement(TextControl, { label:'Amplitude Falloff', value: String(cfg.amplitudefalloff), onChange: (v)=> setField('amplitudefalloff')(parseFloat(v||'0')) }),
          element.createElement(TextControl, { label:'Y Offset', value: String(cfg.yoffset), onChange: (v)=> setField('yoffset')(parseFloat(v||'0')) })
        ),
        element.createElement('div', { style: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginTop:'12px' } },
          ColorField({ label:'col1', value: cfg.col1, onChange: setField('col1') }),
          ColorField({ label:'col2', value: cfg.col2, onChange: setField('col2') }),
          ColorField({ label:'bg1', value: cfg.bg1, onChange: setField('bg1') }),
          ColorField({ label:'bg2', value: cfg.bg2, onChange: setField('bg2') })
        ),
        element.createElement('div', { className: 'gs-actions', style: { marginTop:'12px' } },
          element.createElement(Button, { isPrimary: true, onClick: savePreset }, __('Enregistrer le preset', 'gs')),
          element.createElement(Button, { onClick: ()=> makeDefault(name) }, __('Définir par défaut', 'gs'))
        )
      ),
      element.createElement('div', { className: 'gs-card' },
        element.createElement('h2', null, __('Mes presets', 'gs')),
        element.createElement('input', { type: 'file', accept: 'application/json', ref: fileInputRef, style: { display: 'none' }, onChange: importPreset }),
        element.createElement('div', { className: 'gs-actions', style: { marginBottom: '12px' } },
          element.createElement(Button, { onClick: triggerImport }, __('Importer un preset', 'gs'))
        ),
        Object.keys(presets).length === 0
          ? element.createElement('p', null, __('Aucun preset pour le moment.', 'gs'))
          : Object.entries(presets).map(([n, p]) =>
              element.createElement('div', { className: 'gs-list-item', key: n },
                element.createElement('div', null, n, def===n ? ' • par défaut' : ''),
                element.createElement('div', { className: 'gs-actions' },
                  element.createElement(Button, { onClick: ()=> { setName(n); setCfg(Object.assign({}, p)); } }, __('Charger', 'gs')),
                  element.createElement(Button, { onClick: ()=> exportPreset(n, p) }, __('Exporter', 'gs')),
                  element.createElement(Button, { onClick: ()=> makeDefault(n) }, __('Par défaut', 'gs')),
                  element.createElement(Button, { isDestructive: true, onClick: ()=> delPreset(n) }, __('Supprimer', 'gs'))
                )
              )
            )
      )
    );
  }

  wp.element.render( element.createElement(App), document.getElementById('gs-admin-app') );
})( window.wp.element, window.wp.components, window.wp.apiFetch, window.wp.i18n );
