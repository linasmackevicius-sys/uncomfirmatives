package main

import (
	"log"
	"net/http"

	"uncomfirmatives/internal/config"
	"uncomfirmatives/internal/database"
	"uncomfirmatives/internal/handlers"
	"uncomfirmatives/internal/models"
	"uncomfirmatives/internal/router"
	"uncomfirmatives/internal/services"

	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	db := database.Connect(cfg)

	db.AutoMigrate(&models.Entry{}, &models.Status{}, &models.User{})
	seedStatuses(db)

	events := handlers.NewEventHub()
	entrySvc := services.NewEntryService(db)
	entryHandler := handlers.NewEntryHandler(entrySvc, events)
	statusHandler := handlers.NewStatusHandler(db)

	r := router.New(entryHandler, statusHandler, events)

	log.Printf("Server starting on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

func seedStatuses(db *gorm.DB) {
	var count int64
	db.Model(&models.Status{}).Count(&count)
	if count == 0 {
		statuses := models.DefaultStatuses()
		db.Create(&statuses)
		log.Println("Seeded default statuses")
	}
}
