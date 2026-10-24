#!/bin/sh
set -eu
if ! wp core is-installed; then
  wp core install --url=http://localhost:8080 --title='Stichting Rechtswinkel Amsterdam' --admin_user="$WP_ADMIN_USER" --admin_password="$WP_ADMIN_PASSWORD" --admin_email="$WP_ADMIN_EMAIL" --skip-email
fi
wp plugin activate rwa-headless
wp language core install nl_NL --activate
wp option update timezone_string Europe/Amsterdam
wp option update blog_public 0
wp eval-file /bootstrap/docker-app-password.php
