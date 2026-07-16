# composer.lock pins Symfony 8.1, which requires PHP >= 8.4.1
FROM php:8.4-fpm-alpine

# nginx + supervisor + envsubst
RUN apk add --no-cache nginx supervisor gettext

# PHP extensions (handles build deps automatically)
ADD --chmod=0755 https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN install-php-extensions pdo_pgsql pdo_mysql bcmath intl zip opcache pcntl

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install PHP deps first for better layer caching
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY . .
RUN composer dump-autoload --optimize --no-dev --no-interaction

COPY docker/nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

RUN mkdir -p storage/framework/sessions storage/framework/views \
      storage/framework/cache/data storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

ENV PORT=10000
EXPOSE 10000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
