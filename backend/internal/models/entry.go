package models

import "time"

type Entry struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"size:255;not null" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	Status      string    `gorm:"size:50;default:open" json:"status"`
	Severity    string    `gorm:"size:50;default:minor" json:"severity"`
	Group       string    `gorm:"size:50;default:incoming_control" json:"group"`
	AssignedTo  string    `gorm:"size:255" json:"assigned_to"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateEntryInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Severity    string `json:"severity"`
	Group       string `json:"group"`
	AssignedTo  string `json:"assigned_to"`
}

type UpdateEntryInput struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
	Severity    *string `json:"severity"`
	Group       *string `json:"group"`
	AssignedTo  *string `json:"assigned_to"`
}

type UpdateStatusInput struct {
	Status string `json:"status"`
}

type PaginatedEntries struct {
	Data     []Entry `json:"data"`
	Total    int64   `json:"total"`
	Page     int     `json:"page"`
	PageSize int     `json:"page_size"`
}
