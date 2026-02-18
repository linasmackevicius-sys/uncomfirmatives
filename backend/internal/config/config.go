package config

import "os"

type Config struct {
	DBHost string
	DBPort string
	DBName string
	DBUser string
	DBPass string
	Port   string
}

func Load() *Config {
	return &Config{
		DBHost: getEnv("DB_HOST", "localhost"),
		DBPort: getEnv("DB_PORT", "3306"),
		DBName: getEnv("DB_NAME", "uncomfirmatives"),
		DBUser: getEnv("DB_USER", "app"),
		DBPass: getEnv("DB_PASS", "apppass"),
		Port:   getEnv("PORT", "8080"),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
