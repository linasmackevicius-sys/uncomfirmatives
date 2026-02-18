package router

import (
	"uncomfirmatives/internal/handlers"
	"uncomfirmatives/internal/middleware"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func New(entries *handlers.EntryHandler, statuses *handlers.StatusHandler, events *handlers.EventHub) *chi.Mux {
	r := chi.NewRouter()

	r.Use(cors.Handler(middleware.CORS()))
	r.Use(chimw.Recoverer)
	r.Use(middleware.Logger)

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/entries", entries.List)
		r.Post("/entries", entries.Create)
		r.Get("/entries/stats", entries.Stats)
		r.Get("/entries/{id}", entries.GetByID)
		r.Put("/entries/{id}", entries.Update)
		r.Delete("/entries/{id}", entries.Delete)
		r.Patch("/entries/{id}/status", entries.UpdateStatus)

		r.Get("/statuses", statuses.List)

		r.Get("/events", events.ServeHTTP)
	})

	return r
}
