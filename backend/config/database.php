<?php
/**
 * StayNest - Database Configuration and Connection Class
 *
 * Uses PDO with prepared statements for secure MySQL access.
 * Loads DB credentials from the project-root .env file, then falls back
 * to process environment variables, and finally to the hard-coded defaults.
 */

class Database {
    private static ?PDO $instance = null;

    // Hard-coded defaults (used only when neither .env nor OS env vars are present)
    private static string $host    = '127.0.0.1';
    private static int    $port    = 3306;
    private static string $db      = 'staynest_db';
    private static string $user    = 'root';
    private static string $pass    = '';           // Never hard-code a real password here
    private static string $charset = 'utf8mb4';

    /**
     * Parse a .env file and populate $_ENV / putenv for every KEY=VALUE line.
     * Already-set environment variables are NOT overwritten (process env wins).
     *
     * @param string $envFile  Absolute path to the .env file.
     * @return void
     */
    private static function loadEnv(string $envFile): void {
        if (!is_readable($envFile)) {
            return;
        }

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            // Skip comment lines
            if (str_starts_with(ltrim($line), '#')) {
                continue;
            }

            // Expect KEY=VALUE (value may contain '=')
            if (!str_contains($line, '=')) {
                continue;
            }

            [$key, $value] = explode('=', $line, 2);
            $key   = trim($key);
            $value = trim($value);

            // Strip surrounding quotes (" or ') if present
            if (
                strlen($value) >= 2 &&
                (($value[0] === '"' && $value[-1] === '"') ||
                 ($value[0] === "'" && $value[-1] === "'"))
            ) {
                $value = substr($value, 1, -1);
            }

            // Only set if not already defined in the process environment
            if ($key !== '' && getenv($key) === false) {
                putenv("{$key}={$value}");
                $_ENV[$key] = $value;
            }
        }
    }

    /**
     * Get the PDO database connection instance (Singleton).
     *
     * @return PDO
     * @throws PDOException
     */
    public static function getConnection(): PDO {
        if (self::$instance === null) {
            // Load .env from the project root (one level above this config/ dir)
            self::loadEnv(dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env');

            $host    = getenv('DB_HOST')    ?: self::$host;
            $port    = (int)(getenv('DB_PORT') ?: self::$port);
            $db      = getenv('DB_NAME')    ?: self::$db;
            $user    = getenv('DB_USER')    ?: self::$user;
            $pass    = getenv('DB_PASS') !== false ? getenv('DB_PASS') : self::$pass;
            $charset = getenv('DB_CHARSET') ?: self::$charset;

            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset={$charset}";

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            self::$instance = new PDO($dsn, $user, $pass, $options);
        }

        return self::$instance;
    }
}
