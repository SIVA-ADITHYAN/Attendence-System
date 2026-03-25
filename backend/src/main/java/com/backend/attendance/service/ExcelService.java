package com.backend.attendance.service;

import com.backend.attendance.model.Student;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class ExcelService {

    public List<Student> parseStudentsFromExcel(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename != null && filename.toLowerCase().endsWith(".csv")) {
            return parseStudentsFromCsv(file);
        }

        List<Student> students = new ArrayList<>();

        try (InputStream is = file.getInputStream(); Workbook workbook = new XSSFWorkbook(is)) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                Student student = Student.builder()
                        .studentName(getCellValue(row, 0))
                        .gender(getCellValue(row, 1))
                        .dateOfBirth(getDateValue(row, 2))
                        .schoolName(getCellValue(row, 3))
                        .standard(getCellValue(row, 4))
                        .parentName(getCellValue(row, 5))
                        .parentPhone(getCellValue(row, 6))
                        .parentAltPhone(getCellValue(row, 7))
                        .batchName(getCellValue(row, 8))
                        .batchStartTime(getTimeValue(row, 9))
                        .batchEndTime(getTimeValue(row, 10))
                        .tutorId(getCellValue(row, 11))
                        .address(getCellValue(row, 12))
                        .isActive(true)
                        .joinedDate(getDateValue(row, 13))
                        .build();

                students.add(student);
            }
        } catch (Exception e) {
            if (e.getClass().getSimpleName().equals("NotOfficeXmlFileException")
                    || e.getClass().getName().contains("NotOfficeXmlFileException")) {
                log.warn("File was not a valid Excel file, attempting to parse as CSV instead...");
                return parseStudentsFromCsv(file);
            }
            log.error("Error parsing Excel file: {}", e.getMessage());
            throw new RuntimeException("Failed to parse Excel file: " + e.getMessage());
        }

        return students;
    }

    private List<Student> parseStudentsFromCsv(MultipartFile file) {
        List<Student> students = new ArrayList<>();
        try (java.io.BufferedReader reader = new java.io.BufferedReader(
                new java.io.InputStreamReader(file.getInputStream()))) {
            String line;
            boolean first = true;
            while ((line = reader.readLine()) != null) {
                if (first || line.trim().isEmpty()) {
                    first = false;
                    continue;
                }
                List<String> cols = parseCsvLine(line);
                if (cols.size() < 14) {
                    // pad with empty strings if the line is short
                    while (cols.size() < 14)
                        cols.add("");
                }

                Student student = Student.builder()
                        .studentName(cols.get(0))
                        .gender(cols.get(1))
                        .dateOfBirth(parseDateValue(cols.get(2)))
                        .schoolName(cols.get(3))
                        .standard(cols.get(4))
                        .parentName(cols.get(5))
                        .parentPhone(cols.get(6))
                        .parentAltPhone(cols.get(7))
                        .batchName(cols.get(8))
                        .batchStartTime(parseTimeValue(cols.get(9)))
                        .batchEndTime(parseTimeValue(cols.get(10)))
                        .tutorId(cols.get(11))
                        .address(cols.get(12))
                        .isActive(true)
                        .joinedDate(parseDateValue(cols.get(13)))
                        .build();
                students.add(student);
            }
        } catch (Exception e) {
            log.error("Error parsing CSV file: {}", e.getMessage());
            throw new RuntimeException("Failed to parse CSV file: " + e.getMessage());
        }
        return students;
    }

    private List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (i < line.length() - 1 && line.charAt(i + 1) == '"') {
                    sb.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                values.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        values.add(sb.toString().trim());
        return values;
    }

    private LocalDate parseDateValue(String val) {
        if (val == null || val.trim().isEmpty())
            return null;
        try {
            return LocalDate.parse(val.trim());
        } catch (Exception e) {
            log.warn("Error parsing string date {}: {}", val, e.getMessage());
            return null;
        }
    }

    private LocalTime parseTimeValue(String val) {
        if (val == null || val.trim().isEmpty())
            return null;
        try {
            return LocalTime.parse(val.trim());
        } catch (Exception e) {
            log.warn("Error parsing string time {}: {}", val, e.getMessage());
            return null;
        }
    }

    private String getCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null)
            return null;

        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> null;
        };
    }

    private LocalDate getDateValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null)
            return null;

        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            } else if (cell.getCellType() == CellType.STRING) {
                return LocalDate.parse(cell.getStringCellValue().trim());
            }
        } catch (Exception e) {
            log.warn("Error parsing date at cell {}: {}", cellIndex, e.getMessage());
        }
        return null;
    }

    private LocalTime getTimeValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null)
            return null;

        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalTime();
            } else if (cell.getCellType() == CellType.STRING) {
                return LocalTime.parse(cell.getStringCellValue().trim());
            }
        } catch (Exception e) {
            log.warn("Error parsing time at cell {}: {}", cellIndex, e.getMessage());
        }
        return null;
    }
}
