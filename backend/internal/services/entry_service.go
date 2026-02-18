package services

import (
	"errors"

	"uncomfirmatives/internal/models"

	"gorm.io/gorm"
)

var (
	ErrEntryNotFound = errors.New("entry not found")
	ErrTitleRequired = errors.New("title is required")
	ErrInvalidStatus = errors.New("invalid status")
)

var validStatuses = map[string]bool{
	"open": true, "in_progress": true, "resolved": true, "closed": true,
}

var validSeverities = map[string]bool{
	"minor": true, "major": true, "critical": true,
}

var validGroups = map[string]bool{
	"incoming_control": true, "production": true, "client": true,
}

type EntryService struct {
	db *gorm.DB
}

func NewEntryService(db *gorm.DB) *EntryService {
	return &EntryService{db: db}
}

type ListParams struct {
	Status   string
	Severity string
	Search   string
	Group    string
	Page     int
	PageSize int
}

func (s *EntryService) List(params ListParams) (*models.PaginatedEntries, error) {
	query := s.db.Model(&models.Entry{}).Order("created_at DESC")

	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}
	if params.Severity != "" {
		query = query.Where("severity = ?", params.Severity)
	}
	if params.Group != "" {
		query = query.Where("`group` = ?", params.Group)
	}
	if params.Search != "" {
		like := "%" + params.Search + "%"
		query = query.Where("title LIKE ? OR description LIKE ?", like, like)
	}

	var total int64
	query.Count(&total)

	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 {
		params.PageSize = 10
	}
	if params.PageSize > 50 {
		params.PageSize = 50
	}

	offset := (params.Page - 1) * params.PageSize

	var entries []models.Entry
	if err := query.Offset(offset).Limit(params.PageSize).Find(&entries).Error; err != nil {
		return nil, err
	}

	return &models.PaginatedEntries{
		Data:     entries,
		Total:    total,
		Page:     params.Page,
		PageSize: params.PageSize,
	}, nil
}

func (s *EntryService) GetByID(id uint) (*models.Entry, error) {
	var entry models.Entry
	if err := s.db.First(&entry, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrEntryNotFound
		}
		return nil, err
	}
	return &entry, nil
}

func (s *EntryService) Create(input models.CreateEntryInput) (*models.Entry, error) {
	if input.Title == "" {
		return nil, ErrTitleRequired
	}
	if input.Severity == "" {
		input.Severity = "minor"
	}
	if !validSeverities[input.Severity] {
		return nil, errors.New("invalid severity: must be minor, major, or critical")
	}
	if input.Group == "" {
		input.Group = "incoming_control"
	}
	if !validGroups[input.Group] {
		return nil, errors.New("invalid group: must be incoming_control, production, or client")
	}

	entry := models.Entry{
		Title:       input.Title,
		Description: input.Description,
		Status:      "open",
		Severity:    input.Severity,
		Group:       input.Group,
		AssignedTo:  input.AssignedTo,
	}

	if err := s.db.Create(&entry).Error; err != nil {
		return nil, err
	}
	return &entry, nil
}

func (s *EntryService) Update(id uint, input models.UpdateEntryInput) (*models.Entry, error) {
	entry, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	if input.Title != nil {
		if *input.Title == "" {
			return nil, ErrTitleRequired
		}
		entry.Title = *input.Title
	}
	if input.Description != nil {
		entry.Description = *input.Description
	}
	if input.Severity != nil {
		if !validSeverities[*input.Severity] {
			return nil, errors.New("invalid severity: must be minor, major, or critical")
		}
		entry.Severity = *input.Severity
	}
	if input.Group != nil {
		if !validGroups[*input.Group] {
			return nil, errors.New("invalid group: must be incoming_control, production, or client")
		}
		entry.Group = *input.Group
	}
	if input.AssignedTo != nil {
		entry.AssignedTo = *input.AssignedTo
	}

	if err := s.db.Save(entry).Error; err != nil {
		return nil, err
	}
	return entry, nil
}

func (s *EntryService) UpdateStatus(id uint, status string) (*models.Entry, error) {
	if !validStatuses[status] {
		return nil, ErrInvalidStatus
	}

	entry, err := s.GetByID(id)
	if err != nil {
		return nil, err
	}

	entry.Status = status
	if err := s.db.Save(entry).Error; err != nil {
		return nil, err
	}
	return entry, nil
}

func (s *EntryService) Delete(id uint) error {
	entry, err := s.GetByID(id)
	if err != nil {
		return err
	}
	return s.db.Delete(entry).Error
}

func (s *EntryService) Stats() (map[string]interface{}, error) {
	var total int64
	s.db.Model(&models.Entry{}).Count(&total)

	type statusCount struct {
		Status string
		Count  int64
	}
	var byStatus []statusCount
	s.db.Model(&models.Entry{}).Select("status, count(*) as count").Group("status").Scan(&byStatus)

	type severityCount struct {
		Severity string
		Count    int64
	}
	var bySeverity []severityCount
	s.db.Model(&models.Entry{}).Select("severity, count(*) as count").Group("severity").Scan(&bySeverity)

	type groupCount struct {
		Group string
		Count int64
	}
	var byGroup []groupCount
	s.db.Model(&models.Entry{}).Select("`group`, count(*) as count").Group("`group`").Scan(&byGroup)

	statusMap := make(map[string]int64)
	for _, sc := range byStatus {
		statusMap[sc.Status] = sc.Count
	}

	severityMap := make(map[string]int64)
	for _, sc := range bySeverity {
		severityMap[sc.Severity] = sc.Count
	}

	groupMap := make(map[string]int64)
	for _, gc := range byGroup {
		groupMap[gc.Group] = gc.Count
	}

	return map[string]interface{}{
		"total":       total,
		"by_status":   statusMap,
		"by_severity": severityMap,
		"by_group":    groupMap,
	}, nil
}
