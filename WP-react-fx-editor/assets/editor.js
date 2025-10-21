( function( blocks, element, components, blockEditor, i18n ) {
  const { registerBlockType } = blocks;
  const { useEffect } = element;
  const { InspectorControls, useBlockProps } = blockEditor;
  const { PanelBody, RangeControl, SelectControl, ColorPicker, TextControl } = components;
  const __ = i18n.__;

  const BUILTIN = {
    calm:     { speed: 1.0, lineCount: 10, amplitude: 0.15, yOffset: 0.15, lineThickness: 0.003, softnessBase: 0.0, softnessRange: 0.2, amplitudeFalloff: 0.05, bokehExponent: 3.0, bgAngle: 45, col1:'#3a80ff', col2:'#ff66e0', bg1:'#331600', bg2:'#330033' },
    vibrant:  { speed: 1.6, lineCount: 14, amplitude: 0.22, yOffset: 0.12, lineThickness: 0.003, softnessBase: 0.02, softnessRange: 0.25, amplitudeFalloff: 0.045, bokehExponent: 2.6, bgAngle: 45, col1:'#00ffc2', col2:'#ff006e', bg1:'#001219', bg2:'#3a0ca3' },
    nocturne: { speed: 0.9, lineCount: 12, amplitude: 0.18, yOffset: 0.20, lineThickness: 0.0025, softnessBase: 0.01, softnessRange: 0.22, amplitudeFalloff: 0.04, bokehExponent: 3.5, bgAngle: 45, col1:'#4cc9f0', col2:'#4361ee', bg1:'#0b132b', bg2:'#1c2541' },
    sunrise:  { speed: 1.2, lineCount: 11, amplitude: 0.20, yOffset: 0.10, lineThickness: 0.0032, softnessBase: 0.015, softnessRange: 0.23, amplitudeFalloff: 0.05, bokehExponent: 2.8, bgAngle: 45, col1:'#ff9e00', col2:'#ff4d6d', bg1:'#250902', bg2:'#3b0d11' },
    mono:     { speed: 1.0, lineCount: 9,  amplitude: 0.16, yOffset: 0.15, lineThickness: 0.0028, softnessBase: 0.005, softnessRange: 0.18, amplitudeFalloff: 0.05, bokehExponent: 3.2, bgAngle: 45, col1:'#aaaaaa', col2:'#ffffff', bg1:'#111111', bg2:'#222222' }
  };

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

  registerBlockType('gs/gradient-shader', {
    edit({ attributes, setAttributes }) {
      const { preset, speed, lineCount, amplitude, thickness, yOffset, lineThickness, softnessBase, softnessRange, amplitudeFalloff, bokehExponent, bgAngle, col1, col2, bg1, bg2 } = attributes;
      const blockProps = useBlockProps({ style:{ minHeight:'300px' } });

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
              wp.element.createElement(TextControl, {
                label: __('Amplitude', 'gs'),
                value: amplitude ?? '',
                onChange: (v)=> setAttributes({ amplitude: v === '' ? undefined : parseFloat(v) }),
                __next40pxDefaultSize: true,
                __nextHasNoMarginBottom: true
              }),
              wp.element.createElement(TextControl, {
                label: __('Thickness', 'gs'),
                value: thickness != null ? String(thickness) : '',
                onChange: (v)=> setAttributes({ thickness: v === '' ? undefined : parseFloat(v) }),
                __next40pxDefaultSize: true,
                __nextHasNoMarginBottom: true
              }),
              wp.element.createElement(TextControl, {
                label: __('Softness Base', 'gs'),
                value: softnessBase ?? '',
                onChange: (v)=> setAttributes({ softnessBase: v === '' ? undefined : parseFloat(v) }),
                __next40pxDefaultSize: true,
                __nextHasNoMarginBottom: true
              }),
              wp.element.createElement(TextControl, {
                label: __('Amplitude Falloff', 'gs'),
                value: amplitudeFalloff ?? '',
                onChange: (v)=> setAttributes({ amplitudeFalloff: v === '' ? undefined : parseFloat(v) }),
                __next40pxDefaultSize: true,
                __nextHasNoMarginBottom: true
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
                onChange: (v)=> setAttributes({ softnessBase: v }),
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
                onChange: (v)=> setAttributes({ amplitudeFalloff: v }),
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
            )
          ),
          wp.element.createElement('div', blockProps,
            wp.element.createElement('gradient-shader', Object.assign({ style: { width: '100%', height: '100%', display: 'block' } }, attrs))
          )
        )
      );
    },
    save({ attributes }) {
      const { preset, speed, lineCount, amplitude, thickness, yOffset, lineThickness, softnessBase, softnessRange, amplitudeFalloff, bokehExponent, bgAngle, col1, col2, bg1, bg2 } = attributes;
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
      return wp.element.createElement('div', { style: { minHeight: '300px' } },
        wp.element.createElement('gradient-shader', Object.assign({ style: { width: '100%', height: '100%', display: 'block' } }, attrs))
      );
    }
  });
} )( window.wp.blocks, window.wp.element, window.wp.components, window.wp.blockEditor, window.wp.i18n );
