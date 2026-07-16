#!/bin/sh
set -e

: "${PORT:=10000}"

# Render injects $PORT at runtime; only substitute PORT so nginx vars ($uri etc) survive
export PORT
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Storage symlink (ignore if it already exists)
php artisan storage:link 2>/dev/null || true

# Cache config/routes/views with the runtime env in place
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Apply schema changes
php artisan migrate --force

# Optional demo data. The free Render plan has no shell, so this is the only way
# to seed. The seeder is idempotent, so leaving the flag on is harmless.
if [ "${SEED_DEMO}" = "true" ]; then
    echo "SEED_DEMO=true — running database seeders"
    php artisan db:seed --force
fi

exec supervisord -c /etc/supervisord.conf
