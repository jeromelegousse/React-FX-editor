( function( blocks, element, components, blockEditor, i18n ) {
  const { registerBlockType } = blocks;
  const { useEffect } = element;
  const { InspectorControls, useBlockProps } = blockEditor;
  const { PanelBody, RangeControl, SelectControl, ColorPicker, TextControl } = components;
  const __ = i18n.__;

  const getGlobalPresets = () => {
    if (typeof window !== 'undefined' && window.GS_PRESETS && typeof window.GS_PRESETS === 'object') return window.GS_PRESETS;
    if (typeof globalThis !== 'undefined' && globalThis.GS_PRESETS && typeof globalThis.GS_PRESETS === 'object') return globalThis.GS_PRESETS;
    if (typeof GS_PRESETS !== 'undefined') return GS_PRESETS;
    return {};
  };

  const DEFAULT_VALUES = (() => {
    if (typeof window !== 'undefined' && window.GS_CONFIG && window.GS_CONFIG.defaults && typeof window.GS_CONFIG.defaults === 'object') {
      return Object.assign({}, window.GS_CONFIG.defaults);
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
      bg2: '#330033'
    };
  })();

  const mergeWithDefaults = (preset) => Object.assign({}, DEFAULT_VALUES, preset || {});

  const RAW_BUILTIN = getGlobalPresets();

  const BUILTIN = Object.keys(RAW_BUILTIN).reduce((acc, key) => {
    if (key === 'custom') {
      return acc;
    }
    if (RAW_BUILTIN[key] && typeof RAW_BUILTIN[key] === 'object') {
      acc[key] = mergeWithDefaults(RAW_BUILTIN[key]);
    }
    return acc;
  }, {});

  if (!Object.keys(BUILTIN).length) {
    BUILTIN.calm = mergeWithDefaults();
  }

  function ColorField({ label, value, onChange }) {
    return wp.element.createElement('div', { style: { marginBottom: '12px' } },
      wp.element.createElement('div', { style: { marginBottom: '6px' } }, label),
      wp.element.createElement(ColorPicker, {
        color: value || '#000000',
        onChangeComplete: (c)=> onChange(c.hex),
        disableAlpha: true
      })
    );
  }

  const computeMinHeight = (value)=>{
    if (value == null || value === '') {
      return '300px';
    }
    const trimmed = String(value).trim();
    if (!trimmed) {
      return '300px';
    }
    if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
      return `${trimmed}px`;
    }
    return trimmed;
  };

  registerBlockType('gs/gradient-shader', {
    edit({ attributes, setAttributes }) {
      const { preset, speed, lineCount, amplitude, thickness, yOffset, lineThickness, softnessBase, softnessRange, amplitudeFalloff, bokehExponent, bgAngle, col1, col2, bg1, bg2, fallbackText, minHeight } = attributes;

      const computedMinHeight = computeMinHeight(minHeight);
      const blockProps = useBlockProps({ style:{ minHeight: computedMinHeight } });

      useEffect(()=>{
        if (!preset) {
          const def = (window.GS_CONFIG && window.GS_CONFIG.default) || 'calm';
          setAttributes({ preset: def });
        }
      }, []);

      const USER = (window.GS_CONFIG && window.GS_CONFIG.userPresets) || {};
      const presetOptions = [
        ...Object.keys(BUILTIN).map(k=>({ label: 'Builtin: '+k, value: k })),
        ...Object.keys(USER).map(k=>({ label: 'Custom: '+k, value: k }))
      ];

      const attrs = { preset: preset || 'calm' };
      if (speed != null) attrs.speed = String(speed);
      if (lineCount != null) attrs.linecount = String(lineCount);
      if (amplitude != null) attrs.amplitude = String(amplitude);
      if (thickness != null) attrs.thickness = String(thickness);
      if (softnessBase != null) attrs.softnessbase = String(softnessBase);
      if (softnessRange != null) attrs.softnessrange = String(softnessRange);
      if (amplitudeFalloff != null) attrs.amplitudefalloff = String(amplitudeFalloff);
      if (yOffset != null) attrs.yoffset = String(yOffset);
      if (lineThickness != null) attrs.linethickness = String(lineThickness);
      if (bokehExponent != null) attrs.bokehexponent = String(bokehExponent);
      if (bgAngle != null) attrs.bgangle = String(bgAngle);
      if (col1) attrs.col1 = col1;
      if (col2) attrs.col2 = col2;
      if (bg1) attrs.bg1 = bg1;
      if (bg2) attrs.bg2 = bg2;
      if (fallbackText) attrs['fallback-text'] = fallbackText;
      attrs['min-height'] = computedMinHeight;

      return (
        wp.element.createElement(
          wp.element.Fragment,
          null,
          wp.element.createElement(
            InspectorControls,
            null,
            wp.element.createElement(
              PanelBody,
              { title: __('Préréglages', 'gs') },
              wp.element.createElement(SelectControl, {
                label: __('Preset', 'gs'),
                value: preset || '',
                options: [{label:'—', value:''}, ...presetOptions],
                onChange: (v)=> setAttributes({ preset: v }),
                __next40pxDefaultSize: true,
                __nextHasNoMarginBottom: true
              }),
              wp.element.createElement('p', null, __('Laissez vide un champ pour garder la valeur du preset.', 'gs'))
            ),
            wp.element.createElement(
              PanelBody,
              { title: __('Paramètres', 'gs'), initialOpen: false },
              wp.element.createElement(TextControl, {
                label: __('Minimum height', 'gs'),
                value: minHeight ?? '',
                onChange: (v)=> setAttributes({ minHeight: v === '' ? undefined : v }),
                help: __('CSS value (e.g., 300px, 40vh). Leave empty for default.', 'gs'),
                __next40pxDefaultSize: true,
                __nextHasNoMarginBottom: true
              }),
              wp.element.createElement(RangeControl, {
                label: __('Speed', 'gs'),
                value: speed,
                onChange: (v)=> setAttributes({ speed: v }),
                min: 0.5, max: 3, step: 0.01,
                __next40pxDefaultSize: true,
                __nextHasNoMarginBottom: true
              }),
              wp.element.createElement(RangeControl, {
                label: __('Line Count', 'gs'),
                value: lineCount,
                onChange: (v)=> setAttributes({ lineCount: v }),
                min: 1, max: 32, step: 1,
                __next40pxDefaultSize: true,
                __nextHasNoMarginBottom: true
              }),
              wp.element.createElement(RangeControl, {
                label: __('Amplitude', 'gs'),
                value: amplitude,
                min: 0,
                max: 0.5,
                step: 0.001,
                onChange: (v)=> setAttributes({ amplitude: (v === '' || v == null || Number.isNaN(v)) ? undefined : v })
              }),
              wp.element.createElement(RangeControl, {
                label: __('Thickness', 'gs'),
                value: thickness,
                min: 0.001,
                max: 0.01,
                step: 0.0001,
                onChange: (v)=> setAttributes({ thickness: (v === '' || v == null || Number.isNaN(v)) ? undefined : v })
              }),
              wp.element.createElement(TextControl, {
                label: __('Y Offset', 'gs'),
                value: yOffset ?? '',
                onChange: (v)=> setAttributes({ yOffset: v === '' ? undefined : parseFloat(v) }),
                __next40pxDefaultSize: true,
                __nextHasNoMarginBottom: true
              }),
              wp.element.createElement(RangeControl, {
                label: __('Line Thickness', 'gs'),
                value: lineThickness,
                onChange: (v)=> setAttributes({ lineThickness: v }),
                min: 0.001, max: 0.01, step: 0.0005,
                __next40pxDefaultSize: true,
                __nextHasNoMarginBottom: true
              }),
              wp.element.createElement(RangeControl, {
                label: __('Softness Base', 'gs'),
                value: softnessBase,
                onChange: (v)=> setAttributes({ softnessBase: (v === '' || v == null || Number.isNaN(v)) ? undefined : v }),
                min: 0, max: 0.1, step: 0.001,
                __next40pxDefaultSize: true,
                __nextHasNoMarginBottom: true
              }),
              wp.element.createElement(RangeControl, {
                label: __('Softness Range', 'gs'),
                value: softnessRange,
                onChange: (v)=> setAttributes({ softnessRange: v }),
                min: 0, max: 0.5, step: 0.005,
                __next40pxDefaultSize: true,
                __nextHasNoMarginBottom: true
              }),
              wp.element.createElement(RangeControl, {
                label: __('Amplitude Falloff', 'gs'),
                value: amplitudeFalloff,
                onChange: (v)=> setAttributes({ amplitudeFalloff: (v === '' || v == null || Number.isNaN(v)) ? undefined : v }),
                min: 0, max: 0.2, step: 0.001,
                __next40pxDefaultSize: true,
                __nextHasNoMarginBottom: true
              }),
              wp.element.createElement(RangeControl, {
                label: __('Bokeh Exponent', 'gs'),
                value: bokehExponent,
                onChange: (v)=> setAttributes({ bokehExponent: v }),
                min: 1, max: 6, step: 0.1,
                __next40pxDefaultSize: true,
                __nextHasNoMarginBottom: true
              }),
              wp.element.createElement(RangeControl, {
                label: __('Background Angle', 'gs'),
                value: bgAngle,
                onChange: (v)=> setAttributes({ bgAngle: v }),
                min: 0, max: 360, step: 1,
                __next40pxDefaultSize: true,
                __nextHasNoMarginBottom: true
              })
            ),
            wp.element.createElement(
              PanelBody,
              { title: __('Couleurs', 'gs'), initialOpen: false },
              ColorField({ label: 'Wave color 1 (col1)', value: col1, onChange: (v)=> setAttributes({ col1: v }) }),
              ColorField({ label: 'Wave color 2 (col2)', value: col2, onChange: (v)=> setAttributes({ col2: v }) }),
              ColorField({ label: 'Background 1 (bg1)', value: bg1, onChange: (v)=> setAttributes({ bg1: v }) }),
              ColorField({ label: 'Background 2 (bg2)', value: bg2, onChange: (v)=> setAttributes({ bg2: v }) })
            ),
            wp.element.createElement(
              PanelBody,
              { title: __('Accessibilité', 'gs'), initialOpen: false },
              wp.element.createElement(TextControl, {
                label: __('Fallback message', 'gs'),
                help: __('Displayed when WebGL is unavailable.', 'gs'),
                value: fallbackText ?? '',
                placeholder: (window.GS_CONFIG && window.GS_CONFIG.fallbackText) || '',
                onChange: (v)=> setAttributes({ fallbackText: v === '' ? undefined : v }),
                __next40pxDefaultSize: true,
                __nextHasNoMarginBottom: true
              })
            )
          ),
          wp.element.createElement('div', blockProps,
            wp.element.createElement('gradient-shader', Object.assign({ style: { width: '100%', height: '100%', display: 'block', minHeight: computedMinHeight } }, attrs))
          )
        )
      );
    },
    save({ attributes }) {
      const { preset, speed, lineCount, amplitude, thickness, yOffset, lineThickness, softnessBase, softnessRange, amplitudeFalloff, bokehExponent, bgAngle, col1, col2, bg1, bg2, fallbackText, minHeight } = attributes;
      const computedMinHeight = computeMinHeight(minHeight);
      const attrs = { preset: preset || 'calm' };
      if (speed != null) attrs.speed = String(speed);
      if (lineCount != null) attrs.linecount = String(lineCount);
      if (amplitude != null) attrs.amplitude = String(amplitude);
      if (thickness != null) attrs.thickness = String(thickness);
      if (softnessBase != null) attrs.softnessbase = String(softnessBase);
      if (softnessRange != null) attrs.softnessrange = String(softnessRange);
      if (amplitudeFalloff != null) attrs.amplitudefalloff = String(amplitudeFalloff);
      if (yOffset != null) attrs.yoffset = String(yOffset);
      if (lineThickness != null) attrs.linethickness = String(lineThickness);
      if (bokehExponent != null) attrs.bokehexponent = String(bokehExponent);
      if (bgAngle != null) attrs.bgangle = String(bgAngle);
      if (col1) attrs.col1 = col1;
      if (col2) attrs.col2 = col2;
      if (bg1) attrs.bg1 = bg1;
      if (bg2) attrs.bg2 = bg2;
      if (fallbackText) attrs['fallback-text'] = fallbackText;
      attrs['min-height'] = computedMinHeight;
      return wp.element.createElement('div', { style: { minHeight: computedMinHeight } },
        wp.element.createElement('gradient-shader', Object.assign({ style: { width: '100%', height: '100%', display: 'block', minHeight: computedMinHeight } }, attrs))
      );
    }
  });
} )( window.wp.blocks, window.wp.element, window.wp.components, window.wp.blockEditor, window.wp.i18n );
