package com.backend.attendance.controller;

import com.backend.attendance.model.CoachingCentre;
import com.backend.attendance.service.CoachingCentreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coaching-centres")
@RequiredArgsConstructor
public class CoachingCentreController {

    private final CoachingCentreService coachingCentreService;

    @PostMapping
    public ResponseEntity<CoachingCentre> createCoachingCentre(@RequestBody CoachingCentre coachingCentre) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(coachingCentreService.createCoachingCentre(coachingCentre));
    }

    @GetMapping
    public ResponseEntity<List<CoachingCentre>> getAllCoachingCentres() {
        return ResponseEntity.ok(coachingCentreService.getAllCoachingCentres());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CoachingCentre> getCoachingCentreById(@PathVariable String id) {
        return coachingCentreService.getCoachingCentreById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/active")
    public ResponseEntity<List<CoachingCentre>> getActiveCoachingCentres() {
        return ResponseEntity.ok(coachingCentreService.getActiveCoachingCentres());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CoachingCentre> updateCoachingCentre(@PathVariable String id,
            @RequestBody CoachingCentre coachingCentre) {
        return ResponseEntity.ok(coachingCentreService.updateCoachingCentre(id, coachingCentre));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoachingCentre(@PathVariable String id) {
        coachingCentreService.deleteCoachingCentre(id);
        return ResponseEntity.noContent().build();
    }
}
