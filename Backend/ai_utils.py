import os
from typing import Literal

from dotenv import load_dotenv
from openai import OpenAI


# =========================
# ENVIRONMENT CONFIG
# =========================

load_dotenv()

AICREDITS_BASE_URL = "https://api.aicredits.in/v1"

DEFAULT_SUMMARY_MODEL = os.getenv(
    "AI_SUMMARY_MODEL",
    "google/gemini-2.0-flash",
)

MAX_SUMMARY_INPUT_CHARS = 12000

SummaryType = Literal[
    "short",
    "detailed",
    "bullets",
]


# =========================
# AI CLIENT
# =========================

def get_ai_client() -> OpenAI:
    api_key = os.getenv("AICREDITS_API_KEY")

    if not api_key:
        raise RuntimeError(
            "AICREDITS_API_KEY is missing from Backend/.env"
        )

    return OpenAI(
        base_url=AICREDITS_BASE_URL,
        api_key=api_key,
    )


# =========================
# TEXT PREPARATION
# =========================

def prepare_text_for_summary(
    text: str,
) -> tuple[str, bool]:
    cleaned_text = text.strip()

    was_truncated = False

    if len(cleaned_text) > MAX_SUMMARY_INPUT_CHARS:
        cleaned_text = cleaned_text[
            :MAX_SUMMARY_INPUT_CHARS
        ]

        was_truncated = True

    return cleaned_text, was_truncated


# =========================
# SUMMARY INSTRUCTIONS
# =========================

def get_summary_instruction(
    summary_type: str,
) -> str:
    if summary_type == "short":
        return (
            "Create a concise summary in exactly 3 bullet points. "
            "Each bullet must be one complete sentence. "
            "Do not write an introduction such as 'Here is a summary'."
        )

    if summary_type == "detailed":
        return (
            "Create a clear detailed summary in 100 to 140 words. "
            "Use complete sentences. "
            "Explain the main idea, important points, and final message. "
            "Do not make it too long. "
            "Do not write an introduction such as 'Here is a detailed summary'."
        )

    if summary_type == "bullets":
        return (
            "Create concise study notes from the document. "
            "Use 5 to 7 bullet points maximum. "
            "Focus only on the most important ideas. "
            "Each bullet must be complete and useful."
        )

    raise ValueError(
        "summary_type must be one of: short, detailed, bullets"
    )


def get_max_tokens_for_summary_type(
    summary_type: str,
) -> int:
    if summary_type == "short":
        return 350

    if summary_type == "detailed":
        return 750

    if summary_type == "bullets":
        return 600

    return 500


def get_retry_max_tokens(
    summary_type: str,
) -> int:
    if summary_type == "short":
        return 500

    if summary_type == "detailed":
        return 950

    if summary_type == "bullets":
        return 750

    return 700


# =========================
# PROMPT BUILDER
# =========================

def build_summary_prompt(
    text: str,
    summary_type: str,
    force_complete: bool = False,
) -> str:
    instruction = get_summary_instruction(
        summary_type
    )

    completion_rule = (
        "Return a complete answer. "
        "Do not stop mid-sentence. "
        "End naturally with complete meaning."
    )

    if force_complete:
        completion_rule = (
            "Rewrite the full summary again. "
            "Make sure it is complete. "
            "Do not stop mid-sentence."
        )

    return (
        f"{instruction}\n\n"
        f"{completion_rule}\n\n"
        "If the document text is Hindi, you may summarize it in English.\n\n"
        "Document text:\n"
        "--------------------\n"
        f"{text}"
    )


# =========================
# OUTPUT CLEANING
# =========================

def clean_summary_output(
    summary: str,
) -> str:
    cleaned = summary.strip()

    unwanted_prefixes = [
        "Here's a summary of the document:",
        "Here is a summary of the document:",
        "Here's a summary:",
        "Here is a summary:",
        "Here's a detailed structured summary:",
        "Here is a detailed structured summary:",
        "Here are clean study notes from the document:",
        "Here are the study notes:",
    ]

    for prefix in unwanted_prefixes:
        if cleaned.lower().startswith(
            prefix.lower()
        ):
            cleaned = cleaned[
                len(prefix):
            ].strip()

    return cleaned


# =========================
# INCOMPLETE OUTPUT CHECK
# =========================

def looks_incomplete(
    summary: str,
    finish_reason: str | None,
) -> bool:
    cleaned = summary.strip()

    if not cleaned:
        return True

    if finish_reason == "length":
        return True

    incomplete_punctuation = (
        ",",
        ";",
        ":",
        "-",
        "—",
        "–",
    )

    if cleaned.endswith(
        incomplete_punctuation
    ):
        return True

    words = cleaned.split()

    if not words:
        return True

    last_word = (
        words[-1]
        .lower()
        .strip()
        .strip(".,;:-—–!?।")
    )

    incomplete_last_words = {
        "and",
        "or",
        "but",
        "because",
        "with",
        "of",
        "the",
        "that",
        "to",
        "for",
        "in",
        "on",
        "और",
        "या",
        "कि",
        "के",
        "से",
        "में",
    }

    if last_word in incomplete_last_words:
        return True

    return False


# =========================
# MODEL CALL
# =========================

def call_summary_model(
    client: OpenAI,
    cleaned_text: str,
    summary_type: str,
    max_tokens: int,
    force_complete: bool = False,
) -> tuple[str, str | None]:
    response = client.chat.completions.create(
        model=DEFAULT_SUMMARY_MODEL,
        temperature=0.2,
        max_tokens=max_tokens,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an AI document assistant inside "
                    "a document scanner app called Scanify AI. "
                    "Summarize OCR-extracted text accurately. "
                    "Do not invent facts. "
                    "Do not leave answers incomplete."
                ),
            },
            {
                "role": "user",
                "content": build_summary_prompt(
                    text=cleaned_text,
                    summary_type=summary_type,
                    force_complete=force_complete,
                ),
            },
        ],
    )

    raw_summary = (
        response.choices[0]
        .message
        .content
        or ""
    )

    finish_reason = (
        response.choices[0]
        .finish_reason
    )

    return (
        clean_summary_output(
            raw_summary
        ),
        finish_reason,
    )


# =========================
# DOCUMENT SUMMARIZATION
# =========================

def summarize_document_text(
    text: str,
    summary_type: str = "short",
) -> dict:
    cleaned_text, was_truncated = (
        prepare_text_for_summary(text)
    )

    if not cleaned_text:
        raise ValueError(
            "Text is empty. Please provide text to summarize."
        )

    # Validate summary type.
    get_summary_instruction(
        summary_type
    )

    client = get_ai_client()

    summary, finish_reason = call_summary_model(
        client=client,
        cleaned_text=cleaned_text,
        summary_type=summary_type,
        max_tokens=get_max_tokens_for_summary_type(
            summary_type
        ),
        force_complete=False,
    )

    retried = False

    if looks_incomplete(
        summary=summary,
        finish_reason=finish_reason,
    ):
        retried = True

        retry_summary, retry_finish_reason = (
            call_summary_model(
                client=client,
                cleaned_text=cleaned_text,
                summary_type=summary_type,
                max_tokens=get_retry_max_tokens(
                    summary_type
                ),
                force_complete=True,
            )
        )

        # Use retry if it produced anything useful.
        if retry_summary.strip():
            summary = retry_summary
            finish_reason = retry_finish_reason

    if not summary.strip():
        raise RuntimeError(
            "AI returned an empty summary. Please try again."
        )

    return {
        "summary": summary,
        "model": DEFAULT_SUMMARY_MODEL,
        "summary_type": summary_type,
        "was_truncated": was_truncated,
        "retried": retried,
        "finish_reason": finish_reason,
        "input_character_count": len(text),
        "processed_character_count": len(cleaned_text),
        "summary_word_count": len(
            summary.split()
        ),
    }