package com.backend.attendance.service;

import com.backend.attendance.model.CoachingCentre;
import com.backend.attendance.repository.CoachingCentreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CoachingCentreService {

    private final CoachingCentreRepository coachingCentreRepository;

    public CoachingCentre createCoachingCentre(CoachingCentre coachingCentre) {
        return coachingCentreRepository.save(coachingCentre);
    }

    public List<CoachingCentre> getAllCoachingCentres() {
        return coachingCentreRepository.findAll();
    }

    public Optional<CoachingCentre> getCoachingCentreById(String id) {
        return coachingCentreRepository.findById(id);
    }

    public List<CoachingCentre> getActiveCoachingCentres() {
        return coachingCentreRepository.findByIsActive(true);
    }

    public CoachingCentre updateCoachingCentre(String id, CoachingCentre coachingCentre) {
        coachingCentre.setId(id);
        return coachingCentreRepository.save(coachingCentre);
    }

    public void deleteCoachingCentre(String id) {
        coachingCentreRepository.deleteById(id);
    }
}
