<?php
/**
 * Plugin Name: Gradient Shader
 * Description: Motion design WebGL personnalisable (bloc + shortcode) avec préréglages, créateur de presets et aperçu live.
 * Version: 1.4.0
 * Author: You
 */

if (!defined('ABSPATH')) exit;

if (!defined('GS_PRESET_SCHEMA')) {
  define('GS_PRESET_SCHEMA', [
    'speed' => [
      'aliases' => ['speed'],
      'snake' => 'speed',
      'camel' => 'speed',
      'default' => 1.0,
    ],
    'linecount' => [
      'aliases' => ['linecount', 'lineCount'],
      'snake' => 'linecount',
      'camel' => 'lineCount',
      'default' => 10,
    ],
    'amplitude' => [
      'aliases' => ['amplitude'],
      'snake' => 'amplitude',
      'camel' => 'amplitude',
      'default' => 0.15,
    ],
    'thickness' => [
      'aliases' => ['thickness'],
      'snake' => 'thickness',
      'camel' => 'thickness',
      'default' => 0.003,
    ],
    'yoffset' => [
      'aliases' => ['yoffset', 'yOffset'],
      'snake' => 'yoffset',
      'camel' => 'yOffset',
      'default' => 0.15,
    ],
    'linethickness' => [
      'aliases' => ['linethickness', 'lineThickness'],
      'snake' => 'linethickness',
      'camel' => 'lineThickness',
      'default' => 0.003,
    ],
    'softnessbase' => [
      'aliases' => ['softnessbase', 'softnessBase'],
      'snake' => 'softnessbase',
      'camel' => 'softnessBase',
      'default' => 0.0,
    ],
    'softnessrange' => [
      'aliases' => ['softnessrange', 'softnessRange'],
      'snake' => 'softnessrange',
      'camel' => 'softnessRange',
      'default' => 0.2,
    ],
    'amplitudefalloff' => [
      'aliases' => ['amplitudefalloff', 'amplitudeFalloff'],
      'snake' => 'amplitudefalloff',
      'camel' => 'amplitudeFalloff',
      'default' => 0.05,
    ],
    'bokehexponent' => [
      'aliases' => ['bokehexponent', 'bokehExponent'],
      'snake' => 'bokehexponent',
      'camel' => 'bokehExponent',
      'default' => 3.0,
    ],
    'bgangle' => [
      'aliases' => ['bgangle', 'bgAngle'],
      'snake' => 'bgangle',
      'camel' => 'bgAngle',
      'default' => 45,
    ],
    'col1' => [
      'aliases' => ['col1'],
      'snake' => 'col1',
      'camel' => 'col1',
      'default' => '#3a80ff',
    ],
    'col2' => [
      'aliases' => ['col2'],
      'snake' => 'col2',
      'camel' => 'col2',
      'default' => '#ff66e0',
    ],
    'bg1' => [
      'aliases' => ['bg1'],
      'snake' => 'bg1',
      'camel' => 'bg1',
      'default' => '#331600',
    ],
    'bg2' => [
      'aliases' => ['bg2'],
      'snake' => 'bg2',
      'camel' => 'bg2',
      'default' => '#330033',
    ],
  ]);
}

if (!defined('GS_PRESET_LIBRARY')) {
  define('GS_PRESET_LIBRARY', [
    'calm' => [
      'speed' => 1.0,
      'linecount' => 10,
      'amplitude' => 0.15,
      'thickness' => 0.003,
      'yoffset' => 0.15,
      'linethickness' => 0.003,
      'softnessbase' => 0.0,
      'softnessrange' => 0.2,
      'amplitudefalloff' => 0.05,
      'bokehexponent' => 3.0,
      'bgangle' => 45,
      'col1' => '#3a80ff',
      'col2' => '#ff66e0',
      'bg1' => '#331600',
      'bg2' => '#330033',
    ],
    'vibrant' => [
      'speed' => 1.6,
      'linecount' => 14,
      'amplitude' => 0.22,
      'thickness' => 0.003,
      'yoffset' => 0.12,
      'linethickness' => 0.003,
      'softnessbase' => 0.02,
      'softnessrange' => 0.25,
      'amplitudefalloff' => 0.045,
      'bokehexponent' => 2.6,
      'bgangle' => 45,
      'col1' => '#00ffc2',
      'col2' => '#ff006e',
      'bg1' => '#001219',
      'bg2' => '#3a0ca3',
    ],
    'nocturne' => [
      'speed' => 0.9,
      'linecount' => 12,
      'amplitude' => 0.18,
      'thickness' => 0.0025,
      'yoffset' => 0.20,
      'linethickness' => 0.0025,
      'softnessbase' => 0.01,
      'softnessrange' => 0.22,
      'amplitudefalloff' => 0.04,
      'bokehexponent' => 3.5,
      'bgangle' => 45,
      'col1' => '#4cc9f0',
      'col2' => '#4361ee',
      'bg1' => '#0b132b',
      'bg2' => '#1c2541',
    ],
    'sunrise' => [
      'speed' => 1.2,
      'linecount' => 11,
      'amplitude' => 0.20,
      'thickness' => 0.0032,
      'yoffset' => 0.10,
      'linethickness' => 0.0032,
      'softnessbase' => 0.015,
      'softnessrange' => 0.23,
      'amplitudefalloff' => 0.05,
      'bokehexponent' => 2.8,
      'bgangle' => 45,
      'col1' => '#ff9e00',
      'col2' => '#ff4d6d',
      'bg1' => '#250902',
      'bg2' => '#3b0d11',
    ],
    'mono' => [
      'speed' => 1.0,
      'linecount' => 9,
      'amplitude' => 0.16,
      'thickness' => 0.0028,
      'yoffset' => 0.15,
      'linethickness' => 0.0028,
      'softnessbase' => 0.005,
      'softnessrange' => 0.18,
      'amplitudefalloff' => 0.05,
      'bokehexponent' => 3.2,
      'bgangle' => 45,
      'col1' => '#aaaaaa',
      'col2' => '#ffffff',
      'bg1' => '#111111',
      'bg2' => '#222222',
    ],
  ]);
}

function gs_prepare_preset($data, $format = 'snake', $withDefaults = true) {
  $schema = GS_PRESET_SCHEMA;
  $result = [];

  foreach ($schema as $field => $info) {
    $value = $withDefaults ? ($info['default'] ?? null) : null;

    if (isset($data[$field])) {
      $value = $data[$field];
    } else {
      foreach ($info['aliases'] as $alias) {
        if (isset($data[$alias])) {
          $value = $data[$alias];
          break;
        }
      }
    }

    if ($value === null) {
      continue;
    }

    $targetKey = $info[$format] ?? $info['snake'];
    $result[$targetKey] = $value;
  }

  return $result;
}

function gs_get_preset_defaults($format = 'snake') {
  return gs_prepare_preset([], $format, true);
}

function gs_format_preset_collection($collection, $format = 'snake') {
  $formatted = [];
  foreach ($collection as $name => $preset) {
    if (!is_array($preset)) {
      continue;
    }
    $formatted[$name] = gs_prepare_preset($preset, $format, true);
  }
  return $formatted;
}

function gs_get_user_presets($format = 'snake') {
  $presets = get_option('gs_presets', []);
  if (!is_array($presets)) $presets = [];
  return gs_format_preset_collection($presets, $format);
}

function gs_set_user_presets($presets) {
  update_option('gs_presets', $presets);
}

function gs_get_default_preset() {
  $def = get_option('gs_default_preset', 'calm');
  if (!$def) $def = 'calm';
  return $def;
}

function gs_get_builtin_presets($format = 'snake') {
  return gs_format_preset_collection(GS_PRESET_LIBRARY, $format);
}

function gs_default_fallback_message() {
  return __('Interactive gradient disabled: WebGL unavailable.', 'gradient-shader');
}

function gs_get_fallback_text() {
  $text = get_option('gs_fallback_text');

  if (!is_string($text) || trim($text) === '') {
    $text = gs_default_fallback_message();
  }

  return apply_filters('gs_fallback_text', $text);
}

function gs_sanitize_css_dimension($value, $default = '300px') {
  $value = is_string($value) ? trim($value) : '';

  if ($value === '') {
    return $default;
  }

  if (preg_match('/^\d+(?:\.\d+)?$/', $value)) {
    return $value . 'px';
  }

  if (preg_match('/^calc\(.+\)$/i', $value)) {
    return $value;
  }

  if (preg_match('/^\d+(?:\.\d+)?(px|em|rem|vh|vw|%)$/i', $value)) {
    return $value;
  }

  return $default;
}

function gs_get_config_payload() {
  return [
    'default' => gs_get_default_preset(),
    'userPresets' => gs_get_user_presets(),
    'builtinPresets' => gs_get_builtin_presets(),
    'fallbackText' => gs_get_fallback_text(),
    'defaults' => gs_get_preset_defaults(),
    'camel' => [
      'userPresets' => gs_get_user_presets('camel'),
      'builtinPresets' => gs_get_builtin_presets('camel'),
      'defaults' => gs_get_preset_defaults('camel'),
    ],
  ];
}

function gs_add_presets_inline_script($handle) {
  static $processed = [];

  if (isset($processed[$handle])) {
    return;
  }

  if (!wp_script_is($handle, 'registered') && !wp_script_is($handle, 'enqueued')) {
    return;
  }

  $config = gs_get_config_payload();
  $script = '(function(root){'
    . 'var data=' . wp_json_encode($config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . ';'
    . 'if(!data||typeof data!=="object"){return;}'
    . 'var presets=data.builtinPresets||{};'
    . 'var camel=data.camel||{};'
    . 'var defaultsSnake=data.defaults||{};'
    . 'var defaultsCamel=camel.defaults||{};'
    . 'var existingConfig=(root.GS_CONFIG&&typeof root.GS_CONFIG==="object")?root.GS_CONFIG:{};'
    . 'root.GS_CONFIG=Object.assign({},existingConfig,data);'
    . 'var existingPresets=(root.GS_PRESETS&&typeof root.GS_PRESETS==="object")?root.GS_PRESETS:{};'
    . 'root.GS_PRESETS=Object.assign({},existingPresets,presets);'
    . 'if(!root.GS_PRESETS.custom){root.GS_PRESETS.custom={};}'
    . 'root.GS_getPresetDefaults=function(format){return format==="camel"?Object.assign({},defaultsCamel):Object.assign({},defaultsSnake);};'
    . '})(typeof window!=="undefined"?window:(typeof globalThis!=="undefined"?globalThis:this));';

  wp_add_inline_script($handle, $script, 'before');
  $processed[$handle] = true;
}

function gs_localize_fallback($handle) {
  if (!wp_script_is($handle, 'registered') && !wp_script_is($handle, 'enqueued')) {
    return;
  }

  $data = [
    'text' => gs_get_fallback_text(),
  ];

  $script = 'window.GS_FALLBACK = ' . wp_json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . ';';
  wp_add_inline_script($handle, $script, 'before');
}

function gs_collect_shader_attributes($input) {
  $map = [
    'preset' => 'preset',
    'speed' => 'speed',
    'linecount' => 'linecount',
    'lineCount' => 'linecount',
    'amplitude' => 'amplitude',
    'thickness' => 'thickness',
    'yoffset' => 'yoffset',
    'yOffset' => 'yoffset',
    'linethickness' => 'linethickness',
    'lineThickness' => 'linethickness',
    'softnessbase' => 'softnessbase',
    'softnessBase' => 'softnessbase',
    'softnessrange' => 'softnessrange',
    'softnessRange' => 'softnessrange',
    'amplitudefalloff' => 'amplitudefalloff',
    'amplitudeFalloff' => 'amplitudefalloff',
    'bokehexponent' => 'bokehexponent',
    'bokehExponent' => 'bokehexponent',
    'bgangle' => 'bgangle',
    'bgAngle' => 'bgangle',
    'col1' => 'col1',
    'col2' => 'col2',
    'bg1' => 'bg1',
    'bg2' => 'bg2',
    'fallback-text' => 'fallback-text',
    'fallbackText' => 'fallback-text',
    'fallback_text' => 'fallback-text',
    'minheight' => 'min-height',
    'minHeight' => 'min-height',
    'min_height' => 'min-height',
  ];

  $attrs = [];

  foreach ($map as $source => $target) {
    if (!array_key_exists($source, $input)) continue;
    $value = $input[$source];
    if ($value === '' || $value === null) continue;

    switch ($target) {
      case 'preset':
        $attrs['preset'] = sanitize_title($value);
        break;
      case 'linecount':
        $attrs['linecount'] = max(1, intval($value));
        break;
      case 'col1':
      case 'col2':
      case 'bg1':
      case 'bg2':
        $color = sanitize_hex_color($value);
        if ($color) {
          $attrs[$target] = $color;
        }
        break;
      case 'fallback-text':
        $attrs['fallback-text'] = sanitize_text_field($value);
        break;
      case 'min-height':
        $attrs['min-height'] = gs_sanitize_css_dimension($value);
        break;
      default:
        if (is_numeric($value)) {
          $attrs[$target] = (string) (floatval($value));
        } else {
          $attrs[$target] = sanitize_text_field($value);
        }
        break;
    }
  }

  if (!isset($attrs['preset']) || $attrs['preset'] === '') {
    $attrs['preset'] = sanitize_title(gs_get_default_preset());
  }

  if (!isset($attrs['fallback-text']) || $attrs['fallback-text'] === '') {
    $attrs['fallback-text'] = gs_default_fallback_message();
  }

  return $attrs;
}

function gs_resolve_fallback_config($attrs) {
  $presetName = strtolower($attrs['preset'] ?? gs_get_default_preset());
  $builtin = gs_get_builtin_presets();
  $user = gs_get_user_presets();

  $base = $builtin['calm'];

  if (isset($builtin[$presetName])) {
    $base = array_merge($base, $builtin[$presetName]);
  }

  if (isset($user[$presetName]) && is_array($user[$presetName])) {
    $base = array_merge($base, $user[$presetName]);
  }

  $config = [
    'linecount' => max(1, intval($base['linecount'] ?? 10)),
    'col1' => sanitize_hex_color($base['col1'] ?? '#3a80ff') ?: '#3a80ff',
    'col2' => sanitize_hex_color($base['col2'] ?? '#ff66e0') ?: '#ff66e0',
    'bg1' => sanitize_hex_color($base['bg1'] ?? '#331600') ?: '#331600',
    'bg2' => sanitize_hex_color($base['bg2'] ?? '#330033') ?: '#330033',
  ];

  if (isset($attrs['linecount'])) {
    $config['linecount'] = max(1, intval($attrs['linecount']));
  }

  foreach (['col1', 'col2', 'bg1', 'bg2'] as $key) {
    if (!empty($attrs[$key])) {
      $color = sanitize_hex_color($attrs[$key]);
      if ($color) {
        $config[$key] = $color;
      }
    }
  }

  return $config;
}

function gs_percent_value($value) {
  $formatted = number_format((float) $value, 3, '.', '');
  $formatted = rtrim(rtrim($formatted, '0'), '.');
  if ($formatted === '') {
    $formatted = '0';
  }
  return $formatted . '%';
}

function gs_build_fallback_representation($attrs) {
  $config = gs_resolve_fallback_config($attrs);
  $minHeight = gs_sanitize_css_dimension($attrs['min-height'] ?? '300px');

  $baseGradient = sprintf('linear-gradient(135deg, %s, %s)', $config['bg1'], $config['bg2']);
  $accentStep = max(1, 100 / max(1, $config['linecount']));
  $accentHalf = $accentStep / 2;
  $accentGradient = sprintf(
    'repeating-linear-gradient(90deg, %1$s 0%%, %1$s %2$s, %3$s %2$s, %3$s %4$s)',
    $config['col1'],
    gs_percent_value($accentHalf),
    $config['col2'],
    gs_percent_value($accentStep)
  );

  $containerStyleParts = [
    'position:relative',
    'display:block',
    'width:100%',
    'height:100%',
    'min-height:' . $minHeight,
    'background:' . $config['bg1'],
    'background-image:' . $accentGradient . ', ' . $baseGradient,
    'background-blend-mode:screen',
    'border-radius:inherit',
    'overflow:hidden',
  ];

  $layerStyle = 'position:absolute;inset:0;width:100%;height:100%;display:block;border-radius:inherit;mix-blend-mode:screen;opacity:0.6;pointer-events:none;background-repeat:no-repeat;background-size:cover;background-image:' . $accentGradient . ', ' . $baseGradient;
  $messageStyle = 'position:absolute;left:0.75rem;bottom:0.75rem;padding:0.25rem 0.5rem;font-size:0.75rem;color:#fff;background:rgba(0,0,0,0.35);border-radius:999px;pointer-events:none;letter-spacing:0.02em;';

  return [
    'attributes' => $attrs,
    'container_style' => implode(';', $containerStyleParts) . ';',
    'layer_style' => $layerStyle . ';',
    'message_style' => $messageStyle,
    'message' => $attrs['fallback-text'] ?? gs_get_fallback_text(),
  ];
}

function gs_render_gradient_shader_markup($input, $wrapperAttributes = null) {
  $attrs = gs_collect_shader_attributes($input);
  $fallback = gs_build_fallback_representation($attrs);

  $attr_str = '';
  foreach ($fallback['attributes'] as $k => $v) {
    $attr_str .= ' ' . $k . '="' . esc_attr($v) . '"';
  }

  $containerAttrs = [
    'data-gs-fallback-container' => 'true',
    'data-gs-fallback-active' => 'true',
    'style' => $fallback['container_style'],
  ];

  if ($wrapperAttributes !== null) {
    $containerOpen = '<div ' . $wrapperAttributes;
    if (strpos($wrapperAttributes, 'style=') === false) {
      $containerOpen .= ' style="' . esc_attr($fallback['container_style']) . '"';
    }
    if (strpos($wrapperAttributes, 'data-gs-fallback-container') === false) {
      $containerOpen .= ' data-gs-fallback-container="true"';
    }
    if (strpos($wrapperAttributes, 'data-gs-fallback-active') === false) {
      $containerOpen .= ' data-gs-fallback-active="true"';
    }
  } else {
    $attrParts = [];
    foreach ($containerAttrs as $key => $value) {
      $attrParts[] = $key . '="' . esc_attr($value) . '"';
    }
    $containerOpen = '<div class="gs-gradient-shader-fallback" ' . implode(' ', $attrParts);
  }

  $containerOpen .= '>';

  $html = $containerOpen;
  $html .= '<gradient-shader data-has-fallback="true"' . $attr_str . '></gradient-shader>';
  $html .= '<div aria-hidden="true" data-gs-fallback-layer="true" style="' . esc_attr($fallback['layer_style']) . '"></div>';
  $html .= '<span role="status" aria-live="polite" data-gs-fallback-message="true" style="' . esc_attr($fallback['message_style']) . '">' . esc_html($fallback['message']) . '</span>';
  $html .= '</div>';

  return $html;
}

function gs_render_block_gradient_shader($attributes, $content = '', $block = null) {
  $attrs = gs_collect_shader_attributes($attributes);
  $fallback = gs_build_fallback_representation($attrs);

  if (function_exists('get_block_wrapper_attributes')) {
    $wrapper = get_block_wrapper_attributes([
      'class' => 'gs-gradient-shader-fallback',
      'data-gs-fallback-container' => 'true',
      'data-gs-fallback-active' => 'true',
      'style' => $fallback['container_style'],
    ]);
  } else {
    $wrapper = 'class="wp-block-gs-gradient-shader gs-gradient-shader-fallback" style="' . esc_attr($fallback['container_style']) . '" data-gs-fallback-container="true" data-gs-fallback-active="true"';
  }

  return gs_render_gradient_shader_markup($attrs, $wrapper);
}

add_action('init', function () {
  register_block_type(__DIR__ . '/block', [
    'render_callback' => 'gs_render_block_gradient_shader',
  ]); // uses block.json "file:" to enqueue assets

  // Shortcode
  add_shortcode('gradient_shader', function ($atts) {
    $a = shortcode_atts([
      'preset' => '',
      'speed' => '',
      'linecount' => '',
      'amplitude' => '',
      'thickness' => '',
      'yoffset' => '',
      'linethickness' => '',
      'softnessbase' => '',
      'softnessrange' => '',
      'amplitudefalloff' => '',
      'bokehexponent' => '',
      'bgangle' => '',
      'col1' => '',
      'col2' => '',
      'bg1' => '',
      'bg2' => '',
      'fallback-text' => '',
      'fallback_text' => '',
      'fallbackText' => '',
    ], $atts, 'gradient_shader');

    return gs_render_gradient_shader_markup($a);
  });
});

// Admin menu and page
add_action('admin_menu', function() {
  add_menu_page('Gradient Shader','Gradient Shader','edit_pages','gs-presets','gs_render_admin_page','data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAyMCI+CiAgPGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CiAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjM2E4MGZmIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZmY2NmUwIi8+CiAgPC9saW5lYXJHcmFkaWVudD48L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iMyIgZmlsbD0iIzExMSIvPgogIDxwYXRoIGQ9Ik0wIDEyIEMzIDYsIDcgMTQsIDEwIDEwIFMxNyAxMiwgMjAgOCIgc3Ryb2tlPSJ1cmwoI2cpIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KPC9zdmc+',59);
});

function gs_render_admin_page() {
  echo '<div class="wrap"><h1>Gradient Shader — Créateur de presets</h1><div id="gs-admin-app"></div></div>';
}

add_action('admin_enqueue_scripts', function($hook) {
  if ($hook !== 'toplevel_page_gs-presets') return;
  // enqueue block view script for live preview
  wp_enqueue_script('gs-frontend', plugins_url('assets/frontend.js', __FILE__), ['wp-i18n'], filemtime(__DIR__.'/assets/frontend.js'), true);
  gs_add_presets_inline_script('gs-frontend');
  wp_enqueue_script('gs-admin', plugins_url('assets/admin.js', __FILE__), ['wp-element','wp-components','wp-api-fetch','wp-i18n'], filemtime(__DIR__.'/assets/admin.js'), true);
  gs_add_presets_inline_script('gs-admin');
  wp_enqueue_style('gs-admin-css', plugins_url('assets/admin.css', __FILE__), [], filemtime(__DIR__.'/assets/admin.css'));
  wp_localize_script('gs-admin', 'GS_ADMIN', [
    'nonce' => wp_create_nonce('wp_rest'),
    'rest'  => esc_url_raw( rest_url('gs/v1/') ),
    'config'=> gs_get_config_payload()
  ]);
});

// REST API
add_action('rest_api_init', function () {
  register_rest_route('gs/v1', '/presets', [
    'methods' => 'GET',
    'permission_callback' => function() { return current_user_can('edit_pages'); },
    'callback' => function() { return new WP_REST_Response(['default'=>gs_get_default_preset(),'userPresets'=>gs_get_user_presets()],200); }
  ]);
  register_rest_route('gs/v1', '/presets', [
    'methods' => 'POST',
    'permission_callback' => function() { return current_user_can('edit_pages'); },
    'callback' => function(WP_REST_Request $req) {
      $name = sanitize_text_field($req->get_param('name'));
      $data = $req->get_param('data');
      if (!$name || !is_array($data)) return new WP_Error('gs_invalid','Nom ou données invalides',['status'=>400]);
      $presets = gs_get_user_presets();
      $presets[$name] = [
        'speed' => floatval($data['speed'] ?? 1.0),
        'linecount' => max(1, intval($data['linecount'] ?? 10)),
        'amplitude' => floatval($data['amplitude'] ?? 0.15),
        'thickness' => max(0.0001, floatval($data['thickness'] ?? 0.003)),
        'yoffset' => floatval($data['yoffset'] ?? 0.15),
        'linethickness' => max(0.0001, floatval($data['linethickness'] ?? 0.003)),
        'softnessbase' => max(0.0, floatval($data['softnessbase'] ?? 0.0)),
        'softnessrange' => max(0.0, floatval($data['softnessrange'] ?? 0.2)),
        'amplitudefalloff' => max(0.0, floatval($data['amplitudefalloff'] ?? 0.05)),
        'bokehexponent' => max(0.1, floatval($data['bokehexponent'] ?? 3.0)),
        'bgangle' => max(0.0, min(360.0, floatval($data['bgangle'] ?? 45))),
        'col1' => sanitize_hex_color($data['col1'] ?? '#3a80ff'),
        'col2' => sanitize_hex_color($data['col2'] ?? '#ff66e0'),
        'bg1' => sanitize_hex_color($data['bg1'] ?? '#331600'),
        'bg2' => sanitize_hex_color($data['bg2'] ?? '#330033'),
      ];
      gs_set_user_presets($presets);
      return new WP_REST_Response(['ok'=>true,'presets'=>gs_get_user_presets()],200);
    }
  ]);
  register_rest_route('gs/v1', '/presets/(?P<name>[\w\- ]+)', [
    'methods' => 'DELETE',
    'permission_callback' => function() { return current_user_can('edit_pages'); },
    'callback' => function(WP_REST_Request $req) {
      $name = sanitize_text_field($req['name']);
      $presets = gs_get_user_presets();
      if (isset($presets[$name])) { unset($presets[$name]); gs_set_user_presets($presets); }
      return new WP_REST_Response(['ok'=>true,'presets'=>gs_get_user_presets()],200);
    }
  ]);
  register_rest_route('gs/v1', '/default', [
    'methods' => 'POST',
    'permission_callback' => function() { return current_user_can('edit_pages'); },
    'callback' => function(WP_REST_Request $req) {
      $name = sanitize_text_field($req->get_param('name'));
      if (!$name) return new WP_Error('gs_invalid','Nom de preset requis',['status'=>400]);
      update_option('gs_default_preset', $name);
      return new WP_REST_Response(['ok'=>true,'default'=>$name],200);
    }
  ]);
});

add_action('enqueue_block_editor_assets', function(){
  // handle name generated by block.json: script handle is 'gs-gradient-shader-editor-script'
  $handle = 'gs-gradient-shader-editor-script';
  wp_register_script($handle, plugins_url('assets/editor.js', __FILE__), ['wp-blocks','wp-element','wp-components','wp-block-editor','wp-i18n'], filemtime(__DIR__.'/assets/editor.js'), true);
  gs_add_presets_inline_script($handle);
  wp_enqueue_script($handle);

  // ensure the <gradient-shader> custom element is available in the block editor preview
  $view_handle = 'gs-gradient-shader-view-script';
  if (!wp_script_is($view_handle, 'registered')) {
    wp_register_script($view_handle, plugins_url('assets/frontend.js', __FILE__), ['wp-i18n'], filemtime(__DIR__.'/assets/frontend.js'), true);
  }
  gs_add_presets_inline_script($view_handle);
  gs_localize_fallback($view_handle);
  wp_enqueue_script($view_handle);
});

add_action('enqueue_block_assets', function(){
  $handle = 'gs-gradient-shader-view-script';
  if (wp_script_is($handle, 'registered') || wp_script_is($handle, 'enqueued')) {
    gs_add_presets_inline_script($handle);
    gs_localize_fallback($handle);
  }
});

add_filter('block_editor_iframe_sandbox_attributes', function ($attributes) {
  $tokens = preg_split('/\s+/', trim((string) $attributes));
  $tokens = array_filter($tokens);

  $required = [
    'allow-scripts',
    'allow-same-origin',
    'allow-pointer-lock',
  ];

  foreach ($required as $token) {
    if (!in_array($token, $tokens, true)) {
      $tokens[] = $token;
    }
  }

  return implode(' ', $tokens);
});
