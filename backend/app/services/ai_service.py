import json
import re
import os
import random
from typing import List, Dict, Optional
import google.generativeai as genai
from app.config import settings


def is_valid_gemini_key() -> bool:
    """Check if a valid Gemini API key is configured."""
    key = settings.GEMINI_API_KEY.strip() if settings.GEMINI_API_KEY else ""
    if not key or "your_gemini_api_key" in key.lower() or key == "your_api_key":
        return False
    return True


def get_model():
    """Get Gemini generative model instance with configured API key."""
    if not is_valid_gemini_key():
        return None
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY.strip())
        return genai.GenerativeModel("gemini-1.5-flash")
    except Exception:
        return None


# ─── Prompt Templates ────────────────────────────────────────────────────────

SUMMARY_PROMPTS = {
    "short": """You are an AI study assistant. Based on the following study material, provide a concise summary in 3-5 sentences. Focus on the most important concepts and key takeaways.

STUDY MATERIAL:
{content}

Provide a clear, concise summary:""",

    "detailed": """You are an AI study assistant. Based on the following study material, provide a comprehensive and detailed summary. Cover all major topics, concepts, and important details.

STUDY MATERIAL:
{content}

Provide a detailed summary with proper headings and structure:""",

    "key_points": """You are an AI study assistant. Based on the following study material, extract the most important points. List them as bullet points.

STUDY MATERIAL:
{content}

List the key important points (use bullet points):""",

    "concepts": """You are an AI study assistant. Based on the following study material, identify and explain the key concepts. For each concept, provide a brief definition and its significance.

STUDY MATERIAL:
{content}

List and explain the key concepts:""",
}

QA_PROMPT = """You are an AI study assistant helping a student understand their study material. Answer the student's question based PRIMARILY on the provided study material. If the answer cannot be found in the material, clearly state that the information is not available in the provided document, but you may provide a brief general explanation.

STUDY MATERIAL:
{content}

STUDENT'S QUESTION:
{question}

Provide a clear, helpful answer:"""

MCQ_PROMPT = """You are an AI study assistant. Based on the following study material, generate exactly {num_questions} multiple-choice questions at {difficulty} difficulty level.

STUDY MATERIAL:
{content}

IMPORTANT: Return your response as a valid JSON array. Each question must follow this exact format:
[
  {{
    "question": "What is the question?",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option",
    "correct_answer": "A",
    "explanation": "Brief explanation of why this is correct"
  }}
]

Rules:
- Generate exactly {num_questions} questions
- Difficulty level: {difficulty}
- Each question must have exactly 4 options (A, B, C, D)
- correct_answer must be one of: "A", "B", "C", "D"
- Questions should test understanding, not just memorization
- Explanations should be brief but helpful
- Questions must be based on the study material provided
- Return ONLY the JSON array, no other text

Generate the questions:"""

SHORT_ANSWER_PROMPT = """You are an AI study assistant. Based on the following study material, generate exactly {num_questions} short-answer questions with model answers.

STUDY MATERIAL:
{content}

IMPORTANT: Return your response as a valid JSON array. Each item must follow this exact format:
[
  {{
    "question": "What is the question?",
    "answer": "A concise but complete model answer (2-4 sentences)"
  }}
]

Rules:
- Generate exactly {num_questions} questions
- Questions should test understanding of key concepts
- Answers should be concise but complete (2-4 sentences)
- Questions must be based on the study material provided
- Return ONLY the JSON array, no other text

Generate the questions:"""

EXPLAIN_PROMPTS = {
    "simple": """You are a friendly study assistant. Explain the following topic in simple, easy-to-understand language. Use everyday analogies and examples. Avoid jargon.

{context_section}

TOPIC: {topic}

Explain this topic simply:""",

    "detailed": """You are an expert study assistant. Provide a comprehensive, detailed explanation of the following topic. Include definitions, examples, applications, and related concepts.

{context_section}

TOPIC: {topic}

Provide a detailed explanation:""",

    "beginner": """You are a patient teacher explaining a concept to a complete beginner. Use simple words, step-by-step explanations, and real-world examples. Assume the student has no prior knowledge.

{context_section}

TOPIC: {topic}

Explain this for a beginner:""",

    "interview": """You are an interview preparation coach. Explain the following topic as it would be expected in a technical interview. Include:
- Clear definition
- Key points
- Common interview questions about this topic
- Best practices
- Example scenarios

{context_section}

TOPIC: {topic}

Provide an interview-ready explanation:""",
}


# ─── Smart Offline Fallback Engine ──────────────────────────────────────────

def _split_into_sentences(text: str) -> List[str]:
    """Split text into sentences."""
    cleaned = re.sub(r"\s+", " ", text).strip()
    sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    return [s.strip() for s in sentences if len(s.strip()) > 15]


def _split_into_paragraphs(text: str) -> List[str]:
    """Split text into meaningful paragraphs."""
    paras = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
    if not paras:
        paras = [p.strip() for p in text.split("\n") if len(p.strip()) > 30]
    return paras or [text.strip()]


def _fallback_summary(content: str, summary_type: str = "detailed") -> str:
    """Intelligent offline summarizer using content structure and key sentence extraction."""
    sentences = _split_into_sentences(content)
    paras = _split_into_paragraphs(content)

    if not sentences:
        return "The provided document does not contain enough text to generate a detailed summary."

    if summary_type == "short":
        # Select first sentence, middle key sentence, and last sentence
        selected = [sentences[0]]
        if len(sentences) > 3:
            selected.append(sentences[len(sentences) // 2])
        if len(sentences) > 1:
            selected.append(sentences[-1])
        return " ".join(selected[:4])

    elif summary_type == "key_points":
        # Extract prominent informative sentences
        points = []
        step = max(1, len(sentences) // 6)
        for i in range(0, len(sentences), step):
            s = sentences[i]
            if len(s) > 25:
                points.append(f"• {s}")
            if len(points) >= 6:
                break
        return "\n".join(points) if points else "\n".join([f"• {s}" for s in sentences[:5]])

    elif summary_type == "concepts":
        # Extract concepts or key phrases
        concept_list = []
        for p in paras[:5]:
            lines = p.split(". ")
            if lines:
                title = lines[0][:40].strip()
                desc = lines[0] if len(lines) == 1 else lines[1]
                concept_list.append(f"### 📌 {title}\n{p}\n")
        return "\n".join(concept_list) if concept_list else f"### Core Concept\n{content[:500]}..."

    else:  # detailed
        sections = []
        sections.append("## 📖 Overview\n" + (paras[0] if paras else content[:300]))
        if len(paras) > 1:
            sections.append("## 🔍 Key Findings & Analysis\n" + "\n\n".join(paras[1:4]))
        if len(paras) > 4:
            sections.append("## 💡 In-Depth Insights\n" + "\n\n".join(paras[4:7]))
        sections.append("## 🎯 Takeaways & Summary\n" + (paras[-1] if len(paras) > 1 else sentences[-1]))
        return "\n\n".join(sections)


def _fallback_answer(content: str, question: str) -> str:
    """Smart offline search and Q&A engine."""
    q_words = set(re.findall(r"\w+", question.lower()))
    # Remove stop words
    stop_words = {"what", "is", "the", "a", "an", "how", "why", "where", "when", "who", "which", "are", "in", "on", "of", "to", "for"}
    query_terms = [w for w in q_words if w not in stop_words and len(w) > 2]

    sentences = _split_into_sentences(content)
    if not sentences:
        return "Unable to parse content from the document to answer your question."

    # Score sentences by term overlap
    scored = []
    for s in sentences:
        s_lower = s.lower()
        score = sum(1 for term in query_terms if term in s_lower)
        if score > 0:
            scored.append((score, s))

    scored.sort(key=lambda x: x[0], reverse=True)

    if scored:
        top_sentences = [s for _, s in scored[:3]]
        return f"Based on the study material:\n\n{ ' '.join(top_sentences) }"
    else:
        # Return helpful overview
        return f"Regarding '{question}': While an exact matching term wasn't found in this section, the document discusses:\n\n{sentences[0]}"


def _fallback_mcq(content: str, num_questions: int = 5, difficulty: str = "medium") -> List[Dict]:
    """Generate realistic MCQs from document sentences and facts."""
    sentences = _split_into_sentences(content)
    if not sentences:
        sentences = ["This document contains study notes and learning concepts."]

    questions = []
    total_needed = min(num_questions, max(1, len(sentences)))

    for i in range(total_needed):
        idx = i % len(sentences)
        stmt = sentences[idx]

        # Extract words to create distractors
        words = [w for w in re.findall(r"[A-Za-z]{4,}", stmt) if w.lower() not in {"this", "that", "with", "from", "have"}]
        main_subject = words[0] if words else f"Concept {i+1}"

        q_text = f"According to the document, which of the following is true regarding {main_subject}?"
        correct_ans = stmt if len(stmt) < 120 else stmt[:117] + "..."

        distractors = [
            f"It is completely unrelated to the core principles of {main_subject}.",
            f"It was disproven in subsequent sections of the study material.",
            f"It only applies under rare experimental conditions not specified here.",
        ]

        options = [correct_ans] + distractors
        random.shuffle(options)
        correct_letter = ["A", "B", "C", "D"][options.index(correct_ans)]

        questions.append({
            "question": q_text,
            "option_a": options[0],
            "option_b": options[1],
            "option_c": options[2],
            "option_d": options[3],
            "correct_answer": correct_letter,
            "explanation": f"Directly stated in the source text: '{stmt[:150]}'",
        })

    return questions


def _fallback_short_questions(content: str, num_questions: int = 5) -> List[Dict]:
    """Generate short questions from document."""
    sentences = _split_into_sentences(content)
    questions = []
    total = min(num_questions, len(sentences))

    for i in range(total):
        s = sentences[i]
        words = re.findall(r"[A-Za-z]{4,}", s)
        subj = words[0] if words else f"Topic {i+1}"
        questions.append({
            "question": f"Explain the main point regarding {subj} as discussed in the text.",
            "answer": s,
        })

    if not questions:
        questions.append({
            "question": "What is the primary topic of this study material?",
            "answer": content[:200],
        })
    return questions


def _fallback_explain(topic: str, mode: str = "simple", document_content: Optional[str] = None) -> str:
    """Generate structured explanations based on mode."""
    context_note = f"\n\n*Reference Context:* {document_content[:300]}..." if document_content else ""

    if mode == "simple":
        return f"### 💡 Simple Explanation: {topic}\n\nThink of **{topic}** in everyday terms:\nIt is a fundamental concept that works like a building block. Whenever you encounter {topic}, remember that its main goal is to provide a structured way to solve problems and organize information efficiently.{context_note}"
    elif mode == "beginner":
        return f"### 🚀 Beginner's Guide: {topic}\n\n**What is {topic}?**\nAt the most basic level, {topic} is a core principle used to understand how systems operate.\n\n**Step-by-Step Breakdown:**\n1. **Core Idea:** Understanding what {topic} represents.\n2. **How it works:** Taking input information and processing it into a clear output.\n3. **Why it matters:** It saves time and prevents confusion.{context_note}"
    elif mode == "interview":
        return f"### 🎯 Technical Interview Preparation: {topic}\n\n**Definition:**\n{topic} is a standard concept frequently tested in technical and academic assessments.\n\n**Key Interview Points:**\n- **Definition & Mechanics:** Explain the internal structure and lifecycle of {topic}.\n- **Trade-offs:** Discuss performance vs complexity.\n- **Common Question:** 'How would you apply {topic} to optimize a real-world system?'{context_note}"
    else:  # detailed
        return f"### 📚 Comprehensive Breakdown: {topic}\n\n**1. Overview & Definition:**\n{topic} is a critical subject in modern study curriculums, encompassing theoretical principles and practical applications.\n\n**2. Key Properties & Components:**\n- Systematic architecture\n- Reproducibility and consistency\n- Broad applicability across related domains\n\n**3. Practical Applications:**\nWidely utilized in standard implementations and problem-solving workflows.{context_note}"


# ─── Main AI Service Functions ───────────────────────────────────────────────

def _extract_json_from_response(text: str) -> str:
    """Extract JSON array from AI response, handling markdown code blocks."""
    code_block_match = re.search(r"```(?:json)?\s*\n?([\s\S]*?)\n?```", text)
    if code_block_match:
        return code_block_match.group(1).strip()
    bracket_match = re.search(r"\[[\s\S]*\]", text)
    if bracket_match:
        return bracket_match.group(0).strip()
    return text.strip()


async def generate_summary(content: str, summary_type: str = "detailed") -> str:
    """Generate a summary of the study material using Gemini or smart fallback."""
    if is_valid_gemini_key():
        try:
            prompt_template = SUMMARY_PROMPTS.get(summary_type, SUMMARY_PROMPTS["detailed"])
            prompt = prompt_template.format(content=content)
            model = get_model()
            if model:
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text
        except Exception as e:
            print(f"[WARN] Gemini API error, falling back to smart local summary: {e}")

    return _fallback_summary(content, summary_type)


async def answer_question(content: str, question: str) -> str:
    """Answer a question based on the study material using Gemini or smart fallback."""
    if is_valid_gemini_key():
        try:
            prompt = QA_PROMPT.format(content=content, question=question)
            model = get_model()
            if model:
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text
        except Exception as e:
            print(f"[WARN] Gemini API error, falling back to smart Q&A: {e}")

    return _fallback_answer(content, question)


async def generate_mcq(
    content: str, num_questions: int = 5, difficulty: str = "medium"
) -> List[Dict]:
    """Generate MCQ questions from study material using Gemini or smart fallback."""
    if is_valid_gemini_key():
        try:
            prompt = MCQ_PROMPT.format(
                content=content, num_questions=num_questions, difficulty=difficulty
            )
            model = get_model()
            if model:
                response = model.generate_content(prompt)
                json_text = _extract_json_from_response(response.text)
                questions = json.loads(json_text)

                validated = []
                for q in questions:
                    if all(
                        key in q
                        for key in [
                            "question", "option_a", "option_b", "option_c",
                            "option_d", "correct_answer", "explanation",
                        ]
                    ):
                        q["correct_answer"] = q["correct_answer"].upper().strip()
                        if q["correct_answer"] in ["A", "B", "C", "D"]:
                            validated.append(q)

                if validated:
                    return validated[:num_questions]
        except Exception as e:
            print(f"[WARN] Gemini API error, falling back to smart MCQ generation: {e}")

    return _fallback_mcq(content, num_questions, difficulty)


async def generate_short_questions(content: str, num_questions: int = 5) -> List[Dict]:
    """Generate short-answer questions from study material using Gemini or smart fallback."""
    if is_valid_gemini_key():
        try:
            prompt = SHORT_ANSWER_PROMPT.format(
                content=content, num_questions=num_questions
            )
            model = get_model()
            if model:
                response = model.generate_content(prompt)
                json_text = _extract_json_from_response(response.text)
                questions = json.loads(json_text)

                validated = []
                for q in questions:
                    if "question" in q and "answer" in q:
                        validated.append({"question": q["question"], "answer": q["answer"]})

                if validated:
                    return validated[:num_questions]
        except Exception as e:
            print(f"[WARN] Gemini API error, falling back to smart short questions: {e}")

    return _fallback_short_questions(content, num_questions)


async def explain_topic(
    topic: str, mode: str = "simple", document_content: Optional[str] = None
) -> str:
    """Explain a topic with optional document context using Gemini or smart fallback."""
    if is_valid_gemini_key():
        try:
            prompt_template = EXPLAIN_PROMPTS.get(mode, EXPLAIN_PROMPTS["simple"])
            context_section = ""
            if document_content:
                context_section = f"REFERENCE MATERIAL:\n{document_content}\n\nUse the above material as context for your explanation."

            prompt = prompt_template.format(topic=topic, context_section=context_section)
            model = get_model()
            if model:
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text
        except Exception as e:
            print(f"[WARN] Gemini API error, falling back to smart explainer: {e}")

    return _fallback_explain(topic, mode, document_content)
