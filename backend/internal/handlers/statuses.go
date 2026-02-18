package handlers

import (
	"net/http"

	"uncomfirmatives/internal/models"

	"gorm.io/gorm"
)

type StatusHandler struct {
	db *gorm.DB
}

func NewStatusHandler(db *gorm.DB) *StatusHandler {
	return &StatusHandler{db: db}
}

func (h *StatusHandler) List(w http.ResponseWriter, r *http.Request) {
	var statuses []models.Status
	if err := h.db.Order("`order` ASC").Find(&statuses).Error; err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list statuses")
		return
	}
	writeJSON(w, http.StatusOK, statuses)
}
