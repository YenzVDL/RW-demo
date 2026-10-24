<?php
$root=dirname(__DIR__).'/.runtime/wp/wordpress';
$uri=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
if(str_starts_with($uri,'/wp-json/')){
  $_GET['rest_route']=substr($uri,8);require $root.'/index.php';return true;
}
if($uri!=='/' && is_file($root.$uri)) return false;
if(str_starts_with($uri,'/wp-admin') && is_dir($root.$uri)){
  if(!str_ends_with($uri,'/')){header('Location: '.$uri.'/');return true;}
  require $root.$uri.'index.php';return true;
}
require $root.'/index.php';
