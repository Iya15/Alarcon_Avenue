# Alarcon Avenue

Production-grade multi-category e-commerce platform built with Laravel 12 + Inertia.js + React.

![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.2+-777BB4?logo=php&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Inertia.js](https://img.shields.io/badge/Inertia.js-2-9553E9?logo=inertia&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-0055FF?logo=framer&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-443E38?logo=react&logoColor=white)
![Meilisearch](https://img.shields.io/badge/Meilisearch-1.16-FF5CAA?logo=meilisearch&logoColor=white)
![Reverb](https://img.shields.io/badge/Laravel_Reverb-1.10-FF2D20?logo=laravel&logoColor=white)
![Sanctum](https://img.shields.io/badge/Laravel_Sanctum-4.3-FF2D20?logo=laravel&logoColor=white)
![Pest](https://img.shields.io/badge/Pest-3-1EAF4C?logo=pest&logoColor=white)
![Spatie](https://img.shields.io/badge/Spatie_Permissions-6.25-2F2D2E?logo=laravel&logoColor=white)

## Requirements

- PHP 8.2+
- Composer 2.x
- Node.js 20+
- PostgreSQL 15+
- Meilisearch (for search)

## Local Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url> alarcon-avenue
cd alarcon-avenue

composer install
npm install
```

### 2. Environment

```bash
cp .env.example .env
php artisan key:generate
```

Open `.env` and set your database password:

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=alarcon_avenue
DB_USERNAME=postgres
DB_PASSWORD=your_password_here
```

### 3. Create the database

```bash
# Using psql CLI
createdb alarcon_avenue

# Or inside a psql shell
CREATE DATABASE alarcon_avenue;
```

### 4. Run migrations

```bash
php artisan migrate
```

### 5. Start development servers

Run in separate terminals:

```bash
# Terminal 1 — PHP dev server
php artisan serve

# Terminal 2 — Vite (React + HMR)
npm run dev

# Terminal 3 — Reverb WebSocket server
php artisan reverb:start

# Terminal 4 — Queue worker
php artisan queue:work
```

### 6. Meilisearch (search)

Download and start Meilisearch locally, then import model indexes:

```bash
php artisan scout:import "App\Models\YourModel"
```

## Running Tests

```bash
# All tests via Artisan
php artisan test

# Directly via Pest
./vendor/bin/pest

# With coverage
./vendor/bin/pest --coverage
```

## Installed Package Versions

| Package | Version |
|---|---|
| Laravel | 12.x |
| Breeze (Inertia/React/TS) | 2.4.x |
| Inertia Laravel | 2.0.x |
| Laravel Sanctum | 4.3.x |
| Laravel Scout | 11.2.x |
| Meilisearch PHP | 1.16.x |
| spatie/laravel-permission | 6.25.x |
| Laravel Reverb | 1.10.x |
| Pest | 3.8.x |
| React | 18.x |
| Framer Motion | 12.x |
| Zustand | 5.x |
| TailwindCSS | 3.x |
| TypeScript | 5.x |

## Project Structure

```
app/
  Actions/        # Single-responsibility action classes
  Services/       # Multi-step or stateful services
  Policies/       # Authorization policies
  Http/
    Controllers/  # Thin controllers — delegate to Actions/Services
    Requests/     # Form Request validation classes
    Resources/    # Eloquent API Resources
  Models/
  Events/
  Listeners/
resources/
  js/
    Pages/        # Inertia page components (.tsx)
    Components/   # Shared React components
    Layouts/      # Page layouts
    stores/       # Zustand stores (cart, UI state)
    types/        # TypeScript type definitions
```

## Theme

Black (`#000000`), White (`#ffffff`), and Brand (`#e7901d`) only.
Use `text-brand`, `bg-brand`, `border-brand` in Tailwind.
