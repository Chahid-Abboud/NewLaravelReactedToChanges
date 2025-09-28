Awesome — here’s a clean, copy-paste **README.md** your friend can follow to get the project running fast.
(You can drop this into the repo root as `README.md`.)

---

# Hayetak — Laravel + React (Inertia + TS)

Fitness & nutrition tracker with maps, meal logging, workouts, and dashboards.

## 1) Prerequisites

* **PHP** 8.3+ (Windows users: Wamp/XAMPP with PHP 8.3)
* **Composer** 2.x
* **Node.js** 18–22 (we use 20 in examples) + npm
* **Database**

  * MySQL/MariaDB *(current default)*
  * (PostgreSQL coming later — instructions will be added)
* **Git**

Optional (for maps):

* **Mapbox public token**

> Windows: if PHP extensions are missing, enable them in `php.ini` (e.g., `extension=pdo_mysql`), then restart Apache.

---

## 2) Clone & install

```bash
git clone https://github.com/Chahid-Abboud/NewLaravelReactedToChanges.git
cd NewLaravelReactedToChanges

# PHP deps
composer install

# Node deps
npm install
```

---

## 3) .env setup

Create your environment file from the example:

```bash
cp .env.example .env
```

Open `.env` and update:

```dotenv
APP_NAME="Hayetak"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

# --- Database (MySQL/MariaDB) ---
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hayetak
DB_USERNAME=root
DB_PASSWORD=            # (set if you have one)

# --- Queue/cache/session (defaults are fine for local) ---

# --- Mapbox (optional, for Nearby map) ---
MAPBOX_TOKEN=pk_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Generate app key & storage link:

```bash
php artisan key:generate
php artisan storage:link
```

Run migrations (and seed, if available):

```bash
php artisan migrate
# or, to reset and seed demo data:
# php artisan migrate:fresh --seed
```

---

## 4) Run the app (choose ONE)

### Option A — single command (if defined)

If the project has a Composer script that runs both servers:

```bash
composer run dev
```

### Option B — two terminals (standard)

**Terminal 1 — PHP server**

```bash
php artisan serve
# http://127.0.0.1:8000
```

**Terminal 2 — Vite dev server**

```bash
npm run dev
```

> If you’re using Wamp/XAMPP Apache instead of `php artisan serve`, make sure your virtual host points to the `public/` folder.

---

## 5) Common tasks

```bash
# Clear caches (helpful when things look "stuck")
php artisan optimize:clear

# Rebuild frontend for production
npm run build

# Re-run autoload if classes aren’t found
composer dump-autoload

# Fresh DB with seeders (destructive!)
php artisan migrate:fresh --seed
```

---

## 6) Mapbox Nearby map (optional)

Add your token in `.env`:

```dotenv
MAPBOX_TOKEN=pk_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

If you don’t have a token yet, create a free one at mapbox.com and use the public token.

---

## 7) Project structure (high level)

```
app/Http/Controllers/        # Laravel controllers
app/Http/Controllers/Api     # API controllers
resources/js/                # React (Inertia + TSX)
resources/views/             # Blade shell for Inertia
routes/web.php               # Web routes
routes/api.php               # API routes (controllers only referenced, not declared here)
database/migrations/         # DB migrations
public/                      # Web root (Vite builds into here)
```

> Important: **Do not declare classes in `routes/*.php`**. Keep controllers in `app/Http/Controllers/...` and reference them from routes.

---

## 8) CI / GitHub Actions (you can ignore or disable)

The repo may show red ❌ checks because GitHub Actions workflows are present.

* To **ignore**: do nothing; they don’t block local dev.
* To **disable** Actions: GitHub → **Settings → Actions → General → Disable Actions**.
* Or remove the workflows:

  ```bash
  git rm -r .github/workflows
  git commit -m "Remove CI workflows for uni project"
  git push
  ```

---

## 9) Collaborating (you + teammate)

**First time (teammate):**

```bash
git clone https://github.com/Chahid-Abboud/NewLaravelReactedToChanges.git
cd NewLaravelReactedToChanges
composer install
npm install
cp .env.example .env
php artisan key:generate
# set DB credentials in .env, then:
php artisan migrate
php artisan storage:link
npm run dev
php artisan serve   # or use Apache virtual host
```

**Pull latest changes later:**

```bash
git pull origin main
```

**Create your own branch (recommended):**

```bash
git checkout -b feature/some-change
# ...work...
git add .
git commit -m "Implement some change"
git push -u origin feature/some-change
```

---

## 10) Troubleshooting

* **White page / 500 error**

  * Run `php artisan optimize:clear`
  * Check `.env` DB credentials and that the DB exists
  * Ensure `APP_KEY` exists (`php artisan key:generate`)

* **Class not found / autoload issues**

  * `composer dump-autoload`
  * Make sure controllers are in `app/Http/Controllers/...` and namespaces match

* **Vite not loading / mixed content**

  * Use `npm run dev` for hot reload in dev
  * Use `npm run build` for production assets

* **Windows CRLF warnings in Git**

  * Add `.gitattributes`:

    ```
    * text=auto
    *.php text eol=lf
    *.js text eol=lf
    *.ts text eol=lf
    *.tsx text eol=lf
    *.css text eol=lf
    ```
  * Commit it and push.

---

## 11) License

Academic/educational use for senior project.

---

If you want, I can also add a minimal **`compose-dev`** script so `composer run dev` reliably starts both `php artisan serve` and Vite.
