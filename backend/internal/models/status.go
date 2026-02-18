package models

type Status struct {
	ID    uint   `gorm:"primaryKey" json:"id"`
	Name  string `gorm:"size:50;uniqueIndex;not null" json:"name"`
	Color string `gorm:"size:7;not null" json:"color"`
	Order int    `gorm:"not null" json:"order"`
}

func DefaultStatuses() []Status {
	return []Status{
		{Name: "open", Color: "#569cd6", Order: 1},
		{Name: "in_progress", Color: "#dcdcaa", Order: 2},
		{Name: "resolved", Color: "#4ec9b0", Order: 3},
		{Name: "closed", Color: "#6a6a6a", Order: 4},
	}
}
