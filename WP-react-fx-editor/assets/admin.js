( function( element, components, apiFetch, i18n ) {
  const { useState, useEffect, useRef } = element;
  const { Button, TextControl, RangeControl, ColorPicker, SelectControl, Notice } = components;
  const __ = i18n.__;
  apiFetch.use( apiFetch.createNonceMiddleware( GS_ADMIN.nonce ) );

  const BUILTIN = (GS_ADMIN?.config?.builtinPresets && typeof GS_ADMIN.config.builtinPresets === 'object') ? GS_ADMIN.config.builtinPresets : {};

  const getPresetDefaults = (format = 'snake') => {
    if (typeof window !== 'undefined' && typeof window.GS_getPresetDefaults === 'function') {
      const defaults = window.GS_getPresetDefaults(format);
      if (defaults) return defaults;
    }
    if (format === 'snake') {
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
        bg2: '#330033'
      };
    }
    return {};
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

  function withDefaults(data){
    return Object.assign({}, getPresetDefaults('snake'), data || {});
  }

  function App(){
    const [presets, setPresets] = useState(GS_ADMIN.config.userPresets || {});
    const [def, setDef] = useState(GS_ADMIN.config.default || 'calm');
    const builtinKeys = Object.keys(BUILTIN || {});
    const builtinOptions = builtinKeys.filter((key)=> key !== 'custom');
    const initialBase = builtinKeys.includes('calm') ? 'calm' : (builtinOptions[0] || builtinKeys[0] || 'calm');
    const [base, setBase] = useState(initialBase);
    const defaultName = __('Mon preset', 'gs');
    const [name, setName] = useState(defaultName);
    const [cfg, setCfg] = useState(withDefaults(BUILTIN[base]));
    const [msg, setMsg] = useState(null);
    const prevRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(()=>{ setCfg(withDefaults(BUILTIN[base])); }, [base]);

    useEffect(()=>{
      const el = prevRef.current;
      if (!el) return;
      Object.entries(cfg).forEach(([k,v])=> el.setAttribute(k.toLowerCase(), String(v)));
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
          options: builtinOptions.map(k=>({label:k, value:k})),
          __next40pxDefaultSize: true,
          __nextHasNoMarginBottom: true
        }),
        element.createElement(TextControl, {
          label: __('Nom du preset', 'gs'),
          value: name,
          onChange: setName,
          __next40pxDefaultSize: true,
          __nextHasNoMarginBottom: true
        }),
        element.createElement('div', { className: 'gs-preview', style: { margin: '12px 0' } },
          element.createElement('gradient-shader', { ref: prevRef, style: { display: 'block', width: '100%', height: '100%' } })
        ),
        element.createElement('div', { style: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' } },
          element.createElement(RangeControl, {
            label:'Speed',
            min:0.5,
            max:3,
            step:0.01,
            value: cfg.speed,
            onChange: setField('speed'),
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true
          }),
          element.createElement(RangeControl, {
            label:'Line Count',
            min:1,
            max:32,
            step:1,
            value: cfg.linecount,
            onChange: setField('linecount'),
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true
          }),
          element.createElement(TextControl, {
            label:'Amplitude',
            value: String(cfg.amplitude),
            onChange: (v)=> setField('amplitude')(parseFloat(v||'0')),
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true
          }),
          element.createElement(TextControl, {
            label:'Thickness',
            value: cfg.thickness != null ? String(cfg.thickness) : '',
            onChange: (v)=> setField('thickness')(parseFloat(v||'0')),
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true
          }),
          element.createElement(TextControl, {
            label:'Y Offset',
            value: String(cfg.yoffset),
            onChange: (v)=> setField('yoffset')(parseFloat(v||'0')),
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true
          })
        ),
        element.createElement('div', { style: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginTop:'12px' } },
          element.createElement(RangeControl, {
            label:'Line Thickness',
            min:0.001,
            max:0.01,
            step:0.0005,
            value: cfg.linethickness,
            onChange: setField('linethickness'),
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true
          }),
          element.createElement(RangeControl, {
            label:'Softness Base',
            min:0,
            max:0.1,
            step:0.001,
            value: cfg.softnessbase,
            onChange: setField('softnessbase'),
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true
          }),
          element.createElement(RangeControl, {
            label:'Softness Range',
            min:0,
            max:0.5,
            step:0.005,
            value: cfg.softnessrange,
            onChange: setField('softnessrange'),
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true
          }),
          element.createElement(RangeControl, {
            label:'Amplitude Falloff',
            min:0,
            max:0.2,
            step:0.001,
            value: cfg.amplitudefalloff,
            onChange: setField('amplitudefalloff'),
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true
          }),
          element.createElement(RangeControl, {
            label:'Bokeh Exponent',
            min:1,
            max:6,
            step:0.1,
            value: cfg.bokehexponent,
            onChange: setField('bokehexponent'),
            __next40pxDefaultSize: true,
            __nextHasNoMarginBottom: true
          })
        ),
        element.createElement('div', { style: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginTop:'12px' } },
          ColorField({ label:'col1', value: cfg.col1, onChange: setField('col1') }),
          ColorField({ label:'col2', value: cfg.col2, onChange: setField('col2') }),
          ColorField({ label:'bg1', value: cfg.bg1, onChange: setField('bg1') }),
          ColorField({ label:'bg2', value: cfg.bg2, onChange: setField('bg2') }),
          element.createElement('div', { style: { gridColumn: '1 / -1' } },
            element.createElement(RangeControl, {
              label: __('Background angle', 'gs'),
              min: 0,
              max: 360,
              step: 1,
              value: cfg.bgangle != null ? cfg.bgangle : 0,
              onChange: (v)=> setField('bgangle')(v == null ? 0 : v),
              __next40pxDefaultSize: true,
              __nextHasNoMarginBottom: true
            })
          )
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
                  element.createElement(Button, { onClick: ()=> { setName(n); setCfg(withDefaults(p)); } }, __('Charger', 'gs')),
                  element.createElement(Button, { onClick: ()=> exportPreset(n, p) }, __('Exporter', 'gs')),
                  element.createElement(Button, { onClick: ()=> makeDefault(n) }, __('Par défaut', 'gs')),
                  element.createElement(Button, { isDestructive: true, onClick: ()=> delPreset(n) }, __('Supprimer', 'gs'))
                )
              )
            )
      )
    );
  }

  let root;

  function mount(){
    const target = document.getElementById('gs-admin-app');
    if (!target) {
      return;
    }

    const app = element.createElement(App);

    if (typeof element.createRoot === 'function') {
      if (!root) {
        root = element.createRoot(target);
      }
      root.render(app);
    } else if (typeof element.render === 'function') {
      element.render(app, target);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})( window.wp.element, window.wp.components, window.wp.apiFetch, window.wp.i18n );
