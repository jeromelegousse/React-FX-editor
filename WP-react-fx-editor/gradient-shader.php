<?php
/**
 * Plugin Name: Gradient Shader
 * Description: Motion design WebGL personnalisable (bloc + shortcode) avec préréglages, créateur de presets et aperçu live.
 * Version: 1.4.0
 * Author: You
 */

if (!defined('ABSPATH')) exit;

function gs_get_user_presets() {
  $presets = get_option('gs_presets', []);
  if (!is_array($presets)) $presets = [];
  return $presets;
}

function gs_set_user_presets($presets) {
  update_option('gs_presets', $presets);
}

function gs_get_default_preset() {
  $def = get_option('gs_default_preset', 'calm');
  if (!$def) $def = 'calm';
  return $def;
}

function gs_get_fallback_text() {
  return __('Interactive gradient disabled: WebGL unavailable.', 'gs');
}

function gs_localize_fallback($handle) {
  static $localized = [];
  if (!$handle || isset($localized[$handle])) {
    return;
  }
  wp_localize_script($handle, 'GS_FALLBACK', [
    'text' => gs_get_fallback_text(),
  ]);
  $localized[$handle] = true;
}

add_action('init', function () {
  register_block_type(__DIR__ . '/block'); // uses block.json "file:" to enqueue assets

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
      'fallback_text' => '',
      'fallback-text' => '',
    ], $atts, 'gradient_shader');

    if ($a['preset'] === '') { $a['preset'] = gs_get_default_preset(); }

    $attrs = ['preset' => esc_attr($a['preset'])];
    foreach (['speed','linecount','amplitude','thickness','yoffset','linethickness','softnessbase','softnessrange','amplitudefalloff','bokehexponent','bgangle','col1','col2','bg1','bg2'] as $k) {
      if ($a[$k] !== '') $attrs[$k] = esc_attr($a[$k]);
    }
    $fallback = $atts['fallback-text'] ?? $a['fallback-text'] ?? $a['fallback_text'];
    if (!is_string($fallback)) $fallback = '';
    $fallback = trim($fallback);
    if ($fallback !== '') {
      $attrs['fallback-text'] = esc_attr($fallback);
    }
    $attr_str = '';
    foreach ($attrs as $k => $v) { $attr_str .= ' ' . $k . '="' . $v . '"'; }
    return '<div style="width:100%;min-height:300px;height:100%"><gradient-shader' . $attr_str . '></gradient-shader></div>';
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
  $handle = 'gs-frontend';
  wp_enqueue_script($handle, plugins_url('assets/frontend.js', __FILE__), [], filemtime(__DIR__.'/assets/frontend.js'), true);
  gs_localize_fallback($handle);
  wp_enqueue_script('gs-admin', plugins_url('assets/admin.js', __FILE__), ['wp-element','wp-components','wp-api-fetch','wp-i18n'], filemtime(__DIR__.'/assets/admin.js'), true);
  wp_enqueue_style('gs-admin-css', plugins_url('assets/admin.css', __FILE__), [], filemtime(__DIR__.'/assets/admin.css'));
  wp_localize_script('gs-admin', 'GS_ADMIN', [
    'nonce' => wp_create_nonce('wp_rest'),
    'rest'  => esc_url_raw( rest_url('gs/v1/') ),
    'config'=> [ 'default' => gs_get_default_preset(), 'userPresets' => gs_get_user_presets() ]
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
      return new WP_REST_Response(['ok'=>true,'presets'=>$presets],200);
    }
  ]);
  register_rest_route('gs/v1', '/presets/(?P<name>[\w\- ]+)', [
    'methods' => 'DELETE',
    'permission_callback' => function() { return current_user_can('edit_pages'); },
    'callback' => function(WP_REST_Request $req) {
      $name = sanitize_text_field($req['name']);
      $presets = gs_get_user_presets();
      if (isset($presets[$name])) { unset($presets[$name]); gs_set_user_presets($presets); }
      return new WP_REST_Response(['ok'=>true,'presets'=>$presets],200);
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
  $cfg = [
    'default' => gs_get_default_preset(),
    'userPresets' => gs_get_user_presets(),
    'fallbackText' => gs_get_fallback_text(),
  ];
  // handle name generated by block.json: script handle is 'gs-gradient-shader-editor-script'
  $handle = 'gs-gradient-shader-editor-script';
  wp_register_script($handle, plugins_url('assets/editor.js', __FILE__), ['wp-blocks','wp-element','wp-components','wp-block-editor','wp-i18n'], filemtime(__DIR__.'/assets/editor.js'), true);
  wp_add_inline_script($handle, 'window.GS_CONFIG = ' . json_encode($cfg, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE) . ';', 'before');
  wp_enqueue_script($handle);

  // ensure the <gradient-shader> custom element is available in the block editor preview
  $view_handle = 'gs-gradient-shader-view-script';
  if (!wp_script_is($view_handle, 'registered')) {
    wp_register_script($view_handle, plugins_url('assets/frontend.js', __FILE__), [], filemtime(__DIR__.'/assets/frontend.js'), true);
  }
  gs_localize_fallback($view_handle);
  wp_enqueue_script($view_handle);
});

add_action('enqueue_block_assets', function(){
  $handle = 'gs-gradient-shader-view-script';
  if (wp_script_is($handle, 'registered') || wp_script_is($handle, 'enqueued')) {
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
