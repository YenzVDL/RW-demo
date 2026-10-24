<?php
define('WP_INSTALLING',true);
$root=dirname(__DIR__).'/.runtime/wp/wordpress/';
require $root.'wp-load.php';
require_once ABSPATH.'wp-admin/includes/upgrade.php';
require_once ABSPATH.'wp-admin/includes/plugin.php';
if(!is_blog_installed()) {
  wp_install('Stichting Rechtswinkel Amsterdam',getenv('WP_ADMIN_USER'),getenv('WP_ADMIN_EMAIL'),false,'',getenv('WP_ADMIN_PASSWORD'));
}
$error=activate_plugin('rwa-headless/rwa-headless.php');
if(is_wp_error($error)){fwrite(STDERR,$error->get_error_message());exit(1);}
update_option('timezone_string','Europe/Amsterdam');update_option('blog_public',0);
if(get_option('WPLANG')!=='nl_NL') {
  require_once ABSPATH.'wp-admin/includes/translation-install.php';
  $language=wp_download_language_pack('nl_NL');
  if($language)update_option('WPLANG','nl_NL');
}
$user=get_user_by('login',getenv('WP_ADMIN_USER'));
$user->add_cap('approve_rwa');
wp_set_current_user($user->ID);
if(!file_exists(dirname(__DIR__).'/.env.local')){
  $result=WP_Application_Passwords::create_new_application_password($user->ID,['name'=>'Lokale bronimport']);
  if(is_wp_error($result)){fwrite(STDERR,$result->get_error_message());exit(1);}
  echo wp_json_encode(['password'=>$result[0]]);
}else echo wp_json_encode(['ready'=>true]);
