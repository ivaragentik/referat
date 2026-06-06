/// Application configuration constants
///
/// Centralized definitions for default models and settings.
/// Used across database initialization, import, and retranscription.

/// Default Whisper model for transcription when no preference is configured.
/// Best accuracy for Norwegian Bokmål via NB-Whisper (NbAiLab / Nasjonalbiblioteket).
pub const DEFAULT_WHISPER_MODEL: &str = "nb-whisper-large-q5_0";

/// Default Parakeet model for transcription when no preference is configured.
/// This is the quantized version optimized for speed.
pub const DEFAULT_PARAKEET_MODEL: &str = "parakeet-tdt-0.6b-v3-int8";

/// Whisper model catalog with metadata for all supported models.
/// Used by both WhisperEngine::discover_models() and discover_models_standalone().
///
/// Format: (name, filename, size_mb, accuracy, speed, description)
pub const WHISPER_MODEL_CATALOG: &[(&str, &str, u32, &str, &str, &str)] = &[
    // Standard f16 models (full precision)
    ("tiny", "ggml-tiny.bin", 74, "Decent", "Very Fast", "Fastest processing, good for real-time use"),
    ("base", "ggml-base.bin", 142, "Good", "Fast", "Good balance of speed and accuracy"),
    ("small", "ggml-small.bin", 466, "Good", "Medium", "Better accuracy, moderate speed"),
    ("medium", "ggml-medium.bin", 1463, "High", "Slow", "High accuracy for professional use"),
    ("large-v3-turbo", "ggml-large-v3-turbo.bin", 1549, "High", "Medium", "Best accuracy with improved speed"),
    ("large-v3", "ggml-large-v3.bin", 2951, "High", "Slow", "Most Accurate, latest large model"),

    // Q5_1 quantized models (balanced speed/accuracy, slightly better quality than Q5_0)
    ("tiny-q5_1", "ggml-tiny-q5_1.bin", 31, "Decent", "Very Fast", "Quantized tiny model, ~50% faster processing"),
    ("base-q5_1", "ggml-base-q5_1.bin", 57, "Good", "Fast", "Quantized base model, good speed/accuracy balance"),
    ("small-q5_1", "ggml-small-q5_1.bin", 181, "Good", "Fast", "Quantized small model, faster than f16 version"),

    // Q5_0 quantized models (balanced speed/accuracy)
    ("medium-q5_0", "ggml-medium-q5_0.bin", 514, "High", "Medium", "Quantized medium model, professional quality"),
    ("large-v3-turbo-q5_0", "ggml-large-v3-turbo-q5_0.bin", 547, "High", "Medium", "Quantized large model, best balance"),
    ("large-v3-q5_0", "ggml-large-v3-q5_0.bin", 1031, "High", "Slow", "Quantized large model, high accuracy"),

    // NB-Whisper — Norwegian Bokmål finetuned Whisper (NbAiLab / Nasjonalbiblioteket)
    // Same architecture as stock Whisper, so file sizes match the stock q5_0 models.
    ("nb-whisper-large-q5_0", "ggml-nb-whisper-large-q5_0.bin", 1031, "High", "Slow", "Norsk (bokmål) — NB-Whisper Large, best Norwegian accuracy"),
    ("nb-whisper-medium-q5_0", "ggml-nb-whisper-medium-q5_0.bin", 514, "High", "Medium", "Norsk (bokmål) — NB-Whisper Medium, fast Norwegian transcription"),
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_nb_whisper_models_in_catalog() {
        let names: Vec<&str> = WHISPER_MODEL_CATALOG.iter().map(|m| m.0).collect();
        assert!(names.contains(&"nb-whisper-large-q5_0"), "nb-whisper-large-q5_0 missing from catalog");
        assert!(names.contains(&"nb-whisper-medium-q5_0"), "nb-whisper-medium-q5_0 missing from catalog");
    }

    #[test]
    fn test_default_whisper_model_is_norwegian_and_in_catalog() {
        assert_eq!(DEFAULT_WHISPER_MODEL, "nb-whisper-large-q5_0");
        assert!(
            WHISPER_MODEL_CATALOG.iter().any(|m| m.0 == DEFAULT_WHISPER_MODEL),
            "DEFAULT_WHISPER_MODEL must exist in WHISPER_MODEL_CATALOG"
        );
    }

    #[test]
    fn test_catalog_filenames_follow_download_pattern() {
        // download_model() derives the on-disk filename as `ggml-{name}.bin`.
        // Catalog filenames must match, or downloads and model discovery disagree.
        for entry in WHISPER_MODEL_CATALOG {
            assert_eq!(
                entry.1,
                format!("ggml-{}.bin", entry.0),
                "catalog filename mismatch for model '{}'",
                entry.0
            );
        }
    }
}
