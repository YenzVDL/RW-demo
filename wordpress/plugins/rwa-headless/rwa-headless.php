<?php
/**
 * Plugin Name: Rechtswinkel Amsterdam — Headless CMS
 * Description: Vaste inhoudsmodellen, bronimport, redactionele controle en beveiligde previews.
 * Version: 1.0.0
 * Requires PHP: 8.2
 */
defined('ABSPATH') || exit;

function rwa_types() {
    return ['page'=>'Pagina’s','area'=>'Rechtsgebieden','article'=>'Juridische vragen','contact'=>'Centrale contactgegevens','channel'=>'Spreekuren per kanaal','notice'=>'Tijdelijke meldingen','recruitment'=>'Werving','person'=>'Team en bestuur','partner'=>'Partners','document'=>'Documenten','navigation'=>'Navigatie','candidate'=>'Historische kandidaten'];
}
function rwa_post_type($kind) { return 'rwa_' . ($kind === 'recruitment' ? 'recruit' : ($kind === 'navigation' ? 'nav' : $kind)); }
function rwa_fields() {
    return [
      'key'=>['string','Vaste broncode'], 'route'=>['string','URL-pad (bijv. /over-ons)'],
      'language'=>['string','Taal','nl','en'], 'category'=>['string','Rechtsgebied','','huurrecht','arbeidsrecht','consumentenrecht'],
      'essential'=>['boolean','Essentieel voor publicatie'],
      'editorialStatus'=>['string','Redactionele status','source_imported','needs_confirmation','proposed','approved'],
      'sourceUrl'=>['string','Bron-URL'], 'sourceId'=>['integer','Bron-ID'], 'sourceModifiedAt'=>['string','Bron gewijzigd op'],
      'fetchedAt'=>['string','Ophaaldatum'], 'reviewedAt'=>['string','Controledatum'],
      'translationKey'=>['string','Broncode van de vertaling'],
      'phone'=>['string','Telefoonnummer'], 'email'=>['string','E-mailadres'], 'address'=>['string','Locatie / adres'],
      'channel'=>['string','Contactkanaal','','telephone','walkin','appointment'],
      'schedule'=>['string','Tijden en dagen (Europe/Amsterdam)'], 'purpose'=>['string','Doel van het spreekuur'],
      'appointmentRule'=>['string','Afspraakregel'], 'contactKey'=>['string','Broncode centrale contactgegevens'],
      'startsAt'=>['string','Begin: ISO 8601 met jaartal en offset'], 'endsAt'=>['string','Einde: ISO 8601 met jaartal en offset'],
      'deadline'=>['string','Deadline: ISO 8601 met jaartal en offset'], 'appliesTo'=>['string','Contactroute waarop melding van toepassing is'],
      'recruitmentStatus'=>['string','Wervingsstatus','','review','open','closed'],
      'requirements'=>['string','Toelatingseisen'], 'commitment'=>['string','Inzetduur'], 'startMoment'=>['string','Startmoment'],
      'applicationUrl'=>['string','Echte aanmeldroute (mailto of https)'],
      'role'=>['string','Rol / bestuursfunctie'], 'group'=>['string','Groep','','team','board'], 'period'=>['string','Periode'], 'active'=>['boolean','Actief'],
      'image'=>['string','Afbeelding-URL uit mediabibliotheek'], 'imageId'=>['integer','Media-ID afbeelding'],
      'link'=>['string','Partnerwebsite'], 'fileUrl'=>['string','Document-URL'], 'fileId'=>['integer','Media-ID document'],
      'year'=>['integer','Documentjaar'], 'documentType'=>['string','Documenttype'], 'navigationLabel'=>['string','Navigatielabel']
    ];
}
function rwa_editable($allowed,$key,$id) { return current_user_can('edit_post', $id); }
function rwa_sanitize_field($value,$key='') {
    if (is_bool($value) || is_int($value)) return $value;
    return sanitize_text_field($value);
}
add_action('init', function() {
    foreach(rwa_types() as $kind=>$label) {
        $type=rwa_post_type($kind);
        register_post_type($type,[
          'label'=>$label,'public'=>false,'show_ui'=>true,'show_in_rest'=>true,'rest_base'=>$type,
          'supports'=>['title','editor','revisions','custom-fields','page-attributes'],
          'capability_type'=>'post','map_meta_cap'=>true,'menu_icon'=>'dashicons-media-text',
          'template'=>[['core/paragraph']], 'template_lock'=>false,
        ]);
        foreach(rwa_fields() as $key=>$field) {
            $schema=['type'=>$field[0], 'description'=>$field[1], 'context'=>['view','edit']];
            if(count($field)>2) $schema['enum']=array_slice($field,2);
            register_post_meta($type,'rwa_'.$key,[
              'single'=>true,'type'=>$field[0],'show_in_rest'=>['schema'=>$schema],
              'sanitize_callback'=>'rwa_sanitize_field',
              'auth_callback'=>function($allowed,$meta_key,$post_id)use($key){
                return current_user_can('edit_post',$post_id) && ($key!=='editorialStatus'||current_user_can('approve_rwa'));
              }
            ]);
        }
    }
});
function rwa_activate() {
    get_role('administrator')?->add_cap('approve_rwa');
    add_role('rwa_editor','Rechtswinkel redacteur',[
      'read'=>true,'upload_files'=>true,'edit_posts'=>true,'edit_published_posts'=>true,
      'edit_others_posts'=>true,'publish_posts'=>true,'delete_posts'=>true,'delete_published_posts'=>true,
    ]);
    update_option('timezone_string','Europe/Amsterdam');
    update_option('blog_public',0);
}
register_activation_hook(__FILE__,'rwa_activate');
// Structured records need immediately visible fields, without a collapsible block-editor panel.
add_filter('use_block_editor_for_post_type',function($use,$type){
    if(str_starts_with($type,'rwa_')&&!in_array($type,['rwa_page','rwa_article','rwa_candidate'],true))return false;
    return $use;
},10,2);
// The front-end renders a constrained HTML subset, not a pagebuilder.
add_filter('allowed_block_types_all',function($allowed,$ctx){
    if(!empty($ctx->post) && str_starts_with($ctx->post->post_type,'rwa_'))return ['core/paragraph','core/heading','core/list','core/list-item','core/quote','core/table'];
    return $allowed;
},10,2);
add_action('add_meta_boxes',function(){
    foreach(rwa_types() as $kind=>$label) add_meta_box('rwa-details','Inhoud, bron en controle','rwa_meta_box',rwa_post_type($kind),'normal','high');
});
function rwa_meta_box($post) {
    wp_nonce_field('rwa_save','rwa_nonce');
    echo '<p>Bewerk de tekst hierboven. Broncode, oorspronkelijke tekst en importgeschiedenis blijven behouden. Alleen een bevoegde goedkeurder kan inhoud goedkeuren. Tijden worden verwerkt in Europe/Amsterdam.</p>';
    $kinds=['contact'=>['phone','email','address'],'channel'=>['channel','schedule','purpose','appointmentRule','address','contactKey'],'notice'=>['startsAt','endsAt','appliesTo'],'recruit'=>['deadline','recruitmentStatus','requirements','commitment','startMoment','applicationUrl'],'person'=>['role','group','period','active','image','imageId'],'partner'=>['image','imageId','link'],'document'=>['fileUrl','fileId','year','documentType']];
    $kind=substr($post->post_type,4);
    $common=['route','language','category','essential','editorialStatus','reviewedAt','translationKey','navigationLabel','sourceUrl','sourceId','sourceModifiedAt','fetchedAt'];
    $visible=array_merge($common,$kinds[$kind]??[]);
    echo '<table class="form-table"><tbody>';
    foreach(rwa_fields() as $key=>$f) {
        if(!in_array($key,$visible,true))continue;
        $value=get_post_meta($post->ID,'rwa_'.$key,true);
        echo '<tr><th><label for="rwa_'.esc_attr($key).'">'.esc_html($f[1]).'</label></th><td>';
        if($key==='editorialStatus'&&!current_user_can('approve_rwa')) {
            echo '<p>'.esc_html($value?:'source_imported').' — goedkeuring door beheerder</p>';
        } elseif(count($f)>2) {
            echo '<select id="rwa_'.esc_attr($key).'" name="rwa['.esc_attr($key).']">';
            foreach(array_slice($f,2) as $choice)echo '<option value="'.esc_attr($choice).'" '.selected($value,$choice,false).'>'.esc_html($choice?:'—').'</option>';
            echo '</select>';
        } elseif($f[0]==='boolean') echo '<input type="hidden" name="rwa['.esc_attr($key).']" value="0"><input id="rwa_'.esc_attr($key).'" type="checkbox" name="rwa['.esc_attr($key).']" value="1" '.checked((bool)$value,true,false).'>';
        else echo '<input class="large-text" id="rwa_'.esc_attr($key).'" name="rwa['.esc_attr($key).']" type="'.($f[0]==='integer'?'number':'text').'" value="'.esc_attr($value).'">';
        echo '</td></tr>';
    }
    echo '<tr><th><label for="rwa_notes">Interne reviewnotities</label></th><td><textarea class="large-text" id="rwa_notes" name="rwa_notes">'.esc_textarea(get_post_meta($post->ID,'_rwa_notes',true)).'</textarea><p>Deze notities komen niet in de openbare API.</p></td></tr></tbody></table>';
    echo '<details><summary>Oorspronkelijke brontekst en importinformatie</summary><pre style="white-space:pre-wrap;max-height:300px;overflow:auto">'.esc_html(get_post_meta($post->ID,'_rwa_original',true)).'</pre><p>Broncode: '.esc_html(get_post_meta($post->ID,'rwa_key',true)).'</p>';
    if(get_post_meta($post->ID,'_rwa_pending_import',true))echo '<p><strong>Nieuwe bronversie beschikbaar. Lokale wijzigingen behouden; handmatige vergelijking nodig.</strong></p>';
    echo '</details>';
    if(current_user_can('edit_post',$post->ID) && getenv('RWA_PREVIEW_SECRET')) {
        $ts=time();$sig=hash_hmac('sha256',"$ts:{$post->ID}",getenv('RWA_PREVIEW_SECRET'));
        $url=rtrim(getenv('RWA_PUBLIC_FRONTEND_URL')?:getenv('RWA_FRONTEND_URL')?:'http://localhost:3000','/')."/api/preview?id={$post->ID}&ts=$ts&sig=$sig";
        echo '<p><a class="button" target="_blank" rel="noopener" href="'.esc_url($url).'">Beveiligde conceptpreview</a></p>';
    }
}
add_action('save_post',function($id){
    if(!str_starts_with(get_post_type($id)?:'','rwa_') || !isset($_POST['rwa_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['rwa_nonce'])),'rwa_save') || !current_user_can('edit_post',$id) || wp_is_post_revision($id))return;
    foreach(rwa_fields() as $key=>$field) {
        if(!isset($_POST['rwa'][$key])||($key==='editorialStatus'&&!current_user_can('approve_rwa')))continue;
        $value=wp_unslash($_POST['rwa'][$key]);
        if($field[0]==='boolean')$value=(bool)$value;
        elseif($field[0]==='integer')$value=(int)$value;
        else $value=sanitize_text_field($value);
        if(count($field)>2&&!in_array($value,array_slice($field,2),true))continue;
        update_post_meta($id,'rwa_'.$key,$value);
    }
    if(isset($_POST['rwa_notes']))update_post_meta($id,'_rwa_notes',sanitize_textarea_field(wp_unslash($_POST['rwa_notes'])));
    rwa_validate_approval($id);
    rwa_webhook($id);
},30);
function rwa_validate_approval($id) {
    if(get_post_meta($id,'rwa_editorialStatus',true)==='approved') {
        if(current_user_can('approve_rwa')) {
            update_post_meta($id,'_rwa_approved_by',get_current_user_id());
            update_post_meta($id,'_rwa_approved_at',gmdate('c'));
        } else update_post_meta($id,'rwa_editorialStatus','needs_confirmation');
    } else { delete_post_meta($id,'_rwa_approved_by');delete_post_meta($id,'_rwa_approved_at'); }
}
// Any substantive edit invalidates prior approval, including REST/Gutenberg edits.
add_action('post_updated',function($id,$after,$before){
    if(str_starts_with($after->post_type,'rwa_') && ($after->post_title!==$before->post_title||$after->post_content!==$before->post_content)) {
        update_post_meta($id,'rwa_editorialStatus','needs_confirmation');
        delete_post_meta($id,'_rwa_approved_by');delete_post_meta($id,'_rwa_approved_at');
    }
},10,3);
add_action('updated_post_meta',function($mid,$id,$key){
    if(!str_starts_with($key,'rwa_')||in_array($key,['rwa_editorialStatus','rwa_reviewedAt'],true))return;
    if(get_post_meta($id,'rwa_editorialStatus',true)==='approved'){
        update_post_meta($id,'rwa_editorialStatus','needs_confirmation');delete_post_meta($id,'_rwa_approved_by');delete_post_meta($id,'_rwa_approved_at');
    }
},10,3);
foreach(rwa_types() as $kind=>$label) {
    add_action('rest_after_insert_'.rwa_post_type($kind),function($post){rwa_validate_approval($post->ID);rwa_webhook($post->ID);});
}
function rwa_unit($post,$preview=false) {
    $u=['title'=>$post->post_title,'html'=>wp_kses_post($post->post_content),'publicationStatus'=>$post->post_status,'kind'=>str_replace(['rwa_','recruit','nav'],['','recruitment','navigation'],$post->post_type)];
    foreach(rwa_fields() as $key=>$f) {
        $v=get_post_meta($post->ID,'rwa_'.$key,true);
        $u[$key]=$f[0]==='boolean'?(bool)$v:($f[0]==='integer'?(int)$v:$v);
    }
    $u['approvedAt']=get_post_meta($post->ID,'_rwa_approved_at',true);
    $u['approvedBy']=get_post_meta($post->ID,'_rwa_approved_by',true)?'Bevoegde redacteur':'';
    if($u['editorialStatus']==='approved'&&(!$u['approvedAt']||!$u['approvedBy']))$u['editorialStatus']='needs_confirmation';
    foreach(['image'=>'imageId','fileUrl'=>'fileId'] as $url=>$media)if($u[$media])$u[$url]=wp_get_attachment_url($u[$media])?:'';
    if($u['imageId']) {
        $meta=wp_get_attachment_metadata($u['imageId']);$parts=[];$ratio=($meta['width']??1)/max(1,$meta['height']??1);
        foreach(($meta['sizes']??[]) as $name=>$size){
            if(abs($size['width']/max(1,$size['height'])-$ratio)>.02)continue;
            $src=wp_get_attachment_image_src($u['imageId'],$name);
            if($src)$parts[]=$src[0].' '.$src[1].'w';
        }
        if($parts)$u['imageSrcSet']=implode(', ',$parts);
    }
    if($preview)$u['publicationStatus']='publish';
    return $u;
}
function rwa_fingerprint($id) {
    $p=get_post($id);$fields=[];
    $keys=get_post_meta($id,'_rwa_import_fields',true);
    if(!is_array($keys))$keys=array_values(array_diff(array_keys(rwa_fields()),['group']));
    foreach($keys as $k)$fields[$k]=get_post_meta($id,'rwa_'.$k,true);
    return hash('sha256',wp_json_encode([$p->post_title,$p->post_content,$p->post_status,$fields]));
}
add_action('rest_api_init',function(){
    register_rest_route('rwa/v1','/site',['methods'=>'GET','permission_callback'=>'__return_true','callback'=>function(){
      $posts=get_posts(['post_type'=>array_map('rwa_post_type',array_keys(rwa_types())),'posts_per_page'=>-1,'post_status'=>'publish','orderby'=>'menu_order ID','order'=>'ASC']);
      $units=array_map('rwa_unit',$posts);$logo=get_option('rwa_logo_url','/assets/rsz_1rsz_logorwa.png');
      return new WP_REST_Response(['units'=>$units,'logo'=>$logo,'fetchedAt'=>get_option('rwa_imported_at','')],200,['Cache-Control'=>'no-store']);
    }]);
    register_rest_route('rwa/v1','/preview/(?P<id>\d+)',['methods'=>'GET','permission_callback'=>function($r){
      $ts=$r->get_header('x-rwa-timestamp');$sig=$r->get_header('x-rwa-signature');$secret=getenv('RWA_PREVIEW_SECRET');
      return $secret&&strlen($secret)>=32&&ctype_digit((string)$ts)&&abs(time()-(int)$ts)<300&&hash_equals(hash_hmac('sha256',"$ts:{$r['id']}",$secret),(string)$sig);
    },'callback'=>function($r){$p=get_post((int)$r['id']);if(!$p||!str_starts_with($p->post_type,'rwa_'))return new WP_Error('missing','Niet gevonden',['status'=>404]);return new WP_REST_Response(['unit'=>rwa_unit($p,true)],200,['Cache-Control'=>'private, no-store','X-Robots-Tag'=>'noindex']);}]);
    register_rest_route('rwa/v1','/import',['methods'=>'POST','permission_callback'=>fn()=>current_user_can('manage_options'),'callback'=>'rwa_import']);
    register_rest_route('rwa/v1','/asset',['methods'=>'POST','permission_callback'=>fn()=>current_user_can('manage_options'),'callback'=>'rwa_asset']);
});
add_filter('rest_pre_dispatch',function($result,$server,$request){
    if(str_starts_with($request->get_route(),'/wp/v2/users')&&!is_user_logged_in())return new WP_Error('rwa_private_users','Beheergegevens zijn niet openbaar.',['status'=>401]);
    return $result;
},10,3);
function rwa_import($r) {
    $u=$r->get_json_params();
    if(empty($u['key'])||empty($u['kind'])||!isset(rwa_types()[$u['kind']])||empty($u['importHash']))return new WP_Error('invalid','Ongeldige bronimport',['status'=>400]);
    if(($u['editorialStatus']??'')==='approved')return new WP_Error('approval','Import mag niet automatisch worden goedgekeurd',['status'=>400]);
    $existing=get_posts(['post_type'=>rwa_post_type($u['kind']),'post_status'=>'any','meta_key'=>'rwa_key','meta_value'=>sanitize_text_field($u['key']),'posts_per_page'=>1]);
    $id=$existing?$existing[0]->ID:0;
    if($id) {
        if(get_post_meta($id,'_rwa_import_hash',true)===$u['importHash'])return ['action'=>'unchanged','id'=>$id,'key'=>$u['key']];
        if(get_post_meta($id,'_rwa_editor_hash',true)!==rwa_fingerprint($id)){
            update_post_meta($id,'_rwa_pending_import',$u);
            return ['action'=>'conflict_preserved','id'=>$id,'key'=>$u['key']];
        }
    }
    $id=wp_insert_post(['ID'=>$id,'post_type'=>rwa_post_type($u['kind']),'post_status'=>($u['publicationStatus']??'draft')==='publish'?'publish':'draft','post_title'=>sanitize_text_field($u['title']??''),'post_content'=>wp_kses_post($u['html']??'')],true);
    if(is_wp_error($id))return $id;
    foreach(rwa_fields() as $key=>$f)if(array_key_exists($key,$u))update_post_meta($id,'rwa_'.$key,$f[0]==='boolean'?(bool)$u[$key]:($f[0]==='integer'?(int)$u[$key]:sanitize_text_field($u[$key])));
    update_post_meta($id,'_rwa_original',(string)($u['originalText']??''));
    update_post_meta($id,'_rwa_import_hash',sanitize_text_field($u['importHash']));
    update_post_meta($id,'_rwa_import_fields',array_keys(rwa_fields()));
    update_post_meta($id,'_rwa_editor_hash',rwa_fingerprint($id));
    delete_post_meta($id,'_rwa_pending_import');
    update_option('rwa_imported_at',sanitize_text_field($u['fetchedAt']??''));
    rwa_webhook($id);
    return ['action'=>$existing?'updated':'created','id'=>$id,'key'=>$u['key']];
}
function rwa_asset($r) {
    $data=$r->get_json_params();$source=esc_url_raw($data['sourceUrl']??'');
    if(parse_url($source,PHP_URL_HOST)!=='rechtswinkelamsterdam.nl')return new WP_Error('host','Onbekende bronhost',['status'=>400]);
    $found=get_posts(['post_type'=>'attachment','post_status'=>'inherit','meta_key'=>'_rwa_asset_source','meta_value'=>$source,'posts_per_page'=>1]);
    if($found)return ['id'=>$found[0]->ID,'url'=>wp_get_attachment_url($found[0]->ID),'action'=>'unchanged'];
    $bytes=base64_decode($data['data']??'',true);
    if(!$bytes||strlen($bytes)>16000000)return new WP_Error('size','Ongeldig bestand',['status'=>400]);
    $name=sanitize_file_name($data['filename']??'');$ext=strtolower(pathinfo($name,PATHINFO_EXTENSION));
    if(!in_array($ext,['png','jpg','jpeg','webp','avif','pdf'],true))return new WP_Error('type','Onjuist bestandstype',['status'=>400]);
    $upload=wp_upload_bits($name,null,$bytes);
    if($upload['error'])return new WP_Error('upload',$upload['error'],['status'=>500]);
    $check=wp_check_filetype_and_ext($upload['file'],$name);
    if(empty($check['type'])){wp_delete_file($upload['file']);return new WP_Error('mime','Onjuist bestand',['status'=>400]);}
    $id=wp_insert_attachment(['post_mime_type'=>$check['type'],'post_title'=>sanitize_text_field($data['title']??$name),'post_status'=>'inherit'],$upload['file']);
    require_once ABSPATH.'wp-admin/includes/image.php';
    wp_update_attachment_metadata($id,wp_generate_attachment_metadata($id,$upload['file']));
    update_post_meta($id,'_rwa_asset_source',$source);update_post_meta($id,'_wp_attachment_image_alt',sanitize_text_field($data['existingAlt']??''));
    if(str_contains($source,'rsz_1rsz_logorwa'))update_option('rwa_logo_url',wp_get_attachment_url($id));
    return ['id'=>$id,'url'=>wp_get_attachment_url($id),'action'=>'created'];
}
function rwa_webhook($id) {
    $url=getenv('RWA_FRONTEND_URL');$secret=getenv('RWA_REVALIDATE_SECRET');
    if(!$url||!$secret||!str_starts_with(get_post_type($id)?:'','rwa_'))return;
    $body=wp_json_encode(['id'=>(int)$id,'event'=>'content_changed','nonce'=>wp_generate_uuid4()]);$ts=(string)time();
    $response=wp_remote_post(rtrim($url,'/').'/api/revalidate',['timeout'=>3,'headers'=>['Content-Type'=>'application/json','x-rwa-timestamp'=>$ts,'x-rwa-signature'=>hash_hmac('sha256',$ts.'.'.$body,$secret)],'body'=>$body]);
    if(is_wp_error($response)||wp_remote_retrieve_response_code($response)!==200)update_option('rwa_webhook_error','Cachemelding mislukt op '.gmdate('c').'. SSR haalt inhoud zonder cache op.');
    else delete_option('rwa_webhook_error');
}
add_action('transition_post_status',function($new,$old,$post){if($new!==$old)rwa_webhook($post->ID);},10,3);
add_action('before_delete_post','rwa_webhook');
add_action('trashed_post','rwa_webhook');
add_action('admin_notices',function(){if($s=get_option('rwa_webhook_error'))echo '<div class="notice notice-warning"><p>'.esc_html($s).'</p></div>';});
