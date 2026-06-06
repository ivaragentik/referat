use sqlx::SqlitePool;

/// Repository for meeting notes (user-written rough notes that are woven into the AI summary).
pub struct MeetingNotesRepository;

impl MeetingNotesRepository {
    /// UPSERT a meeting's notes_markdown.
    ///
    /// On first insert, sets both `created_at` and `updated_at` to the current UTC timestamp.
    /// On conflict (same `meeting_id`), updates only `notes_markdown` and `updated_at`.
    pub async fn save_notes(
        pool: &SqlitePool,
        meeting_id: &str,
        markdown: &str,
    ) -> Result<(), sqlx::Error> {
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            r#"
            INSERT INTO meeting_notes (meeting_id, notes_markdown, created_at, updated_at)
            VALUES ($1, $2, $3, $3)
            ON CONFLICT(meeting_id) DO UPDATE SET
                notes_markdown = excluded.notes_markdown,
                updated_at     = excluded.updated_at
            "#,
        )
        .bind(meeting_id)
        .bind(markdown)
        .bind(&now)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Fetch the `notes_markdown` for a given meeting.
    ///
    /// Returns `Ok(None)` when the meeting has no notes row yet.
    pub async fn get_notes(
        pool: &SqlitePool,
        meeting_id: &str,
    ) -> Result<Option<String>, sqlx::Error> {
        let result: Option<Option<String>> = sqlx::query_scalar(
            "SELECT notes_markdown FROM meeting_notes WHERE meeting_id = $1 LIMIT 1",
        )
        .bind(meeting_id)
        .fetch_optional(pool)
        .await?;

        Ok(result.flatten())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::SqlitePoolOptions;

    /// Create an in-memory SQLite pool with just the meeting_notes table.
    async fn test_pool() -> SqlitePool {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect("sqlite::memory:")
            .await
            .expect("Failed to create in-memory SQLite pool");

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS meeting_notes (
                meeting_id      TEXT PRIMARY KEY,
                notes_markdown  TEXT,
                notes_json      TEXT,
                created_at      TEXT,
                updated_at      TEXT
            )
            "#,
        )
        .execute(&pool)
        .await
        .expect("Failed to create meeting_notes table");

        pool
    }

    #[tokio::test]
    async fn test_save_and_get_notes() {
        let pool = test_pool().await;
        let meeting_id = "test-meeting-1";
        let notes = "- Discuss Q3 goals\n- Follow up on budget";

        // First insert
        MeetingNotesRepository::save_notes(&pool, meeting_id, notes)
            .await
            .expect("save_notes failed on first insert");

        let fetched = MeetingNotesRepository::get_notes(&pool, meeting_id)
            .await
            .expect("get_notes failed");

        assert_eq!(fetched, Some(notes.to_string()));
    }

    #[tokio::test]
    async fn test_upsert_updates_notes() {
        let pool = test_pool().await;
        let meeting_id = "test-meeting-2";

        MeetingNotesRepository::save_notes(&pool, meeting_id, "initial notes")
            .await
            .expect("initial save failed");

        MeetingNotesRepository::save_notes(&pool, meeting_id, "updated notes")
            .await
            .expect("upsert save failed");

        let fetched = MeetingNotesRepository::get_notes(&pool, meeting_id)
            .await
            .expect("get_notes failed");

        assert_eq!(fetched, Some("updated notes".to_string()));
    }

    #[tokio::test]
    async fn test_get_notes_returns_none_for_unknown_meeting() {
        let pool = test_pool().await;

        let fetched = MeetingNotesRepository::get_notes(&pool, "no-such-meeting")
            .await
            .expect("get_notes failed");

        assert_eq!(fetched, None);
    }

    #[tokio::test]
    async fn test_upsert_preserves_created_at() {
        use sqlx::Row;

        let pool = test_pool().await;
        let meeting_id = "test-meeting-3";

        MeetingNotesRepository::save_notes(&pool, meeting_id, "first")
            .await
            .expect("first save failed");

        // Grab the created_at timestamp after first insert
        let row = sqlx::query("SELECT created_at, updated_at FROM meeting_notes WHERE meeting_id = $1")
            .bind(meeting_id)
            .fetch_one(&pool)
            .await
            .expect("fetch failed");
        let created_at_1: String = row.get("created_at");
        let updated_at_1: String = row.get("updated_at");

        // Small delay to ensure timestamps differ if the column were re-written
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;

        MeetingNotesRepository::save_notes(&pool, meeting_id, "second")
            .await
            .expect("upsert save failed");

        let row2 = sqlx::query("SELECT created_at, updated_at FROM meeting_notes WHERE meeting_id = $1")
            .bind(meeting_id)
            .fetch_one(&pool)
            .await
            .expect("fetch failed");
        let created_at_2: String = row2.get("created_at");
        let updated_at_2: String = row2.get("updated_at");

        // created_at must not change on upsert
        assert_eq!(created_at_1, created_at_2, "created_at must not change on upsert");
        // updated_at should be >= the first value (same second is fine in a fast test)
        assert!(updated_at_2 >= updated_at_1, "updated_at should be non-decreasing");
    }
}
