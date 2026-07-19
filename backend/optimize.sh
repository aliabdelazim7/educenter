#!/bin/bash
echo "⚡ Starting Laravel production cache optimizations..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
echo "✅ Production optimizations completed successfully!"
