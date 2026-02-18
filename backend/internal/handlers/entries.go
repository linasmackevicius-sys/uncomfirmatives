package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"uncomfirmatives/internal/models"
	"uncomfirmatives/internal/services"

	"github.com/go-chi/chi/v5"
)

type EntryHandler struct {
	svc    *services.EntryService
	events *EventHub
}

func NewEntryHandler(svc *services.EntryService, events *EventHub) *EntryHandler {
	return &EntryHandler{svc: svc, events: events}
}

func (h *EntryHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	page, _ := strconv.Atoi(q.Get("page"))
	pageSize, _ := strconv.Atoi(q.Get("page_size"))

	params := services.ListParams{
		Status:   q.Get("status"),
		Severity: q.Get("severity"),
		Search:   q.Get("search"),
		Group:    q.Get("group"),
		Page:     page,
		PageSize: pageSize,
	}

	result, err := h.svc.List(params)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list entries")
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *EntryHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	entry, err := h.svc.GetByID(id)
	if err != nil {
		if errors.Is(err, services.ErrEntryNotFound) {
			writeError(w, http.StatusNotFound, "entry not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to get entry")
		return
	}
	writeJSON(w, http.StatusOK, entry)
}

func (h *EntryHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input models.CreateEntryInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	entry, err := h.svc.Create(input)
	if err != nil {
		if errors.Is(err, services.ErrTitleRequired) {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	h.events.Broadcast("entry_changed")
	writeJSON(w, http.StatusCreated, entry)
}

func (h *EntryHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var input models.UpdateEntryInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	entry, err := h.svc.Update(id, input)
	if err != nil {
		if errors.Is(err, services.ErrEntryNotFound) {
			writeError(w, http.StatusNotFound, "entry not found")
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	h.events.Broadcast("entry_changed")
	writeJSON(w, http.StatusOK, entry)
}

func (h *EntryHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var input models.UpdateStatusInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	entry, err := h.svc.UpdateStatus(id, input.Status)
	if err != nil {
		if errors.Is(err, services.ErrEntryNotFound) {
			writeError(w, http.StatusNotFound, "entry not found")
			return
		}
		if errors.Is(err, services.ErrInvalidStatus) {
			writeError(w, http.StatusBadRequest, "invalid status")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to update status")
		return
	}
	h.events.Broadcast("entry_changed")
	writeJSON(w, http.StatusOK, entry)
}

func (h *EntryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.svc.Delete(id); err != nil {
		if errors.Is(err, services.ErrEntryNotFound) {
			writeError(w, http.StatusNotFound, "entry not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "failed to delete entry")
		return
	}
	h.events.Broadcast("entry_changed")
	w.WriteHeader(http.StatusNoContent)
}

func (h *EntryHandler) Stats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.svc.Stats()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get stats")
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

func parseID(r *http.Request) (uint, error) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
