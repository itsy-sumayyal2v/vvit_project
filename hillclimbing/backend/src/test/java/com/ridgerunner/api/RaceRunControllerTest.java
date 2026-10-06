package com.ridgerunner.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:race-runs;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
class RaceRunControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RaceRunRepository runs;

    @BeforeEach
    void clearRuns() {
        runs.deleteAll();
    }

    @Test
    void savesRunAndReturnsItOnLeaderboard() throws Exception {
        mockMvc.perform(post("/api/runs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"distance\":420,\"coins\":7,\"reason\":\"Rollover\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.distance").value(420));

        mockMvc.perform(get("/api/leaderboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.personalBest").value(420))
                .andExpect(jsonPath("$.runs[0].coins").value(7))
                .andExpect(jsonPath("$.runs[0].reason").value("Rollover"));
    }

    @Test
    void rejectsNegativeDistance() throws Exception {
        mockMvc.perform(post("/api/runs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"distance\":-1,\"coins\":0,\"reason\":\"Rollover\"}"))
                .andExpect(status().isBadRequest());
    }
}