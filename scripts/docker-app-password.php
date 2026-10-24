<?php
$user=get_user_by('login',getenv('WP_ADMIN_USER'));
$user->add_cap('approve_rwa');
$result=WP_Application_Passwords::create_new_application_password($user->ID,['name'=>'Lokale bronimport']);
if(is_wp_error($result))throw new Exception($result->get_error_message());
// Captured in memory by docker-setup.mjs; never print this helper directly to a terminal.
echo 'RWA_IMPORT_CREDENTIALS:'.wp_json_encode(['user'=>$user->user_login,'userId'=>$user->ID,'password'=>$result[0],'uuid'=>$result[1]['uuid']])."\n";
