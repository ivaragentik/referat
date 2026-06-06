use crate::summary::templates;
use serde::{Deserialize, Serialize};
use tauri::Runtime;
use tracing::{info, warn};

/// Template metadata for UI display
#[derive(Debug, Serialize, Deserialize)]
pub struct TemplateInfo {
    /// Template identifier (e.g., "daily_standup", "standard_meeting")
    pub id: String,

    /// Display name for the template
    pub name: String,

    /// Brief description of the template's purpose
    pub description: String,
}

/// Detailed template structure for preview/debugging
#[derive(Debug, Serialize, Deserialize)]
pub struct TemplateDetails {
    /// Template identifier
    pub id: String,

    /// Display name
    pub name: String,

    /// Description
    pub description: String,

    /// List of section titles in order
    pub sections: Vec<String>,
}

/// Lists all available templates
///
/// Returns templates from both built-in (embedded) and custom (user data directory) sources.
/// Templates are automatically discovered - no code changes needed to add new templates.
///
/// # Returns
/// Vector of TemplateInfo with id, name, and description for each template
#[tauri::command]
pub async fn api_list_templates<R: Runtime>(
    _app: tauri::AppHandle<R>,
) -> Result<Vec<TemplateInfo>, String> {
    info!("api_list_templates called");

    let templates = templates::list_templates();

    let template_infos: Vec<TemplateInfo> = templates
        .into_iter()
        .map(|(id, name, description)| TemplateInfo {
            id,
            name,
            description,
        })
        .collect();

    info!("Found {} available templates", template_infos.len());

    Ok(template_infos)
}

/// Gets detailed information about a specific template
///
/// # Arguments
/// * `template_id` - Template identifier (e.g., "daily_standup")
///
/// # Returns
/// TemplateDetails with full template structure
#[tauri::command]
pub async fn api_get_template_details<R: Runtime>(
    _app: tauri::AppHandle<R>,
    template_id: String,
) -> Result<TemplateDetails, String> {
    info!("api_get_template_details called for template_id: {}", template_id);

    let template = templates::get_template(&template_id)?;

    let section_titles: Vec<String> = template
        .sections
        .iter()
        .map(|section| section.title.clone())
        .collect();

    let details = TemplateDetails {
        id: template_id,
        name: template.name,
        description: template.description,
        sections: section_titles,
    };

    info!("Retrieved template details for '{}'", details.name);

    Ok(details)
}

/// Validates a custom template JSON string
///
/// Useful for template editor UI or validation before saving custom templates
///
/// # Arguments
/// * `template_json` - Raw JSON string of the template
///
/// # Returns
/// Ok(template_name) if valid, Err(error_message) if invalid
#[tauri::command]
pub async fn api_validate_template<R: Runtime>(
    _app: tauri::AppHandle<R>,
    template_json: String,
) -> Result<String, String> {
    info!("api_validate_template called");

    match templates::validate_and_parse_template(&template_json) {
        Ok(template) => {
            info!("Template '{}' validated successfully", template.name);
            Ok(template.name)
        }
        Err(e) => {
            warn!("Template validation failed: {}", e);
            Err(e)
        }
    }
}

/// LES-MEG.md content written on first-time seed (Norwegian explanation of the template format)
const LES_MEG_CONTENT: &str = r#"# Egendefinerte maler for Referat

Referat bruker maler for å styre hvordan møtereferater genereres av AI.
Denne mappen inneholder dine egne maler.

## Hva er en mal?

En mal er en JSON-fil som forteller AI-en hvilke seksjoner referatet skal ha,
og hvordan hver seksjon skal fylles ut.

## JSON-format

En mal-fil MÅ inneholde disse feltene:

```json
{
  "name": "Malens visningsnavn",
  "description": "Kort beskrivelse av hva malen passer til",
  "sections": [
    {
      "title": "Seksjonstittel",
      "instruction": "Instruksjon til AI-en om hva seksjonen skal inneholde",
      "format": "paragraph"
    }
  ]
}
```

### Gyldige verdier for `format`

| Verdi       | Betydning                          |
|-------------|-------------------------------------|
| `paragraph` | Sammenhengende avsnitt             |
| `list`      | Punktliste                         |
| `string`    | Enkelt fritekst-felt               |

### Valgfritt felt: `item_format`

Brukes ved `"format": "list"` for å gi AI-en en mal for hvert element:

```json
"item_format": "[Ansvarlig] — Oppgave (frist: dato)"
```

## Regler

- Filen MÅ slutte på `.json`
- `name` og `description` kan ikke være tomme
- Malen MÅ ha minst én seksjon
- Hver seksjon MÅ ha `title`, `instruction` og gyldig `format`

Når du lagrer en ny `.json`-fil her, dukker den opp i malvelgeren i appen
**uten at du trenger å starte appen på nytt**.

---

Se `eksempelmal.json` i denne mappen for et komplett eksempel du kan kopiere og redigere.
"#;

/// eksempelmal.json content written on first-time seed
const EKSEMPELMAL_JSON: &str = r#"{
  "name": "Eksempelmal",
  "description": "Rediger meg! Denne ligger i mal-mappen — lag din egen kopi.",
  "sections": [
    {
      "title": "Sammendrag",
      "instruction": "Skriv et kort sammendrag av møtet på 2–4 setninger. Dekk hovedformålet og de viktigste utfallene.",
      "format": "paragraph"
    },
    {
      "title": "Hovedpunkter",
      "instruction": "List opp de viktigste temaene og diskusjonspunktene som ble tatt opp i møtet.",
      "format": "list"
    },
    {
      "title": "Handlingspunkter",
      "instruction": "List opp konkrete oppgaver som ble avtalt, med ansvarlig person og eventuell frist om det ble nevnt.",
      "format": "list",
      "item_format": "[Ansvarlig] — Oppgave (frist: dato)"
    }
  ]
}
"#;

/// Open the custom templates folder in the system file explorer.
///
/// On first use (dir does not yet exist, or is empty), seeds the folder with:
/// - `LES-MEG.md`: Norwegian explanation of the template format
/// - `eksempelmal.json`: a valid example template
///
/// After seeding (or if the folder already exists), opens it in Finder / Explorer / Files.
#[tauri::command]
pub async fn open_templates_folder() -> Result<(), String> {
    let templates_dir = crate::summary::templates::loader_get_custom_templates_dir()
        .ok_or_else(|| "Kunne ikke bestemme mal-mappen på dette systemet".to_string())?;

    let was_new = !templates_dir.exists();

    // Ensure directory exists
    std::fs::create_dir_all(&templates_dir)
        .map_err(|e| format!("Kunne ikke opprette mal-mappen: {}", e))?;

    // Seed if the directory was just created or is empty
    let is_empty = std::fs::read_dir(&templates_dir)
        .map(|mut rd| rd.next().is_none())
        .unwrap_or(false);

    if was_new || is_empty {
        info!("Seeding custom templates folder: {:?}", templates_dir);

        let les_meg_path = templates_dir.join("LES-MEG.md");
        std::fs::write(&les_meg_path, LES_MEG_CONTENT)
            .map_err(|e| format!("Kunne ikke skrive LES-MEG.md: {}", e))?;

        let eksempelmal_path = templates_dir.join("eksempelmal.json");
        std::fs::write(&eksempelmal_path, EKSEMPELMAL_JSON)
            .map_err(|e| format!("Kunne ikke skrive eksempelmal.json: {}", e))?;

        info!("Template folder seeded with LES-MEG.md and eksempelmal.json");
    }

    let folder_path = templates_dir.to_string_lossy().to_string();

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&folder_path)
            .spawn()
            .map_err(|e| format!("Kunne ikke åpne mappen: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&folder_path)
            .spawn()
            .map_err(|e| format!("Kunne ikke åpne mappen: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&folder_path)
            .spawn()
            .map_err(|e| format!("Kunne ikke åpne mappen: {}", e))?;
    }

    info!("Opened custom templates folder: {}", folder_path);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_list_templates() {
        // This test requires the templates to be embedded/available
        // In a real test environment, you might want to mock the templates module

        // For now, just verify the function compiles and runs
        // You can expand this with more specific assertions
    }

    #[tokio::test]
    async fn test_validate_template_valid() {
        let valid_json = r#"
        {
            "name": "Test Template",
            "description": "A test template",
            "sections": [
                {
                    "title": "Summary",
                    "instruction": "Provide a summary",
                    "format": "paragraph"
                }
            ]
        }"#;

        // Mock app handle would be needed for actual testing
        // For now, test the validation logic directly
        let result = templates::validate_and_parse_template(valid_json);
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_validate_template_invalid() {
        let invalid_json = "invalid json";

        let result = templates::validate_and_parse_template(invalid_json);
        assert!(result.is_err());
    }

    /// Unit-sanity test: the embedded eksempelmal.json parses and validates against the
    /// Template struct rules, matching exactly what open_templates_folder seeds on disk.
    #[test]
    fn test_eksempelmal_json_parses_and_validates() {
        let result = templates::validate_and_parse_template(EKSEMPELMAL_JSON);
        assert!(
            result.is_ok(),
            "EKSEMPELMAL_JSON failed validation: {:?}",
            result.err()
        );

        let template = result.unwrap();
        assert_eq!(template.name, "Eksempelmal");
        assert!(
            !template.description.is_empty(),
            "eksempelmal description must not be empty"
        );
        assert!(
            !template.sections.is_empty(),
            "eksempelmal must have at least one section"
        );

        // Check that all section formats are valid
        for section in &template.sections {
            assert!(
                matches!(section.format.as_str(), "paragraph" | "list" | "string"),
                "eksempelmal section '{}' has invalid format '{}'",
                section.title,
                section.format
            );
        }
    }
}
