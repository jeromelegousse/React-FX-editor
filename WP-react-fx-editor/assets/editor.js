( function( blocks, element, components, blockEditor, i18n ) {
  const { registerBlockType } = blocks;
  const { useEffect } = element;
  const { InspectorControls, useBlockProps } = blockEditor;
  const { PanelBody, RangeControl, SelectControl, ColorPicker, TextControl } = components;
  const __ = i18n.__;

  const BUILTIN = {
    calm:     { speed: 1.0, lineCount: 10, amplitude: 0.15, yOffset: 0.15, lineThickness: 0.003, softnessBase: 0.0, softnessRange: 0.2, amplitudeFalloff: 0.05, bokehExponent: 3.0, col1:'#3a80ff', col2:'#ff66e0', bg1:'#331600', bg2:'#330033' },
    vibrant:  { speed: 1.6, lineCount: 14, amplitude: 0.22, yOffset: 0.12, lineThickness: 0.003, softnessBase: 0.02, softnessRange: 0.25, amplitudeFalloff: 0.045, bokehExponent: 2.6, col1:'#00ffc2', col2:'#ff006e', bg1:'#001219', bg2:'#3a0ca3' },
    nocturne: { speed: 0.9, lineCount: 12, amplitude: 0.18, yOffset: 0.20, lineThickness: 0.0025, softnessBase: 0.01, softnessRange: 0.22, amplitudeFalloff: 0.04, bokehExponent: 3.5, col1:'#4cc9f0', col2:'#4361ee', bg1:'#0b132b', bg2:'#1c2541' },
    sunrise:  { speed: 1.2, lineCount: 11, amplitude: 0.20, yOffset: 0.10, lineThickness: 0.0032, softnessBase: 0.015, softnessRange: 0.23, amplitudeFalloff: 0.05, bokehExponent: 2.8, col1:'#ff9e00', col2:'#ff4d6d', bg1:'#250902', bg2:'#3b0d11' },
    mono:     { speed: 1.0, lineCount: 9,  amplitude: 0.16, yOffset: 0.15, lineThickness: 0.0028, softnessBase: 0.005, softnessRange: 0.18, amplitudeFalloff: 0.05, bokehExponent: 3.2, col1:'#aaaaaa', col2:'#ffffff', bg1:'#111111', bg2:'#222222' }
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
      const { preset, speed, lineCount, amplitude, yOffset, lineThickness, softnessBase, softnessRange, amplitudeFalloff, bokehExponent, col1, col2, bg1, bg2 } = attributes;
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

      const attrs = Object.assign({ preset: preset || 'calm' },
        speed!=null ? { speed: String(speed) } : {},
        lineCount!=null ? { linecount: String(lineCount) } : {},
        amplitude!=null ? { amplitude: String(amplitude) } : {},
        thickness!=null ? { thickness: String(thickness) } : {},
        softnessBase!=null ? { softnessbase: String(softnessBase) } : {},
        amplitudeFalloff!=null ? { amplitudefalloff: String(amplitudeFalloff) } : {},
        yOffset!=null ? { yoffset: String(yOffset) } : {},
        lineThickness!=null ? { linethickness: String(lineThickness) } : {},
        softnessBase!=null ? { softnessbase: String(softnessBase) } : {},
        softnessRange!=null ? { softnessrange: String(softnessRange) } : {},
        amplitudeFalloff!=null ? { amplitudefalloff: String(amplitudeFalloff) } : {},
        bokehExponent!=null ? { bokehexponent: String(bokehExponent) } : {},
        col1 ? { col1 } : {},
        col2 ? { col2 } : {},
        bg1 ? { bg1 } : {},
        bg2 ? { bg2 } : {},
        bgAngle!=null ? { bgangle: String(bgAngle) } : {},
      );

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
                onChange: (v)=> setAttributes({ preset: v })
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
                min: 0.5, max: 3, step: 0.01
              }),
              wp.element.createElement(RangeControl, {
                label: __('Line Count', 'gs'),
                value: lineCount,
                onChange: (v)=> setAttributes({ lineCount: v }),
                min: 1, max: 32, step: 1
              }),
              wp.element.createElement(TextControl, {
                label: __('Amplitude', 'gs'),
                value: amplitude ?? '',
                onChange: (v)=> setAttributes({ amplitude: v === '' ? undefined : parseFloat(v) })
              }),
              wp.element.createElement(TextControl, {
                label: __('Thickness', 'gs'),
                value: thickness ?? '',
                onChange: (v)=> setAttributes({ thickness: v === '' ? undefined : parseFloat(v) })
              }),
              wp.element.createElement(TextControl, {
                label: __('Softness Base', 'gs'),
                value: softnessBase ?? '',
                onChange: (v)=> setAttributes({ softnessBase: v === '' ? undefined : parseFloat(v) })
              }),
              wp.element.createElement(TextControl, {
                label: __('Amplitude Falloff', 'gs'),
                value: amplitudeFalloff ?? '',
                onChange: (v)=> setAttributes({ amplitudeFalloff: v === '' ? undefined : parseFloat(v) })
              }),
              wp.element.createElement(TextControl, {
                label: __('Y Offset', 'gs'),
                value: yOffset ?? '',
                onChange: (v)=> setAttributes({ yOffset: v === '' ? undefined : parseFloat(v) })
              }),
              wp.element.createElement(RangeControl, {
                label: __('Line Thickness', 'gs'),
                value: lineThickness,
                onChange: (v)=> setAttributes({ lineThickness: v }),
                min: 0.001, max: 0.01, step: 0.0005
              }),
              wp.element.createElement(RangeControl, {
                label: __('Softness Base', 'gs'),
                value: softnessBase,
                onChange: (v)=> setAttributes({ softnessBase: v }),
                min: 0, max: 0.1, step: 0.001
              }),
              wp.element.createElement(RangeControl, {
                label: __('Softness Range', 'gs'),
                value: softnessRange,
                onChange: (v)=> setAttributes({ softnessRange: v }),
                min: 0, max: 0.5, step: 0.005
              }),
              wp.element.createElement(RangeControl, {
                label: __('Amplitude Falloff', 'gs'),
                value: amplitudeFalloff,
                onChange: (v)=> setAttributes({ amplitudeFalloff: v }),
                min: 0, max: 0.2, step: 0.001
              }),
              wp.element.createElement(RangeControl, {
                label: __('Bokeh Exponent', 'gs'),
                value: bokehExponent,
                onChange: (v)=> setAttributes({ bokehExponent: v }),
                min: 1, max: 6, step: 0.1
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
            wp.element.createElement('gradient-shader', Object.assign({ style: 'width:100%;height:100%;display:block' }, attrs))
          )
        )
      );
    },
    save({ attributes }) {
      const { preset, speed, lineCount, amplitude, yOffset, lineThickness, softnessBase, softnessRange, amplitudeFalloff, bokehExponent, col1, col2, bg1, bg2 } = attributes;
      const attrs = Object.assign({ preset: preset || 'calm' },
        speed!=null ? { speed: String(speed) } : {},
        lineCount!=null ? { linecount: String(lineCount) } : {},
        amplitude!=null ? { amplitude: String(amplitude) } : {},
        thickness!=null ? { thickness: String(thickness) } : {},
        softnessBase!=null ? { softnessbase: String(softnessBase) } : {},
        amplitudeFalloff!=null ? { amplitudefalloff: String(amplitudeFalloff) } : {},
        yOffset!=null ? { yoffset: String(yOffset) } : {},
        lineThickness!=null ? { linethickness: String(lineThickness) } : {},
        softnessBase!=null ? { softnessbase: String(softnessBase) } : {},
        softnessRange!=null ? { softnessrange: String(softnessRange) } : {},
        amplitudeFalloff!=null ? { amplitudefalloff: String(amplitudeFalloff) } : {},
        bokehExponent!=null ? { bokehexponent: String(bokehExponent) } : {},
        col1 ? { col1 } : {},
        col2 ? { col2 } : {},
        bg1 ? { bg1 } : {},
        bg2 ? { bg2 } : {},
        bgAngle!=null ? { bgangle: String(bgAngle) } : {},
      );
      return wp.element.createElement('div', { style: { minHeight: '300px' } },
        wp.element.createElement('gradient-shader', Object.assign({ style: 'width:100%;height:100%;display:block' }, attrs))
      );
    }
  });
} )( window.wp.blocks, window.wp.element, window.wp.components, window.wp.blockEditor, window.wp.i18n );
